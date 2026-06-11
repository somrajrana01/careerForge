import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { auth_id, email, full_name, role } = await request.json();

    if (!auth_id || !email || !full_name || !role) {
      return NextResponse.json({ error: "Missing required fields", success: false }, { status: 400 });
    }

    const validRoles = ["student", "trainer", "placement_officer", "admin"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role", success: false }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Create user record
    const { data: user, error: userError } = await supabase
      .from("users")
      .insert({ auth_id, email, full_name, role })
      .select()
      .single();

    if (userError) {
      console.error("User creation error:", userError);
      // If duplicate, just return success (user might already exist)
      if (userError.code === "23505") {
        return NextResponse.json({ message: "User already exists", success: true });
      }
      return NextResponse.json({ error: userError.message, success: false }, { status: 500 });
    }

    // Create student profile if student role
    if (role === "student") {
      await supabase.from("student_profiles").insert({
        user_id: user.id,
        skills: [],
        languages: [],
        target_companies: [],
        profile_completion: 5,
      });
    }

    // Create welcome notification
    await supabase.from("notifications").insert({
      user_id: user.id,
      title: "Welcome to IRAN! 🎉",
      message: `Hi ${full_name}! Your account is ready. ${role === "student" ? "Start by completing your profile to improve your readiness score." : "Your dashboard is ready to use."}`,
      type: "success",
    });

    // Audit log
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "user_registered",
      resource_type: "user",
      resource_id: user.id,
      new_values: { email, role },
    });

    return NextResponse.json({ data: user, success: true });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error.message ?? "Registration failed", success: false },
      { status: 500 }
    );
  }
}
