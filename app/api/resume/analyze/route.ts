import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzeResume } from "@/lib/groq";
import pdfParse from "pdf-parse";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });

    const { resume_id } = await request.json();
    if (!resume_id) return NextResponse.json({ error: "resume_id required", success: false }, { status: 400 });

    // Get user ID
    const { data: userData } = await supabase.from("users").select("id").eq("auth_id", user.id).single();
    if (!userData) return NextResponse.json({ error: "User not found", success: false }, { status: 404 });

    // Get resume record
    const { data: resume, error: resumeError } = await supabase
      .from("resumes")
      .select("*")
      .eq("id", resume_id)
      .eq("user_id", userData.id)
      .single();

    if (resumeError || !resume) {
      return NextResponse.json({ error: "Resume not found", success: false }, { status: 404 });
    }

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("resumes")
      .download(resume.file_path);

    if (downloadError || !fileData) {
      return NextResponse.json({ error: "Could not download resume file", success: false }, { status: 500 });
    }

    // Extract text from PDF
    let resumeText = "";
    try {
      const arrayBuffer = await fileData.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const pdfData = await pdfParse(buffer);
      resumeText = pdfData.text;
    } catch (pdfError) {
      console.error("PDF parse error:", pdfError);
      resumeText = "Unable to extract text from PDF. Please ensure the PDF contains selectable text.";
    }

    // Get student's target role
    const { data: profileData } = await supabase
      .from("student_profiles")
      .select("target_role")
      .eq("user_id", userData.id)
      .single();

    const startTime = Date.now();

    // Analyze with Groq AI
    const analysis = await analyzeResume(resumeText, profileData?.target_role);
    const processingTime = Date.now() - startTime;

    // Store the report
    const reportPayload = {
      resume_id,
      user_id: userData.id,
      ats_score: analysis.ats_score,
      quality_score: analysis.quality_score,
      extracted_text: resumeText.slice(0, 5000),
      missing_keywords: analysis.missing_keywords,
      missing_sections: analysis.missing_sections,
      grammar_issues: analysis.grammar_issues,
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      suggestions: analysis.suggestions,
      skills_found: analysis.skills_found,
      skills_missing: analysis.skills_missing,
      project_quality_analysis: analysis.project_quality_analysis,
      full_analysis: analysis.full_analysis,
      processing_time_ms: processingTime,
    };

    const { data: report, error: reportError } = await supabase
      .from("resume_reports")
      .upsert(reportPayload)
      .select()
      .single();

    if (reportError) {
      console.error("Report save error:", reportError);
      return NextResponse.json({ error: "Failed to save report", success: false }, { status: 500 });
    }

    // Log audit event
    await supabase.from("audit_logs").insert({
      user_id: userData.id,
      action: "resume_analyzed",
      resource_type: "resume",
      resource_id: resume_id,
      new_values: { ats_score: analysis.ats_score, quality_score: analysis.quality_score },
    });

    return NextResponse.json({ data: report, success: true });
  } catch (error: any) {
    console.error("Resume analysis error:", error);
    return NextResponse.json(
      { error: error.message ?? "Analysis failed", success: false },
      { status: 500 }
    );
  }
}
