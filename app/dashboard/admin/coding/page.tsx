"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Code2,
  Edit,
  Eye,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { cn, formatDate, getDifficultyColor } from "@/lib/utils";
import type { CodingQuestion, DifficultyLevel } from "@/types";

type ApiResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

type TestCase = {
  id: string;
  input: string;
  expected_output: string;
  is_hidden: boolean;
};

type StarterCode = Record<"cpp" | "java" | "python" | "javascript", string>;

type CodingMetadata = {
  explanation: string;
  test_cases: TestCase[];
  starter_code: StarterCode;
};

type QuestionForm = {
  title: string;
  problem_statement: string;
  difficulty: DifficultyLevel;
  category: string;
  constraints: string;
  input_format: string;
  output_format: string;
  sample_input: string;
  sample_output: string;
  explanation: string;
  test_cases: TestCase[];
  starter_code: StarterCode;
};

const PAGE_SIZE = 8;

const defaultStarterCode: StarterCode = {
  cpp: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    return 0;\n}",
  java: "public class Solution {\n    public static void main(String[] args) {\n    }\n}",
  python: "def solve():\n    pass\n\nsolve()",
  javascript: "function solve(input) {\n  return input;\n}\n\nconsole.log(solve(''));",
};

const emptyForm: QuestionForm = {
  title: "",
  problem_statement: "",
  difficulty: "medium",
  category: "",
  constraints: "",
  input_format: "",
  output_format: "",
  sample_input: "",
  sample_output: "",
  explanation: "",
  test_cases: [],
  starter_code: defaultStarterCode,
};

function newTestCase(): TestCase {
  return {
    id: crypto.randomUUID(),
    input: "",
    expected_output: "",
    is_hidden: false,
  };
}

function parseMetadata(raw?: string | null): CodingMetadata {
  if (!raw) {
    return { explanation: "", test_cases: [], starter_code: defaultStarterCode };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<CodingMetadata>;
    if (parsed && typeof parsed === "object" && "starter_code" in parsed) {
      return {
        explanation: typeof parsed.explanation === "string" ? parsed.explanation : "",
        test_cases: Array.isArray(parsed.test_cases) ? parsed.test_cases : [],
        starter_code: { ...defaultStarterCode, ...(parsed.starter_code ?? {}) },
      };
    }
  } catch {
    // Existing rows may have plain-text explanations.
  }

  return { explanation: raw, test_cases: [], starter_code: defaultStarterCode };
}

function serializeMetadata(form: QuestionForm) {
  return JSON.stringify({
    explanation: form.explanation,
    test_cases: form.test_cases,
    starter_code: form.starter_code,
  });
}

function formFromQuestion(question: CodingQuestion): QuestionForm {
  const metadata = parseMetadata(question.explanation);

  return {
    title: question.title,
    problem_statement: question.problem_statement,
    difficulty: question.difficulty,
    category: question.tags?.[0] ?? "",
    constraints: question.constraints ?? "",
    input_format: question.input_format ?? "",
    output_format: question.output_format ?? "",
    sample_input: question.sample_input ?? "",
    sample_output: question.sample_output ?? "",
    explanation: metadata.explanation,
    test_cases: metadata.test_cases,
    starter_code: metadata.starter_code,
  };
}

function getCategory(question: CodingQuestion) {
  return question.tags?.[0] ?? "Uncategorized";
}

function getMetadata(question: CodingQuestion) {
  return parseMetadata(question.explanation);
}

async function readApi<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiResult<T>;
  if (!response.ok || !payload.success) {
    throw new Error(payload.error ?? "Request failed");
  }
  return payload.data as T;
}

