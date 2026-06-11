import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateInternshipMatch } from "@/lib/scoring";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });

    const { data: userData } = await supabase.from("users").select("id").eq("auth_id", user.id).single();
    if (!userData) return NextResponse.json({ error: "User not found", success: false }, { status: 404 });

    const userId = userData.id;

    // Get student profile
    const { data: profile } = await supabase
      .from("student_profiles")
      .select("skills, cgpa, branch, year_of_study")
      .eq("user_id", userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Complete your profile first", success: false }, { status: 400 });
    }

    // Get all active internships
    const { data: internships } = await supabase
      .from("internships")
      .select("*")
      .eq("is_active", true);

    if (!internships || internships.length === 0) {
      return NextResponse.json({ count: 0, success: true });
    }

    // Calculate matches
    const matchInserts = internships.map((internship) => {
      const result = calculateInternshipMatch(
        profile.skills ?? [],
        profile.cgpa ?? 0,
        profile.branch ?? "",
        profile.year_of_study ?? 3,
        {
          required_skills: internship.required_skills ?? [],
          preferred_skills: internship.preferred_skills ?? [],
          min_cgpa: internship.min_cgpa,
          eligible_branches: internship.eligible_branches ?? [],
          eligible_years: internship.eligible_years ?? [],
        }
      );

      return {
        user_id: userId,
        internship_id: internship.id,
        match_percentage: result.match_percentage,
        matching_skills: result.matching_skills,
        missing_skills: result.missing_skills,
        recommendations: result.recommendations,
        calculated_at: new Date().toISOString(),
      };
    });

    // Upsert all matches
    const { error } = await supabase
      .from("internship_matches")
      .upsert(matchInserts, { onConflict: "user_id,internship_id" });

    if (error) {
      console.error("Match upsert error:", error);
      return NextResponse.json({ error: "Failed to save matches", success: false }, { status: 500 });
    }

    return NextResponse.json({ count: matchInserts.length, success: true });
  } catch (error: any) {
    console.error("Matching error:", error);
    return NextResponse.json(
      { error: error.message ?? "Matching failed", success: false },
      { status: 500 }
    );
  }
}
