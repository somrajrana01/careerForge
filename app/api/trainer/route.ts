import { NextRequest } from "next/server";
import { isApiContext, jsonData, jsonError, requireUser } from "@/lib/api/supabase";

export async function GET(request: NextRequest) {
  const ctx = await requireUser(["admin", "trainer"]);
  if (!isApiContext(ctx)) return ctx;

  const resource = request.nextUrl.searchParams.get("resource") ?? "overview";

  if (resource === "students") {
    const [studentsResult, membershipsResult, batchesResult] = await Promise.all([
      ctx.supabase
        .from("student_analytics")
        .select("*")
        .order("readiness_score", { ascending: false, nullsFirst: false }),
      ctx.supabase.from("training_batch_students").select("user_id,batch_id,enrolled_at"),
      ctx.supabase.from("training_batches").select("id,name,trainer_id"),
    ]);

    if (studentsResult.error) return jsonError(studentsResult.error.message, 500);
    if (membershipsResult.error) return jsonError(membershipsResult.error.message, 500);
    if (batchesResult.error) return jsonError(batchesResult.error.message, 500);

    const batchById = new Map((batchesResult.data ?? []).map((batch) => [batch.id, batch]));
    const membershipMap = new Map<string, any>();

    for (const membership of membershipsResult.data ?? []) {
      const currentBatch = batchById.get(membership.batch_id);
      if (ctx.role === "trainer" && currentBatch?.trainer_id !== ctx.userId) continue;

      const existing = membershipMap.get(membership.user_id);
      const currentEnrolledAt = new Date(membership.enrolled_at).getTime();
      const existingEnrolledAt = existing ? new Date(existing.enrolled_at).getTime() : 0;

      if (!existing || currentEnrolledAt > existingEnrolledAt) {
        membershipMap.set(membership.user_id, {
          ...membership,
          batch_name: currentBatch?.name ?? null,
        });
      }
    }

    const students = (studentsResult.data ?? []).map((student) => {
      const membership = membershipMap.get(student.user_id);
      return {
        ...student,
        batch_id: membership?.batch_id ?? null,
        batch_name: membership?.batch_name ?? null,
      };
    });

    return jsonData(students);
  }

  if (resource === "batches") {
    let query: any = ctx.supabase
      .from("training_batches")
      .select("*, training_batch_students(*), training_sessions(*)");
    if (ctx.role === "trainer") query = query.eq("trainer_id", ctx.userId);
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) return jsonError(error.message, 500);
    return jsonData(data ?? []);
  }

  if (resource === "batch_details") {
    const batchId = request.nextUrl.searchParams.get("batch_id");
    if (!batchId) return jsonError("batch_id is required");

    let query: any = ctx.supabase
      .from("training_batches")
      .select("*, training_batch_students(*), training_sessions(*)")
      .eq("id", batchId)
      .maybeSingle();
    if (ctx.role === "trainer") query = query.eq("trainer_id", ctx.userId);

    const { data, error } = await query;
    if (error) return jsonError(error.message, 500);
    if (!data) return jsonError("Batch not found", 404);
    return jsonData(data);
  }

  if (resource === "sessions") {
    let query = ctx.supabase.from("training_sessions").select("*, training_batches(name)");
    if (ctx.role === "trainer") query = query.eq("trainer_id", ctx.userId);
    const { data, error } = await query.order("starts_at", { ascending: false });
    if (error) return jsonError(error.message, 500);
    return jsonData(data ?? []);
  }

  const [students, assessments, batches, activity] = await Promise.all([
    ctx.supabase.from("student_analytics").select("*"),
    ctx.supabase.from("assessments").select("id", { count: "exact", head: true }).eq("is_active", true),
    ctx.supabase.from("trainer_batch_analytics").select("*").eq("trainer_id", ctx.userId),
    ctx.supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(25),
  ]);

  return jsonData({
    students: students.data ?? [],
    active_assessments: assessments.count ?? 0,
    batches: batches.data ?? [],
    recent_activity: activity.data ?? [],
  });
}

