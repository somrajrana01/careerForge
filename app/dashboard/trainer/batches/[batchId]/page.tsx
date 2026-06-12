"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/index";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/index";
import { Loader2, ArrowLeft, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ApiResponse<T> = { success: boolean; data?: T; error?: string };

async function readApi<T>(res: Response) {
  const payload = (await res.json()) as ApiResponse<T>;
  if (!res.ok || !payload.success) throw new Error(payload.error ?? "Request failed");
  return payload.data as T;
}

export default function BatchDetailsPage() {
  const params = useParams();
  const batchId = params.batchId as string;
  const [batch, setBatch] = useState<any | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [batchData, studentsData] = await Promise.all([
        readApi<any>(await fetch(`/api/trainer?resource=batch_details&batch_id=${batchId}`, { cache: "no-store" })),
        readApi<any[]>(await fetch(`/api/trainer?resource=students`, { cache: "no-store" })),
      ]);
      setBatch(batchData);
      setStudents(studentsData ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load batch details");
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    load();
  }, [load]);

  const membershipRows = useMemo(() => {
    const studentMap = new Map(students.map((student) => [student.user_id ?? student.id, student]));
    return (batch?.training_batch_students ?? []).map((membership: any) => ({
      ...membership,
      student: studentMap.get(membership.user_id) ?? null,
    }));
  }, [batch, students]);

  const handleRemove = async (userId: string) => {
    if (!window.confirm("Remove this student from the batch?")) return;
    setRemoving(userId);

    try {
      const res = await fetch("/api/trainer", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ resource: "batch_membership", batch_id: batchId, user_id: userId }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result?.error ?? "Could not remove student");
      toast({ title: "Student removed", description: "The student was removed from the batch." });
      load();
    } catch (err) {
      toast({ title: "Error", description: String(err instanceof Error ? err.message : err) });
    } finally {
      setRemoving(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded-lg bg-muted/60 animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="h-40 rounded-2xl bg-muted/60 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-sm text-destructive">{error}</div>;
  }

  if (!batch) {
    return <div className="text-sm text-muted-foreground">Batch not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{batch.name}</h1>
          <p className="text-sm text-muted-foreground">Batch details, student membership, and training sessions.</p>
        </div>
        <Link href="/dashboard/trainer/batches">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to batches
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Batch summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p>{batch.status?.replace(/_/g, " ") ?? "Active"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Duration</p>
              <p>{batch.start_date ? `${batch.start_date}${batch.end_date ? ` — ${batch.end_date}` : ""}` : "Not scheduled"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Students</p>
              <p>{membershipRows.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sessions</p>
              <p>{batch.training_sessions?.length ?? 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{batch.description ?? "No description provided."}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Batch members</CardTitle>
          <CardDescription>{membershipRows.length} students assigned</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {membershipRows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">No students are currently assigned to this batch.</div>
          ) : (
            <div className="space-y-2">
              {membershipRows.map((membership) => (
                <div key={membership.user_id} className="flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{membership.student?.full_name ?? membership.user_id}</p>
                    <p className="text-xs text-muted-foreground">{membership.student?.email ?? "Student record not found"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">Enrolled {new Date(membership.enrolled_at).toLocaleDateString()}</p>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-8"
                      disabled={removing === membership.user_id}
                      onClick={() => handleRemove(membership.user_id)}
                    >
                      {removing === membership.user_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
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
