"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/index";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/index";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/index";
import { Input } from "@/components/ui/index";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/index";
import { Textarea } from "@/components/ui/index";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2, ChevronRight } from "lucide-react";

type ApiResponse<T> = { success: boolean; data?: T; error?: string };

async function readApi<T>(res: Response) {
  const payload = (await res.json()) as ApiResponse<T>;
  if (!res.ok || !payload.success) throw new Error(payload.error ?? "Request failed");
  return payload.data as T;
}

const defaultFormState = {
  name: "",
  description: "",
  status: "active",
  start_date: "",
  end_date: "",
};

export default function TrainerBatchesPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<any | null>(null);
  const [form, setForm] = useState(defaultFormState);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await readApi<any[]>(await fetch(`/api/trainer?resource=batches`, { cache: "no-store" }));
      setBatches(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load batches");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openForm = (batch?: any) => {
    setEditingBatch(batch ?? null);
    setForm({
      name: batch?.name ?? "",
      description: batch?.description ?? "",
      status: batch?.status ?? "active",
      start_date: batch?.start_date ? String(batch.start_date).slice(0, 10) : "",
      end_date: batch?.end_date ? String(batch.end_date).slice(0, 10) : "",
    });
    setDialogOpen(true);
  };

  const resetForm = () => setForm(defaultFormState);

  const saveBatch = async () => {
    if (!form.name.trim()) {
      toast({ title: "Name required", description: "Enter a batch name before saving." });
      return;
    }

    try {
      const payload = editingBatch ?
        { id: editingBatch.id, resource: "batch", name: form.name.trim(), description: form.description.trim() || null, status: form.status, start_date: form.start_date || null, end_date: form.end_date || null }
        : { action: "create_batch", name: form.name.trim(), description: form.description.trim() || null, status: form.status, start_date: form.start_date || null, end_date: form.end_date || null };

      const method = editingBatch ? "PATCH" : "POST";
      const res = await fetch("/api/trainer", {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result?.error ?? "Unable to save batch");

      toast({ title: editingBatch ? "Batch updated" : "Batch created", description: `Batch ${editingBatch ? "updated" : "created"} successfully.` });
      setDialogOpen(false);
      setEditingBatch(null);
      resetForm();
      load();
    } catch (err) {
      toast({ title: "Error", description: String(err instanceof Error ? err.message : err) });
    }
  };

  const deleteBatch = async (id: string) => {
    if (!window.confirm("Delete this batch? This action cannot be undone.")) return;
    try {
      const res = await fetch("/api/trainer", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ resource: "batch", id }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result?.error ?? "Unable to delete batch");
      toast({ title: "Batch deleted", description: "The batch was removed successfully." });
      load();
    } catch (err) {
      toast({ title: "Error", description: String(err instanceof Error ? err.message : err) });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Training Batches</h1>
          <p className="text-sm text-muted-foreground">Create, manage, and review trainer batch membership.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => openForm()}>
            <Plus className="h-4 w-4 mr-2" /> New batch
          </Button>
          <Button variant="outline" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
          </Button>
        </div>
      </div>

      {error && <div className="text-sm text-destructive">{error}</div>}

      {loading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-32 rounded-2xl bg-muted/60 animate-pulse" />
          ))}
        </div>
      ) : batches.length === 0 ? (
        <Card>
          <CardContent className="space-y-3">
            <CardTitle>No batches yet</CardTitle>
            <CardDescription>Use the button above to create a new training batch.</CardDescription>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {batches.map((batch) => (
            <Card key={batch.id} className="group overflow-hidden">
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-semibold truncate">{batch.name}</h2>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${batch.status === "active" ? "bg-emerald-100 text-emerald-700" : batch.status === "completed" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
                        {batch.status?.replace(/_/g, " ")?.replace(/\b\w/g, (c: string) => c.toUpperCase()) ?? "Active"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link href={`/dashboard/trainer/batches/${batch.id}`}>
                      <Button variant="outline">
                        Details <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                    <Button variant="secondary" onClick={() => openForm(batch)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" onClick={() => deleteBatch(batch.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Students</p>
                    <p className="font-semibold">{batch.training_batch_students?.length ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Sessions</p>
                    <p className="font-semibold">{batch.training_sessions?.length ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Timeline</p>
                    <p className="font-semibold">{batch.start_date ? `${batch.start_date}${batch.end_date ? ` — ${batch.end_date}` : ""}` : "Not scheduled"}</p>
                  </div>
                </div>

                {batch.description ? <p className="text-sm text-muted-foreground">{batch.description}</p> : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        if (!open) {
          setEditingBatch(null);
          resetForm();
        }
        setDialogOpen(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBatch ? "Edit batch" : "Create batch"}</DialogTitle>
            <DialogDescription>{editingBatch ? "Update the batch information." : "Create a new batch for your training cohort."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              placeholder="Batch name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
            <Textarea
              placeholder="Description"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              rows={4}
            />
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="block text-xs font-medium mb-1 text-muted-foreground">Status</label>
                <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value })}>
                  <SelectTrigger className="w-full">
                    {form.status.replace(/_/g, " ")}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input
                type="date"
                value={form.start_date}
                onChange={(event) => setForm({ ...form, start_date: event.target.value })}
              />
              <Input
                type="date"
                value={form.end_date}
                onChange={(event) => setForm({ ...form, end_date: event.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="mt-4 justify-end gap-2">
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveBatch}>{editingBatch ? "Save changes" : "Create batch"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
