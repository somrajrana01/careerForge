"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  BarChart3,
  Code2,
  Download,
  FileQuestion,
  GraduationCap,
  Loader2,
  RefreshCw,
  Trophy,
  UserCog,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, getScoreColor } from "@/lib/utils";
import type { ReadinessCategory, UserRole } from "@/types";

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

type AdminAnalyticsApi = {
  users: Array<{ role: UserRole; is_active: boolean; created_at?: string }>;
  total_assessments: number;
  total_coding_questions: number;
  total_internships: number;
  recent_events: Array<{ event_type: string; created_at: string }>;
  assessments: Array<{ id: string; title: string; created_at: string }>;
  attempts: Array<{ id: string; assessment_id: string; percentage: number | null; status: string | null; created_at: string; completed_at: string | null }>;
  coding_submissions: Array<{ id: string; score: number | null; completion_percentage: number | null; submitted_at: string }>;
  readiness_scores: Array<{ user_id: string; overall_score: number | null; category: ReadinessCategory | null }>;
  students: Array<{ user_id: string; full_name: string | null; email: string | null; institution: string | null; branch: string | null; readiness_score: number | null; assessments_completed: number | null; coding_submissions: number | null }>;
};

type ChartPoint = {
  label: string;
  value: number;
  secondary?: number;
};

const readinessLabels: Record<ReadinessCategory | "unknown", string> = {
  not_ready: "Not Ready",
  needs_improvement: "Needs Improvement",
  internship_ready: "Internship Ready",
  highly_ready: "Highly Ready",
  unknown: "Unscored",
};

const chartColors = ["#6366f1", "#10b981", "#f59e0b", "#f43f5e", "#06b6d4"];

function monthKey(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: "short", year: "2-digit" });
}

function buildMonthlySeries<T>(rows: T[], getDate: (row: T) => string | null | undefined): ChartPoint[] {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const date = getDate(row);
    if (!date) continue;
    const key = monthKey(date);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({ label: monthLabel(key), value }));
}