export async function POST(request: NextRequest) {
  const ctx = await requireUser(["admin", "trainer"]);
  if (!isApiContext(ctx)) return ctx;

  const body = await request.json();

  if (body.action === "create_batch") {
    if (!body.name) return jsonError("name is required");

    const { data, error } = await ctx.supabase
      .from("training_batches")
      .insert({
        trainer_id: body.trainer_id ?? ctx.userId,
        name: body.name,
        description: body.description ?? null,
        status: body.status ?? "active",
        start_date: body.start_date ?? null,
        end_date: body.end_date ?? null,
      })
      .select()
      .single();

    if (error) return jsonError(error.message, 500);
    return jsonData(data, { status: 201 });
  }

  if (body.action === "enroll_student") {
    if (!body.batch_id || !body.user_id) return jsonError("batch_id and user_id are required");

    const { data, error } = await ctx.supabase
      .from("training_batch_students")
      .upsert({ batch_id: body.batch_id, user_id: body.user_id }, { onConflict: "batch_id,user_id" })
      .select()
      .single();

    if (error) return jsonError(error.message, 500);
    return jsonData(data, { status: 201 });
  }

  if (body.action === "move_student_batch") {
    if (!body.target_batch_id || !body.user_id) return jsonError("target_batch_id and user_id are required");

    if (body.from_batch_id) {
      await ctx.supabase
        .from("training_batch_students")
        .delete()
        .eq("batch_id", body.from_batch_id)
        .eq("user_id", body.user_id);
    }

    const { data, error } = await ctx.supabase
      .from("training_batch_students")
      .upsert({ batch_id: body.target_batch_id, user_id: body.user_id }, { onConflict: "batch_id,user_id" })
      .select()
      .single();

    if (error) return jsonError(error.message, 500);
    return jsonData(data, { status: 201 });
  }

  if (body.action === "create_session") {
    if (!body.title) return jsonError("title is required");

    const { data, error } = await ctx.supabase
      .from("training_sessions")
      .insert({
        batch_id: body.batch_id ?? null,
        trainer_id: body.trainer_id ?? ctx.userId,
        title: body.title,
        description: body.description ?? null,
        starts_at: body.starts_at ?? null,
        duration_minutes: body.duration_minutes ?? 60,
        status: body.status ?? "scheduled",
        attendance: body.attendance ?? {},
      })
      .select()
      .single();

    if (error) return jsonError(error.message, 500);
    return jsonData(data, { status: 201 });
  }

  return jsonError("Unsupported trainer action");
}

export async function PATCH(request: NextRequest) {
  const ctx = await requireUser(["admin", "trainer"]);
  if (!isApiContext(ctx)) return ctx;

  const body = await request.json();
  if (!body.id || !body.resource) return jsonError("id and resource are required");

  const table = body.resource === "session" ? "training_sessions" : "training_batches";
  const { id, ...updates } = body;
  delete updates.resource;

  const { data, error } = await ctx.supabase
    .from(table)
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

  const body = await request.json();
  if (!body.resource) return jsonError("resource is required");

  if (body.resource === "batch") {
    if (!body.id) return jsonError("id is required");
    const { error } = await ctx.supabase.from("training_batches").delete().eq("id", body.id);
    if (error) return jsonError(error.message, 500);
    return jsonData({ deleted: true });
  }

  if (body.resource === "batch_membership") {
    if (!body.batch_id || !body.user_id) return jsonError("batch_id and user_id are required");
    const { error } = await ctx.supabase
      .from("training_batch_students")
      .delete()
      .eq("batch_id", body.batch_id)
      .eq("user_id", body.user_id);
    if (error) return jsonError(error.message, 500);
    return jsonData({ deleted: true });
  }

  return jsonError("Unsupported delete resource");
}
