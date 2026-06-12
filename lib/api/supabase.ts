import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types";

export type ApiContext = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  authUserId: string;
  userId: string;
  role: UserRole;
};

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function jsonData<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ success: true, data }, init);
}

export async function requireUser(roles?: UserRole[]): Promise<ApiContext | NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return jsonError("Unauthorized", 401);

  const { data: appUser, error } = await supabase
    .from("users")
    .select("id, role")
    .eq("auth_id", user.id)
    .single();

  if (error || !appUser) return jsonError("User not found", 404);

  const role = appUser.role as UserRole;
  if (roles && !roles.includes(role)) return jsonError("Forbidden", 403);

  return {
    supabase,
    authUserId: user.id,
    userId: appUser.id,
    role,
  };
}

export function isApiContext(value: ApiContext | NextResponse): value is ApiContext {
  return !(value instanceof NextResponse);
}
