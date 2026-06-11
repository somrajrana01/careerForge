import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  generateRoadmap,
  generateSkillGapAnalysis,
  generateInterviewPreparation,
  generateDSAPlan,
} from "@/lib/groq";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });

    const { type } = await request.json();
    const validTypes = ["roadmap", "skill_gap", "interview", "dsa", "resume"];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Invalid type", success: false }, { status: 400 });
    }

    const { data: userData } = await supabase.from("users").select("id").eq("auth_id", user.id).single();
    if (!userData) return NextResponse.json({ error: "User not found", success: false }, { status: 404 });

    const userId = userData.id;

    // Fetch user data for context
    const [{ data: profile }, { data: readiness }, { data: resumeReport }] = await Promise.all([
      supabase.from("student_profiles").select("*").eq("user_id", userId).single(),
      supabase.from("readiness_scores").select("*").eq("user_id", userId).single(),
      supabase.from("resume_reports").select("skills_missing, skills_found")
        .eq("user_id", userId).order("created_at", { ascending: false }).limit(1).single(),
    ]);

    const skills = profile?.skills ?? [];
    const targetRole = profile?.target_role ?? "Software Development Intern";
    const readinessScore = readiness?.overall_score ?? 0;
    const codingScore = readiness?.coding_score ?? 0;
    const weakAreas = readiness?.improvement_areas ?? [];
    const resumeSkillsMissing = resumeReport?.skills_missing ?? [];

    let content: Record<string, unknown> = {};
    let title = "";

    switch (type) {
      case "roadmap": {
        const roadmap = await generateRoadmap(targetRole, skills, readinessScore, weakAreas);
        content = { roadmap };
        title = `90-Day Roadmap for ${targetRole}`;
        break;
      }
      case "skill_gap": {
        const skillGaps = await generateSkillGapAnalysis(skills, targetRole, resumeSkillsMissing);
        content = { skill_gaps: skillGaps };
        title = `Skill Gap Analysis for ${targetRole}`;
        break;
      }
      case "interview": {
        const interviewPlan = await generateInterviewPreparation(targetRole, skills, weakAreas);
        content = { interview_plan: interviewPlan };
        title = `Interview Prep Plan — ${targetRole}`;
        break;
      }
      case "dsa": {
        const dsaPlan = await generateDSAPlan(codingScore, targetRole);
        content = { dsa_plan: dsaPlan };
        title = "DSA Improvement Plan";
        break;
      }
      case "resume": {
        content = {
          resume_plan: {
            priority_changes: resumeSkillsMissing.length > 0
              ? [`Add ${resumeSkillsMissing.slice(0, 3).join(", ")} to your skills section`,
                 "Quantify achievements with numbers (e.g., 'Improved performance by 30%')",
                 "Add a professional summary at the top"]
              : ["Add more technical keywords for ATS",
                 "Quantify your project impact",
                 "Add a strong professional summary"],
            sections_to_add: ["Professional Summary", "Technical Skills", "Key Achievements"],
            keywords_to_add: resumeSkillsMissing.slice(0, 8),
            formatting_tips: [
              "Use consistent font sizes (11-12pt for body, 14-16pt for name)",
              "Keep resume to 1-2 pages max",
              "Use bullet points starting with action verbs",
              "Include links to GitHub and LinkedIn",
            ],
          },
        };
        title = "Resume Improvement Plan";
        break;
      }
    }

    // Upsert recommendation (one per type per user)
    const existing = await supabase
      .from("recommendations")
      .select("id")
      .eq("user_id", userId)
      .eq("type", type)
      .single();

    let rec;
    if (existing.data) {
      const { data } = await supabase
        .from("recommendations")
        .update({ content, title, generated_at: new Date().toISOString() })
        .eq("id", existing.data.id)
        .select()
        .single();
      rec = data;
    } else {
      const { data } = await supabase
        .from("recommendations")
        .insert({ user_id: userId, type, title, content })
        .select()
        .single();
      rec = data;
    }

    return NextResponse.json({ data: rec, success: true });
  } catch (error: any) {
    console.error("Recommendation generation error:", error);
    return NextResponse.json(
      { error: error.message ?? "Generation failed", success: false },
      { status: 500 }
    );
  }
}
