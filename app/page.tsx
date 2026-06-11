"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Brain,
  Code2,
  FileText,
  BarChart3,
  Users,
  Trophy,
  Zap,
  CheckCircle2,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: FileText,
    title: "AI Resume Analyzer",
    description:
      "Upload your resume for instant ATS scoring, keyword analysis, and actionable improvement suggestions powered by Groq AI.",
    color: "text-iran-400",
    bg: "bg-iran-500/10",
  },
  {
    icon: Code2,
    title: "Coding Assessments",
    description:
      "Solve real-world coding challenges across difficulty levels. Track your progress and identify weak spots.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Brain,
    title: "Aptitude Testing",
    description:
      "Quantitative, logical, and verbal sections with timed tests, auto-scoring, and a competitive leaderboard.",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
  {
    icon: BarChart3,
    title: "Readiness Engine",
    description:
      "Deterministic scoring across 6 dimensions gives you an honest Internship Readiness Score from 0–100.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    icon: Zap,
    title: "AI Roadmaps",
    description:
      "Personalized 30/60/90 day preparation roadmaps with skill gap analysis and interview preparation plans.",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
  },
  {
    icon: Users,
    title: "Internship Matching",
    description:
      "Smart matching algorithm connects your profile to relevant internships with match percentages.",
    color: "text-teal-400",
    bg: "bg-teal-500/10",
  },
];

const stats = [
  { label: "Students Analyzed", value: "10,000+" },
  { label: "Resumes Processed", value: "25,000+" },
  { label: "Internships Listed", value: "500+" },
  { label: "Average Score Improvement", value: "34%" },
];

const roles = [
  {
    title: "Student",
    description: "Track your readiness, take assessments, and get AI-powered guidance",
    features: ["Resume Analysis", "Coding Practice", "AI Roadmaps", "Internship Matching"],
    href: "/auth/register",
    color: "from-iran-500 to-violet-500",
  },
  {
    title: "Trainer",
    description: "Monitor student progress and manage skill assessments",
    features: ["Student Dashboard", "Assessment Creation", "Progress Tracking", "Analytics"],
    href: "/auth/register",
    color: "from-emerald-500 to-teal-500",
  },
  {
    title: "Placement Officer",
    description: "Get department-wide placement readiness analytics",
    features: ["Placement Analytics", "Student Reports", "Export Data", "Department View"],
    href: "/auth/register",
    color: "from-amber-500 to-orange-500",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-iran-500 to-violet-500">
              <span className="text-xs font-bold text-white">IR</span>
            </div>
            <span className="font-semibold text-sm tracking-tight">IRAN</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#roles" className="hover:text-foreground transition-colors">For whom</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild className="bg-gradient-to-r from-iran-500 to-violet-500 hover:from-iran-600 hover:to-violet-600 text-white border-0">
              <Link href="/auth/register">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-mesh opacity-40" />
        <div className="container relative text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-iran-500/30 bg-iran-500/10 px-3 py-1 text-xs text-iran-400 mb-6">
              <Star className="h-3 w-3" />
              <span>AI-Powered Internship Preparation Platform</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              Know your{" "}
              <span className="text-gradient">internship</span>
              <br />
              readiness score
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              IRAN analyzes your resume, coding skills, aptitude, and projects
              to give you an honest readiness score — plus an AI roadmap to get
              you internship-ready faster.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" asChild className="bg-gradient-to-r from-iran-500 to-violet-500 hover:from-iran-600 hover:to-violet-600 text-white border-0 h-12 px-8">
                <Link href="/auth/register">
                  Analyze my readiness
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-12 px-8">
                <Link href="/auth/login">Sign in to dashboard</Link>
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="glass-card p-6 text-center">
                <div className="text-2xl md:text-3xl font-bold text-gradient mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 border-t border-border/50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need to get placed
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Six powerful tools that work together to identify gaps and help
              you close them before your internship interviews.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                viewport={{ once: true }}
                className="glass-card p-6 hover:border-border transition-all"
              >
                <div className={`inline-flex p-2.5 rounded-lg ${feature.bg} mb-4`}>
                  <feature.icon className={`h-5 w-5 ${feature.color}`} />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 border-t border-border/50 bg-muted/20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              From profile to placement in 4 steps
            </h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "Build your profile",
                desc: "Add your education, skills, projects, and certifications",
              },
              {
                step: "02",
                title: "Get analyzed",
                desc: "Upload resume, take assessments, and solve coding problems",
              },
              {
                step: "03",
                title: "See your score",
                desc: "View your readiness score across all 6 dimensions",
              },
              {
                step: "04",
                title: "Follow your roadmap",
                desc: "Execute your AI-generated 30/60/90 day preparation plan",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl font-bold text-iran-500/20 mb-3">{item.step}</div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="py-20 border-t border-border/50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for everyone</h2>
            <p className="text-muted-foreground">IRAN supports students, trainers, and placement officers with role-specific dashboards.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {roles.map((role) => (
              <div key={role.title} className="glass-card p-6">
                <div className={`text-lg font-bold bg-gradient-to-r ${role.color} bg-clip-text text-transparent mb-2`}>
                  {role.title}
                </div>
                <p className="text-sm text-muted-foreground mb-4">{role.description}</p>
                <ul className="space-y-2 mb-5">
                  {role.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href={role.href}>Get started as {role.title}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-border/50">
        <div className="container text-center">
          <div className="glass-card p-12 max-w-2xl mx-auto gradient-border">
            <Trophy className="h-10 w-10 text-amber-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-3">Ready to check your score?</h2>
            <p className="text-muted-foreground mb-6">
              Join thousands of engineering students who've improved their
              placement readiness with IRAN.
            </p>
            <Button size="lg" asChild className="bg-gradient-to-r from-iran-500 to-violet-500 hover:from-iran-600 hover:to-violet-600 text-white border-0 h-12 px-10">
              <Link href="/auth/register">
                Start for free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-gradient-to-br from-iran-500 to-violet-500 flex items-center justify-center">
              <span className="text-[8px] font-bold text-white">IR</span>
            </div>
            <span>IRAN — Internship Readiness Analyzer</span>
          </div>
          <p>Built for BTech students. Final year major project.</p>
        </div>
      </footer>
    </div>
  );
}
