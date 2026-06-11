import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function RedirectPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("auth_id", user.id)
    .single();

  const roleRedirects: Record<string, string> = {
    student: "/dashboard/student",
    trainer: "/dashboard/trainer",
    placement_officer: "/dashboard/placement",
    admin: "/dashboard/admin",
  };

  const dest = roleRedirects[userData?.role ?? "student"] ?? "/dashboard/student";
  redirect(dest);
}
