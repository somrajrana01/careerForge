import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit2, HelpCircle, Plus, Trash2, X } from 'lucide-react';
import { Card } from '../components/Card';
import { Loader } from '../components/Loader';
import {
  createQuestion,
  deleteQuestion,
  getAdminQuestions,
  updateQuestion,
} from '../features/assessment/assessmentService';
import { useApiError } from '../hooks/useApiError';
import type { AssessmentType, Question, QuestionRequest } from '../types';

const emptyQuestion: QuestionRequest = {
  title: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctAnswer: 'A',
  category: 'SKILL',
  difficulty: 'EASY',
};

type CategoryFilter = 'ALL' | AssessmentType;

export function AdminQuestionsPage() {
  const queryClient = useQueryClient();
  const getError = useApiError();
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL');
  const [form, setForm] = useState<QuestionRequest>(emptyQuestion);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['admin-questions', categoryFilter],
    queryFn: () => getAdminQuestions(categoryFilter === 'ALL' ? undefined : categoryFilter),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: QuestionRequest) => (
      editingId ? updateQuestion(editingId, payload) : createQuestion(payload)
    ),
    onSuccess: async () => {
      setForm(emptyQuestion);
      setEditingId(null);
      setError('');
      await queryClient.invalidateQueries({ queryKey: ['admin-questions'] });
    },
    onError: (err) => setError(getError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteQuestion,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-questions'] });
    },
    onError: (err) => setError(getError(err)),
  });

  const startEdit = (question: Question) => {
    setEditingId(question.id);
    setForm({
      title: question.title,
      optionA: question.optionA,
      optionB: question.optionB,
      optionC: question.optionC,
      optionD: question.optionD,
      correctAnswer: question.correctAnswer,
      category: question.category,
      difficulty: question.difficulty,
    });
    setError('');
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyQuestion);
    setError('');
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    saveMutation.mutate(form);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-forge-mint text-forge-teal">
            <HelpCircle size={20} aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-forge-ink">Question Bank</h1>
            <p className="mt-1 text-sm text-neutral-500">{questions.length} questions visible</p>
          </div>
        </div>
        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value as CategoryFilter)}
          className="focus-ring rounded-lg border border-forge-line bg-white px-3 py-2 text-sm"
        >
          <option value="ALL">All Categories</option>
          <option value="SKILL">Skill</option>
          <option value="APTITUDE">Aptitude</option>
        </select>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-2">
          <label className="block text-sm font-medium text-forge-ink lg:col-span-2">
            Title
            <textarea
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              required
              rows={3}
              className="focus-ring mt-2 w-full rounded-lg border border-forge-line px-3 py-2 text-sm"
            />
          </label>
          {(['optionA', 'optionB', 'optionC', 'optionD'] as const).map((field, index) => (
            <label key={field} className="block text-sm font-medium text-forge-ink">
              Option {String.fromCharCode(65 + index)}
              <input
                value={form[field]}
                onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))}
                required
                className="focus-ring mt-2 w-full rounded-lg border border-forge-line px-3 py-2 text-sm"
              />
            </label>
          ))}
          <label className="block text-sm font-medium text-forge-ink">
            Correct Answer
            <select
              value={form.correctAnswer}
              onChange={(event) => setForm((current) => ({ ...current, correctAnswer: event.target.value as QuestionRequest['correctAnswer'] }))}
              className="focus-ring mt-2 w-full rounded-lg border border-forge-line px-3 py-2 text-sm"
            >
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </label>
          <label className="block text-sm font-medium text-forge-ink">
            Category
            <select
              value={form.category}
              onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as AssessmentType }))}
              className="focus-ring mt-2 w-full rounded-lg border border-forge-line px-3 py-2 text-sm"
            >
              <option value="SKILL">Skill</option>
              <option value="APTITUDE">Aptitude</option>
            </select>
          </label>
          <label className="block text-sm font-medium text-forge-ink lg:col-span-2">
            Difficulty
            <input
              value={form.difficulty}
              onChange={(event) => setForm((current) => ({ ...current, difficulty: event.target.value }))}
              required
              className="focus-ring mt-2 w-full rounded-lg border border-forge-line px-3 py-2 text-sm"
            />
          </label>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 lg:col-span-2">{error}</p>}

          <div className="flex flex-col gap-3 sm:flex-row lg:col-span-2">
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-forge-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
            >
              <Plus size={16} aria-hidden="true" />
              {editingId ? 'Update Question' : 'Create Question'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg border border-forge-line bg-white px-4 py-2 text-sm font-semibold text-forge-ink hover:bg-neutral-50"
              >
                <X size={16} aria-hidden="true" />
                Cancel
              </button>
            )}
          </div>
        </form>
      </Card>

      {isLoading ? (
        <Loader label="Loading questions" />
      ) : (
        <div className="grid gap-4">
          {questions.map((question) => (
            <Card key={question.id}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-lg bg-forge-mint px-2.5 py-1 text-xs font-semibold text-forge-teal">
                      {question.category}
                    </span>
                    <span className="rounded-lg bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-600">
                      {question.difficulty}
                    </span>
                    <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      Answer {question.correctAnswer}
                    </span>
                  </div>
                  <h2 className="mt-3 text-base font-semibold text-forge-ink">{question.title}</h2>
                  <div className="mt-3 grid gap-2 text-sm text-neutral-600 sm:grid-cols-2">
                    <p>A. {question.optionA}</p>
                    <p>B. {question.optionB}</p>
                    <p>C. {question.optionC}</p>
                    <p>D. {question.optionD}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    title="Edit question"
                    onClick={() => startEdit(question)}
                    className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-lg border border-forge-line bg-white text-neutral-600 hover:bg-neutral-50"
                  >
                    <Edit2 size={16} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    title="Delete question"
                    onClick={() => deleteMutation.mutate(question.id)}
                    className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-lg border border-red-200 bg-white text-red-700 hover:bg-red-50"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
          {questions.length === 0 && (
            <Card>
              <p className="text-sm text-neutral-500">No questions found</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
