const baseUrl = process.env.HEALTH_CHECK_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const timeoutMs = Number(process.env.HEALTH_CHECK_TIMEOUT_MS ?? 10000);

const routes = [
  "/",
  "/auth/login",
  "/auth/register",
  "/dashboard/student",
  "/dashboard/student/profile",
  "/dashboard/student/resume",
  "/dashboard/student/assessments",
  "/dashboard/student/coding",
  "/dashboard/student/aptitude",
  "/dashboard/student/readiness",
  "/dashboard/student/recommendations",
  "/dashboard/student/internships",
  "/dashboard/admin",
  "/dashboard/trainer",
  "/dashboard/placement",
  "/dashboard/trainer/students",
  "/dashboard/trainer/assessments",
  "/dashboard/trainer/analytics",
  "/dashboard/placement/overview",
  "/dashboard/placement/analytics",
  "/dashboard/placement/reports",
  "/dashboard/admin/users",
  "/dashboard/admin/assessments",
  "/dashboard/admin/coding",
  "/dashboard/admin/analytics",
  "/dashboard/admin/logs",
];

type Result = {
  route: string;
  status: number | "ERR";
  ok: boolean;
  message: string;
};

function hasCrashSignature(html: string) {
  return [
    "TypeError: Failed to fetch",
    "This site can't be reached",
    "Application error: a client-side exception has occurred",
    "__NEXT_ERROR__",
  ].some((signature) => html.includes(signature));
}

async function checkRoute(route: string): Promise<Result> {
  const url = new URL(route, baseUrl).toString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { redirect: "manual", signal: controller.signal });
    const html = await response.text().catch(() => "");
    const redirectedToLogin = response.status >= 300 && response.status < 400 && response.headers.get("location")?.includes("/auth/login");

    if (redirectedToLogin) {
      return { route, status: response.status, ok: true, message: "protected route redirected to login" };
    }

    if (!response.ok) {
      return { route, status: response.status, ok: false, message: response.statusText || "HTTP failure" };
    }

    if (html.trim().length === 0) {
      return { route, status: response.status, ok: false, message: "empty response body" };
    }

    if (hasCrashSignature(html)) {
      return { route, status: response.status, ok: false, message: "runtime/fetch failure signature found" };
    }

    return { route, status: response.status, ok: true, message: "content returned" };
  } catch (error) {
    return {
      route,
      status: "ERR",
      ok: false,
      message: error instanceof Error && error.name === "AbortError"
        ? `timed out after ${timeoutMs}ms`
        : error instanceof Error ? error.message : "request failed",
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  console.log(`Route health check: ${baseUrl}`);
  const results: Result[] = [];

  for (const route of routes) {
    const result = await checkRoute(route);
    results.push(result);
    const status = result.ok ? "PASS" : "FAIL";
    console.log(`${status} ${result.status} ${result.route} - ${result.message}`);
  }


  const failed = results.filter((result) => !result.ok);
  console.log(`\nSummary: ${results.length - failed.length}/${results.length} passed`);

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main();
