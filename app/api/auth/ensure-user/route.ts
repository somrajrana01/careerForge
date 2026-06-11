import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

const VALID_ROLES = new Set([
  "student",
  "trainer",
  "placement_officer",
  "admin",
]);

export async function POST() {
  try {
    console.log("=== ENSURE USER START ===");

    const supabase = await createClient();

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    console.log("Auth user:", authUser?.id);

    if (authError) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        { success: false, error: authError.message },
        { status: 401 }
      );
    }

    if (!authUser) {
      console.error("No authenticated user");
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("SUPABASE_SERVICE_ROLE_KEY missing");
      return NextResponse.json(
        {
          success: false,
          error: "SUPABASE_SERVICE_ROLE_KEY missing",
        },
        { status: 500 }
      );
    }

    const admin = createAdminClient();

    const role =
      typeof authUser.user_metadata?.role === "string" &&
      VALID_ROLES.has(authUser.user_metadata.role)
        ? authUser.user_metadata.role
        : "student";

    const fullName =
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      authUser.email?.split("@")[0] ||
      "User";

    console.log("Looking for existing user...");

    const { data: existingUser, error: lookupError } = await admin
      .from("users")
      .select("*")
      .eq("auth_id", authUser.id)
      .maybeSingle();

    if (lookupError) {
      console.error("USERS LOOKUP ERROR:");
      console.error(JSON.stringify(lookupError, null, 2));

      return NextResponse.json(
        {
          success: false,
          error: lookupError.message,
          details: lookupError,
        },
        { status: 500 }
      );
    }

    if (existingUser) {
      console.log("Existing user found");
      return NextResponse.json({
        success: true,
        data: existingUser,
      });
    }

    console.log("Creating user...");

    const { data: createdUser, error: createError } = await admin
      .from("users")
      .upsert(
        {
          auth_id: authUser.id,
          email: authUser.email ?? "",
          full_name: fullName,
          role,
          email_verified: !!authUser.email_confirmed_at,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "auth_id",
        }
      )
      .select()
      .single();

    if (createError) {
      console.error("USER CREATE ERROR:");
      console.error(JSON.stringify(createError, null, 2));

      return NextResponse.json(
        {
          success: false,
          error: createError.message,
          details: createError,
        },
        { status: 500 }
      );
    }

    console.log("User created:", createdUser.id);

    if (createdUser.role === "student") {
      console.log("Creating student profile...");

      const { error: profileError } = await admin
        .from("student_profiles")
        .upsert(
          {
            user_id: createdUser.id,
            skills: [],
            languages: [],
            target_companies: [],
            profile_completion: 5,
          },
          {
            onConflict: "user_id",
          }
        );

      if (profileError) {
        console.error("PROFILE ERROR:");
        console.error(JSON.stringify(profileError, null, 2));
      }
    }

    console.log("=== ENSURE USER SUCCESS ===");

    return NextResponse.json({
      success: true,
      data: createdUser,
    });
  } catch (error: any) {
    console.error("=== ENSURE USER FATAL ERROR ===");
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}