import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateReadinessScore } from "@/lib/scoring";
import type { StudentProfile, ResumeReport, CodingSubmission, Attempt, Project, Certification } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });

    // Get user record
    const { data: userData } = await supabase
      .from("users").select("id").eq("auth_id", user.id).single();
    if (!userData) return NextResponse.json({ error: "User not found", success: false }, { status: 404 });

    const userId = userData.id;

    // Gather all data needed for scoring
    const [
      { data: profile },
      { data: latestResumeReport },
      { data: codingSubmissions },
      { data: aptitudeAttempts },
      { data: projects },
      { data: certifications },
    ] = await Promise.all([
      supabase.from("student_profiles").select("*").eq("user_id", userId).single(),
      supabase.from("resume_reports").select("*").eq("user_id", userId)
        .order("created_at", { ascending: false }).limit(1).single(),
      supabase.from("coding_submissions").select("*").eq("user_id", userId),
      supabase.from("attempts")
        .select("*, assessments!inner(type)")
        .eq("user_id", userId)
        .eq("assessments.type", "aptitude")
        .eq("status", "completed"),
      supabase.from("projects").select("*").eq("user_id", userId),
      supabase.from("certifications").select("*").eq("user_id", userId),
    ]);

    const result = calculateReadinessScore({
      profile: profile as StudentProfile | null,
      latestResumeReport: latestResumeReport as ResumeReport | null,
      codingSubmissions: (codingSubmissions ?? []) as CodingSubmission[],
      aptitudeAttempts: (aptitudeAttempts ?? []) as Attempt[],
      projects: (projects ?? []) as Project[],
      certifications: (certifications ?? []) as Certification[],
      userId,
    });

    // Upsert readiness score
    const { data: savedScore, error } = await supabase
      .from("readiness_scores")
      .upsert({
        user_id: userId,
        overall_score: result.overall_score,
        category: result.category,
        profile_score: result.profile_score,
        resume_score: result.resume_score,
        coding_score: result.coding_score,
        aptitude_score: result.aptitude_score,
        projects_score: result.projects_score,
        certifications_score: result.certifications_score,
        explanation: result.explanation,
        improvement_areas: result.improvement_areas,
        calculated_at: new Date().toISOString(),
      }, { onConflict: "user_id" })
      .select()
      .single();

    if (error) {
      console.error("Save readiness error:", error);
      return NextResponse.json({ error: "Failed to save score", success: false }, { status: 500 });
    }

    // Audit log
    await supabase.from("audit_logs").insert({
      user_id: userId,
      action: "readiness_calculated",
      resource_type: "readiness_score",
      resource_id: userId,
      new_values: { overall_score: result.overall_score, category: result.category },
    });

    return NextResponse.json({ data: savedScore, success: true });
  } catch (error: any) {
    console.error("Readiness calculation error:", error);
    return NextResponse.json(
      { error: error.message ?? "Calculation failed", success: false },
      { status: 500 }
    );
  }
}
