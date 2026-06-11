"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Clock, Target, CheckCircle2, Play, ChevronRight,
  Loader2, AlertCircle, Trophy, BarChart3, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { cn, getDifficultyColor, formatRelativeTime } from "@/lib/utils";
import type { Assessment, Question, Attempt } from "@/types";

export default function AssessmentsPage() {
  const { toast } = useToast();
  const supabase = createClient();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [activeAssessment, setActiveAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [taking, setTaking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Attempt | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: userData } = await supabase.from("users").select("id").eq("auth_id", user.id).single();
        if (!userData) return;
        setUserId(userData.id);

        try {
          const { data: asmts } = await supabase.from("assessments").select("*").eq("is_active", true).order("created_at", { ascending: false });
          setAssessments((asmts ?? []) as Assessment[]);
        } catch (err) {
          console.error("Failed to load assessments:", err);
        }

        try {
          const { data: atts } = await supabase.from("attempts").select("*, assessments(title)").eq("user_id", userData.id).order("created_at", { ascending: false }).limit(10);
          setAttempts((atts ?? []) as Attempt[]);
        } catch (err) {
          console.error("Failed to load attempts:", err);
        }

        setLoading(false);
      } catch (err) {
        console.error("Assessments load error:", err);
        setLoading(false);
      }
    }
    load();
  }, []);

  // Timer
  useEffect(() => {
    if (!taking || !activeAssessment?.is_timed) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timer); handleSubmit(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [taking, activeAssessment]);

  const startAssessment = async (assessment: Assessment) => {
    setActiveAssessment(assessment);
    const { data: qs } = await supabase.from("questions").select("*").eq("assessment_id", assessment.id).order("order_index");
    setQuestions((qs ?? []) as Question[]);
    setCurrentQ(0);
    setAnswers({});
    setTimeLeft(assessment.duration_minutes * 60);
    setTaking(true);
    setResult(null);
  };

  const handleSubmit = async () => {
    if (!activeAssessment || submitting) return;
    setSubmitting(true);
    try {
      let correct = 0;
      const sectionScores: Record<string, { correct: number; total: number }> = {};

      for (const q of questions) {
        const userAns = answers[q.id];
        const isCorrect = userAns === q.correct_answer;
        if (isCorrect) correct++;

        if (q.section) {
          if (!sectionScores[q.section]) sectionScores[q.section] = { correct: 0, total: 0 };
          sectionScores[q.section].total++;
          if (isCorrect) sectionScores[q.section].correct++;
        }
      }

      const percentage = questions.length > 0 ? (correct / questions.length) * 100 : 0;
      const sectionPcts = Object.fromEntries(
        Object.entries(sectionScores).map(([k, v]) => [k, (v.correct / v.total) * 100])
      );

      const { data: attempt } = await supabase.from("attempts").insert({
        user_id: userId,
        assessment_id: activeAssessment.id,
        answers,
        score: correct,
        percentage,
        total_questions: questions.length,
        correct_answers: correct,
        time_taken_seconds: activeAssessment.duration_minutes * 60 - timeLeft,
        status: "completed",
        section_scores: sectionPcts,
        completed_at: new Date().toISOString(),
        feedback: percentage >= activeAssessment.passing_score
          ? "Congratulations! You passed this assessment."
          : `You scored ${Math.round(percentage)}%. Review the topics and try again.`,
      }).select().single();

      setResult(attempt as Attempt);
      setTaking(false);
      toast({ title: `Score: ${Math.round(percentage)}%`, description: attempt?.feedback });
      setAttempts((prev) => [attempt as Attempt, ...prev]);
    } catch (e) {
      toast({ title: "Submit failed", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (secs: number) => `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;

  if (loading) return (
    <div className="space-y-4">
      <div className="h-8 w-48 skeleton" />
      <div className="grid md:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => <div key={i} className="h-36 skeleton rounded-xl" />)}
      </div>
    </div>
  );

  // Active assessment UI
  if (taking && activeAssessment && questions.length > 0) {
    const q = questions[currentQ];
    const progress = ((currentQ + 1) / questions.length) * 100;

    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="glass-card p-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-sm">{activeAssessment.title}</h2>
            <p className="text-xs text-muted-foreground">Question {currentQ + 1} of {questions.length}</p>
          </div>
          <div className="flex items-center gap-3">
            {activeAssessment.is_timed && (
              <div className={cn("flex items-center gap-1.5 text-sm font-mono font-bold", timeLeft < 60 ? "text-rose-400" : "text-iran-400")}>
                <Clock className="h-4 w-4" />{formatTime(timeLeft)}
              </div>
            )}
            <Button size="sm" variant="outline" onClick={() => { setTaking(false); setActiveAssessment(null); }}>
              <X className="h-3.5 w-3.5 mr-1" />Exit
            </Button>
          </div>
        </div>

        <Progress value={progress} className="h-1.5" />

        {/* Question */}
        <motion.div key={q.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-6 space-y-5">
          <div className="flex items-start gap-3">
            <span className="text-xs font-bold text-iran-400 bg-iran-500/10 rounded px-2 py-1 shrink-0 mt-0.5">
              Q{currentQ + 1}
            </span>
            <p className="text-sm leading-relaxed font-medium">{q.question_text}</p>
          </div>

          <div className="space-y-2">
            {(q.options ?? []).map((opt: any) => (
              <button
                key={opt.id}
                onClick={() => setAnswers({ ...answers, [q.id]: opt.id })}
                className={cn(
                  "w-full text-left p-3 rounded-lg border text-sm transition-all",
                  answers[q.id] === opt.id
                    ? "border-iran-500 bg-iran-500/10 text-iran-300"
                    : "border-border/50 hover:border-border hover:bg-muted/30"
                )}
              >
                <span className="font-medium mr-2 text-muted-foreground">{opt.id}.</span>
                {opt.text}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="flex justify-between">
          <Button variant="outline" disabled={currentQ === 0} onClick={() => setCurrentQ(currentQ - 1)}>
            Previous
          </Button>
          <div className="flex gap-2">
            {currentQ < questions.length - 1 ? (
              <Button onClick={() => setCurrentQ(currentQ + 1)}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting}
                className="bg-gradient-to-r from-iran-500 to-violet-500 text-white border-0">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Submit Assessment
              </Button>
            )}
          </div>
        </div>

        {/* Answer map */}
        <div className="glass-card p-3">
          <p className="text-xs text-muted-foreground mb-2">Answer progress</p>
          <div className="flex flex-wrap gap-1.5">
            {questions.map((_, i) => (
              <button key={i} onClick={() => setCurrentQ(i)}
                className={cn("w-7 h-7 rounded text-xs font-medium transition-colors",
                  i === currentQ ? "bg-iran-500 text-white" :
                  answers[questions[i].id] ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                  "bg-muted text-muted-foreground"
                )}>
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Result display
  if (result) {
    const passed = result.percentage >= (activeAssessment?.passing_score ?? 60);
    return (
      <div className="max-w-md mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8 text-center">
          <div className={cn("w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4",
            passed ? "bg-emerald-500/20" : "bg-amber-500/20")}>
            {passed ? <Trophy className="h-8 w-8 text-emerald-400" /> : <AlertCircle className="h-8 w-8 text-amber-400" />}
          </div>
          <h2 className="text-2xl font-bold mb-1">{Math.round(result.percentage)}%</h2>
          <p className={cn("text-sm font-medium mb-1", passed ? "text-emerald-400" : "text-amber-400")}>
            {passed ? "Passed! 🎉" : "Not passed"}
          </p>
          <p className="text-xs text-muted-foreground mb-4">{result.feedback}</p>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-lg font-bold text-emerald-400">{result.correct_answers}</p>
              <p className="text-xs text-muted-foreground">Correct</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-lg font-bold text-rose-400">{(result.total_questions ?? 0) - result.correct_answers}</p>
              <p className="text-xs text-muted-foreground">Wrong</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-lg font-bold">{result.total_questions}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
          <Button onClick={() => { setResult(null); setActiveAssessment(null); }} className="w-full">
            Back to Assessments
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Skill Assessments</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Test your knowledge and track your scores</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold">{assessments.length}</p>
          <p className="text-xs text-muted-foreground">Available</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold">{attempts.filter((a) => a.status === "completed").length}</p>
          <p className="text-xs text-muted-foreground">Completed</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold">
            {attempts.length > 0
              ? Math.round(attempts.filter((a) => a.status === "completed").reduce((sum, a) => sum + (a.percentage ?? 0), 0) / Math.max(1, attempts.filter((a) => a.status === "completed").length))
              : 0}%
          </p>
          <p className="text-xs text-muted-foreground">Avg Score</p>
        </div>
      </div>

      {/* Assessments grid */}
      {assessments.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
          <p className="text-muted-foreground">No assessments available yet</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assessments.map((assessment) => {
            const myAttempts = attempts.filter((a) => a.assessment_id === assessment.id);
            const bestScore = myAttempts.length > 0
              ? Math.max(...myAttempts.map((a) => a.percentage ?? 0))
              : null;

            return (
              <motion.div
                key={assessment.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-5 flex flex-col"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm mb-1">{assessment.title}</h3>
                    {assessment.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{assessment.description}</p>
                    )}
                  </div>
                  {bestScore !== null && (
                    <span className={cn("text-xs font-bold ml-2 shrink-0",
                      bestScore >= 80 ? "text-emerald-400" : bestScore >= 60 ? "text-amber-400" : "text-rose-400")}>
                      {Math.round(bestScore)}%
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", getDifficultyColor(assessment.difficulty))}>
                    {assessment.difficulty}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {assessment.type}
                  </span>
                  {assessment.category && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {assessment.category}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4 mt-auto">
                  <span className="flex items-center gap-1"><Target className="h-3 w-3" />{assessment.total_questions}Q</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{assessment.duration_minutes}m</span>
                  <span className="flex items-center gap-1"><BarChart3 className="h-3 w-3" />{assessment.passing_score}% pass</span>
                </div>

                <Button
                  size="sm"
                  onClick={() => startAssessment(assessment)}
                  className={myAttempts.length > 0 ? "" : "bg-gradient-to-r from-iran-500 to-violet-500 text-white border-0"}
                >
                  <Play className="h-3.5 w-3.5 mr-1.5" />
                  {myAttempts.length > 0 ? "Retake" : "Start Test"}
                </Button>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Recent attempts */}
      {attempts.length > 0 && (
        <div className="glass-card p-5">
          <h2 className="font-semibold text-sm mb-3">Recent Attempts</h2>
          <div className="space-y-2">
            {attempts.slice(0, 5).map((attempt) => (
              <div key={attempt.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <p className="text-sm font-medium">{(attempt as any).assessments?.title ?? "Assessment"}</p>
                  <p className="text-xs text-muted-foreground">{formatRelativeTime(attempt.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className={cn("text-sm font-bold",
                    attempt.percentage >= 80 ? "text-emerald-400" :
                    attempt.percentage >= 60 ? "text-amber-400" : "text-rose-400")}>
                    {Math.round(attempt.percentage)}%
                  </p>
                  <p className="text-xs text-muted-foreground">{attempt.correct_answers}/{attempt.total_questions}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
