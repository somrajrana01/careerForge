"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/index";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/index";
import { Input } from "@/components/ui/index";
import { useToast } from "@/hooks/use-toast";
import { Download } from "lucide-react";

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

export default function PlacementReportsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [drives, setDrives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [appsData, drivesData] = await Promise.all([
        readApi<any[]>(await fetch(`/api/placement?resource=applications`, { cache: "no-store" })),
        readApi<any[]>(await fetch(`/api/placement?resource=drives`, { cache: "no-store" })),
      ]);
      setApplications(appsData ?? []);
      setDrives(drivesData ?? []);
    } catch (err) {
      toast({ title: "Error", description: String(err instanceof Error ? err.message : err) });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return applications.filter((a) => {
      if (q && ![a.user?.full_name, a.user?.email, a.internships?.company_name, a.internships?.title].some(Boolean)) return false;
      if (q && ![a.user?.full_name, a.user?.email, a.internships?.company_name, a.internships?.title].some((v) => String(v ?? "").toLowerCase().includes(q))) return false;
      if (from && new Date(a.applied_at) < new Date(from)) return false;
      if (to && new Date(a.applied_at) > new Date(to)) return false;
      return true;
    });
  }, [applications, query, from, to]);

  const exportCsv = () => {
    const rows = filtered.map((a) => ({ id: a.id, user: a.users?.full_name ?? a.user?.full_name ?? "", email: a.users?.email ?? a.user?.email ?? "", status: a.status ?? "", applied_at: a.applied_at ?? "" }));
    downloadCsv("placement_reports.csv", rows);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Reports</h1>
          <p className="text-sm text-muted-foreground">Prepare placement reports and exports.</p>
        </div>
        <Link href="/dashboard/placement" className="w-full sm:w-auto">
          <Button variant="secondary" className="w-full sm:w-auto">Back to dashboard</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter reports by drive, student, status, and date range.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-2">
            <Input placeholder="Search student or drive" value={query} onChange={(e) => setQuery(e.target.value)} />
            <Input type="date" value={from ?? ""} onChange={(e) => setFrom(e.target.value || null)} />
            <Input type="date" value={to ?? ""} onChange={(e) => setTo(e.target.value || null)} />
            <div className="ml-auto">
              <Button onClick={exportCsv} disabled={loading || filtered.length === 0}><Download className="h-4 w-4" /> Export CSV</Button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 rounded-lg bg-muted/60 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No report rows match the filters.</div>
          ) : (
            <div className="space-y-2">
              {filtered.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{a.users?.full_name ?? a.user?.full_name ?? "Student"}</p>
                    <p className="text-xs text-muted-foreground">{a.internships?.company_name ?? a.internships?.title} • {a.applied_at ? new Date(a.applied_at).toLocaleDateString() : "—"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={() => window.open(`/dashboard/placement/reports?drive=${a.internships?.id}`, "_self")}>Drive</Button>
                    <Button onClick={() => downloadCsv(`app_${a.id}.csv`, [{ id: a.id, status: a.status ?? "", applied_at: a.applied_at ?? "" }])}><Download className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
