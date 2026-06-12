"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  Plus, Loader2, Edit, Trash2, CheckCircle2, XCircle,
  ClipboardList, Clock, Target, Save, BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { cn, getDifficultyColor } from "@/lib/utils";
import type { Assessment } from "@/types";

const assessmentSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  type: z.enum(["skill", "aptitude", "coding"]),
  category: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  duration_minutes: z.coerce.number().min(5).max(180),
  passing_score: z.coerce.number().min(1).max(100),
  is_timed: z.boolean(),
});
type AssessmentForm = z.infer<typeof assessmentSchema>;

export default function AdminAssessmentsPage() {
  const { toast } = useToast();
  const supabase = createClient();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Assessment | null>(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<AssessmentForm>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: { type: "skill", difficulty: "medium", duration_minutes: 30, passing_score: 60, is_timed: true },
  });

  const watchType = watch("type");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: userData } = await supabase.from("users").select("id").eq("auth_id", user.id).single();
      if (userData) setUserId(userData.id);
      const { data } = await supabase.from("assessments").select("*").order("created_at", { ascending: false });
      setAssessments((data ?? []) as Assessment[]);
      setLoading(false);
    }
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    reset({ type: "skill", difficulty: "medium", duration_minutes: 30, passing_score: 60, is_timed: true });
    setShowForm(true);
  };

  const openEdit = (a: Assessment) => {
    setEditing(a);
    reset({
      title: a.title, description: a.description ?? "",
      type: a.type, category: a.category ?? "",
      difficulty: a.difficulty, duration_minutes: a.duration_minutes,
      passing_score: a.passing_score, is_timed: a.is_timed,
    });
    setShowForm(true);
  };

  const onSubmit = async (data: AssessmentForm) => {
    setSaving(true);
    try {
      if (editing) {
        const { error } = await supabase.from("assessments").update(data).eq("id", editing.id);
        if (!error) {
          setAssessments(assessments.map((a) => a.id === editing.id ? { ...a, ...data } : a));
          toast({ title: "Assessment updated" });
        }
      } else {
        const { data: newA, error } = await supabase.from("assessments")
          .insert({ ...data, created_by: userId, is_active: true, total_questions: 0, tags: [] })
          .select().single();
        if (!error && newA) {
          setAssessments([newA as Assessment, ...assessments]);
          toast({ title: "Assessment created!" });
        }
      }
      setShowForm(false);
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (a: Assessment) => {
    const { error } = await supabase.from("assessments")
      .update({ is_active: !a.is_active }).eq("id", a.id);
    if (!error) setAssessments(assessments.map((x) => x.id === a.id ? { ...x, is_active: !x.is_active } : x));
  };

  const deleteAssessment = async (id: string) => {
    if (!confirm("Delete this assessment? All attempts will be lost.")) return;
    const { error } = await supabase.from("assessments").delete().eq("id", id);
    if (!error) {
      setAssessments(assessments.filter((a) => a.id !== id));
      toast({ title: "Assessment deleted" });
    }
  };

  if (loading) return (
    <div className="space-y-4">
      <div className="h-8 w-48 skeleton" />
      <div className="h-96 skeleton rounded-xl" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold">Assessment Management</h1>
          <p className="text-sm text-muted-foreground">Create and manage skill, aptitude, and coding tests</p>
        </div>
        <Button onClick={openNew} className="bg-gradient-to-r from-iran-500 to-violet-500 text-white border-0">
          <Plus className="h-4 w-4 mr-1.5" />New Assessment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total", value: assessments.length },
          { label: "Active", value: assessments.filter((a) => a.is_active).length },
          { label: "Skill", value: assessments.filter((a) => a.type === "skill").length },
          { label: "Aptitude", value: assessments.filter((a) => a.type === "aptitude").length },
        ].map((s) => (
          <div key={s.label} className="glass-card p-3 text-center">
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Assessments grid */}
      <div className="grid md:grid-cols-2 gap-3">
        {assessments.map((a) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("glass-card p-4 transition-all", !a.is_active && "opacity-60")}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-sm truncate">{a.title}</h3>
                  {a.is_active
                    ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    : <XCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                </div>
                {a.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1">{a.description}</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3">
              <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", getDifficultyColor(a.difficulty))}>
                {a.difficulty}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                {a.type}
              </span>
              {a.category && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {a.category}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
              <span className="flex items-center gap-1"><Target className="h-3 w-3" />{a.total_questions}Q</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{a.duration_minutes}m</span>
              <span>Pass: {a.passing_score}%</span>
            </div>

            <div className="flex items-center gap-2">
              <Link href={`/dashboard/admin/assessments/${a.id}`}>
                <Button variant="outline" size="sm" className="h-7 text-xs">
                  <BookOpen className="h-3 w-3 mr-1" />Manage Questions
                </Button>
              </Link>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openEdit(a)}>
                <Edit className="h-3 w-3 mr-1" />Edit
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => toggleActive(a)}>
                {a.is_active ? <XCircle className="h-3 w-3 mr-1" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                {a.is_active ? "Disable" : "Enable"}
              </Button>
              <Button
                variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive ml-auto"
                onClick={() => deleteAssessment(a.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {assessments.length === 0 && (
        <div className="glass-card p-12 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
          <p className="text-muted-foreground mb-3">No assessments yet</p>
          <Button onClick={openNew} variant="outline">Create First Assessment</Button>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Assessment" : "Create Assessment"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input {...register("title")} placeholder="JavaScript Fundamentals" />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea {...register("description")} placeholder="Brief description..." rows={2} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={watchType} onValueChange={(v) => setValue("type", v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skill">Skill</SelectItem>
                    <SelectItem value="aptitude">Aptitude</SelectItem>
                    <SelectItem value="coding">Coding</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Input {...register("category")} placeholder="JavaScript, DSA…" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Difficulty</Label>
                <Select onValueChange={(v) => setValue("difficulty", v as any)} defaultValue="medium">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Duration (min)</Label>
                <Input {...register("duration_minutes")} type="number" min={5} max={180} />
              </div>
              <div className="space-y-1.5">
                <Label>Pass Score %</Label>
                <Input {...register("passing_score")} type="number" min={1} max={100} />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={saving} className="flex-1 bg-gradient-to-r from-iran-500 to-violet-500 text-white border-0">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                {saving ? "Saving..." : editing ? "Update" : "Create"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
