"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  Star,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { cn, formatDate, formatFileSize } from "@/lib/utils";
import type { Resume, ResumeReport } from "@/types";

function ScoreCircle({ score, label, color }: { score: number; label: string; color: string }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
          <circle
            cx="40"
            cy="40"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: "stroke-dasharray 1s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold">{score}</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export default function ResumePage() {
  const { toast } = useToast();
  const supabase = useMemo(() => createClient(), []);
  const fileRef = useRef<HTMLInputElement>(null);

  const [userId, setUserId] = useState("");
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [latestReport, setLatestReport] = useState<ResumeReport | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError("Not authenticated. Please log in again.");
          return;
        }

        try {
          await fetch("/api/auth/ensure-user", { method: "POST" });
        } catch {
          // keep going
        }

        const { data: userData, error: userLookupError } = await supabase
          .from("users")
          .select("id")
          .eq("auth_id", user.id)
          .maybeSingle();

        if (userLookupError) {
          console.error("User lookup error:", userLookupError);
        }

        const appUserId = userData?.id ?? user.id;
        setUserId(appUserId);

        const { data: resumeData } = await supabase
          .from("resumes")
          .select("*")
          .eq("user_id", appUserId)
          .order("created_at", { ascending: false });

        setResumes((resumeData ?? []) as Resume[]);

        const { data: reportData } = await supabase
          .from("resume_reports")
          .select("*")
          .eq("user_id", appUserId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (reportData) setLatestReport(reportData as ResumeReport);
      } catch (err) {
        console.error("Resume load error:", err);
        setError("Failed to load resume data.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [supabase]);

  const analyzeResume = async (resumeId: string) => {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/resume/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_id: resumeId }),
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { error: text || "Invalid server response" };
      }

      if (!res.ok || !data.success || !data.data) {
        throw new Error(data.error || `Analysis failed (${res.status})`);
      }

      setLatestReport(data.data as ResumeReport);
      toast({ title: "Analysis complete!", description: `ATS Score: ${data.data.ats_score}/100` });
    } catch (e: any) {
      toast({
        title: "Analysis failed",
        description: e?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFile = async (file: File) => {
    if (!userId) {
      toast({ title: "Missing user", description: "Please refresh and try again.", variant: "destructive" });
      return;
    }

    if (file.type !== "application/pdf") {
      toast({ title: "PDF only", description: "Please upload a PDF resume", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB allowed", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const path = `${userId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("resumes").upload(path, file);
      if (uploadError) throw uploadError;

      const { data: resumeRec, error: dbError } = await supabase
        .from("resumes")
        .insert({ user_id: userId, file_name: file.name, file_path: path, file_size: file.size })
        .select()
        .single();

      if (dbError) throw dbError;

      setResumes((prev) => [resumeRec as Resume, ...prev]);
      toast({ title: "Resume uploaded!", description: "Starting AI analysis..." });

      await analyzeResume((resumeRec as Resume).id);
    } catch (e: any) {
      toast({
        title: "Upload failed",
        description: e?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 skeleton" />
        <div className="h-64 skeleton rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-6 border-rose-500/30 bg-rose-500/5">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <h2 className="font-semibold text-sm text-rose-400">Error Loading Resume Page</h2>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const r = latestReport;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold">Resume Analyzer</h1>
        <p className="text-sm text-muted-foreground mt-0.5">AI-powered ATS scoring and improvement suggestions</p>
      </div>

      <div
        className={cn(
          "glass-card p-8 border-2 border-dashed text-center transition-all cursor-pointer",
          dragOver ? "border-iran-500 bg-iran-500/5" : "border-border/50 hover:border-iran-500/50"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        {uploading || analyzing ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 text-iran-400 animate-spin" />
            <p className="text-sm font-medium">{uploading ? "Uploading resume..." : "Analyzing with AI..."}</p>
            <p className="text-xs text-muted-foreground">This takes 15-30 seconds</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 rounded-full bg-iran-500/10">
              <Upload className="h-6 w-6 text-iran-400" />
            </div>
            <div>
              <p className="text-sm font-medium">Drop your resume here or click to upload</p>
              <p className="text-xs text-muted-foreground mt-1">PDF only • Max 5MB</p>
            </div>
          </div>
        )}
      </div>

      {resumes.length > 0 && (
        <div className="glass-card p-5">
          <h2 className="font-semibold text-sm mb-3">Uploaded Resumes</h2>
          <div className="space-y-2">
            {resumes.slice(0, 3).map((resume) => (
              <div key={resume.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-2.5">
                  <FileText className="h-4 w-4 text-iran-400" />
                  <div>
                    <p className="text-sm font-medium">{resume.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(resume.created_at)} • {resume.file_size ? formatFileSize(resume.file_size) : ""}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => analyzeResume(resume.id)} disabled={analyzing}>
                  {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  <span className="ml-1">Re-analyze</span>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {r && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="glass-card p-5">
            <h2 className="font-semibold text-sm mb-4">Analysis Results</h2>
            <div className="flex flex-wrap justify-around gap-4">
              <ScoreCircle score={r.ats_score} label="ATS Score" color="#6366f1" />
              <ScoreCircle score={r.quality_score} label="Quality Score" color="#10b981" />
              <ScoreCircle score={r.project_quality_analysis?.quality_score ?? 0} label="Projects" color="#f59e0b" />
              <ScoreCircle score={Math.min(100, (r.skills_found?.length ?? 0) * 8)} label="Skills Found" color="#8b5cf6" />
            </div>
          </div>

          <Tabs defaultValue="overview">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
              <TabsTrigger value="issues">Issues</TabsTrigger>
              <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="glass-card p-4">
                  <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Strengths
                  </h3>
                  <ul className="space-y-2">
                    {r.strengths?.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Star className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="glass-card p-4">
                  <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
                    <AlertCircle className="h-4 w-4 text-rose-400" />
                    Weaknesses
                  </h3>
                  <ul className="space-y-2">
                    {r.weaknesses?.map((w, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <TrendingDown className="h-3 w-3 text-rose-400 shrink-0 mt-0.5" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="skills" className="glass-card p-5 space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2 text-emerald-400">Skills Found ({r.skills_found?.length ?? 0})</h3>
                <div className="flex flex-wrap gap-1.5">
                  {r.skills_found?.map((s) => (
                    <span key={s} className="badge-success">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-2 text-amber-400">Skills to Add</h3>
                <div className="flex flex-wrap gap-1.5">
                  {r.skills_missing?.map((s) => (
                    <span key={s} className="badge-warning">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-2 text-rose-400">Missing Keywords</h3>
                <div className="flex flex-wrap gap-1.5">
                  {r.missing_keywords?.map((k) => (
                    <span key={k} className="badge-error">
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="issues" className="glass-card p-5 space-y-4">
              {r.missing_sections?.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Missing Sections</h3>
                  <div className="space-y-1.5">
                    {r.missing_sections.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
                        {s}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {r.grammar_issues?.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Grammar / Writing Issues</h3>
                  <div className="space-y-1.5">
                    {r.grammar_issues.map((g, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground p-2 rounded-lg bg-muted/30">
                        <AlertCircle className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
                        {g}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="suggestions" className="glass-card p-5">
              <h3 className="text-sm font-medium mb-3">Improvement Suggestions</h3>
              <div className="space-y-2">
                {r.suggestions?.map((s, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <span className="text-xs font-bold text-iran-400 bg-iran-500/10 rounded px-1.5 py-0.5 shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="text-xs text-muted-foreground">{s}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      )}

      {!r && resumes.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Upload your resume to get started</p>
        </div>
      )}
    </div>
  );
}