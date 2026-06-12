import { NextRequest } from "next/server";
import { isApiContext, jsonData, jsonError, requireUser } from "@/lib/api/supabase";

export async function GET(request: NextRequest) {
  const ctx = await requireUser();
  if (!isApiContext(ctx)) return ctx;

  const mode = request.nextUrl.searchParams.get("mode") ?? "assessments";

  if (mode === "leaderboard") {
    const { data, error } = await ctx.supabase
      .from("aptitude_leaderboard")
      .select("*")
      .order("rank", { ascending: true })
      .limit(100);

    if (error) return jsonError(error.message, 500);
    return jsonData(data ?? []);
  }

  if (mode === "attempts") {
    const userId = request.nextUrl.searchParams.get("user_id") ?? ctx.userId;
    if (userId !== ctx.userId && !["admin", "trainer", "placement_officer"].includes(ctx.role)) {
      return jsonError("Forbidden", 403);
    }

    const { data, error } = await ctx.supabase
      .from("attempts")
      .select("*, assessments!inner(title, type)")
      .eq("user_id", userId)
      .eq("assessments.type", "aptitude")
      .order("created_at", { ascending: false });

    if (error) return jsonError(error.message, 500);
    return jsonData(data ?? []);
  }

  const { data, error } = await ctx.supabase
    .from("assessments")
    .select("*, questions(*)")
    .eq("type", "aptitude")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) return jsonError(error.message, 500);
  return jsonData(data ?? []);
}

export async function POST(request: NextRequest) {
  const ctx = await requireUser();
  if (!isApiContext(ctx)) return ctx;

  const body = await request.json();
  if (!body.assessment_id) return jsonError("assessment_id is required");

  const { data: questions, error: questionsError } = await ctx.supabase
    .from("questions")
    .select("id, correct_answer, section")
    .eq("assessment_id", body.assessment_id);

  if (questionsError) return jsonError(questionsError.message, 500);

  const answers = body.answers ?? {};
  let correct = 0;
  const sectionScores: Record<string, { correct: number; total: number }> = {};

  for (const question of questions ?? []) {
    const isCorrect = answers[question.id] === question.correct_answer;
    if (isCorrect) correct += 1;
    if (question.section) {
      sectionScores[question.section] ??= { correct: 0, total: 0 };
      sectionScores[question.section].total += 1;
      if (isCorrect) sectionScores[question.section].correct += 1;
    }
  }

  const total = questions?.length ?? 0;
  const percentage = total > 0 ? (correct / total) * 100 : 0;
  const sectionPercentages = Object.fromEntries(
    Object.entries(sectionScores).map(([section, value]) => [
      section,
      value.total > 0 ? (value.correct / value.total) * 100 : 0,
    ])
  );

  const { data, error } = await ctx.supabase
    .from("attempts")
    .insert({
      user_id: ctx.userId,
      assessment_id: body.assessment_id,
      answers,
      score: correct,
      percentage,
      total_questions: total,
      correct_answers: correct,
      time_taken_seconds: body.time_taken_seconds ?? null,
      completed_at: new Date().toISOString(),
      status: "completed",
      section_scores: sectionPercentages,
      feedback: percentage >= (body.passing_score ?? 60)
        ? "Congratulations! You passed this aptitude assessment."
        : `You scored ${Math.round(percentage)}%. Review weak sections and try again.`,
    })
    .select()
    .single();

  if (error) return jsonError(error.message, 500);
  return jsonData(data, { status: 201 });
}