function downloadCsv(filename: string, rows: Array<Record<string, string | number>>) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  const csv = [headers.join(","), ...rows.map((row) => headers.map((header) => escape(row[header])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

async function readApi<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !payload.success) throw new Error(payload.error ?? "Request failed");
  return payload.data as T;
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[260px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function ChartShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-28 rounded-xl bg-muted/60 animate-pulse" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-80 rounded-xl bg-muted/60 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AdminAnalyticsApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const api = await readApi<AdminAnalyticsApi>(await fetch("/api/admin?resource=analytics", { cache: "no-store" }));
      setData(api);
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const metrics = useMemo(() => {
    if (!data) return null;
    const users = data.users;
    const scores = data.readiness_scores.map((score) => Number(score.overall_score ?? 0)).filter((score) => score > 0);
    const averageReadiness = scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;

    return [
      { label: "Total Users", value: users.length, icon: Users, color: "text-indigo-400" },
      { label: "Total Students", value: users.filter((user) => user.role === "student").length, icon: GraduationCap, color: "text-emerald-400" },
      { label: "Total Trainers", value: users.filter((user) => user.role === "trainer").length, icon: UserCog, color: "text-amber-400" },
      {
        label: "Placement Officers",
        value: users.filter((user) => user.role === "placement_officer").length,
        icon: Users,
        color: "text-cyan-400",
      },
      { label: "Total Assessments", value: data.total_assessments, icon: FileQuestion, color: "text-violet-400" },
      { label: "Coding Questions", value: data.total_coding_questions, icon: Code2, color: "text-rose-400" },
      { label: "Coding Submissions", value: data.coding_submissions.length, icon: Activity, color: "text-blue-400" },
      { label: "Avg Readiness", value: `${averageReadiness}%`, icon: BarChart3, color: getScoreColor(averageReadiness) },
    ];
  }, [data]);

  const userGrowth = useMemo(() => (data ? buildMonthlySeries(data.users as any[], (row: any) => row.created_at) : []), [data]);
  const assessmentActivity = useMemo(
    () => (data ? buildMonthlySeries(data.attempts as any[], (row: any) => row.completed_at ?? row.created_at) : []),
    [data]
  );
  const codingActivity = useMemo(() => (data ? buildMonthlySeries(data.coding_submissions as any[], (row: any) => row.submitted_at) : []), [data]);

  const readinessDistribution = useMemo(() => {
    if (!data) return [];
    const counts = new Map<ReadinessCategory | "unknown", number>();
    for (const score of data.readiness_scores) {
      counts.set(score.category ?? "unknown", (counts.get(score.category ?? "unknown") ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([category, value]) => ({
      label: readinessLabels[category],
      value,
    }));
  }, [data]);

  const topStudents = useMemo(() => {
    if (!data) return [];
    return data.students
      .filter((student) => (student.readiness_score ?? 0) > 0)
      .sort((a, b) => (b.readiness_score ?? 0) - (a.readiness_score ?? 0))
      .slice(0, 8);
  }, [data]);

  const completionRate = useMemo(() => {
    if (!data) return [];
    return data.assessments
      .map((assessment) => {
        const attempts = data.attempts.filter((attempt) => attempt.assessment_id === assessment.id);
        const completed = attempts.filter((attempt) => attempt.status === "completed" || attempt.completed_at).length;
        const rate = attempts.length > 0 ? Math.round((completed / attempts.length) * 100) : 0;
        return {
          label: assessment.title.length > 18 ? `${assessment.title.slice(0, 18)}...` : assessment.title,
          value: rate,
          secondary: attempts.length,
        };
      })
      .filter((item) => item.secondary && item.secondary > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [data]);

  const exportAnalytics = () => {
    if (!data || !metrics) return;
    downloadCsv("admin_analytics.csv", [
      ...metrics.map((metric) => ({ section: "metric", name: metric.label, value: metric.value })),
      ...userGrowth.map((point) => ({ section: "user_growth", name: point.label, value: point.value })),
      ...assessmentActivity.map((point) => ({ section: "assessment_activity", name: point.label, value: point.value })),
      ...codingActivity.map((point) => ({ section: "coding_submission_activity", name: point.label, value: point.value })),
      ...readinessDistribution.map((point) => ({ section: "readiness_distribution", name: point.label, value: point.value })),
      ...topStudents.map((student) => ({
        section: "top_students",
        name: student.full_name ?? student.email ?? student.user_id,
        value: Math.round(student.readiness_score ?? 0),
      })),
      ...completionRate.map((point) => ({ section: "assessment_completion_rate", name: point.label, value: point.value })),
    ]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-sm text-muted-foreground">Review platform-wide activity, readiness, and assessment outcomes.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={loadAnalytics} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
          <Button onClick={exportAnalytics} disabled={!data || loading}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          {lastUpdated ? (
            <span className="text-sm text-muted-foreground">Last updated {new Date(lastUpdated).toLocaleString()}</span>
          ) : null}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
            <div>
              <p className="text-sm font-medium text-destructive">Analytics unavailable</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <SkeletonDashboard />
      ) : data && metrics ? (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <Card key={metric.label}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{metric.label}</p>
                      <p className={cn("mt-2 text-2xl font-bold", metric.color)}>{metric.value}</p>
                    </div>
                    <div className="rounded-lg bg-muted p-2">
                      <metric.icon className={cn("h-4 w-4", metric.color)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <ChartShell title="User Growth Over Time">
              {userGrowth.length === 0 ? (
                <EmptyChart message="No user growth data available." />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="value" name="Users" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </ChartShell>

            <ChartShell title="Assessment Activity">
              {assessmentActivity.length === 0 ? (
                <EmptyChart message="No assessment attempts completed yet." />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={assessmentActivity}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" name="Attempts" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartShell>

            <ChartShell title="Coding Submission Activity">
              {codingActivity.length === 0 ? (
                <EmptyChart message="No coding submissions yet." />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={codingActivity}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" name="Submissions" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartShell>

            <ChartShell title="Readiness Score Distribution">
              {readinessDistribution.length === 0 ? (
                <EmptyChart message="No readiness scores calculated yet." />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={readinessDistribution} dataKey="value" nameKey="label" outerRadius={92} label>
                      {readinessDistribution.map((_, index) => (
                        <Cell key={index} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartShell>

            <ChartShell title="Top Performing Students">
              {topStudents.length === 0 ? (
                <EmptyChart message="No scored students available." />
              ) : (
                <div className="space-y-2">
                  {topStudents.map((student, index) => (
                    <div key={student.user_id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold">
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{student.full_name ?? student.email ?? "Student"}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {[student.branch, student.institution].filter(Boolean).join(" / ")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Trophy className={cn("h-4 w-4", getScoreColor(student.readiness_score ?? 0))} />
                        <span className={cn("text-sm font-bold", getScoreColor(student.readiness_score ?? 0))}>
                          {Math.round(student.readiness_score ?? 0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ChartShell>

            <ChartShell title="Assessment Completion Rate">
              {completionRate.length === 0 ? (
                <EmptyChart message="No assessment completion data available." />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={completionRate} layout="vertical" margin={{ left: 16, right: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <YAxis dataKey="label" type="category" width={120} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" name="Completion %" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartShell>
          </div>
        </>
      ) : (
        <EmptyChart message="No analytics data available." />
      )}
    </div>
  );
}
