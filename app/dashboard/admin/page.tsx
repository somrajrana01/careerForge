"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users, ClipboardList, BarChart3, Shield, TrendingUp,
  Brain, Code2, UserCheck, Activity, AlertCircle,
  CheckCircle2, ChevronRight, Loader2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/client";
import { cn, formatRelativeTime, getReadinessCategoryInfo } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function AdminDashboard() {
  const supabase = createClient();
  const [stats, setStats] = useState({
    total_users: 0,
    students: 0,
    trainers: 0,
    placement_officers: 0,
    assessments: 0,
    coding_questions: 0,
    internships: 0,
    resume_reports: 0,
  });
  const [readinessDist, setReadinessDist] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setError(null);
        const [
          { count: totalUsers },
          { count: students },
          { count: trainers },
          { count: placements },
          { count: assessments },
          { count: codingQs },
          { count: internships },
          { count: reports },
          { data: scores },
          { data: logs },
        ] = await Promise.all([
          supabase.from("users").select("*", { count: "exact", head: true }),
          supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "student"),
          supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "trainer"),
          supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "placement_officer"),
          supabase.from("assessments").select("*", { count: "exact", head: true }),
          supabase.from("coding_questions").select("*", { count: "exact", head: true }),
          supabase.from("internships").select("*", { count: "exact", head: true }),
          supabase.from("resume_reports").select("*", { count: "exact", head: true }),
          supabase.from("readiness_scores").select("category"),
          supabase.from("audit_logs").select("action, created_at, user_id").order("created_at", { ascending: false }).limit(8),
        ]);

        setStats({
          total_users: totalUsers ?? 0,
          students: students ?? 0,
          trainers: trainers ?? 0,
          placement_officers: placements ?? 0,
          assessments: assessments ?? 0,
          coding_questions: codingQs ?? 0,
          internships: internships ?? 0,
          resume_reports: reports ?? 0,
        });

        if (scores) {
          const dist: Record<string, number> = {
            not_ready: 0, needs_improvement: 0, internship_ready: 0, highly_ready: 0,
          };
          for (const s of scores) dist[s.category] = (dist[s.category] ?? 0) + 1;
          setReadinessDist([
            { name: "Not Ready", count: dist.not_ready, color: "#f43f5e" },
            { name: "Needs Improvement", count: dist.needs_improvement, color: "#f59e0b" },
            { name: "Internship Ready", count: dist.internship_ready, color: "#10b981" },
            { name: "Highly Ready", count: dist.highly_ready, color: "#6366f1" },
          ]);
        }

        setRecentLogs((logs ?? []) as any[]);
      } catch (err) {
        console.error("Admin dashboard load error:", err);
        setError("Could not load admin metrics right now.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const cards = [
    { label: "Total Users", value: stats.total_users, icon: Users, color: "text-iran-400 bg-iran-500/10", href: "/dashboard/admin/users" },
    { label: "Students", value: stats.students, icon: UserCheck, color: "text-emerald-400 bg-emerald-500/10", href: "/dashboard/admin/users" },
    { label: "Assessments", value: stats.assessments, icon: ClipboardList, color: "text-violet-400 bg-violet-500/10", href: "/dashboard/admin/assessments" },
    { label: "Coding Questions", value: stats.coding_questions, icon: Code2, color: "text-amber-400 bg-amber-500/10", href: "/dashboard/admin/coding" },
    { label: "Internships", value: stats.internships, icon: Brain, color: "text-teal-400 bg-teal-500/10" },
    { label: "Resume Reports", value: stats.resume_reports, icon: BarChart3, color: "text-rose-400 bg-rose-500/10" },
  ];

  if (loading) return (
    <div className="space-y-4">
      <div className="h-8 w-48 skeleton" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => <div key={i} className="h-24 skeleton rounded-xl" />)}
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
          <div>
            <h1 className="text-sm font-semibold">Admin dashboard unavailable</h1>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Platform overview and management</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {cards.map((card) => (
          <Link key={card.label} href={card.href ?? "#"}>
            <div className="stat-card hover:scale-[1.01] transition-transform cursor-pointer">
              <div className={cn("inline-flex p-2 rounded-lg mb-3", card.color.split(" ")[1])}>
                <card.icon className={cn("h-4 w-4", card.color.split(" ")[0])} />
              </div>
              <div className="text-2xl font-bold">{card.value.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{card.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Readiness distribution */}
        <div className="glass-card p-5">
          <h2 className="font-semibold text-sm mb-4">Student Readiness Distribution</h2>
          {readinessDist.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={readinessDist} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{
                    background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))",
                    borderRadius: "8px", fontSize: 12,
                  }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {readinessDist.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-3">
                {readinessDist.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                    <span className="text-muted-foreground truncate">{d.name}</span>
                    <span className="font-medium ml-auto">{d.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
          )}
        </div>

        {/* Role breakdown */}
        <div className="glass-card p-5">
          <h2 className="font-semibold text-sm mb-4">User Roles</h2>
          <div className="space-y-3">
            {[
              { label: "Students", count: stats.students, total: stats.total_users, color: "bg-iran-500" },
              { label: "Trainers", count: stats.trainers, total: stats.total_users, color: "bg-emerald-500" },
              { label: "Placement Officers", count: stats.placement_officers, total: stats.total_users, color: "bg-amber-500" },
              { label: "Admins", count: stats.total_users - stats.students - stats.trainers - stats.placement_officers, total: stats.total_users, color: "bg-rose-500" },
            ].map((role) => (
              <div key={role.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{role.label}</span>
                  <span className="font-medium">{role.count}</span>
                </div>
                <Progress
                  value={role.total > 0 ? (role.count / role.total) * 100 : 0}
                  className="h-1.5"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick admin actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Manage Users", href: "/dashboard/admin/users", icon: Users },
          { label: "Create Assessment", href: "/dashboard/admin/assessments", icon: ClipboardList },
          { label: "View Analytics", href: "/dashboard/admin/analytics", icon: BarChart3 },
          { label: "Audit Logs", href: "/dashboard/admin/logs", icon: Shield },
        ].map((action) => (
          <Link key={action.label} href={action.href}>
            <div className="glass-card p-4 flex items-center gap-3 hover:border-border transition-all cursor-pointer group">
              <div className="p-2 rounded-lg bg-muted/50">
                <action.icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
              <span className="text-sm font-medium">{action.label}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
        ))}
      </div>

      {/* Audit logs */}
      {recentLogs.length > 0 && (
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />Recent Activity
            </h2>
            <Link href="/dashboard/admin/logs" className="text-xs text-iran-400 hover:text-iran-300">
              View all <ChevronRight className="h-3 w-3 inline" />
            </Link>
          </div>
          <div className="space-y-1.5">
            {recentLogs.map((log, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-iran-400 shrink-0" />
                  <span className="text-xs font-mono">{log.action}</span>
                </div>
                <span className="text-xs text-muted-foreground">{formatRelativeTime(log.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
