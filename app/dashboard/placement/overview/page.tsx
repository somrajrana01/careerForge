"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/index";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/index";
import { Input } from "@/components/ui/index";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from "@/components/ui/index";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/index";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type ApiResponse<T> = { success: boolean; data?: T; error?: string };

async function readApi<T>(res: Response) {
  const payload = (await res.json()) as ApiResponse<T>;
  if (!res.ok || !payload.success) throw new Error(payload.error ?? "Request failed");
  return payload.data as T;
}

export default function PlacementOverviewPage() {
  const [drives, setDrives] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [drivesData, appsData] = await Promise.all([
        readApi<any[]>(await fetch(`/api/placement?resource=drives`, { cache: "no-store" })),
        readApi<any[]>(await fetch(`/api/placement?resource=applications`, { cache: "no-store" })),
      ]);
      setDrives(drivesData ?? []);
      setApplications(appsData ?? []);
    } catch (err) {
      toast({ title: "Error", description: String(err instanceof Error ? err.message : err) });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredDrives = useMemo(() => {
    const q = query.trim().toLowerCase();
    return drives.filter((d) => {
      if (statusFilter === "active" && !d.is_active) return false;
      if (statusFilter === "inactive" && d.is_active) return false;
      if (!q) return true;
      return [d.company_name, d.title].filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
    });
  }, [drives, query, statusFilter]);

  const upcoming = filteredDrives.filter((d) => d.start_date && new Date(d.start_date) > new Date());
  const active = filteredDrives.filter((d) => d.is_active);

  // create/edit/delete flows
  const createDrive = async (payload: any) => {
    try {
      const res = await fetch(`/api/placement`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "create_drive", ...payload }),
      });
      const p = await res.json();
      if (!res.ok || !p) throw new Error(p?.error ?? "Create failed");
      toast({ title: "Created", description: "Placement drive created" });
      load();
    } catch (err) {
      toast({ title: "Error", description: String(err instanceof Error ? err.message : err) });
    }
  };

  const updateDrive = async (id: string, updates: any) => {
    try {
      const res = await fetch(`/api/placement`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, ...updates }) });
      const p = await res.json();
      if (!res.ok || !p) throw new Error(p?.error ?? "Update failed");
      toast({ title: "Updated", description: "Drive updated" });
      load();
    } catch (err) {
      toast({ title: "Error", description: String(err instanceof Error ? err.message : err) });
    }
  };

  const deleteDrive = async (id: string) => {
    if (!confirm("Delete this drive?")) return;
    try {
      const res = await fetch(`/api/placement?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const p = await res.json();
      if (!res.ok || !p) throw new Error(p?.error ?? "Delete failed");
      toast({ title: "Deleted", description: "Drive deleted" });
      load();
    } catch (err) {
      toast({ title: "Error", description: String(err instanceof Error ? err.message : err) });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Placement Overview</h1>
          <p className="text-sm text-muted-foreground">Track student placement readiness and manage drives.</p>
        </div>
        <Link href="/dashboard/placement" className="w-full sm:w-auto">
          <Button variant="secondary" className="w-full sm:w-auto">Back to dashboard</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Drives</CardTitle>
          <CardDescription>Manage placement drives, create new drives, and review applications.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-2">
            <Input placeholder="Search drives" value={query} onChange={(e) => setQuery(e.target.value)} />
            <Select onValueChange={(v) => setStatusFilter(v === "all" ? null : v)}>
              <SelectTrigger className="w-40">{statusFilter ?? "All statuses"}</SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <div className="ml-auto">
              <Dialog>
                <DialogTrigger asChild>
                  <Button>Create drive</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create placement drive</DialogTitle>
                    <DialogDescription>Provide minimal details to create a drive.</DialogDescription>
                  </DialogHeader>
                  <CreateDriveForm onCreate={createDrive} onCancel={() => {}} />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 rounded-lg bg-muted/60 animate-pulse" />
              ))}
            </div>
          ) : drives.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No drives found.</div>
          ) : (
            <div className="space-y-2">
              {filteredDrives.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{d.company_name} — {d.title}</p>
                    <p className="text-xs text-muted-foreground">{d.location ?? "Online"} • {d.start_date ? new Date(d.start_date).toLocaleDateString() : "TBD"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={() => window.open(`/dashboard/placement/reports?drive=${d.id}`, "_self")}>Reports</Button>
                    <Button onClick={() => updateDrive(d.id, { is_active: !d.is_active })}>{d.is_active ? "Close" : "Open"}</Button>
                    <Button variant="destructive" onClick={() => deleteDrive(d.id)}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pipeline summary</CardTitle>
          <CardDescription>Overview of application pipeline and student placement status.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Total applications</p>
              <p className="mt-2 text-2xl font-bold">{applications.length}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Unique applicants</p>
              <p className="mt-2 text-2xl font-bold">{new Set(applications.map((a) => a.user_id)).size}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CreateDriveForm({ onCreate, onCancel }: { onCreate: (payload: any) => Promise<void>; onCancel?: () => void }) {
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [applicationDeadline, setApplicationDeadline] = useState("");
  const [submitting, setSubmitting] = useState(false);

  return (
    <div>
      <div className="space-y-2">
        <Input placeholder="Company name" value={company} onChange={(e) => setCompany(e.target.value)} />
        <Input placeholder="Drive title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Input type="date" value={applicationDeadline} onChange={(e) => setApplicationDeadline(e.target.value)} />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" onClick={() => onCancel?.()}>Cancel</Button>
        <Button onClick={async () => { setSubmitting(true); await onCreate({ company_name: company, title, start_date: date, application_deadline: applicationDeadline }); setSubmitting(false); }}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
        </Button>
      </div>
    </div>
  );
}
