import { NextRequest } from "next/server";
import { isApiContext, jsonData, jsonError, requireUser } from "@/lib/api/supabase";

const staffRoles = ["admin", "trainer"] as const;

export async function GET(request: NextRequest) {
  const ctx = await requireUser();
  if (!isApiContext(ctx)) return ctx;

  const params = request.nextUrl.searchParams;
  const id = params.get("id");
  const type = params.get("type");
  const includeQuestions = params.get("include_questions") === "true";

  let query = ctx.supabase
    .from("assessments")
    .select(includeQuestions ? "*, questions(*)" : "*")
    .order("created_at", { ascending: false });

  if (!staffRoles.includes(ctx.role as any)) query = query.eq("is_active", true);
  if (id) query = query.eq("id", id);
  if (type) query = query.eq("type", type);

  const { data, error } = id ? await query.single() : await query;
  if (error) return jsonError(error.message, 500);

  return jsonData(data);
}

export async function POST(request: NextRequest) {
  const ctx = await requireUser(["admin", "trainer"]);
  if (!isApiContext(ctx)) return ctx;

  const body = await request.json();
  const questions = Array.isArray(body.questions) ? body.questions : [];
  const assessmentPayload = {
    created_by: ctx.userId,
    title: body.title,
    description: body.description ?? null,
    type: body.type ?? "skill",
    category: body.category ?? null,
    difficulty: body.difficulty ?? "medium",
    duration_minutes: body.duration_minutes ?? 30,
    total_questions: body.total_questions ?? questions.length,
    passing_score: body.passing_score ?? 60,
    is_active: body.is_active ?? true,
    is_timed: body.is_timed ?? true,
    randomize_questions: body.randomize_questions ?? false,
    tags: body.tags ?? [],
  };

  if (!assessmentPayload.title) return jsonError("title is required");

  const { data: assessment, error } = await ctx.supabase
    .from("assessments")
    .insert(assessmentPayload)
    .select()
    .single();

  if (error) return jsonError(error.message, 500);

  if (questions.length > 0) {
    const { error: questionError } = await ctx.supabase.from("questions").insert(
      questions.map((question: any, index: number) => ({
        assessment_id: assessment.id,
        question_text: question.question_text,
        question_type: question.question_type ?? "mcq",
        options: question.options ?? [],
        correct_answer: question.correct_answer,
        explanation: question.explanation ?? null,
        difficulty: question.difficulty ?? assessmentPayload.difficulty,
        marks: question.marks ?? 1,
        section: question.section ?? null,
        tags: question.tags ?? [],
        order_index: question.order_index ?? index,
      }))
    );

    if (questionError) return jsonError(questionError.message, 500);
  }

  await ctx.supabase.from("audit_logs").insert({
    user_id: ctx.userId,
    action: "assessment_created",
    resource_type: "assessment",
    resource_id: assessment.id,
    new_values: assessment,
  });

  return jsonData(assessment, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const ctx = await requireUser(["admin", "trainer"]);
  if (!isApiContext(ctx)) return ctx;

  const body = await request.json();
  if (!body.id) return jsonError("id is required");

  const { id, questions, ...updates } = body;
  const { data, error } = await ctx.supabase
    .from("assessments")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return jsonError(error.message, 500);

  if (Array.isArray(questions)) {
    await ctx.supabase.from("questions").delete().eq("assessment_id", id);
    if (questions.length > 0) {
      const { error: questionError } = await ctx.supabase.from("questions").insert(
        questions.map((question: any, index: number) => ({
          assessment_id: id,
          question_text: question.question_text,
          question_type: question.question_type ?? "mcq",
          options: question.options ?? [],
          correct_answer: question.correct_answer,
          explanation: question.explanation ?? null,
          difficulty: question.difficulty ?? data.difficulty,
          marks: question.marks ?? 1,
          section: question.section ?? null,
          tags: question.tags ?? [],
          order_index: question.order_index ?? index,
        }))
      );
      if (questionError) return jsonError(questionError.message, 500);
    }
  }

  await ctx.supabase.from("audit_logs").insert({
    user_id: ctx.userId,
    action: "assessment_updated",
    resource_type: "assessment",
    resource_id: id,
    new_values: updates,
  });

  return jsonData(data);
}

export async function DELETE(request: NextRequest) {
  const ctx = await requireUser(["admin", "trainer"]);
  if (!isApiContext(ctx)) return ctx;

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return jsonError("id is required");

  const { error } = await ctx.supabase.from("assessments").delete().eq("id", id);
  if (error) return jsonError(error.message, 500);

  await ctx.supabase.from("audit_logs").insert({
    user_id: ctx.userId,
    action: "assessment_deleted",
    resource_type: "assessment",
    resource_id: id,
  });

  return jsonData({ id });
}
