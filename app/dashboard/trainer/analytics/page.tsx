"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/index";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/index";
import { Loader2, RefreshCw, Download } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { readFileSync } from "fs";
import { useToast } from "@/hooks/use-toast";

type ApiResponse<T> = { success: boolean; data?: T; error?: string };

async function readApi<T>(res: Response) {
  const payload = (await res.json()) as ApiResponse<T>;
  if (!res.ok || !payload.success) throw new Error(payload.error ?? "Request failed");
  return payload.data as T;
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

export default function TrainerAnalyticsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [studentsData, batchesData] = await Promise.all([
        readApi<any[]>(await fetch(`/api/trainer?resource=students`, { cache: "no-store" })),
        readApi<any[]>(await fetch(`/api/trainer?resource=batches`, { cache: "no-store" })),
      ]);
      setStudents(studentsData ?? []);
      setBatches(batchesData ?? []);
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
      toast({ title: "Error", description: String(err instanceof Error ? err.message : err) });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const readinessDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of students) {
      const score = Math.round(Number(s.readiness_score ?? 0));
      const bucket = score >= 80 ? "Highly Ready" : score >= 60 ? "Internship Ready" : score >= 40 ? "Needs Improvement" : score > 0 ? "Not Ready" : "Unscored";
      counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([label, value]) => ({ label, value }));
  }, [students]);

  const avgPerBatch = useMemo(() => {
    const map = new Map<string, { name: string; total: number; count: number }>();
    for (const b of batches) map.set(String(b.id), { name: b.name ?? "Batch", total: 0, count: 0 });
    for (const s of students) {
      const bid = String(s.batch_id ?? "");
      const entry = map.get(bid) ?? { name: "Unassigned", total: 0, count: 0 };
      entry.total += Number(s.readiness_score ?? 0);
      entry.count += 1;
      map.set(bid, entry);
    }
    return Array.from(map.entries())
      .map(([id, v]) => ({ batch: v.name, avg: v.count > 0 ? Math.round(v.total / v.count) : 0, count: v.count }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 12);
  }, [batches, students]);

  const exportCsv = () => {
    const rows: Record<string, string | number>[] = [];
    for (const s of students) rows.push({ user_id: s.user_id ?? s.id, name: s.full_name ?? s.email ?? "", email: s.email ?? "", readiness: Math.round(Number(s.readiness_score ?? 0)), batch_id: s.batch_id ?? "" });
    downloadCsv("trainer_students.csv", rows);
  };

  const chartColors = ["#6366f1", "#10b981", "#f59e0b", "#f43f5e", "#06b6d4"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-sm text-muted-foreground">Review training performance trends.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
          <Button onClick={exportCsv} disabled={loading || students.length === 0}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          {lastUpdated ? <span className="text-sm text-muted-foreground">Last updated {new Date(lastUpdated).toLocaleString()}</span> : null}
        </div>
      </div>

      {error && <div className="text-sm text-destructive">{error}</div>}

      {loading ? (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-56 rounded-xl bg-muted/60 animate-pulse" />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Readiness Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {readinessDistribution.length === 0 ? (
                <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">No data</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={readinessDistribution} dataKey="value" nameKey="label" outerRadius={80} label>
                      {readinessDistribution.map((_, idx) => (
                        <Cell key={idx} fill={chartColors[idx % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Average Readiness by Batch</CardTitle>
            </CardHeader>
            <CardContent>
              {avgPerBatch.length === 0 ? (
                <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">No batch data</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={avgPerBatch} margin={{ left: 8, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="batch" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="avg" fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Top Students</CardTitle>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">No students</div>
              ) : (
                <div className="space-y-2">
                  {students
                    .filter((s) => Number(s.readiness_score ?? 0) > 0)
                    .sort((a, b) => Number(b.readiness_score ?? 0) - Number(a.readiness_score ?? 0))
                    .slice(0, 8)
                    .map((s) => (
                      <div key={s.user_id ?? s.id} className="flex items-center justify-between rounded-lg border p-2">
                        <div>
                          <p className="text-sm font-medium">{s.full_name ?? s.email}</p>
                          <p className="text-xs text-muted-foreground">{s.email}</p>
                        </div>
                        <div className="text-sm font-bold">{Math.round(Number(s.readiness_score ?? 0))}%</div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
