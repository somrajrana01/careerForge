"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Briefcase, MapPin, Clock, DollarSign, RefreshCw,
  Loader2, ExternalLink, Star, Target, ChevronRight,
  Filter, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { cn, formatDate } from "@/lib/utils";
import type { Internship, InternshipMatch } from "@/types";

export default function InternshipsPage() {
  const { toast } = useToast();
  const supabase = createClient();
  const [internships, setInternships] = useState<Internship[]>([]);
  const [matches, setMatches] = useState<InternshipMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [selected, setSelected] = useState<Internship | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: userData } = await supabase.from("users").select("id").eq("auth_id", user.id).single();
      if (!userData) return;

      try {
        const { data: allInternships } = await supabase.from("internships").select("*").eq("is_active", true).order("created_at", { ascending: false });
        setInternships((allInternships ?? []) as Internship[]);
      } catch (err) {
        console.error("Failed to load internships:", err);
      }

      try {
        const { data: myMatches } = await supabase.from("internship_matches").select("*, internships(*)").eq("user_id", userData.id).order("match_percentage", { ascending: false });
        setMatches((myMatches ?? []) as InternshipMatch[]);
      } catch (err) {
        console.error("Failed to load matches:", err);
      }

      setLoading(false);
    } catch (err) {
      console.error("Internships load error:", err);
      setLoading(false);
    }
  };

  const runMatching = async () => {
    setMatching(true);
    try {
      const res = await fetch("/api/internships/match", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Matching complete!", description: `Found ${data.count} matches` });
        loadData();
      }
    } catch {
      toast({ title: "Matching failed", variant: "destructive" });
    } finally {
      setMatching(false);
    }
  };

  const matchMap = new Map<string, InternshipMatch>();
  for (const m of matches) matchMap.set(m.internship_id, m);

  const categories = [
    "all",
    ...Array.from(new Set(internships.map((i) => i.category).filter((category): category is string => Boolean(category)))),
  ];

  const filtered = internships.filter((i) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || i.title.toLowerCase().includes(q) ||
      i.company_name.toLowerCase().includes(q) ||
      i.required_skills?.some((s) => s.toLowerCase().includes(q));
    const matchesCat = filterCategory === "all" || i.category === filterCategory;
    return matchesSearch && matchesCat;
  });

  const sorted = [...filtered].sort((a, b) => {
    const ma = matchMap.get(a.id)?.match_percentage ?? 0;
    const mb = matchMap.get(b.id)?.match_percentage ?? 0;
    return mb - ma;
  });

  if (loading) return (
    <div className="space-y-4">
      <div className="h-8 w-48 skeleton" />
      <div className="grid md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-48 skeleton rounded-xl" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold">Internship Matches</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Find internships that match your profile</p>
        </div>
        <Button onClick={runMatching} disabled={matching} variant="outline" size="sm">
          {matching ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
          {matching ? "Matching..." : "Run Match"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-3 text-center">
          <p className="text-xl font-bold">{internships.length}</p>
          <p className="text-xs text-muted-foreground">Available</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="text-xl font-bold text-emerald-400">
            {matches.filter((m) => m.match_percentage >= 70).length}
          </p>
          <p className="text-xs text-muted-foreground">Strong Matches</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="text-xl font-bold text-amber-400">
            {matches.filter((m) => m.match_percentage >= 50 && m.match_percentage < 70).length}
          </p>
          <p className="text-xs text-muted-foreground">Good Matches</p>
        </div>
      </div>

      {/* Search & filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search internships..." className="pl-9" />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{c === "all" ? "All Categories" : c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Two-panel layout */}
      <div className="grid md:grid-cols-5 gap-4">
        {/* List */}
        <div className="md:col-span-2 space-y-2 max-h-[600px] overflow-y-auto scrollbar-thin pr-1">
          {sorted.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <Briefcase className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-30" />
              <p className="text-sm text-muted-foreground">No internships found</p>
            </div>
          ) : (
            sorted.map((internship) => {
              const match = matchMap.get(internship.id);
              const pct = match?.match_percentage ?? 0;

              return (
                <button
                  key={internship.id}
                  onClick={() => setSelected(internship)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border transition-all",
                    selected?.id === internship.id
                      ? "border-iran-500/50 bg-iran-500/10"
                      : "glass-card hover:border-border"
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{internship.title}</p>
                      <p className="text-xs text-muted-foreground">{internship.company_name}</p>
                    </div>
                    {pct > 0 && (
                      <span className={cn("text-xs font-bold ml-2 shrink-0 px-2 py-0.5 rounded-full",
                        pct >= 70 ? "bg-emerald-500/10 text-emerald-400" :
                        pct >= 50 ? "bg-amber-500/10 text-amber-400" : "bg-muted text-muted-foreground")}>
                        {Math.round(pct)}%
                      </span>
                    )}
                  </div>

                  {pct > 0 && (
                    <Progress value={pct} className="h-1 mb-2" />
                  )}

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {internship.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />{internship.location}
                      </span>
                    )}
                    {internship.is_remote && (
                      <span className="badge-success">Remote</span>
                    )}
                    {internship.stipend_min && (
                      <span>₹{(internship.stipend_min / 1000).toFixed(0)}k/m</span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Detail panel */}
        <div className="md:col-span-3">
          {selected ? (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-5 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-bold text-lg">{selected.title}</h2>
                  <p className="text-muted-foreground">{selected.company_name}</p>
                </div>
                {selected.apply_url && (
                  <Button size="sm" asChild>
                    <a href={selected.apply_url} target="_blank" rel="noopener noreferrer">
                      Apply <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                    </a>
                  </Button>
                )}
              </div>

              {/* Match details */}
              {matchMap.get(selected.id) && (() => {
                const m = matchMap.get(selected.id)!;
                return (
                  <div className={cn("p-4 rounded-lg border",
                    m.match_percentage >= 70 ? "bg-emerald-500/5 border-emerald-500/20" :
                    m.match_percentage >= 50 ? "bg-amber-500/5 border-amber-500/20" :
                    "bg-muted/30")}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <Target className="h-4 w-4 text-iran-400" />
                        Match Score
                      </span>
                      <span className={cn("text-xl font-bold",
                        m.match_percentage >= 70 ? "text-emerald-400" :
                        m.match_percentage >= 50 ? "text-amber-400" : "text-rose-400")}>
                        {Math.round(m.match_percentage)}%
                      </span>
                    </div>
                    <Progress value={m.match_percentage} className="h-2 mb-3" />
                    {m.matching_skills?.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs text-muted-foreground mb-1">✅ Matching skills:</p>
                        <div className="flex flex-wrap gap-1">
                          {m.matching_skills.map((s) => (
                            <span key={s} className="badge-success">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {m.missing_skills?.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs text-muted-foreground mb-1">⚠️ Missing skills:</p>
                        <div className="flex flex-wrap gap-1">
                          {m.missing_skills.map((s) => (
                            <span key={s} className="badge-warning">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {m.recommendations?.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">💡 Tips:</p>
                        {m.recommendations.map((r, i) => (
                          <p key={i} className="text-xs text-muted-foreground">• {r}</p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-3 text-sm">
                {selected.duration_months && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4 shrink-0" />
                    <span>{selected.duration_months} months</span>
                  </div>
                )}
                {(selected.stipend_min || selected.stipend_max) && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="h-4 w-4 shrink-0" />
                    <span>₹{(selected.stipend_min ?? 0) / 1000}k–{(selected.stipend_max ?? 0) / 1000}k/month</span>
                  </div>
                )}
                {selected.location && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span>{selected.location}{selected.is_remote ? " (Remote OK)" : ""}</span>
                  </div>
                )}
                {selected.application_deadline && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Star className="h-4 w-4 shrink-0" />
                    <span>Deadline: {formatDate(selected.application_deadline)}</span>
                  </div>
                )}
              </div>

              {selected.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">{selected.description}</p>
              )}

              <div>
                <p className="text-xs font-medium mb-2">Required Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {selected.required_skills?.map((s) => (
                    <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                  ))}
                </div>
              </div>

              {selected.preferred_skills?.length > 0 && (
                <div>
                  <p className="text-xs font-medium mb-2">Preferred Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.preferred_skills.map((s) => (
                      <span key={s} className="text-[10px] px-2 py-0.5 rounded-full border border-border/50 text-muted-foreground">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {selected.min_cgpa && (
                <p className="text-xs text-muted-foreground">
                  Minimum CGPA: <span className="text-foreground font-medium">{selected.min_cgpa}</span>
                </p>
              )}
            </motion.div>
          ) : (
            <div className="glass-card h-full flex flex-col items-center justify-center p-8 text-center">
              <Briefcase className="h-12 w-12 text-muted-foreground mb-3 opacity-30" />
              <p className="font-medium mb-1">Select an internship</p>
              <p className="text-sm text-muted-foreground">View details and your match score</p>
              {matches.length === 0 && (
                <Button onClick={runMatching} disabled={matching} variant="outline" className="mt-4">
                  {matching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Calculate My Matches
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
