import { NextRequest } from "next/server";
import { isApiContext, jsonData, jsonError, requireUser } from "@/lib/api/supabase";

const placementRoles = ["admin", "placement_officer"] as const;

export async function GET(request: NextRequest) {
  const ctx = await requireUser(["admin", "placement_officer", "trainer"]);
  if (!isApiContext(ctx)) return ctx;

  const resource = request.nextUrl.searchParams.get("resource") ?? "analytics";

  if (resource === "drives") {
    // Use existing `internships` table as placement drives
    const { data, error } = await ctx.supabase.from("internships").select("*").order("created_at", { ascending: false });
    if (error) return jsonError(error.message, 500);
    return jsonData(data ?? []);
  }

  if (resource === "applications") {
    // Return internship_matches as applications and include related user and internship data.
    const { data, error } = await ctx.supabase
      .from("internship_matches")
      .select("*, users(full_name, email), internships(*)")
      .order("calculated_at", { ascending: false });

    if (error) return jsonError(error.message, 500);

    // Return related internship record under `internships` (client reads `internships` relation)
    const rows = (data ?? []).map((r: any) => ({
      ...r,
      // keep related internship record under `internships` (matching schema)
      applied_at: r.calculated_at ?? null,
    }));

    return jsonData(rows);
  }

  if (resource === "pipeline") {
    // Build pipeline analytics from existing internships and internship_matches
    const [{ data: internships }, { data: matches }] = await Promise.all([
      ctx.supabase.from("internships").select("id, company_name, title"),
      ctx.supabase.from("internship_matches").select("id, internship_id, match_percentage"),
    ]);

    if (!internships) return jsonData([]);

    const counts = new Map<string, { applications: number; high_match: number }>();
    (matches ?? []).forEach((m: any) => {
      const id = String(m.internship_id);
      const entry = counts.get(id) ?? { applications: 0, high_match: 0 };
      entry.applications += 1;
      if (typeof m.match_percentage === "number" && m.match_percentage >= 80) entry.high_match += 1;
      counts.set(id, entry);
    });

    const pipeline = (internships ?? []).map((i: any) => ({
      source_id: i.id,
      company_name: i.company_name,
      title: i.title,
      applications: counts.get(String(i.id))?.applications ?? 0,
      placed: counts.get(String(i.id))?.high_match ?? 0,
    }))
      .sort((a: any, b: any) => (b.applications ?? 0) - (a.applications ?? 0));

    return jsonData(pipeline);
  }

  const [{ data: students }, { data: readiness }, { data: internships }, { data: matches }] = await Promise.all([
    ctx.supabase.from("student_analytics").select("*"),
    ctx.supabase.from("readiness_scores").select("overall_score, category"),
    ctx.supabase.from("internships").select("id, company_name, title"),
    ctx.supabase.from("internship_matches").select("id, internship_id, match_percentage"),
  ]);

  const countsMap = new Map<string, { applications: number; placed: number }>();
  (matches ?? []).forEach((m: any) => {
    const id = String(m.internship_id);
    const entry = countsMap.get(id) ?? { applications: 0, placed: 0 };
    entry.applications += 1;
    if (typeof m.match_percentage === "number" && m.match_percentage >= 80) entry.placed += 1;
    countsMap.set(id, entry);
  });

  const pipeline = (internships ?? []).map((i: any) => ({
    source_id: i.id,
    company_name: i.company_name,
    title: i.title,
    applications: countsMap.get(String(i.id))?.applications ?? 0,
    placed: countsMap.get(String(i.id))?.placed ?? 0,
  }));

  return jsonData({
    students: students ?? [],
    readiness: readiness ?? [],
    pipeline: pipeline ?? [],
  });
}

export async function POST(request: NextRequest) {
  const ctx = await requireUser(["admin", "placement_officer"]);
  if (!isApiContext(ctx)) return ctx;

  const body = await request.json();

  if (body.action === "create_drive") {
    if (!body.company_name || !body.title) return jsonError("company_name and title are required");

    // Map incoming drive payload to `internships` schema fields
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

  // Updating application statuses is not supported against internship_matches schema.
  if (body.action === "update_application") {
    return jsonError("Updating application status is not supported for internship_matches", 400);
  }

  return jsonError("Unsupported placement action");
}

export async function PATCH(request: NextRequest) {
  const ctx = await requireUser([...placementRoles]);
  if (!isApiContext(ctx)) return ctx;

  const body = await request.json();
  if (!body.id) return jsonError("id is required");

  const { id, ...updates } = body;
  const { data, error } = await ctx.supabase
    .from("internships")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return jsonError(error.message, 500);
  return jsonData(data);
}

export async function DELETE(request: NextRequest) {
  const ctx = await requireUser([...placementRoles]);
  if (!isApiContext(ctx)) return ctx;

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return jsonError("id is required");

  const { error } = await ctx.supabase.from("internships").delete().eq("id", id);
  if (error) return jsonError(error.message, 500);
  return jsonData({ id });
}
