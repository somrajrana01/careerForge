"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users, BarChart3, TrendingUp, ClipboardList,
  ChevronRight, Eye, Trophy, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { cn, getReadinessCategoryInfo, getScoreColor } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function TrainerDashboard() {
  const supabase = createClient();
  const [stats, setStats] = useState({ students: 0, assessments: 0, avgScore: 0, ready: 0 });
  const [students, setStudents] = useState<any[]>([]);
  const [scoreDistribution, setScoreDistribution] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setError(null);
        const [{ data: studs }, { data: scores }, { count: asmtCount }] = await Promise.all([
          supabase.from("student_analytics").select("*").order("readiness_score", { ascending: false }).limit(20),
          supabase.from("readiness_scores").select("overall_score, category"),
          supabase.from("assessments").select("*", { count: "exact", head: true }).eq("is_active", true),
        ]);

        const studentList = (studs ?? []) as any[];
        setStudents(studentList);

        if (scores && scores.length > 0) {
          const avg = scores.reduce((s, r) => s + (r.overall_score ?? 0), 0) / scores.length;
          const ready = scores.filter((s) => ["internship_ready", "highly_ready"].includes(s.category)).length;
          setStats({
            students: studentList.length,
            assessments: asmtCount ?? 0,
            avgScore: Math.round(avg),
            ready,
          });

          const ranges = [
            { range: "0-20", min: 0, max: 20, count: 0 },
            { range: "21-40", min: 21, max: 40, count: 0 },
            { range: "41-60", min: 41, max: 60, count: 0 },
            { range: "61-80", min: 61, max: 80, count: 0 },
            { range: "81-100", min: 81, max: 100, count: 0 },
          ];
          for (const s of scores) {
            const bucket = ranges.find((r) => (s.overall_score ?? 0) >= r.min && (s.overall_score ?? 0) <= r.max);
            if (bucket) bucket.count++;
          }
          setScoreDistribution(ranges);
        }
      } catch (err) {
        console.error("Trainer dashboard load error:", err);
        setError("Could not load trainer analytics right now.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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
            <h1 className="text-sm font-semibold">Trainer dashboard unavailable</h1>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Trainer Dashboard</h1>
        <p className="text-sm text-muted-foreground">Monitor student progress and assessments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Students", value: stats.students, icon: Users, color: "text-iran-400 bg-iran-500/10" },
          { label: "Active Tests", value: stats.assessments, icon: ClipboardList, color: "text-violet-400 bg-violet-500/10" },
          { label: "Avg Score", value: `${stats.avgScore}%`, icon: BarChart3, color: "text-amber-400 bg-amber-500/10" },
          { label: "Ready Students", value: stats.ready, icon: Trophy, color: "text-emerald-400 bg-emerald-500/10" },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className={cn("inline-flex p-2 rounded-lg mb-3", s.color.split(" ")[1])}>
              <s.icon className={cn("h-4 w-4", s.color.split(" ")[0])} />
            </div>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Score distribution chart */}
        <div className="glass-card p-5 md:col-span-2">
          <h2 className="font-semibold text-sm mb-4">Readiness Score Distribution</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={scoreDistribution}>
              <XAxis dataKey="range" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {scoreDistribution.map((_, i) => (
                  <Cell key={i} fill={["#f43f5e", "#f59e0b", "#f59e0b", "#10b981", "#6366f1"][i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick actions */}
        <div className="glass-card p-5 space-y-2">
          <h2 className="font-semibold text-sm mb-3">Quick Actions</h2>
          {[
            { label: "View All Students", href: "/dashboard/trainer/students", icon: Users },
            { label: "Manage Assessments", href: "/dashboard/trainer/assessments", icon: ClipboardList },
            { label: "View Analytics", href: "/dashboard/trainer/analytics", icon: BarChart3 },
          ].map((a) => (
            <Link key={a.label} href={a.href}>
              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                <a.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm flex-1">{a.label}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Student table */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm">Student Overview</h2>
          <Link href="/dashboard/trainer/students" className="text-xs text-iran-400 hover:text-iran-300">
            View all <ChevronRight className="h-3 w-3 inline" />
          </Link>
        </div>

        {students.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-30" />
            <p className="text-sm text-muted-foreground">No students found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2.5 pr-4 text-xs text-muted-foreground font-medium">Student</th>
                  <th className="text-left py-2.5 pr-4 text-xs text-muted-foreground font-medium">Branch</th>
                  <th className="text-left py-2.5 pr-4 text-xs text-muted-foreground font-medium">CGPA</th>
                  <th className="text-left py-2.5 pr-4 text-xs text-muted-foreground font-medium">Profile</th>
                  <th className="text-left py-2.5 pr-4 text-xs text-muted-foreground font-medium">Readiness</th>
                  <th className="text-left py-2.5 text-xs text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {students.slice(0, 10).map((s) => {
                  const catInfo = s.readiness_category ? getReadinessCategoryInfo(s.readiness_category) : null;
                  return (
                    <tr key={s.user_id} className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="py-3 pr-4">
                        <p className="font-medium truncate max-w-[140px]">{s.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{s.institution}</p>
                      </td>
                      <td className="py-3 pr-4 text-xs text-muted-foreground">
                        {s.branch?.split(" ").slice(0, 2).join(" ") ?? "—"}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={cn("text-xs font-medium", getScoreColor((s.cgpa ?? 0) * 10))}>
                          {s.cgpa ?? "—"}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-1.5">
                          <Progress value={s.profile_completion ?? 0} className="h-1 w-16" />
                          <span className="text-xs text-muted-foreground">{s.profile_completion ?? 0}%</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={cn("font-semibold text-sm", getScoreColor(s.readiness_score ?? 0))}>
                          {s.readiness_score ? `${Math.round(s.readiness_score)}%` : "—"}
                        </span>
                      </td>
                      <td className="py-3">
                        {catInfo ? (
                          <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium border", catInfo.bg, catInfo.color)}>
                            {catInfo.label}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Not scored</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
