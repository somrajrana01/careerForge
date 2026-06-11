"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  RefreshCw,
  Loader2,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import {
  cn,
  getReadinessCategoryInfo,
  getScoreColor,
  formatDate,
} from "@/lib/utils";
import type { ReadinessScore } from "@/types";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const WEIGHTS = [
  {
    key: "profile_score",
    label: "Profile Completion",
    weight: 15,
    icon: "👤",
    desc: "How complete is your student profile",
  },
  {
    key: "resume_score",
    label: "Resume Quality",
    weight: 25,
    icon: "📄",
    desc: "ATS score + overall resume quality",
  },
  {
    key: "coding_score",
    label: "Coding Performance",
    weight: 25,
    icon: "💻",
    desc: "Average score on coding challenges",
  },
  {
    key: "aptitude_score",
    label: "Aptitude Performance",
    weight: 15,
    icon: "🧠",
    desc: "Quantitative, logical, verbal scores",
  },
  {
    key: "projects_score",
    label: "Projects",
    weight: 10,
    icon: "🗂️",
    desc: "Quality and quantity of projects",
  },
  {
    key: "certifications_score",
    label: "Certifications",
    weight: 10,
    icon: "🏆",
    desc: "Professional certifications earned",
  },
];

export default function ReadinessPage() {
  const { toast } = useToast();
  const supabase = useMemo(() => createClient(), []);
  const [readiness, setReadiness] = useState<ReadinessScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  const loadData = async () => {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setReadiness(null);
        return;
      }

      // Ensure app user row exists, but do not fail if it is still being created
      try {
        await fetch("/api/auth/ensure-user", { method: "POST" });
      } catch {
        // ignore
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

      const { data: scoreData, error: scoreError } = await supabase
        .from("readiness_scores")
        .select("*")
        .eq("user_id", appUserId)
        .maybeSingle();

      if (scoreError) {
        console.error("Failed to load readiness:", scoreError);
      }

      setReadiness((scoreData as ReadinessScore) ?? null);
    } catch (err) {
      console.error("Readiness load error:", err);
      setReadiness(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recalculate = async () => {
    setRecalculating(true);
    try {
      const res = await fetch("/api/readiness/calculate", {
        method: "POST",
      });

      const text = await res.text();
      let data: any = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { error: text || "Invalid server response" };
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      setReadiness(data.data as ReadinessScore);

      toast({
        title: "Score updated!",
        description: `New score: ${Math.round(data.data.overall_score)}/100`,
      });
    } catch (err: any) {
      toast({
        title: "Calculation failed",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setRecalculating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 skeleton" />
        <div className="h-96 skeleton rounded-xl" />
      </div>
    );
  }

  const r = readiness;
  const info = r ? getReadinessCategoryInfo(r.category) : null;

  const radarData = r
    ? WEIGHTS.map((w) => ({
        subject: w.label.split(" ")[0],
        score: (r[w.key as keyof ReadinessScore] as number) ?? 0,
        fullMark: 100,
      }))
    : [];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold">Readiness Score</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Your internship readiness across 6 dimensions
          </p>
        </div>
        <Button onClick={recalculate} disabled={recalculating} variant="outline" size="sm">
          {recalculating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          )}
          Recalculate
        </Button>
      </div>

      {r ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className={cn("glass-card p-6 border", info?.bg)}>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative w-36 h-36 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 144 144">
                  <circle
                    cx="72"
                    cy="72"
                    r="60"
                    fill="none"
                    stroke="hsl(var(--border))"
                    strokeWidth="10"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r="60"
                    fill="none"
                    stroke="url(#grad)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${(r.overall_score / 100) * 2 * Math.PI * 60} ${2 * Math.PI * 60}`}
                    style={{ transition: "stroke-dasharray 1.2s ease" }}
                  />
                  <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold">
                    {Math.round(r.overall_score)}
                  </span>
                  <span className="text-xs text-muted-foreground">/100</span>
                </div>
              </div>

              <div className="flex-1 text-center md:text-left">
                <div
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border mb-3",
                    info?.bg,
                    info?.color
                  )}
                >
                  <Target className="h-4 w-4" />
                  {info?.label}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {r.explanation}
                </p>
                {r.calculated_at && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Last calculated: {formatDate(r.calculated_at)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="glass-card p-4 bg-muted/20">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-iran-400 shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">How we calculate: </span>
                Profile (15%) + Resume (25%) + Coding (25%) + Aptitude (15%) + Projects
                (10%) + Certifications (10%) = Readiness Score
              </div>
            </div>
          </div>

          <div className="glass-card p-5">
            <h2 className="font-semibold text-sm mb-4">Score Breakdown</h2>
            <div className="space-y-4">
              {WEIGHTS.map((item) => {
                const score = (r[item.key as keyof ReadinessScore] as number) ?? 0;
                const contribution = (score * item.weight) / 100;

                return (
                  <div key={item.key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{item.icon}</span>
                        <div>
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {item.desc} · weight {item.weight}%
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn("text-lg font-bold", getScoreColor(score))}>
                          {Math.round(score)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          +{contribution.toFixed(1)} pts
                        </p>
                      </div>
                    </div>
                    <Progress value={score} className="h-2" />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="glass-card p-5">
              <h2 className="font-semibold text-sm mb-3">Skill Radar</h2>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="#6366f1"
                    fill="#6366f1"
                    fillOpacity={0.2}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [`${Math.round(v)}/100`, "Score"]}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card p-5">
              <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-400" />
                Top Improvements
              </h2>
              {r.improvement_areas?.length > 0 ? (
                <div className="space-y-2">
                  {r.improvement_areas.slice(0, 5).map((area, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/30"
                    >
                      <span className="text-xs font-bold text-amber-400 bg-amber-500/10 rounded px-1 py-0.5 shrink-0">
                        {i + 1}
                      </span>
                      <p className="text-xs text-muted-foreground">{area}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <p className="text-xs text-emerald-400">
                    Excellent! No major issues found.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="glass-card p-5">
            <h2 className="font-semibold text-sm mb-3">Score Categories</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { range: "0–40", cat: "not_ready", label: "Not Ready" },
                { range: "41–60", cat: "needs_improvement", label: "Needs Improvement" },
                { range: "61–80", cat: "internship_ready", label: "Internship Ready" },
                { range: "81–100", cat: "highly_ready", label: "Highly Ready" },
              ].map(({ range, cat, label }) => {
                const catInfo = getReadinessCategoryInfo(cat as any);
                const isCurrent = r.category === cat;

                return (
                  <div
                    key={cat}
                    className={cn(
                      "p-3 rounded-lg border text-center transition-all",
                      isCurrent
                        ? catInfo.bg + " ring-1 ring-current"
                        : "border-border/50 opacity-60"
                    )}
                  >
                    <p className={cn("text-sm font-bold", catInfo.color)}>{range}</p>
                    <p className="text-xs mt-0.5">{label}</p>
                    {isCurrent && (
                      <div className="w-1.5 h-1.5 rounded-full mx-auto mt-1.5 bg-current" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="glass-card p-12 text-center">
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
          <p className="font-medium mb-2">No readiness score yet</p>
          <p className="text-sm text-muted-foreground mb-4">
            Complete your profile, upload a resume, and take some assessments to generate
            your score
          </p>
          <Button onClick={recalculate} disabled={recalculating}>
            {recalculating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Calculate Now
          </Button>
        </div>
      )}
    </div>
  );
}