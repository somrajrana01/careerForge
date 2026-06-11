import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type SupabaseCookie = {
  name: string;
  value: string;
  options?: any;
};

const PUBLIC_ROUTES = [
  "/",
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
];

const AUTH_TIMEOUT_MS = 4000;

const ROLE_ROUTES: Record<string, string[]> = {
  student: ["/dashboard/student"],
  trainer: ["/dashboard/trainer"],
  placement_officer: ["/dashboard/placement"],
  admin: ["/dashboard/admin"],
};

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet: SupabaseCookie[]) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Get authenticated user with timeout protection
  const user = await Promise.race([
    supabase.auth
      .getUser()
      .then(({ data }) => data.user)
      .catch((err) => {
        console.error("Auth getUser failed:", err);
        return null;
      }),

    new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), AUTH_TIMEOUT_MS)
    ),
  ]);

  // =========================
  // DASHBOARD PROTECTION
  // =========================
  if (pathname.startsWith("/dashboard")) {
    if (!user) {
      return NextResponse.redirect(
        new URL("/auth/login", request.url)
      );
    }

    // Dashboard root redirect
    if (
      pathname === "/dashboard" ||
      pathname === "/dashboard/redirect"
    ) {
      try {
        const { data: userData, error } = await supabase
          .from("users")
          .select("role")
          .eq("auth_id", user.id)
          .maybeSingle();

        if (error) {
          console.error(
            "Dashboard redirect lookup error:",
            error
          );
        }

        // User row not created yet
        if (!userData) {
          return NextResponse.redirect(
            new URL("/dashboard/student", request.url)
          );
        }

        const roleMap: Record<string, string> = {
          student: "/dashboard/student",
          trainer: "/dashboard/trainer",
          placement_officer: "/dashboard/placement",
          admin: "/dashboard/admin",
        };

        return NextResponse.redirect(
          new URL(
            roleMap[userData.role] ?? "/dashboard/student",
            request.url
          )
        );
      } catch (err) {
        console.error(
          "Dashboard redirect failed:",
          err
        );

        return NextResponse.redirect(
          new URL("/dashboard/student", request.url)
        );
      }
    }

    // Role protection
    for (const [role, paths] of Object.entries(ROLE_ROUTES)) {
      if (paths.some((p) => pathname.startsWith(p))) {
        try {
          const { data: userData, error } = await supabase
            .from("users")
            .select("role")
            .eq("auth_id", user.id)
            .maybeSingle();

          if (error) {
            console.error(
              "Role lookup error:",
              error
            );

            // Don't block page if DB lookup fails
            break;
          }

          // Allow access while user row is being created
          if (!userData) {
            break;
          }

          // Admin can access everything
          if (userData.role === "admin") {
            break;
          }

          if (userData.role !== role) {
            const correctPath =
              ROLE_ROUTES[userData.role]?.[0] ??
              "/dashboard/student";

            return NextResponse.redirect(
              new URL(correctPath, request.url)
            );
          }
        } catch (err) {
          console.error(
            "Role permission check failed:",
            err
          );

          // Don't force logout because DB query failed
          break;
        }

        break;
      }
    }
  }

  // =========================
  // API PROTECTION
  // =========================
  if (
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/auth")
  ) {
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};