"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight, Target, FileText, Code2, Brain,
  Briefcase, Lightbulb, TrendingUp, Clock, CheckCircle2,
  AlertCircle, Info, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/client";
import { cn, getReadinessCategoryInfo, getScoreColor, formatRelativeTime } from "@/lib/utils";
import type { ReadinessScore, StudentProfile, Attempt, Notification } from "@/types";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer, Tooltip,
} from "recharts";

function StatCard({ title, value, subtitle, icon: Icon, color, href }: {
  title: string; value: string | number; subtitle: string;
  icon: React.ElementType; color: string; href?: string;
}) {
  const content = (
    <div className="stat-card group cursor-pointer hover:scale-[1.01] transition-transform">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        {href && <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
      </div>
      <div className="text-2xl font-bold mb-0.5">{value}</div>
      <div className="text-xs text-muted-foreground">{subtitle}</div>
      <div className="text-xs font-medium text-foreground mt-1">{title}</div>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

function ScoreMeter({ score, category }: { score: number; category: string }) {
  const info = getReadinessCategoryInfo(category as any);
  const circumference = 2 * Math.PI * 54;
  const strokeDash = (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-40 h-40">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
          <circle
            cx="60" cy="60" r="54" fill="none"
            stroke="url(#scoreGradient)" strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${strokeDash} ${circumference}`}
            style={{ transition: "stroke-dasharray 1s ease-in-out" }}
          />
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold">{Math.round(score)}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>
      <div className={cn("mt-3 px-3 py-1 rounded-full text-xs font-medium border", info.bg, info.color)}>
        {info.label}
      </div>
      <p className="text-xs text-muted-foreground text-center mt-2 max-w-[160px]">
        {info.description}
      </p>
    </div>
  );
}

export default function StudentDashboard() {
  const [readiness, setReadiness] = useState<ReadinessScore | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      try {
        setError(null);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError("Not authenticated. Please log in.");
          setLoading(false);
          return;
        }

        let userData: any = null;

        try {
          const { data } = await supabase
            .from("users")
            .select("id, full_name")
            .eq("auth_id", user.id)
            .maybeSingle();

          userData = data;
        } catch (err) {
          console.error("User lookup failed:", err);
        }

        const appUserId = userData?.id ?? user.id;

        setUserName(
          userData?.full_name ??
          user.user_metadata?.full_name ??
          user.email ??
          "Student"
        );

        try {
          const { data: profileData } = await supabase.from("student_profiles").select("*").eq("user_id", appUserId).single();
          setProfile(profileData as StudentProfile);
        } catch (err) {
          console.error("Failed to load profile:", err);
        }

        try {
          const { data: readinessData } = await supabase.from("readiness_scores").select("*").eq("user_id", appUserId).single();
          setReadiness(readinessData as ReadinessScore);
        } catch (err) {
          console.error("Failed to load readiness:", err);
        }

        try {
          const { data: attemptsData } = await supabase.from("attempts").select("*, assessments(title,type)").eq("user_id", appUserId).order("created_at", { ascending: false }).limit(5);
          setAttempts((attemptsData ?? []) as Attempt[]);
        } catch (err) {
          console.error("Failed to load attempts:", err);
        }

        try {
          const { data: notifData } = await supabase.from("notifications").select("*").eq("user_id", appUserId).eq("is_read", false).order("created_at", { ascending: false }).limit(5);
          setNotifications((notifData ?? []) as Notification[]);
        } catch (err) {
          console.error("Failed to load notifications:", err);
        }

        setUserName(userData?.full_name ?? "Student");
        setLoading(false);
      } catch (err) {
        console.error("Dashboard load error:", err);
        setError("Failed to load dashboard data. Please refresh the page.");
        setLoading(false);
      }
    }
    load();
  }, []);

  const radarData = readiness ? [
    { subject: "Profile", score: readiness.profile_score },
    { subject: "Resume", score: readiness.resume_score },
    { subject: "Coding", score: readiness.coding_score },
    { subject: "Aptitude", score: readiness.aptitude_score },
    { subject: "Projects", score: readiness.projects_score },
    { subject: "Certs", score: readiness.certifications_score },
  ] : [];

  const quickActions = [
    { label: "Analyze Resume", href: "/dashboard/student/resume", icon: FileText, color: "text-iran-400" },
    { label: "Take Assessment", href: "/dashboard/student/assessments", icon: Brain, color: "text-violet-400" },
    { label: "Solve Problems", href: "/dashboard/student/coding", icon: Code2, color: "text-emerald-400" },
    { label: "View Matches", href: "/dashboard/student/internships", icon: Briefcase, color: "text-amber-400" },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 skeleton" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 skeleton rounded-xl" />)}
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="h-64 skeleton rounded-xl col-span-2" />
          <div className="h-64 skeleton rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="glass-card p-6 border-rose-500/30 bg-rose-500/5">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-semibold text-sm text-rose-400">Error Loading Dashboard</h2>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold">
          {greeting}, {userName.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Here's your internship readiness snapshot
        </p>
      </motion.div>

      {/* Profile completion banner */}
      {profile && profile.profile_completion < 60 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-4 border-iran-500/30 bg-iran-500/5">
          <div className="flex items-center gap-3">
            <Info className="h-4 w-4 text-iran-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Complete your profile to boost your readiness score</p>
              <div className="flex items-center gap-2 mt-1.5">
                <Progress value={profile.profile_completion} className="h-1.5 flex-1" />
                <span className="text-xs text-muted-foreground">{profile.profile_completion}%</span>
              </div>
            </div>
            <Button size="sm" variant="outline" asChild className="shrink-0">
              <Link href="/dashboard/student/profile">Complete <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
        </motion.div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          title="Readiness Score" value={readiness ? `${Math.round(readiness.overall_score)}%` : "—"}
          subtitle={readiness?.category?.replace(/_/g, " ") ?? "Not calculated"}
          icon={Target} color="bg-iran-500/10 text-iran-400"
          href="/dashboard/student/readiness"
        />
        <StatCard
          title="Profile Complete" value={profile ? `${profile.profile_completion}%` : "0%"}
          subtitle={`${profile?.skills?.length ?? 0} skills added`}
          icon={TrendingUp} color="bg-emerald-500/10 text-emerald-400"
          href="/dashboard/student/profile"
        />
        <StatCard
          title="Assessments Taken" value={attempts.length}
          subtitle="Total attempts"
          icon={Brain} color="bg-violet-500/10 text-violet-400"
          href="/dashboard/student/assessments"
        />
        <StatCard
          title="Resume Score" value={readiness ? `${Math.round(readiness.resume_score)}%` : "—"}
          subtitle="ATS & quality"
          icon={FileText} color="bg-amber-500/10 text-amber-400"
          href="/dashboard/student/resume"
        />
      </div>

      {/* Main grid */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Readiness breakdown */}
        <div className="glass-card p-5 md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm">Readiness Breakdown</h2>
            <Link href="/dashboard/student/readiness" className="text-xs text-iran-400 hover:text-iran-300 flex items-center gap-1">
              Details <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          {readiness ? (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Profile", score: readiness.profile_score, weight: "15%" },
                { label: "Resume", score: readiness.resume_score, weight: "25%" },
                { label: "Coding", score: readiness.coding_score, weight: "25%" },
                { label: "Aptitude", score: readiness.aptitude_score, weight: "15%" },
                { label: "Projects", score: readiness.projects_score, weight: "10%" },
                { label: "Certifications", score: readiness.certifications_score, weight: "10%" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground">{item.weight}</span>
                      <span className={cn("text-xs font-semibold", getScoreColor(item.score))}>
                        {Math.round(item.score)}
                      </span>
                    </div>
                  </div>
                  <Progress value={item.score} className="h-1.5" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No readiness data yet</p>
              <Button size="sm" variant="outline" className="mt-3" asChild>
                <Link href="/dashboard/student/readiness">Calculate Score</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Score meter */}
        <div className="glass-card p-5 flex flex-col items-center">
          <h2 className="font-semibold text-sm mb-4 self-start">Overall Score</h2>
          <ScoreMeter
            score={readiness?.overall_score ?? 0}
            category={readiness?.category ?? "not_ready"}
          />
        </div>
      </div>

      {/* Quick actions + recent activity */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Quick actions */}
        <div className="glass-card p-5">
          <h2 className="font-semibold text-sm mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors text-center group"
              >
                <div className={cn("p-2 rounded-lg bg-background", action.color)}>
                  <action.icon className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm">Recent Activity</h2>
          </div>
          {attempts.length > 0 ? (
            <div className="space-y-2">
              {attempts.slice(0, 4).map((attempt) => (
                <div key={attempt.id} className="flex items-center gap-3 py-1.5 border-b border-border/50 last:border-0">
                  <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", attempt.status === "completed" ? "bg-emerald-400" : "bg-amber-400")} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">
                      {(attempt as any).assessments?.title ?? "Assessment"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{formatRelativeTime(attempt.created_at)}</p>
                  </div>
                  {attempt.status === "completed" && (
                    <span className={cn("text-xs font-semibold", getScoreColor(attempt.percentage))}>
                      {Math.round(attempt.percentage)}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-6 text-center">
              <Clock className="h-6 w-6 text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">No activity yet</p>
              <Button size="sm" variant="outline" className="mt-2" asChild>
                <Link href="/dashboard/student/assessments">Take Assessment</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Improvement areas */}
      {readiness?.improvement_areas && readiness.improvement_areas.length > 0 && (
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-4 w-4 text-amber-400" />
            <h2 className="font-semibold text-sm">Top Improvement Areas</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-2">
            {readiness.improvement_areas.slice(0, 4).map((area, i) => (
              <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-muted/30">
                <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">{area}</p>
              </div>
            ))}
          </div>
          <Button size="sm" variant="outline" className="mt-3" asChild>
            <Link href="/dashboard/student/recommendations">
              View AI Recommendations <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
