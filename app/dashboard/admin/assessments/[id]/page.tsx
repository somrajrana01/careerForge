"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Plus, Edit, Trash2, Loader2, AlertCircle, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { cn, getDifficultyColor } from "@/lib/utils";
import type { Assessment, Question, QuestionOption } from "@/types";

interface AssessmentDetails extends Assessment {
  questions?: Question[];
}

export default function AssessmentDetailsPage() {
  const params = useParams();
  const assessmentId = params.id as string;
  const { toast } = useToast();
  const supabase = createClient();

  const [assessment, setAssessment] = useState<AssessmentDetails | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [saving, setSaving] = useState(false);

  // Question form state
  const [formData, setFormData] = useState({
    question_text: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correct_answer: "A",
    marks: 1,
  });

  useEffect(() => {
    loadAssessment();
  }, [assessmentId]);

  const loadAssessment = async () => {
    try {
      setLoading(true);
      const { data: assessmentData, error: assessmentError } = await supabase
        .from("assessments")
        .select("*")
        .eq("id", assessmentId)
        .single();

      if (assessmentError) throw assessmentError;
      setAssessment(assessmentData);

      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select("*")
        .eq("assessment_id", assessmentId)
        .order("order_index", { ascending: true });

      if (questionsError) throw questionsError;
      setQuestions(questionsData ?? []);
    } catch (err) {
      toast({ title: "Error", description: "Failed to load assessment" });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      question_text: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correct_answer: "A",
      marks: 1,
    });
    setEditingQuestion(null);
  };

  const handleAddQuestion = async () => {
    if (!formData.question_text || !formData.optionA || !formData.optionB || !formData.optionC || !formData.optionD) {
      toast({ title: "Error", description: "Please fill in all fields" });
      return;
    }

    setSaving(true);
    try {
      const options: QuestionOption[] = [
        { id: "A", text: formData.optionA },
        { id: "B", text: formData.optionB },
        { id: "C", text: formData.optionC },
        { id: "D", text: formData.optionD },
      ];

      const { data, error } = await supabase.from("questions").insert({
        assessment_id: assessmentId,
        question_text: formData.question_text,
        question_type: "mcq",
        options,
        correct_answer: formData.correct_answer,
        difficulty: assessment?.difficulty ?? "medium",
        marks: formData.marks,
        order_index: questions.length,
      }).select().single();

      if (error) throw error;

      setQuestions([...questions, data]);
      await supabase.from("assessments").update({ total_questions: questions.length + 1 }).eq("id", assessmentId);
      if (assessment) setAssessment({ ...assessment, total_questions: questions.length + 1 });

      toast({ title: "Success", description: "Question added" });
      resetForm();
      setShowAddQuestion(false);
    } catch (err) {
      toast({ title: "Error", description: "Failed to add question" });
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateQuestion = async () => {
    if (!editingQuestion || !formData.question_text || !formData.optionA || !formData.optionB || !formData.optionC || !formData.optionD) {
      toast({ title: "Error", description: "Please fill in all fields" });
      return;
    }

    setSaving(true);
    try {
      const options: QuestionOption[] = [
        { id: "A", text: formData.optionA },
        { id: "B", text: formData.optionB },
        { id: "C", text: formData.optionC },
        { id: "D", text: formData.optionD },
      ];

      const { error } = await supabase.from("questions").update({
        question_text: formData.question_text,
        options,
        correct_answer: formData.correct_answer,
        marks: formData.marks,
      }).eq("id", editingQuestion.id);

      if (error) throw error;

      setQuestions(questions.map((q) => q.id === editingQuestion.id ? { ...q, question_text: formData.question_text, options, correct_answer: formData.correct_answer, marks: formData.marks } : q));

      toast({ title: "Success", description: "Question updated" });
      resetForm();
      setShowAddQuestion(false);
    } catch (err) {
      toast({ title: "Error", description: "Failed to update question" });
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Delete this question?")) return;

    try {
      const { error } = await supabase.from("questions").delete().eq("id", questionId);
      if (error) throw error;

      const newQuestions = questions.filter((q) => q.id !== questionId);
      setQuestions(newQuestions);
      await supabase.from("assessments").update({ total_questions: newQuestions.length }).eq("id", assessmentId);
      if (assessment) setAssessment({ ...assessment, total_questions: newQuestions.length });

      toast({ title: "Success", description: "Question deleted" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete question" });
      console.error(err);
    }
  };

  const openEditDialog = (question: Question) => {
    setEditingQuestion(question);
    const optionMap: Record<string, string> = {};
    question.options?.forEach((opt: QuestionOption) => {
      optionMap[`option${opt.id}`] = opt.text;
    });

    setFormData({
      question_text: question.question_text,
      optionA: optionMap.optionA ?? "",
      optionB: optionMap.optionB ?? "",
      optionC: optionMap.optionC ?? "",
      optionD: optionMap.optionD ?? "",
      correct_answer: question.correct_answer,
      marks: question.marks,
    });
    setShowAddQuestion(true);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 skeleton" />
        <div className="grid grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-20 skeleton rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="flex items-center gap-3 p-6 rounded-lg bg-red-500/10 border border-red-500/20">
        <AlertCircle className="h-5 w-5 text-red-500" />
        <p className="text-red-600">Assessment not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/admin/assessments">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Assessments
          </Button>
        </Link>
      </div>

      {/* Assessment Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>{assessment.title}</CardTitle>
          <CardDescription>{assessment.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Type</p>
              <p className="font-semibold text-sm capitalize">{assessment.type}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Difficulty</p>
              <p className={cn("font-semibold text-sm capitalize", getDifficultyColor(assessment.difficulty))}>{assessment.difficulty}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="font-semibold text-sm">{assessment.duration_minutes} min</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pass Score</p>
              <p className="font-semibold text-sm">{assessment.passing_score}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Questions</p>
              <p className="font-semibold text-sm">{questions.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Questions</CardTitle>
            <CardDescription>{questions.length} question{questions.length !== 1 ? "s" : ""}</CardDescription>
          </div>
          <Button onClick={() => { resetForm(); setShowAddQuestion(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> Add Question
          </Button>
        </CardHeader>
        <CardContent>
          {questions.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              No questions yet. Add one to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((question, idx) => (
                <div key={question.id} className="flex items-start justify-between gap-4 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <p className="text-sm font-medium"><span className="text-muted-foreground mr-2">Q{idx + 1}.</span>{question.question_text}</p>
                    <div className="mt-2 flex gap-2">
                      <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
                        Correct: <Check className="h-3 w-3 inline ml-1" /> {question.correct_answer}
                      </span>
                      <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
                        Marks: {question.marks}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(question)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteQuestion(question.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Question Dialog */}
      <Dialog open={showAddQuestion} onOpenChange={setShowAddQuestion}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingQuestion ? "Edit Question" : "Add Question"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Question Text */}
            <div>
              <Label>Question Text</Label>
              <Input
                placeholder="Enter question"
                value={formData.question_text}
                onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
              />
            </div>

            {/* Options */}
            <div className="space-y-3">
              <Label>Options</Label>
              {["optionA", "optionB", "optionC", "optionD"].map((option) => (
                <div key={option} className="flex gap-2 items-center">
                  <span className="w-8 font-semibold text-sm">{option[option.length - 1]}.</span>
                  <Input
                    placeholder={`Option ${option[option.length - 1]}`}
                    value={formData[option as keyof typeof formData] as string}
                    onChange={(e) => setFormData({ ...formData, [option]: e.target.value })}
                  />
                </div>
              ))}
            </div>

            {/* Correct Answer */}
            <div>
              <Label>Correct Answer</Label>
              <Select value={formData.correct_answer} onValueChange={(value) => setFormData({ ...formData, correct_answer: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                  <SelectItem value="D">D</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Marks */}
            <div>
              <Label>Marks</Label>
              <Input
                type="number"
                min="1"
                value={formData.marks}
                onChange={(e) => setFormData({ ...formData, marks: parseInt(e.target.value) || 1 })}
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-4">
              <Button variant="secondary" onClick={() => setShowAddQuestion(false)} disabled={saving}>
                Cancel
              </Button>
              <Button
                onClick={() => editingQuestion ? handleUpdateQuestion() : handleAddQuestion()}
                disabled={saving}
                className="gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingQuestion ? "Update Question" : "Add Question"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
