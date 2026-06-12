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

export default function TrainerStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filterBatch, setFilterBatch] = useState<string | null>(null);
  const [assignBatchId, setAssignBatchId] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load students");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students
      .filter((s) => {
        if (filterBatch && String(s.batch_id ?? "") !== String(filterBatch)) return false;
        if (!q) return true;
        return [s.full_name, s.email].filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
      })
      .slice(0, 200);
  }, [students, query, filterBatch]);

  const enrollStudent = async (studentId: string, batchId: string, currentBatchId?: string | null) => {
    try {
      const body: Record<string, unknown> = {
        user_id: studentId,
        target_batch_id: batchId,
      };

      if (currentBatchId && currentBatchId !== batchId) {
        body.action = "move_student_batch";
        body.from_batch_id = currentBatchId;
      } else {
        body.action = "enroll_student";
        body.batch_id = batchId;
      }

      const res = await fetch(`/api/trainer`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await res.json();
      if (!res.ok || !payload) throw new Error(payload?.error ?? "Enroll failed");
      toast({ title: currentBatchId && currentBatchId !== batchId ? "Batch moved" : "Enrolled", description: "Student assigned successfully." });
      load();
    } catch (err) {
      toast({ title: "Error", description: String(err instanceof Error ? err.message : err) });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Students</h1>
          <p className="text-sm text-muted-foreground">Review trainee progress and assignments.</p>
        </div>
        <Link href="/dashboard/trainer" className="w-full sm:w-auto">
          <Button variant="secondary" className="w-full sm:w-auto">Back to dashboard</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student roster</CardTitle>
          <CardDescription>Search, filter, preview profiles, and manage batch enrollment.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input placeholder="Search by name or email" value={query} onChange={(e) => setQuery(e.target.value)} />
            <Select onValueChange={(v) => setFilterBatch(v === "all" ? null : v)}>
              <SelectTrigger className="w-48">{filterBatch ? batches.find((b) => b.id === filterBatch)?.name ?? "Batch" : "All batches"}</SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All batches</SelectItem>
                {batches.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="ml-auto">
              <Button variant="outline" onClick={load}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
              </Button>
            </div>
          </div>

          {error && <div className="text-sm text-destructive">{error}</div>}

          {loading ? (
            <div className="grid grid-cols-1 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-20 rounded-xl bg-muted/60 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No students found.</div>
          ) : (
            <div className="space-y-2">
              {filtered.map((s) => (
                <div key={s.user_id ?? s.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{s.full_name ?? s.email}</p>
                    <p className="truncate text-xs text-muted-foreground">{s.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Batch: {s.batch_name ? <span className="font-medium text-foreground">{s.batch_name}</span> : "Unassigned"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-muted-foreground">{s.readiness_score ? `${Math.round(s.readiness_score)}%` : "—"}</div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost">Preview</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Student profile</DialogTitle>
                          <DialogDescription>{s.full_name ?? s.email}</DialogDescription>
                        </DialogHeader>
                        <div className="mt-2 space-y-2">
                          <p className="text-sm">Email: {s.email}</p>
                          <p className="text-sm">Institution: {s.institution ?? "—"}</p>
                          <p className="text-sm">Branch: {s.branch ?? "—"}</p>
                          <p className="text-sm">Readiness: {s.readiness_score ? `${Math.round(s.readiness_score)}%` : "Unscored"}</p>
                        </div>
                        <DialogFooter>
                          <Button onClick={() => setSelectedStudent(s)}>Manage</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline">Assign</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogTitle>Assign to batch</DialogTitle>
                        <div className="mt-2">
                          <Select onValueChange={(v) => setAssignBatchId(v)}>
                            <SelectTrigger className="w-full">{assignBatchId ? batches.find((b) => b.id === assignBatchId)?.name ?? "Batch" : "Select batch"}</SelectTrigger>
                            <SelectContent>
                              {batches.map((b) => (
                                <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="mt-4 flex justify-end">
                            <Button
                              onClick={() => {
                                if (!assignBatchId) return toast({ title: "Select batch", description: "Choose a batch to assign" });
                                enrollStudent(s.user_id ?? s.id, assignBatchId);
                              }}
                            >Assign</Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
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
