"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/index";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/index";
import { Loader2, RefreshCw, Download } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
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
  const csv = [headers.join(","), ...rows.map((row) => headers.map((h) => escape(row[h])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function PlacementAnalyticsPage() {
  const [pipeline, setPipeline] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pipelineData, appsData] = await Promise.all([
        readApi<any[]>(await fetch(`/api/placement?resource=pipeline`, { cache: "no-store" })),
        readApi<any[]>(await fetch(`/api/placement?resource=applications`, { cache: "no-store" })),
      ]);
      setPipeline(pipelineData ?? []);
      setApplications(appsData ?? []);
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      toast({ title: "Error", description: String(err instanceof Error ? err.message : err) });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const conversionRate = useMemo(() => {
    const total = applications.length;
    const placed = applications.filter((a) => a.status === "placed").length;
    return total > 0 ? Math.round((placed / total) * 100) : 0;
  }, [applications]);

  const byStatus = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of applications) counts.set(a.status ?? "unknown", (counts.get(a.status ?? "unknown") ?? 0) + 1);
    return Array.from(counts.entries()).map(([label, value]) => ({ label, value }));
  }, [applications]);

  const drivePerformance = useMemo(() => {
    return pipeline.map((p) => ({ name: p.drive || p.company_name || p.title || "Drive", applications: p.applications ?? 0, placed: p.placed ?? 0 }));
  }, [pipeline]);

  const exportCsv = () => {
    const rows = applications.map((a) => ({ id: a.id, user_id: a.user_id, status: a.status ?? "", applied_at: a.applied_at ?? "", drive: a.internships?.title ?? a.internships?.company_name ?? "" }));
    downloadCsv("placement_applications.csv", rows);
  };

  const chartColors = ["#6366f1", "#10b981", "#f59e0b", "#f43f5e", "#06b6d4"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Placement Analytics</h1>
          <p className="text-sm text-muted-foreground">Conversion, pipeline, and drive performance.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
          <Button onClick={exportCsv} disabled={loading || applications.length === 0}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          {lastUpdated ? <span className="text-sm text-muted-foreground">Last updated {new Date(lastUpdated).toLocaleString()}</span> : null}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-56 rounded-xl bg-muted/60 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Placement Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{conversionRate}%</div>
              <div className="text-sm text-muted-foreground">Based on {applications.length} applications</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Applications by Status</CardTitle>
            </CardHeader>
            <CardContent>
              {byStatus.length === 0 ? (
                <div className="text-sm text-muted-foreground">No data</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={byStatus} dataKey="value" nameKey="label" outerRadius={80} label>
                      {byStatus.map((_, idx) => (
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
              <CardTitle className="text-sm">Drive performance</CardTitle>
            </CardHeader>
            <CardContent>
              {drivePerformance.length === 0 ? (
                <div className="text-sm text-muted-foreground">No drive data</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={drivePerformance} margin={{ left: 8, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="applications" fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