export default function AdminCodingPage() {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<CodingQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit" | "view">("create");
  const [selected, setSelected] = useState<CodingQuestion | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CodingQuestion | null>(null);
  const [form, setForm] = useState<QuestionForm>(emptyForm);

  const loadQuestions = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await readApi<CodingQuestion[]>(await fetch("/api/coding", { cache: "no-store" }));
      setQuestions(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load coding questions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const categories = useMemo(() => {
    const values = new Set(questions.map(getCategory));
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [questions]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return questions.filter((question) => {
      const meta = getMetadata(question);
      const matchSearch =
        !q ||
        question.title.toLowerCase().includes(q) ||
        question.problem_statement.toLowerCase().includes(q) ||
        getCategory(question).toLowerCase().includes(q) ||
        meta.explanation.toLowerCase().includes(q);
      const matchDifficulty = difficulty === "all" || question.difficulty === difficulty;
      const matchCategory = category === "all" || getCategory(question) === category;
      return matchSearch && matchDifficulty && matchCategory;
    });
  }, [category, difficulty, questions, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visibleQuestions = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, difficulty, category]);

  const openCreate = () => {
    setMode("create");
    setSelected(null);
    setForm({ ...emptyForm, starter_code: { ...defaultStarterCode }, test_cases: [newTestCase()] });
    setDialogOpen(true);
  };

  const openQuestion = (question: CodingQuestion, nextMode: "edit" | "view") => {
    setMode(nextMode);
    setSelected(question);
    setForm(formFromQuestion(question));
    setDialogOpen(true);
  };

  const updateForm = <K extends keyof QuestionForm>(key: K, value: QuestionForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateTestCase = (id: string, updates: Partial<TestCase>) => {
    setForm((current) => ({
      ...current,
      test_cases: current.test_cases.map((testCase) =>
        testCase.id === id ? { ...testCase, ...updates } : testCase
      ),
    }));
  };

  const removeTestCase = (id: string) => {
    setForm((current) => ({
      ...current,
      test_cases: current.test_cases.filter((testCase) => testCase.id !== id),
    }));
  };

  const validateForm = () => {
    if (!form.title.trim()) return "Title is required.";
    if (!form.problem_statement.trim()) return "Problem statement is required.";
    if (!form.category.trim()) return "Category is required.";
    const invalidCase = form.test_cases.find((testCase) => !testCase.input.trim() || !testCase.expected_output.trim());
    if (invalidCase) return "Each test case needs input and expected output.";
    return null;
  };

  const saveQuestion = async () => {
    const validationError = validateForm();
    if (validationError) {
      toast({ title: "Check the form", description: validationError, variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        problem_statement: form.problem_statement.trim(),
        difficulty: form.difficulty,
        tags: [form.category.trim()],
        constraints: form.constraints.trim() || null,
        input_format: form.input_format.trim() || null,
        output_format: form.output_format.trim() || null,
        sample_input: form.sample_input,
        sample_output: form.sample_output,
        explanation: serializeMetadata(form),
        hints: [],
        is_active: true,
      };

      const saved =
        mode === "edit" && selected
          ? await readApi<CodingQuestion>(
              await fetch("/api/coding", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: selected.id, ...payload }),
              })
            )
          : await readApi<CodingQuestion>(
              await fetch("/api/coding", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "create_question", ...payload }),
              })
            );

      setQuestions((current) =>
        mode === "edit" && selected
          ? current.map((question) => (question.id === selected.id ? saved : question))
          : [saved, ...current]
      );
      setDialogOpen(false);
      toast({ title: mode === "edit" ? "Question updated" : "Question created" });
    } catch (err) {
      toast({
        title: "Save failed",
        description: err instanceof Error ? err.message : "Could not save question.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteQuestion = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await readApi<{ id: string }>(await fetch(`/api/coding?id=${deleteTarget.id}`, { method: "DELETE" }));
      setQuestions((current) => current.filter((question) => question.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast({ title: "Question deleted" });
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Could not delete question.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const readonly = mode === "view";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Coding Questions</h1>
          <p className="text-sm text-muted-foreground">Manage coding-practice question banks.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadQuestions} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New Question
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_220px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
              placeholder="Search by title, category, statement, or explanation"
            />
          </div>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger>
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All difficulties</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <div className="flex gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Could not load coding questions</p>
              <p className="text-muted-foreground">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border bg-card shadow-sm">
        {loading ? (
          <div className="space-y-3 p-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="h-16 rounded-lg bg-muted/60 animate-pulse" />
            ))}
          </div>
        ) : visibleQuestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Code2 className="mb-3 h-10 w-10 text-muted-foreground opacity-40" />
            <p className="font-medium">No coding questions found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {questions.length === 0 ? "Create the first coding question." : "Adjust search or filters."}
            </p>
            {questions.length === 0 && (
              <Button className="mt-4" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                New Question
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Question</th>
                    <th className="px-4 py-3 font-medium">Difficulty</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Test Cases</th>
                    <th className="px-4 py-3 font-medium">Updated</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleQuestions.map((question) => {
                    const metadata = getMetadata(question);
                    return (
                      <tr key={question.id} className="border-b last:border-b-0">
                        <td className="max-w-[420px] px-4 py-3">
                          <p className="font-medium">{question.title}</p>
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {question.problem_statement}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", getDifficultyColor(question.difficulty))}>
                            {question.difficulty}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary">{getCategory(question)}</Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {metadata.test_cases.length} total / {metadata.test_cases.filter((testCase) => testCase.is_hidden).length} hidden
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(question.updated_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={() => openQuestion(question, "view")}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => openQuestion(question, "edit")}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(question)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Showing {visibleQuestions.length} of {filtered.length} questions
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
                  Previous
                </Button>
                <span className="text-xs text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "Create coding question" : mode === "edit" ? "Edit coding question" : "Coding question"}
            </DialogTitle>
            <DialogDescription>
              Problem details, test cases, and starter code are saved through the existing coding question API.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <section className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <Label>Title</Label>
                <Input value={form.title} disabled={readonly} onChange={(event) => updateForm("title", event.target.value)} />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Problem Statement</Label>
                <Textarea
                  value={form.problem_statement}
                  disabled={readonly}
                  rows={5}
                  onChange={(event) => updateForm("problem_statement", event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Difficulty</Label>
                <Select
                  value={form.difficulty}
                  disabled={readonly}
                  onValueChange={(value) => updateForm("difficulty", value as DifficultyLevel)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Input value={form.category} disabled={readonly} onChange={(event) => updateForm("category", event.target.value)} />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Constraints</Label>
                <Textarea value={form.constraints} disabled={readonly} rows={2} onChange={(event) => updateForm("constraints", event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Input Format</Label>
                <Textarea value={form.input_format} disabled={readonly} rows={3} onChange={(event) => updateForm("input_format", event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Output Format</Label>
                <Textarea value={form.output_format} disabled={readonly} rows={3} onChange={(event) => updateForm("output_format", event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Sample Input</Label>
                <Textarea value={form.sample_input} disabled={readonly} rows={3} onChange={(event) => updateForm("sample_input", event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Sample Output</Label>
                <Textarea value={form.sample_output} disabled={readonly} rows={3} onChange={(event) => updateForm("sample_output", event.target.value)} />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Explanation</Label>
                <Textarea value={form.explanation} disabled={readonly} rows={3} onChange={(event) => updateForm("explanation", event.target.value)} />
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">Test Cases</h3>
                  <p className="text-xs text-muted-foreground">Mark cases hidden when they should not be shown publicly.</p>
                </div>
                {!readonly && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => updateForm("test_cases", [...form.test_cases, newTestCase()])}
                  >
                    <Plus className="h-4 w-4" />
                    Add test case
                  </Button>
                )}
              </div>
              {form.test_cases.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No test cases added.
                </div>
              ) : (
                <div className="space-y-3">
                  {form.test_cases.map((testCase, index) => (
                    <div key={testCase.id} className="rounded-lg border p-3">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-medium">Case {index + 1}</p>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Checkbox
                              checked={testCase.is_hidden}
                              disabled={readonly}
                              onCheckedChange={(checked) => updateTestCase(testCase.id, { is_hidden: checked === true })}
                            />
                            Hidden
                          </label>
                          {!readonly && (
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeTestCase(testCase.id)}>
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label>Input</Label>
                          <Textarea
                            value={testCase.input}
                            disabled={readonly}
                            rows={3}
                            onChange={(event) => updateTestCase(testCase.id, { input: event.target.value })}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Expected Output</Label>
                          <Textarea
                            value={testCase.expected_output}
                            disabled={readonly}
                            rows={3}
                            onChange={(event) => updateTestCase(testCase.id, { expected_output: event.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold">Starter Code</h3>
                <p className="text-xs text-muted-foreground">Supported languages: C++, Java, Python, JavaScript.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  ["cpp", "C++"],
                  ["java", "Java"],
                  ["python", "Python"],
                  ["javascript", "JavaScript"],
                ].map(([key, label]) => (
                  <div key={key} className="space-y-1.5">
                    <Label>{label}</Label>
                    <Textarea
                      value={form.starter_code[key as keyof StarterCode]}
                      disabled={readonly}
                      rows={7}
                      className="font-mono text-xs"
                      onChange={(event) =>
                        updateForm("starter_code", {
                          ...form.starter_code,
                          [key]: event.target.value,
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </section>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {readonly ? "Close" : "Cancel"}
            </Button>
            {readonly ? (
              <Button onClick={() => setMode("edit")}>
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            ) : (
              <Button onClick={saveQuestion} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {saving ? "Saving..." : "Save question"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete coding question?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteTarget?.title}". Student submissions linked to this question may also be affected by database constraints.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault();
                deleteQuestion();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
