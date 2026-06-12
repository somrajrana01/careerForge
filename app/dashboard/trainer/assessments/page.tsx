"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/index";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/index";
import { Input, Textarea } from "@/components/ui/index";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash } from "lucide-react";

type ApiResponse<T> = { success: boolean; data?: T; error?: string };

async function readApi<T>(res: Response) {
  const payload = (await res.json()) as ApiResponse<T>;
  if (!res.ok || !payload.success) throw new Error(payload.error ?? "Request failed");
  return payload.data as T;
}

export default function TrainerAssessmentsPage() {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await readApi<any[]>(await fetch(`/api/assessments?include_questions=false`, { cache: "no-store" }));
      setAssessments(Array.isArray(data) ? data : []);
    } catch (err) {
      toast({ title: "Error", description: String(err instanceof Error ? err.message : err) });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    if (!title.trim()) return toast({ title: "Title required", description: "Please provide an assessment title." });
    setCreating(true);
    try {
      const res = await fetch(`/api/assessments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description: description.trim() }),
      });
      const payload = await res.json();
      if (!res.ok || !payload) throw new Error(payload?.error ?? "Create failed");
      toast({ title: "Created", description: "Assessment created successfully" });
      setTitle("");
      setDescription("");
      load();
    } catch (err) {
      toast({ title: "Error", description: String(err instanceof Error ? err.message : err) });
    } finally {
      setCreating(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this assessment?")) return;
    try {
      const res = await fetch(`/api/assessments?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const payload = await res.json();
      if (!res.ok || !payload) throw new Error(payload?.error ?? "Delete failed");
      toast({ title: "Deleted", description: "Assessment deleted" });
      load();
    } catch (err) {
      toast({ title: "Error", description: String(err instanceof Error ? err.message : err) });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Assessments</h1>
          <p className="text-sm text-muted-foreground">Manage trainer evaluations and tests.</p>
        </div>
        <Link href="/dashboard/trainer" className="w-full sm:w-auto">
          <Button variant="secondary" className="w-full sm:w-auto">Back to dashboard</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assessment management</CardTitle>
          <CardDescription>List, create, and remove assessments using existing APIs.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-2 sm:grid-cols-3">
            <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Input placeholder="Short description" value={description} onChange={(e) => setDescription(e.target.value)} />
            <div className="flex items-center gap-2">
              <Button onClick={create} disabled={creating}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create
              </Button>
              <Button variant="outline" onClick={load}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 rounded-lg bg-muted/60 animate-pulse" />
              ))}
            </div>
          ) : assessments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No assessments found.</div>
          ) : (
            <div className="space-y-2">
              {assessments.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={load}>View</Button>
                    <Button variant="destructive" onClick={() => remove(a.id)}>
                      <Trash className="h-4 w-4" />
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
