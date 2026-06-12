import { NextRequest } from "next/server";
import { isApiContext, jsonData, jsonError, requireUser } from "@/lib/api/supabase";
import type { UserRole } from "@/types";

const userRoles: UserRole[] = ["student", "trainer", "placement_officer", "admin"];

export async function GET(request: NextRequest) {
  const ctx = await requireUser(["admin"]);
  if (!isApiContext(ctx)) return ctx;

  const resource = request.nextUrl.searchParams.get("resource") ?? "overview";

  if (resource === "users") {
    const { data, error } = await ctx.supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return jsonError(error.message, 500);
    return jsonData(data ?? []);
  }

  if (resource === "logs") {
    const { data, error } = await ctx.supabase
      .from("audit_logs")
      .select("*, users(full_name, email)")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) return jsonError(error.message, 500);
    return jsonData(data ?? []);
  }

  if (resource === "analytics") {
    const [users, assessments, codingQuestions, internships, events, attempts, codingSubmissions, readinessScores, students] = await Promise.all([
      ctx.supabase.from("users").select("role, is_active, created_at", { count: "exact" }),
      ctx.supabase.from("assessments").select("id, title, created_at", { count: "exact" }),
      ctx.supabase.from("coding_questions").select("id", { count: "exact", head: true }),
      ctx.supabase.from("internships").select("id", { count: "exact", head: true }),
      ctx.supabase.from("analytics_events").select("event_type, created_at").order("created_at", { ascending: false }).limit(500),
      ctx.supabase.from("attempts").select("id, assessment_id, percentage, status, created_at, completed_at"),
      ctx.supabase.from("coding_submissions").select("id, score, completion_percentage, submitted_at"),
      ctx.supabase.from("readiness_scores").select("user_id, overall_score, category"),
      ctx.supabase
        .from("student_analytics")
        .select("user_id, full_name, email, institution, branch, readiness_score, assessments_completed, coding_submissions")
        .order("readiness_score", { ascending: false, nullsFirst: false }),
    ]);

    if (users.error) return jsonError(users.error.message, 500);
    if (assessments.error) return jsonError(assessments.error.message, 500);
    if (codingQuestions.error) return jsonError(codingQuestions.error.message, 500);
    if (internships.error) return jsonError(internships.error.message, 500);
    if (events.error) return jsonError(events.error.message, 500);
    if (attempts.error) return jsonError(attempts.error.message, 500);
    if (codingSubmissions.error) return jsonError(codingSubmissions.error.message, 500);
    if (readinessScores.error) return jsonError(readinessScores.error.message, 500);
    if (students.error) return jsonError(students.error.message, 500);

    return jsonData({
      users: users.data ?? [],
      total_assessments: assessments.count ?? 0,
      total_coding_questions: codingQuestions.count ?? 0,
      total_internships: internships.count ?? 0,
      recent_events: events.data ?? [],
      assessments: assessments.data ?? [],
      attempts: attempts.data ?? [],
      coding_submissions: codingSubmissions.data ?? [],
      readiness_scores: readinessScores.data ?? [],
      students: students.data ?? [],
    });
  }

  const [
    { count: totalUsers },
    { count: activeUsers },
    { count: assessments },
    { count: attempts },
    { count: codingSubmissions },
    { count: internships },
  ] = await Promise.all([
    ctx.supabase.from("users").select("id", { count: "exact", head: true }),
    ctx.supabase.from("users").select("id", { count: "exact", head: true }).eq("is_active", true),
    ctx.supabase.from("assessments").select("id", { count: "exact", head: true }),
    ctx.supabase.from("attempts").select("id", { count: "exact", head: true }),
    ctx.supabase.from("coding_submissions").select("id", { count: "exact", head: true }),
    ctx.supabase.from("internships").select("id", { count: "exact", head: true }),
  ]);

  return jsonData({
    total_users: totalUsers ?? 0,
    active_users: activeUsers ?? 0,
    assessments: assessments ?? 0,
    attempts: attempts ?? 0,
    coding_submissions: codingSubmissions ?? 0,
    internships: internships ?? 0,
  });
}

export async function POST(request: NextRequest) {
  const ctx = await requireUser(["admin"]);
  if (!isApiContext(ctx)) return ctx;

  const body = await request.json();

  if (body.action === "update_user") {
    if (!body.id) return jsonError("id is required");
    const updates: Record<string, unknown> = {};

    if (typeof body.is_active === "boolean") updates.is_active = body.is_active;
    if (typeof body.email_verified === "boolean") updates.email_verified = body.email_verified;
    if (body.full_name) updates.full_name = body.full_name;
    if (body.role) {
      if (!userRoles.includes(body.role)) return jsonError("Invalid role");
      updates.role = body.role;
    }

    const { data, error } = await ctx.supabase
      .from("users")
      .update(updates)
      .eq("id", body.id)
      .select()
      .single();

    if (error) return jsonError(error.message, 500);

    await ctx.supabase.from("audit_logs").insert({
      user_id: ctx.userId,
      action: "admin_user_updated",
      resource_type: "user",
      resource_id: body.id,
      new_values: updates,
    });

    return jsonData(data);
  }

  if (body.action === "create_placement_drive") {
    // Map incoming placement drive payload to the `internships` schema
    const min_cgpa = typeof body.min_cgpa === "number" ? body.min_cgpa : null;
    const eligible_branches = body.eligible_branches ?? null;
    const eligible_years = body.eligible_years ?? null;

    const { data, error } = await ctx.supabase
      .from("internships")
      .insert({
        company_name: body.company_name,
        title: body.title,
        description: body.description ?? null,
        location: body.location ?? null,
        start_date: body.start_date ?? null,
        application_deadline: body.application_deadline ?? body.registration_deadline ?? null,
        min_cgpa: min_cgpa,
        eligible_branches: eligible_branches,
        eligible_years: eligible_years,
        is_active: typeof body.is_active === "boolean" ? body.is_active : (body.status ? body.status !== "closed" : true),
      })
      .select()
      .single();

    if (error) return jsonError(error.message, 500);
    return jsonData(data, { status: 201 });
  }

  return jsonError("Unsupported admin action");
}
