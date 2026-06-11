"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users, Trophy, BarChart3, TrendingUp, Download,
  Target, GraduationCap, ChevronRight, Building2, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/client";
import { cn, getReadinessCategoryInfo, getScoreColor } from "@/lib/utils";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Legend,
} from "recharts";

const CATEGORY_COLORS: Record<string, string> = {
  not_ready: "#f43f5e",
  needs_improvement: "#f59e0b",
  internship_ready: "#10b981",
  highly_ready: "#6366f1",
};

export default function PlacementDashboard() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState({
    total: 0, ready: 0, highlyReady: 0, avgScore: 0, avgCgpa: 0,
  });
  const [categoryDist, setCategoryDist] = useState<any[]>([]);
  const [branchData, setBranchData] = useState<any[]>([]);
  const [topStudents, setTopStudents] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setError(null);
        const [{ data: analytics }, { data: scores }] = await Promise.all([
          supabase.from("student_analytics").select("*"),
          supabase.from("readiness_scores").select("overall_score, category"),
        ]);

        const list = (analytics ?? []) as any[];
        const scoreList = (scores ?? []) as any[];

        const total = list.length;
        const ready = scoreList.filter((s) => ["internship_ready", "highly_ready"].includes(s.category)).length;
        const highlyReady = scoreList.filter((s) => s.category === "highly_ready").length;
        const avgScore = scoreList.length > 0
          ? Math.round(scoreList.reduce((a, s) => a + (s.overall_score ?? 0), 0) / scoreList.length)
          : 0;
        const avgCgpa = list.filter((s) => s.cgpa).length > 0
          ? (list.filter((s) => s.cgpa).reduce((a, s) => a + (s.cgpa ?? 0), 0) / list.filter((s) => s.cgpa).length).toFixed(2)
          : "0";

        setOverview({ total, ready, highlyReady, avgScore, avgCgpa: Number(avgCgpa) });

        const catMap: Record<string, number> = {};
        for (const s of scoreList) catMap[s.category] = (catMap[s.category] ?? 0) + 1;
        setCategoryDist(Object.entries(catMap).map(([cat, count]) => ({
          name: getReadinessCategoryInfo(cat as any).label,
          value: count,
          color: CATEGORY_COLORS[cat],
        })));

        const branchMap: Record<string, { total: number; ready: number; avgScore: number; scores: number[] }> = {};
        for (const s of list) {
          const branch = s.branch?.split(" ").slice(0, 2).join(" ") ?? "Unknown";
          if (!branchMap[branch]) branchMap[branch] = { total: 0, ready: 0, avgScore: 0, scores: [] };
          branchMap[branch].total++;
          if (s.readiness_score) branchMap[branch].scores.push(s.readiness_score);
          if (["internship_ready", "highly_ready"].includes(s.readiness_category))
            branchMap[branch].ready++;
        }
        setBranchData(Object.entries(branchMap)
          .map(([branch, d]) => ({
            branch,
            total: d.total,
            ready: d.ready,
            avgScore: d.scores.length > 0 ? Math.round(d.scores.reduce((a, b) => a + b, 0) / d.scores.length) : 0,
          }))
          .sort((a, b) => b.avgScore - a.avgScore)
          .slice(0, 8)
        );

        setTopStudents(list
          .filter((s) => s.readiness_score)
          .sort((a, b) => (b.readiness_score ?? 0) - (a.readiness_score ?? 0))
          .slice(0, 10)
        );

      } catch (err) {
        console.error("Placement dashboard load error:", err);
        setError("Could not load placement analytics right now.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const exportCSV = () => {
    const headers = ["Name", "Institution", "Branch", "CGPA", "Profile%", "Readiness%", "Category"];
    const rows = topStudents.map((s) => [
      s.full_name, s.institution, s.branch, s.cgpa,
      s.profile_completion, Math.round(s.readiness_score ?? 0), s.readiness_category,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "placement_report.csv"; a.click();
  };

  if (loading) return (
    <div className="space-y-4">
      <div className="h-8 w-48 skeleton" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 skeleton rounded-xl" />)}
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
          <div>
            <h1 className="text-sm font-semibold">Placement dashboard unavailable</h1>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold">Placement Dashboard</h1>
          <p className="text-sm text-muted-foreground">Placement readiness overview across all students</p>
        </div>
        <Button onClick={exportCSV} variant="outline" size="sm">
          <Download className="h-3.5 w-3.5 mr-1.5" />Export CSV
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total Students", value: overview.total, icon: Users, color: "text-iran-400 bg-iran-500/10" },
          { label: "Placement Ready", value: overview.ready, icon: Trophy, color: "text-emerald-400 bg-emerald-500/10" },
          { label: "Highly Ready", value: overview.highlyReady, icon: Target, color: "text-violet-400 bg-violet-500/10" },
          { label: "Avg Score", value: `${overview.avgScore}%`, icon: BarChart3, color: "text-amber-400 bg-amber-500/10" },
          { label: "Avg CGPA", value: overview.avgCgpa.toFixed(2), icon: GraduationCap, color: "text-teal-400 bg-teal-500/10" },
        ].map((card) => (
          <div key={card.label} className="stat-card">
            <div className={cn("inline-flex p-2 rounded-lg mb-3", card.color.split(" ")[1])}>
              <card.icon className={cn("h-4 w-4", card.color.split(" ")[0])} />
            </div>
            <div className="text-2xl font-bold">{card.value}</div>
            <div className="text-xs text-muted-foreground">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Ready rate banner */}
      <div className="glass-card p-4 bg-gradient-to-r from-emerald-500/5 to-iran-500/5 border-emerald-500/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Overall Placement Readiness Rate</span>
          <span className="text-lg font-bold text-emerald-400">
            {overview.total > 0 ? Math.round((overview.ready / overview.total) * 100) : 0}%
          </span>
        </div>
        <Progress value={overview.total > 0 ? (overview.ready / overview.total) * 100 : 0} className="h-2" />
        <p className="text-xs text-muted-foreground mt-1.5">
          {overview.ready} of {overview.total} students are internship-ready or highly ready
        </p>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Pie chart */}
        <div className="glass-card p-5">
          <h2 className="font-semibold text-sm mb-4">Readiness Distribution</h2>
          {categoryDist.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={categoryDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                    {categoryDist.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-1.5 mt-2">
                {categoryDist.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                    <span className="text-muted-foreground">{d.name}</span>
                    <span className="font-medium ml-auto">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">No data yet</p>
          )}
        </div>

        {/* Branch bar chart */}
        <div className="glass-card p-5">
          <h2 className="font-semibold text-sm mb-4">Score by Branch</h2>
          {branchData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={branchData} layout="vertical" margin={{ left: 0, right: 16 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <YAxis dataKey="branch" type="category" tick={{ fontSize: 9 }} width={90} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
                <Bar dataKey="avgScore" name="Avg Score" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">No branch data yet</p>
          )}
        </div>
      </div>

      {/* Top students table */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-400" />Top Placement Candidates
          </h2>
          <Button onClick={exportCSV} variant="ghost" size="sm" className="text-xs">
            <Download className="h-3.5 w-3.5 mr-1" />Export
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-2.5 pr-3 text-xs text-muted-foreground font-medium">#</th>
                <th className="text-left py-2.5 pr-4 text-xs text-muted-foreground font-medium">Student</th>
                <th className="text-left py-2.5 pr-4 text-xs text-muted-foreground font-medium">Branch</th>
                <th className="text-left py-2.5 pr-4 text-xs text-muted-foreground font-medium">CGPA</th>
                <th className="text-left py-2.5 pr-4 text-xs text-muted-foreground font-medium">Score</th>
                <th className="text-left py-2.5 text-xs text-muted-foreground font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {topStudents.map((s, i) => {
                const info = s.readiness_category ? getReadinessCategoryInfo(s.readiness_category) : null;
                return (
                  <tr key={s.user_id} className="border-b border-border/30 last:border-0">
                    <td className="py-3 pr-3">
                      <span className={cn("text-xs font-bold", i < 3 ? "text-amber-400" : "text-muted-foreground")}>
                        {i < 3 ? ["🥇","🥈","🥉"][i] : `#${i+1}`}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-sm">{s.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[160px]">{s.institution}</p>
                    </td>
                    <td className="py-3 pr-4 text-xs text-muted-foreground max-w-[120px] truncate">
                      {s.branch?.split(" ").slice(0,2).join(" ") ?? "—"}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={cn("text-sm font-medium", getScoreColor((s.cgpa ?? 0) * 10))}>
                        {s.cgpa ?? "—"}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={cn("text-sm font-bold", getScoreColor(s.readiness_score ?? 0))}>
                        {s.readiness_score ? `${Math.round(s.readiness_score)}%` : "—"}
                      </span>
                    </td>
                    <td className="py-3">
                      {info ? (
                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium border", info.bg, info.color)}>
                          {info.label}
                        </span>
                      ) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
