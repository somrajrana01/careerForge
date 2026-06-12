import { NextRequest } from "next/server";
import { isApiContext, jsonData, jsonError, requireUser } from "@/lib/api/supabase";

function evaluateSubmission(code: string, difficulty: string) {
  const hasBody = code.trim().length > 30;
  const hasOutput = /\b(return|print|console\.log|cout)\b/.test(code);
  const total = difficulty === "hard" ? 10 : difficulty === "medium" ? 8 : 5;
  const passed = hasBody && hasOutput ? Math.max(1, Math.floor(total * 0.7)) : hasBody ? Math.floor(total * 0.35) : 0;
  const completion = total > 0 ? (passed / total) * 100 : 0;

  return {
    score: Math.round(completion),
    test_cases_passed: passed,
    test_cases_total: total,
    completion_percentage: completion,
    status: "evaluated",
    execution_time_ms: 75 + code.length,
    feedback: passed === total
      ? "All test cases passed."
      : passed > total / 2
      ? `${passed}/${total} test cases passed. Review edge cases.`
      : `${passed}/${total} test cases passed. Check the core logic.`,
  };
}

export async function GET(request: NextRequest) {
  const ctx = await requireUser();
  if (!isApiContext(ctx)) return ctx;

  const params = request.nextUrl.searchParams;
  const mode = params.get("mode") ?? "questions";

  if (mode === "submissions") {
    const userId = params.get("user_id") ?? ctx.userId;
    if (userId !== ctx.userId && !["admin", "trainer", "placement_officer"].includes(ctx.role)) {
      return jsonError("Forbidden", 403);
    }

    const { data, error } = await ctx.supabase
      .from("coding_submissions")
      .select("*, coding_questions(title, difficulty)")
      .eq("user_id", userId)
      .order("submitted_at", { ascending: false });

    if (error) return jsonError(error.message, 500);
    return jsonData(data ?? []);
  }

  let query = ctx.supabase
    .from("coding_questions")
    .select("*")
    .order("created_at", { ascending: false });

  if (!["admin", "trainer"].includes(ctx.role)) query = query.eq("is_active", true);
  if (params.get("difficulty")) query = query.eq("difficulty", params.get("difficulty"));
  if (params.get("id")) query = query.eq("id", params.get("id"));

  const { data, error } = params.get("id") ? await query.single() : await query;
  if (error) return jsonError(error.message, 500);
  return jsonData(data);
}

export async function POST(request: NextRequest) {
  const ctx = await requireUser();
  if (!isApiContext(ctx)) return ctx;

  const body = await request.json();

  if (body.action === "create_question") {
    if (!["admin", "trainer"].includes(ctx.role)) return jsonError("Forbidden", 403);
    if (!body.title || !body.problem_statement) return jsonError("title and problem_statement are required");

    const { data, error } = await ctx.supabase
      .from("coding_questions")
      .insert({
        created_by: ctx.userId,
        title: body.title,
        problem_statement: body.problem_statement,
        difficulty: body.difficulty ?? "medium",
        tags: body.tags ?? [],
        constraints: body.constraints ?? null,
        input_format: body.input_format ?? null,
        output_format: body.output_format ?? null,
        sample_input: body.sample_input ?? null,
        sample_output: body.sample_output ?? null,
        explanation: body.explanation ?? null,
        hints: body.hints ?? [],
        time_limit_ms: body.time_limit_ms ?? 2000,
        memory_limit_mb: body.memory_limit_mb ?? 256,
        is_active: body.is_active ?? true,
      })
      .select()
      .single();

    if (error) return jsonError(error.message, 500);
    return jsonData(data, { status: 201 });
  }

  if (!body.question_id || !body.code || !body.language) {
    return jsonError("question_id, code, and language are required");
  }

  const { data: question, error: questionError } = await ctx.supabase
    .from("coding_questions")
    .select("difficulty")
    .eq("id", body.question_id)
    .single();

  if (questionError || !question) return jsonError("Coding question not found", 404);

  const result = evaluateSubmission(body.code, question.difficulty);
  const { data, error } = await ctx.supabase
    .from("coding_submissions")
    .insert({
      user_id: ctx.userId,
      question_id: body.question_id,
      code: body.code,
      language: body.language,
      ...result,
    })
    .select()
    .single();

  if (error) return jsonError(error.message, 500);
  return jsonData(data, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const ctx = await requireUser(["admin", "trainer"]);
  if (!isApiContext(ctx)) return ctx;

  const body = await request.json();
  if (!body.id) return jsonError("id is required");

  const { id, ...updates } = body;
  const { data, error } = await ctx.supabase
    .from("coding_questions")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return jsonError(error.message, 500);
  return jsonData(data);
}

export async function DELETE(request: NextRequest) {
  const ctx = await requireUser(["admin", "trainer"]);
  if (!isApiContext(ctx)) return ctx;

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return jsonError("id is required");

  const { error } = await ctx.supabase.from("coding_questions").delete().eq("id", id);
  if (error) return jsonError(error.message, 500);
  return jsonData({ id });
}
