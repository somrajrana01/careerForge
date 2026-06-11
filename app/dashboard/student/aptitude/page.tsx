"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Brain, Clock, Trophy, BarChart3, Play, CheckCircle2,
  ChevronRight, Loader2, Star, TrendingUp, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { cn, getScoreColor } from "@/lib/utils";
import type { Assessment, Question, Attempt } from "@/types";

interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  institution: string;
  branch: string;
  best_percentage: number;
  attempts_count: number;
  rank: number;
}

export default function AptitudePage() {
  const { toast } = useToast();
  const supabase = createClient();
  const [aptitudeTests, setAptitudeTests] = useState<Assessment[]>([]);
  const [myAttempts, setMyAttempts] = useState<Attempt[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");

  // Test state
  const [activeTest, setActiveTest] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [taking, setTaking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Attempt | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: userData } = await supabase.from("users").select("id, full_name").eq("auth_id", user.id).single();
      if (!userData) return;
      setUserId(userData.id);
      setUserName(userData.full_name);

      try {
        const { data: tests } = await supabase.from("assessments").select("*").eq("type", "aptitude").eq("is_active", true);
        setAptitudeTests((tests ?? []) as Assessment[]);
      } catch (err) {
        console.error("Failed to load aptitude tests:", err);
      }

      try {
        const { data: attempts } = await supabase.from("attempts").select("*, assessments(title,type)").eq("user_id", userData.id)
          .order("created_at", { ascending: false });
        setMyAttempts((attempts ?? []) as Attempt[]);
      } catch (err) {
        console.error("Failed to load attempts:", err);
      }

      try {
        const { data: lb } = await supabase.from("aptitude_leaderboard").select("*").order("rank").limit(20);
        setLeaderboard((lb ?? []) as LeaderboardEntry[]);
      } catch (err) {
        console.error("Failed to load leaderboard:", err);
      }

      setLoading(false);
    } catch (err) {
      console.error("Aptitude load error:", err);
      setLoading(false);
    }
  };

  // Timer countdown
  useEffect(() => {
    if (!taking || !activeTest?.is_timed) return;
    if (timeLeft <= 0) { handleSubmit(); return; }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [taking, timeLeft]);

  const startTest = async (test: Assessment) => {
    const { data: qs } = await supabase
      .from("questions")
      .select("*")
      .eq("assessment_id", test.id)
      .order("order_index");

    if (!qs || qs.length === 0) {
      toast({ title: "No questions found", variant: "destructive" });
      return;
    }

    setActiveTest(test);
    setQuestions(qs as Question[]);
    setCurrentQ(0);
    setAnswers({});
    setTimeLeft(test.duration_minutes * 60);
    setTaking(true);
    setResult(null);
  };

  const handleSubmit = async () => {
    if (!activeTest || submitting) return;
    setSubmitting(true);
    setTaking(false);

    try {
      let correct = 0;
      const sectionScores: Record<string, { correct: number; total: number }> = {};

      for (const q of questions) {
        const isCorrect = answers[q.id] === q.correct_answer;
        if (isCorrect) correct++;
        if (q.section) {
          if (!sectionScores[q.section]) sectionScores[q.section] = { correct: 0, total: 0 };
          sectionScores[q.section].total++;
          if (isCorrect) sectionScores[q.section].correct++;
        }
      }

      const percentage = (correct / questions.length) * 100;
      const sectionPcts = Object.fromEntries(
        Object.entries(sectionScores).map(([k, v]) => [k, Math.round((v.correct / v.total) * 100)])
      );
      const timeTaken = activeTest.duration_minutes * 60 - timeLeft;

      const { data: attempt } = await supabase.from("attempts").insert({
        user_id: userId,
        assessment_id: activeTest.id,
        answers,
        score: correct,
        percentage,
        total_questions: questions.length,
        correct_answers: correct,
        time_taken_seconds: timeTaken,
        status: "completed",
        section_scores: sectionPcts,
        completed_at: new Date().toISOString(),
        feedback: percentage >= activeTest.passing_score
          ? `Great score of ${Math.round(percentage)}%! You passed.`
          : `Score: ${Math.round(percentage)}%. Passing mark is ${activeTest.passing_score}%. Keep practicing!`,
      }).select().single();

      if (attempt) {
        setResult(attempt as Attempt);
        setMyAttempts((prev) => [attempt as Attempt, ...prev]);
        toast({ title: `Aptitude Score: ${Math.round(percentage)}%` });
        loadData(); // refresh leaderboard
      }
    } catch {
      toast({ title: "Submit failed", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  if (loading) return (
    <div className="space-y-4">
      <div className="h-8 w-48 skeleton" />
      <div className="grid md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-36 skeleton rounded-xl" />)}
      </div>
    </div>
  );

  // ── Active test UI ──
  if (taking && activeTest && questions.length > 0) {
    const q = questions[currentQ];
    const pct = ((currentQ + 1) / questions.length) * 100;
    const answered = Object.keys(answers).length;

    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header bar */}
        <div className="glass-card p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">{activeTest.title}</p>
            <p className="text-xs text-muted-foreground">
              Q {currentQ + 1}/{questions.length} · {answered} answered
            </p>
          </div>
          <div className="flex items-center gap-3">
            {activeTest.is_timed && (
              <div className={cn(
                "flex items-center gap-1.5 font-mono font-bold text-sm px-3 py-1 rounded-lg",
                timeLeft < 60 ? "bg-rose-500/10 text-rose-400" :
                timeLeft < 180 ? "bg-amber-500/10 text-amber-400" :
                "bg-muted text-foreground"
              )}>
                <Clock className="h-3.5 w-3.5" />
                {formatTime(timeLeft)}
              </div>
            )}
          </div>
        </div>

        <Progress value={pct} className="h-1" />

        {/* Question card */}
        <motion.div
          key={q.id}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-6 space-y-5"
        >
          {q.section && (
            <Badge variant="outline" className="capitalize text-xs">
              {q.section}
            </Badge>
          )}
          <p className="font-medium text-base leading-relaxed">{q.question_text}</p>

          <div className="space-y-2">
            {(q.options ?? []).map((opt: any) => {
              const selected = answers[q.id] === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setAnswers({ ...answers, [q.id]: opt.id })}
                  className={cn(
                    "w-full text-left p-3.5 rounded-xl border text-sm transition-all",
                    selected
                      ? "border-iran-500 bg-iran-500/10 text-foreground font-medium"
                      : "border-border/50 hover:border-border hover:bg-muted/30"
                  )}
                >
                  <span className={cn("font-semibold mr-2.5", selected ? "text-iran-400" : "text-muted-foreground")}>
                    {opt.id}.
                  </span>
                  {opt.text}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" disabled={currentQ === 0} onClick={() => setCurrentQ(currentQ - 1)}>
            Previous
          </Button>
          <div className="flex flex-wrap justify-center gap-1 flex-1 px-4">
            {questions.slice(0, 15).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentQ(i)}
                className={cn(
                  "w-6 h-6 rounded text-[10px] font-medium transition-colors",
                  i === currentQ ? "bg-iran-500 text-white" :
                  answers[questions[i].id] ? "bg-emerald-500/20 text-emerald-400" :
                  "bg-muted text-muted-foreground"
                )}
              >{i + 1}</button>
            ))}
          </div>
          {currentQ < questions.length - 1 ? (
            <Button onClick={() => setCurrentQ(currentQ + 1)}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-gradient-to-r from-iran-500 to-violet-500 text-white border-0"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Submit
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ── Result UI ──
  if (result) {
    const passed = result.percentage >= (activeTest?.passing_score ?? 60);
    const sections = result.section_scores as Record<string, number>;

    return (
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 space-y-5"
        >
          <div className="text-center">
            <div className={cn(
              "w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4",
              passed ? "bg-emerald-500/20" : "bg-amber-500/20"
            )}>
              {passed ? <Trophy className="h-10 w-10 text-emerald-400" /> : <Brain className="h-10 w-10 text-amber-400" />}
            </div>
            <p className="text-4xl font-bold mb-1">{Math.round(result.percentage)}%</p>
            <p className={cn("text-sm font-medium", passed ? "text-emerald-400" : "text-amber-400")}>
              {passed ? "Passed! 🎉" : "Keep practicing"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{result.feedback}</p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Correct", val: result.correct_answers, color: "text-emerald-400" },
              { label: "Wrong", val: (result.total_questions ?? 0) - result.correct_answers, color: "text-rose-400" },
              { label: "Total", val: result.total_questions, color: "text-foreground" },
            ].map((s) => (
              <div key={s.label} className="bg-muted/30 rounded-lg p-3 text-center">
                <p className={cn("text-xl font-bold", s.color)}>{s.val}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Section breakdown */}
          {Object.keys(sections).length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Section Scores</p>
              {Object.entries(sections).map(([section, pct]) => (
                <div key={section}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="capitalize text-muted-foreground">{section}</span>
                    <span className={cn("font-semibold", getScoreColor(pct))}>{Math.round(pct)}%</span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => { setResult(null); setActiveTest(null); }}>
              Back
            </Button>
            {activeTest && (
              <Button className="flex-1 bg-gradient-to-r from-iran-500 to-violet-500 text-white border-0"
                onClick={() => startTest(activeTest)}>
                Retake
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Main listing ──
  const bestScore = myAttempts.length > 0
    ? Math.max(...myAttempts.filter((a) => a.status === "completed").map((a) => a.percentage ?? 0))
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Aptitude Tests</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Practice quantitative, logical, and verbal reasoning
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold">{aptitudeTests.length}</p>
          <p className="text-xs text-muted-foreground">Available Tests</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className={cn("text-2xl font-bold", getScoreColor(bestScore))}>
            {myAttempts.length > 0 ? `${Math.round(bestScore)}%` : "—"}
          </p>
          <p className="text-xs text-muted-foreground">Best Score</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold">{myAttempts.filter((a) => a.status === "completed").length}</p>
          <p className="text-xs text-muted-foreground">Completed</p>
        </div>
      </div>

      <Tabs defaultValue="tests">
        <TabsList>
          <TabsTrigger value="tests"><Brain className="h-3.5 w-3.5 mr-1.5" />Tests</TabsTrigger>
          <TabsTrigger value="leaderboard"><Trophy className="h-3.5 w-3.5 mr-1.5" />Leaderboard</TabsTrigger>
          <TabsTrigger value="history"><BarChart3 className="h-3.5 w-3.5 mr-1.5" />History</TabsTrigger>
        </TabsList>

        {/* Tests list */}
        <TabsContent value="tests" className="space-y-3 mt-4">
          {aptitudeTests.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-muted-foreground">No aptitude tests available yet</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {aptitudeTests.map((test) => {
                const testAttempts = myAttempts.filter((a) => a.assessment_id === test.id && a.status === "completed");
                const best = testAttempts.length > 0
                  ? Math.max(...testAttempts.map((a) => a.percentage ?? 0))
                  : null;

                return (
                  <div key={test.id} className="glass-card p-5 flex flex-col">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold">{test.title}</h3>
                      {best !== null && (
                        <span className={cn("text-sm font-bold", getScoreColor(best))}>
                          {Math.round(best)}%
                        </span>
                      )}
                    </div>
                    {test.description && (
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{test.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4 mt-auto">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />{test.duration_minutes}m
                      </span>
                      <span className="flex items-center gap-1">
                        <Brain className="h-3 w-3" />{test.total_questions}Q
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />Pass: {test.passing_score}%
                      </span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => startTest(test)}
                      className={best === null
                        ? "bg-gradient-to-r from-iran-500 to-violet-500 text-white border-0"
                        : ""}
                    >
                      <Play className="h-3.5 w-3.5 mr-1.5" />
                      {best !== null ? "Retake Test" : "Start Test"}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Leaderboard */}
        <TabsContent value="leaderboard" className="mt-4">
          <div className="glass-card p-5">
            <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-400" />Top Performers
            </h2>
            {leaderboard.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No leaderboard data yet</p>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry, i) => (
                  <div
                    key={entry.user_id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg",
                      i === 0 ? "bg-amber-500/10 border border-amber-500/20" :
                      i === 1 ? "bg-slate-500/10 border border-slate-500/20" :
                      i === 2 ? "bg-orange-500/10 border border-orange-500/20" :
                      "bg-muted/20",
                      entry.user_id === userId && "ring-1 ring-iran-500/50"
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                      i === 0 ? "bg-amber-500 text-white" :
                      i === 1 ? "bg-slate-400 text-white" :
                      i === 2 ? "bg-orange-500 text-white" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {i < 3 ? ["🥇","🥈","🥉"][i] : entry.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate flex items-center gap-1.5">
                        {entry.full_name}
                        {entry.user_id === userId && <span className="text-[10px] text-iran-400">(you)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{entry.institution}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={cn("text-sm font-bold", getScoreColor(entry.best_percentage))}>
                        {Math.round(entry.best_percentage)}%
                      </p>
                      <p className="text-[10px] text-muted-foreground">{entry.attempts_count} attempts</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* History */}
        <TabsContent value="history" className="mt-4">
          <div className="glass-card p-5">
            <h2 className="font-semibold text-sm mb-4">My Attempt History</h2>
            {myAttempts.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-30" />
                <p className="text-sm text-muted-foreground">No attempts yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {myAttempts.slice(0, 10).map((attempt) => (
                  <div key={attempt.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                    <div>
                      <p className="text-sm font-medium">{(attempt as any).assessments?.title ?? "Test"}</p>
                      <p className="text-xs text-muted-foreground">
                        {attempt.correct_answers}/{attempt.total_questions} correct ·{" "}
                        {attempt.time_taken_seconds
                          ? `${Math.round(attempt.time_taken_seconds / 60)}m`
                          : "—"}
                      </p>
                    </div>
                    <span className={cn("text-sm font-bold", getScoreColor(attempt.percentage ?? 0))}>
                      {Math.round(attempt.percentage ?? 0)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
