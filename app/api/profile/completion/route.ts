import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });

    const { data: userData } = await supabase.from("users").select("id").eq("auth_id", user.id).single();
    if (!userData) return NextResponse.json({ error: "User not found", success: false }, { status: 404 });

    const userId = userData.id;

    // Calculate profile completion
    const { data: profile } = await supabase.from("student_profiles").select("*").eq("user_id", userId).single();
    const { data: userData2 } = await supabase.from("users").select("full_name").eq("id", userId).single();

    if (!profile) return NextResponse.json({ completion: 0, success: true });

    let completion = 0;

    // Basic info checks
    if ((userData2 as any)?.full_name) completion += 5;
    if (profile.phone) completion += 5;
    if (profile.institution) completion += 5;
    if (profile.degree) completion += 5;
    if (profile.branch) completion += 5;
    if (profile.cgpa) completion += 5;
    if (profile.graduation_year) completion += 5;
    if (profile.bio && profile.bio.length > 50) completion += 5;

    // Skills
    if (profile.skills?.length >= 3) completion += 10;
    if (profile.skills?.length >= 7) completion += 10;

    // Target
    if (profile.target_role) completion += 5;
    if (profile.target_companies?.length >= 1) completion += 5;

    // Links
    if (profile.github_url) completion += 10;
    if (profile.linkedin_url) completion += 10;

    // Certifications
    const { count: certCount } = await supabase.from("certifications").select("*", { count: "exact", head: true }).eq("user_id", userId);
    if ((certCount ?? 0) >= 1) completion += 5;
    if ((certCount ?? 0) >= 3) completion += 5;

    // Projects
    const { count: projCount } = await supabase.from("projects").select("*", { count: "exact", head: true }).eq("user_id", userId);
    if ((projCount ?? 0) >= 1) completion += 5;
    if ((projCount ?? 0) >= 2) completion += 5;

    completion = Math.min(100, completion);

    await supabase.from("student_profiles")
      .update({ profile_completion: completion })
      .eq("user_id", userId);

    return NextResponse.json({ completion, success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, success: false }, { status: 500 });
  }
}
