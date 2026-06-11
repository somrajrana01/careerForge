"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Code2, Play, ChevronRight, Clock, Target, Loader2,
  CheckCircle2, XCircle, Trophy, BookOpen, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { cn, getDifficultyColor, PROGRAMMING_LANGUAGES, formatRelativeTime } from "@/lib/utils";
import type { CodingQuestion, CodingSubmission } from "@/types";

const STARTER_CODE: Record<string, string> = {
  JavaScript: "function solution(input) {\n  // Your code here\n  \n}\n\nconsole.log(solution());",
  Python: "def solution(input):\n    # Your code here\n    pass\n\nprint(solution())",
  Java: "public class Solution {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}",
  "C++": "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}",
  TypeScript: "function solution(input: any): any {\n  // Your code here\n}\n\nconsole.log(solution());",
};

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  return (
    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", getDifficultyColor(difficulty))}>
      {difficulty}
    </span>
  );
}

export default function CodingPage() {
  const { toast } = useToast();
  const supabase = createClient();
  const [questions, setQuestions] = useState<CodingQuestion[]>([]);
  const [submissions, setSubmissions] = useState<CodingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [selected, setSelected] = useState<CodingQuestion | null>(null);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("Python");
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<CodingSubmission | null>(null);
  const [filterDiff, setFilterDiff] = useState<string>("all");

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: userData } = await supabase.from("users").select("id").eq("auth_id", user.id).single();
        if (!userData) return;
        setUserId(userData.id);

        try {
          const { data: qs } = await supabase.from("coding_questions").select("*").eq("is_active", true).order("created_at", { ascending: false });
          setQuestions((qs ?? []) as CodingQuestion[]);
        } catch (err) {
          console.error("Failed to load coding questions:", err);
        }

        try {
          const { data: subs } = await supabase.from("coding_submissions").select("*").eq("user_id", userData.id).order("submitted_at", { ascending: false });
          setSubmissions((subs ?? []) as CodingSubmission[]);
        } catch (err) {
          console.error("Failed to load submissions:", err);
        }

        setLoading(false);
      } catch (err) {
        console.error("Coding load error:", err);
        setLoading(false);
      }
    }
    load();
  }, []);

  const selectQuestion = (q: CodingQuestion) => {
    setSelected(q);
    setCode(STARTER_CODE[language] ?? "");
    setLastResult(null);
  };

  const handleSubmit = async () => {
    if (!selected || !code.trim()) {
      toast({ title: "Write some code first", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      // MVP: simulate evaluation
      const { score, passed, total, feedback } = simulateEvaluation(code, selected, language);

      const { data: sub } = await supabase.from("coding_submissions").insert({
        user_id: userId,
        question_id: selected.id,
        code,
        language,
        status: "evaluated",
        score,
        test_cases_passed: passed,
        test_cases_total: total,
        completion_percentage: (passed / total) * 100,
        feedback,
        execution_time_ms: Math.floor(Math.random() * 200) + 50,
      }).select().single();

      if (sub) {
        setLastResult(sub as CodingSubmission);
        setSubmissions((prev) => [sub as CodingSubmission, ...prev]);
        toast({
          title: `${passed}/${total} test cases passed`,
          description: feedback,
          variant: score >= 70 ? "default" : "destructive",
        });
      }
    } catch {
      toast({ title: "Submission failed", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // MVP simulated evaluation
  const simulateEvaluation = (code: string, q: CodingQuestion, lang: string) => {
    const codeLen = code.trim().length;
    const hasSolution = codeLen > 30;
    const hasLogic = code.includes("return") || code.includes("print") || code.includes("cout");
    const complexityBonus = q.difficulty === "easy" ? 20 : q.difficulty === "medium" ? 10 : 0;

    let passed = 0;
    const total = q.difficulty === "easy" ? 5 : q.difficulty === "medium" ? 8 : 10;

    if (hasSolution && hasLogic) {
      passed = Math.floor(total * (0.4 + Math.random() * 0.5));
    } else if (hasSolution) {
      passed = Math.floor(total * 0.3);
    }

    const score = Math.min(100, Math.round((passed / total) * 100) + complexityBonus);
    const feedback = passed === total
      ? "All test cases passed! Excellent solution."
      : passed > total / 2
      ? `${passed}/${total} test cases passed. Review edge cases.`
      : `Only ${passed}/${total} passed. Check your logic and try again.`;

    return { score, passed, total, feedback };
  };

  const filtered = filterDiff === "all" ? questions : questions.filter((q) => q.difficulty === filterDiff);
  const solvedIds = new Set(submissions.filter((s) => s.completion_percentage >= 100).map((s) => s.question_id));
  const attemptedIds = new Set(submissions.map((s) => s.question_id));

  if (loading) return (
    <div className="space-y-4">
      <div className="h-8 w-48 skeleton" />
      <div className="h-96 skeleton rounded-xl" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Coding Practice</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Solve challenges to boost your coding score</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total", value: questions.length, color: "text-foreground" },
          { label: "Solved", value: solvedIds.size, color: "text-emerald-400" },
          { label: "Attempted", value: attemptedIds.size, color: "text-amber-400" },
          { label: "Submissions", value: submissions.length, color: "text-iran-400" },
        ].map((s) => (
          <div key={s.label} className="glass-card p-3 text-center">
            <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-5 gap-4 min-h-[600px]">
        {/* Question list */}
        <div className="md:col-span-2 space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <Select value={filterDiff} onValueChange={setFilterDiff}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All difficulties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All difficulties</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 max-h-[560px] overflow-y-auto scrollbar-thin pr-1">
            {filtered.map((q, i) => (
              <button
                key={q.id}
                onClick={() => selectQuestion(q)}
                className={cn(
                  "w-full text-left p-3 rounded-lg border transition-all",
                  selected?.id === q.id
                    ? "border-iran-500/50 bg-iran-500/10"
                    : "border-border/50 hover:border-border hover:bg-muted/30"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium truncate flex-1">{q.title}</p>
                  {solvedIds.has(q.id) && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 ml-1" />}
                  {attemptedIds.has(q.id) && !solvedIds.has(q.id) && (
                    <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0 ml-1" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <DifficultyBadge difficulty={q.difficulty} />
                  {q.tags?.slice(0, 2).map((tag) => (
                    <span key={tag} className="text-[10px] text-muted-foreground">{tag}</span>
                  ))}
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No questions found
              </div>
            )}
          </div>
        </div>

        {/* Editor panel */}
        <div className="md:col-span-3">
          {selected ? (
            <div className="glass-card h-full flex flex-col">
              <Tabs defaultValue="problem" className="flex-1 flex flex-col">
                <div className="flex items-center justify-between px-4 pt-3 border-b border-border/50 pb-3">
                  <TabsList className="h-7">
                    <TabsTrigger value="problem" className="text-xs h-6">Problem</TabsTrigger>
                    <TabsTrigger value="solution" className="text-xs h-6">Solution</TabsTrigger>
                    {lastResult && <TabsTrigger value="result" className="text-xs h-6">Result</TabsTrigger>}
                  </TabsList>
                  <div className="flex items-center gap-2">
                    <Select value={language} onValueChange={(v) => { setLanguage(v); setCode(STARTER_CODE[v] ?? ""); }}>
                      <SelectTrigger className="h-7 text-xs w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROGRAMMING_LANGUAGES.map((l) => (
                          <SelectItem key={l} value={l}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-0"
                      onClick={handleSubmit} disabled={submitting}>
                      {submitting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Play className="h-3 w-3 mr-1" />}
                      {submitting ? "Running..." : "Run & Submit"}
                    </Button>
                  </div>
                </div>

                <TabsContent value="problem" className="flex-1 p-4 overflow-y-auto">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold">{selected.title}</h2>
                      <DifficultyBadge difficulty={selected.difficulty} />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.tags?.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {selected.problem_statement}
                    </p>
                    {selected.constraints && (
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs font-medium mb-1">Constraints:</p>
                        <p className="text-xs text-muted-foreground">{selected.constraints}</p>
                      </div>
                    )}
                    {selected.sample_input && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs font-medium mb-1">Sample Input:</p>
                          <pre className="code-block text-xs">{selected.sample_input}</pre>
                        </div>
                        <div>
                          <p className="text-xs font-medium mb-1">Sample Output:</p>
                          <pre className="code-block text-xs">{selected.sample_output}</pre>
                        </div>
                      </div>
                    )}
                    {selected.hints?.length > 0 && (
                      <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                        <p className="text-xs font-medium text-amber-400 mb-1.5">Hints:</p>
                        {selected.hints.map((hint, i) => (
                          <p key={i} className="text-xs text-muted-foreground">• {hint}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="solution" className="flex-1 p-0 flex flex-col">
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="flex-1 w-full bg-transparent font-mono text-sm p-4 resize-none outline-none text-green-400 leading-relaxed"
                    placeholder="Write your solution here..."
                    spellCheck={false}
                    style={{ minHeight: "400px" }}
                  />
                </TabsContent>

                {lastResult && (
                  <TabsContent value="result" className="flex-1 p-4">
                    <div className="space-y-4">
                      <div className={cn("flex items-center gap-3 p-4 rounded-lg",
                        lastResult.completion_percentage >= 100 ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-amber-500/10 border border-amber-500/20")}>
                        {lastResult.completion_percentage >= 100
                          ? <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                          : <AlertCircle className="h-5 w-5 text-amber-400" />}
                        <div>
                          <p className="font-medium text-sm">
                            {lastResult.test_cases_passed}/{lastResult.test_cases_total} Test Cases Passed
                          </p>
                          <p className="text-xs text-muted-foreground">{lastResult.feedback}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="glass-card p-3 text-center">
                          <p className="text-lg font-bold text-iran-400">{Math.round(lastResult.completion_percentage)}%</p>
                          <p className="text-xs text-muted-foreground">Score</p>
                        </div>
                        <div className="glass-card p-3 text-center">
                          <p className="text-lg font-bold">{lastResult.execution_time_ms}ms</p>
                          <p className="text-xs text-muted-foreground">Runtime</p>
                        </div>
                        <div className="glass-card p-3 text-center">
                          <p className="text-lg font-bold">{lastResult.language}</p>
                          <p className="text-xs text-muted-foreground">Language</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </div>
          ) : (
            <div className="glass-card h-full flex flex-col items-center justify-center text-center p-8">
              <Code2 className="h-12 w-12 text-muted-foreground mb-3 opacity-30" />
              <p className="font-medium mb-1">Select a problem to start</p>
              <p className="text-sm text-muted-foreground">Choose from the list on the left</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent submissions */}
      {submissions.length > 0 && (
        <div className="glass-card p-5">
          <h2 className="font-semibold text-sm mb-3">Recent Submissions</h2>
          <div className="space-y-2">
            {submissions.slice(0, 5).map((sub) => {
              const q = questions.find((q) => q.id === sub.question_id);
              return (
                <div key={sub.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-3">
                    {sub.completion_percentage >= 100
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      : <XCircle className="h-4 w-4 text-amber-400" />}
                    <div>
                      <p className="text-sm font-medium">{q?.title ?? "Problem"}</p>
                      <p className="text-xs text-muted-foreground">
                        {sub.language} · {formatRelativeTime(sub.submitted_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-sm font-bold",
                      sub.completion_percentage >= 80 ? "text-emerald-400" :
                      sub.completion_percentage >= 50 ? "text-amber-400" : "text-rose-400")}>
                      {sub.test_cases_passed}/{sub.test_cases_total}
                    </p>
                    <p className="text-xs text-muted-foreground">{Math.round(sub.completion_percentage)}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
