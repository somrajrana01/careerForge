"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, ChevronRight, Target, Code2, FileText, Map, MessageSquare, CheckCircle2, AlertCircle, Zap, Calendar, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { Recommendation } from "@/types";

const TAB_ICONS: Record<string, React.ElementType> = {
  skill_gap: Target,
  roadmap: Map,
  interview: MessageSquare,
  dsa: Code2,
  resume: FileText,
};

const TAB_COLORS: Record<string, string> = {
  skill_gap: "text-rose-400",
  roadmap: "text-iran-400",
  interview: "text-emerald-400",
  dsa: "text-violet-400",
  resume: "text-amber-400",
};

function RoadmapPhase({
  title,
  phase,
  color,
}: {
  title: string;
  phase: { goals: string[]; tasks: string[]; milestones: string[]; resources: string[] };
  color: string;
}) {
  return (
    <div className={cn("p-4 rounded-lg border", color)}>
      <h4 className="font-semibold text-sm mb-3">{title}</h4>
      <div className="space-y-3">
        {phase.goals?.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Goals</p>
            <ul className="space-y-1">
              {phase.goals.map((g, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />
                  {g}
                </li>
              ))}
            </ul>
          </div>
        )}
        {phase.tasks?.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Tasks</p>
            <ul className="space-y-1">
              {phase.tasks.map((t, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <ChevronRight className="h-3 w-3 shrink-0 mt-0.5" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        )}
        {phase.milestones?.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Milestones</p>
            <ul className="space-y-1">
              {phase.milestones.map((m, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <Zap className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />
                  {m}
                </li>
              ))}
            </ul>
          </div>
        )}
        {phase.resources?.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Resources</p>
            <div className="flex flex-wrap gap-1.5">
              {phase.resources.map((r, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground">
                  {r}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RecommendationsPage() {
  const { toast } = useToast();
  const supabase = useMemo(() => createClient(), []);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("roadmap");

  const types = [
    { key: "roadmap", label: "Roadmap", icon: Map },
    { key: "skill_gap", label: "Skill Gap", icon: Target },
    { key: "interview", label: "Interview Prep", icon: MessageSquare },
    { key: "dsa", label: "DSA Plan", icon: Code2 },
    { key: "resume", label: "Resume Tips", icon: FileText },
  ];

  const loadRecommendations = async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Not authenticated. Please log in again.");
        setLoading(false);
        return;
      }

      try {
        await fetch("/api/auth/ensure-user", { method: "POST" });
      } catch {
        // Ignore; page can still load existing data
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

      const { data } = await supabase
        .from("recommendations")
        .select("*")
        .eq("user_id", appUserId)
        .order("generated_at", { ascending: false });

      setRecommendations((data ?? []) as Recommendation[]);
    } catch (err) {
      console.error("Recommendations load error:", err);
      setError("Failed to load recommendations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recMap: Record<string, Recommendation | undefined> = {};
  for (const r of recommendations) {
    if (!recMap[r.type]) recMap[r.type] = r;
  }

  useEffect(() => {
    const available = types.filter(({ key }) => Boolean(recMap[key])).map(({ key }) => key);
    if (available.length > 0 && !available.includes(activeTab)) {
      setActiveTab(available[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recommendations]);

  const generate = async (type: string) => {
    setGenerating(type);
    try {
      const res = await fetch("/api/recommendations/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
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

      toast({
        title: "Generated!",
        description: `Your ${type} recommendation is ready.`,
      });

      await loadRecommendations();
      setActiveTab(type);
    } catch (err: any) {
      toast({
        title: "Generation failed",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(null);
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

  if (error) {
    return (
      <div className="glass-card p-6 border-rose-500/30 bg-rose-500/5">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <h2 className="font-semibold text-sm text-rose-400">Error Loading Recommendations</h2>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={loadRecommendations}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const recTabs = types.filter(({ key }) => recMap[key]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold">AI Recommendations</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Personalized guidance powered by Groq AI</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {types.map(({ key, label, icon: Icon }) => {
          const exists = !!recMap[key];
          const isGenerating = generating === key;

          return (
            <button
              key={key}
              onClick={() => generate(key)}
              disabled={!!generating}
              className={cn(
                "glass-card p-3 text-center flex flex-col items-center gap-2 transition-all hover:scale-[1.02]",
                exists ? "border-iran-500/30" : "border-dashed"
              )}
            >
              <div className={cn("p-2 rounded-lg", exists ? "bg-iran-500/10" : "bg-muted")}>
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin text-iran-400" />
                ) : (
                  <Icon className={cn("h-4 w-4", exists ? TAB_COLORS[key] : "text-muted-foreground")} />
                )}
              </div>
              <span className="text-xs font-medium">{label}</span>
              {exists ? (
                <span className="text-[9px] text-emerald-400">Generated ✓</span>
              ) : (
                <span className="text-[9px] text-muted-foreground">Click to generate</span>
              )}
            </button>
          );
        })}
      </div>

      {recTabs.length > 0 ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap h-auto gap-1">
            {recTabs.map(({ key, label, icon: Icon }) => (
              <TabsTrigger key={key} value={key} className="flex items-center gap-1.5 text-xs">
                <Icon className="h-3.5 w-3.5" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {recMap.roadmap && (
            <TabsContent value="roadmap" className="space-y-4">
              <div className="glass-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-sm">90-Day Internship Prep Roadmap</h2>
                  <span className="text-xs text-muted-foreground">{formatRelativeTime(recMap.roadmap.generated_at)}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Target:{" "}
                  <span className="font-medium text-foreground">
                    {recMap.roadmap.content?.roadmap?.target_role ?? "Software Development"}
                  </span>
                </p>
                <div className="grid md:grid-cols-3 gap-3">
                  {recMap.roadmap.content?.roadmap?.plan_30_days && (
                    <RoadmapPhase
                      title="Days 1–30"
                      phase={recMap.roadmap.content.roadmap.plan_30_days}
                      color="bg-iran-500/5 border-iran-500/20"
                    />
                  )}
                  {recMap.roadmap.content?.roadmap?.plan_60_days && (
                    <RoadmapPhase
                      title="Days 31–60"
                      phase={recMap.roadmap.content.roadmap.plan_60_days}
                      color="bg-emerald-500/5 border-emerald-500/20"
                    />
                  )}
                  {recMap.roadmap.content?.roadmap?.plan_90_days && (
                    <RoadmapPhase
                      title="Days 61–90"
                      phase={recMap.roadmap.content.roadmap.plan_90_days}
                      color="bg-violet-500/5 border-violet-500/20"
                    />
                  )}
                </div>
              </div>
            </TabsContent>
          )}

          {recMap.skill_gap && (
            <TabsContent value="skill_gap" className="space-y-4">
              <div className="glass-card p-5">
                <h2 className="font-semibold text-sm mb-2">Skill Gap Analysis</h2>
                {Array.isArray(recMap.skill_gap.content?.skill_gaps) && recMap.skill_gap.content.skill_gaps.length > 0 ? (
                  <div className="space-y-3">
                    {(recMap.skill_gap.content.skill_gaps as any[]).map((gap: any, i: number) => (
                      <div key={i} className="p-3 rounded-lg bg-muted/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{gap.skill}</span>
                          <span
                            className={cn(
                              "badge-info text-[10px]",
                              gap.importance === "critical"
                                ? "badge-error"
                                : gap.importance === "high"
                                  ? "badge-warning"
                                  : "badge-info"
                            )}
                          >
                            {gap.importance}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 rounded">{gap.current_level}</span>
                          <ChevronRight className="h-3 w-3" />
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">{gap.required_level}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {gap.resources?.map((r: string, ri: number) => (
                            <span key={ri} className="text-[10px] px-2 py-0.5 rounded bg-muted">
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
                {recMap.skill_gap.content?.estimated_learning_time && (
                  <div className="mt-4 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                    <p className="text-xs text-amber-400 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Estimated time to close gaps: {recMap.skill_gap.content.estimated_learning_time}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          )}

          {recMap.interview && (
            <TabsContent value="interview" className="space-y-4">
              <div className="glass-card p-5 space-y-4">
                <h2 className="font-semibold text-sm">Interview Preparation Plan</h2>
                {recMap.interview.content?.interview_plan &&
                  (() => {
                    const plan = recMap.interview.content.interview_plan as any;
                    return (
                      <div className="space-y-4">
                        {plan.technical_topics && (
                          <div>
                            <h3 className="text-xs font-medium text-muted-foreground mb-2">Technical Topics</h3>
                            <div className="flex flex-wrap gap-1.5">
                              {plan.technical_topics.map((t: string, i: number) => (
                                <span key={i} className="badge-info">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {plan.behavioral_topics && (
                          <div>
                            <h3 className="text-xs font-medium text-muted-foreground mb-2">Behavioral Topics</h3>
                            <div className="flex flex-wrap gap-1.5">
                              {plan.behavioral_topics.map((t: string, i: number) => (
                                <span key={i} className="badge-success">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {plan.weekly_plan && (
                          <div>
                            <h3 className="text-xs font-medium text-muted-foreground mb-2">Weekly Plan</h3>
                            <div className="grid md:grid-cols-2 gap-3">
                              {plan.weekly_plan.map((week: any) => (
                                <div key={week.week} className="p-3 rounded-lg bg-muted/30">
                                  <p className="text-xs font-semibold mb-1">
                                    Week {week.week}: {week.focus}
                                  </p>
                                  <ul className="space-y-0.5">
                                    {week.activities?.map((a: string, i: number) => (
                                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                                        <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />
                                        {a}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {plan.resources && (
                          <div>
                            <h3 className="text-xs font-medium text-muted-foreground mb-2">Resources</h3>
                            <div className="flex flex-wrap gap-1.5">
                              {plan.resources.map((r: string, i: number) => (
                                <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-muted">
                                  {r}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
              </div>
            </TabsContent>
          )}

          {recMap.dsa && (
            <TabsContent value="dsa" className="space-y-4">
              <div className="glass-card p-5 space-y-4">
                <h2 className="font-semibold text-sm">DSA Improvement Plan</h2>
                {recMap.dsa.content?.dsa_plan &&
                  (() => {
                    const plan = recMap.dsa.content.dsa_plan as any;
                    return (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-iran-500/10 border border-iran-500/20">
                          <Code2 className="h-5 w-5 text-iran-400" />
                          <div>
                            <p className="text-sm font-medium">Daily Target: {plan.daily_problems} problems/day</p>
                            <p className="text-xs text-muted-foreground">Platforms: {plan.platforms?.join(", ")}</p>
                          </div>
                        </div>
                        {plan.topics_to_cover && (
                          <div>
                            <h3 className="text-xs font-medium text-muted-foreground mb-2">Topics to Cover</h3>
                            <div className="space-y-2">
                              {plan.topics_to_cover.map((t: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={cn(
                                        "w-1.5 h-1.5 rounded-full",
                                        t.priority === "high"
                                          ? "bg-rose-400"
                                          : t.priority === "medium"
                                            ? "bg-amber-400"
                                            : "bg-emerald-400"
                                      )}
                                    />
                                    <span className="text-sm font-medium">{t.topic}</span>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs text-muted-foreground">{t.estimated_days}d</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {plan.milestones && (
                          <div>
                            <h3 className="text-xs font-medium text-muted-foreground mb-2">Milestones</h3>
                            <div className="space-y-1.5">
                              {plan.milestones.map((m: string, i: number) => (
                                <div key={i} className="flex items-center gap-2 text-xs">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                  {m}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
              </div>
            </TabsContent>
          )}

          {recMap.resume && (
            <TabsContent value="resume" className="space-y-4">
              <div className="glass-card p-5 space-y-4">
                <h2 className="font-semibold text-sm">Resume Improvement Plan</h2>
                {recMap.resume.content?.resume_plan &&
                  (() => {
                    const plan = recMap.resume.content.resume_plan as any;
                    return (
                      <div className="space-y-4">
                        {plan.priority_changes && (
                          <div>
                            <h3 className="text-xs font-medium text-muted-foreground mb-2">Priority Changes</h3>
                            {plan.priority_changes.map((c: string, i: number) => (
                              <div key={i} className="flex items-start gap-2 p-2 rounded bg-rose-500/5 border border-rose-500/10 mb-1.5">
                                <AlertCircle className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
                                <p className="text-xs">{c}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        {plan.keywords_to_add && (
                          <div>
                            <h3 className="text-xs font-medium text-muted-foreground mb-2">Keywords to Add</h3>
                            <div className="flex flex-wrap gap-1.5">
                              {plan.keywords_to_add.map((k: string, i: number) => (
                                <span key={i} className="badge-warning">
                                  {k}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
              </div>
            </TabsContent>
          )}
        </Tabs>
      ) : (
        <div className="glass-card p-12 text-center">
          <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
          <p className="font-medium mb-1">No recommendations yet</p>
          <p className="text-sm text-muted-foreground mb-4">Click a card above to generate AI-powered recommendations</p>
          <Button onClick={() => generate("roadmap")} disabled={!!generating}>
            {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
            Generate Roadmap
          </Button>
        </div>
      )}
    </div>
  );
}