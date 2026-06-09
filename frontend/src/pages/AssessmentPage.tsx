import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ClipboardCheck, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { startAssessment, submitAssessment } from '../features/assessment/assessmentService';
import { useApiError } from '../hooks/useApiError';
import type { AnswerSubmission, AssessmentQuestion, AssessmentType } from '../types';

const assessmentTypes: AssessmentType[] = ['SKILL', 'APTITUDE'];
const answerKeys: AnswerSubmission['selectedAnswer'][] = ['A', 'B', 'C', 'D'];

function optionText(question: AssessmentQuestion, answer: AnswerSubmission['selectedAnswer']) {
  return {
    A: question.optionA,
    B: question.optionB,
    C: question.optionC,
    D: question.optionD,
  }[answer];
}

export function AssessmentPage() {
  const navigate = useNavigate();
  const getError = useApiError();
  const [selectedType, setSelectedType] = useState<AssessmentType>('SKILL');
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, AnswerSubmission['selectedAnswer']>>({});
  const [error, setError] = useState('');

  const startMutation = useMutation({
    mutationFn: startAssessment,
    onSuccess: (data) => {
      setQuestions(data.questions);
      setAnswers({});
      setError('');
    },
    onError: (err) => setError(getError(err)),
  });

  const submitMutation = useMutation({
    mutationFn: () => submitAssessment(selectedType, {
      answers: questions.map((question) => ({
        questionId: question.id,
        selectedAnswer: answers[question.id],
      })),
    }),
    onSuccess: (result) => {
      navigate(`/results/${result.attemptId}`, { state: { result } });
    },
    onError: (err) => setError(getError(err)),
  });

  const canSubmit = questions.length > 0 && questions.every((question) => answers[question.id]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-forge-mint text-forge-teal">
            <ClipboardCheck size={20} aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-forge-ink">Assessment</h1>
            <p className="mt-1 text-sm text-neutral-500">{selectedType} question set</p>
          </div>
        </div>
        <div className="inline-flex rounded-lg border border-forge-line bg-white p-1">
          {assessmentTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setSelectedType(type);
                setQuestions([]);
                setAnswers({});
                setError('');
              }}
              className={`focus-ring rounded-lg px-4 py-2 text-sm font-semibold ${
                selectedType === type ? 'bg-forge-mint text-forge-teal' : 'text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold text-forge-ink">{selectedType} Assessment</h2>
            <p className="mt-1 text-sm text-neutral-500">{questions.length} questions loaded</p>
          </div>
          <button
            type="button"
            onClick={() => startMutation.mutate(selectedType)}
            disabled={startMutation.isPending}
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-forge-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
          >
            <ClipboardCheck size={16} aria-hidden="true" />
            {startMutation.isPending ? 'Starting' : 'Start'}
          </button>
        </div>
        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </Card>

      {questions.length > 0 && (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            submitMutation.mutate();
          }}
        >
          {questions.map((question, index) => (
            <Card key={question.id}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <h2 className="text-base font-semibold text-forge-ink">
                  {index + 1}. {question.title}
                </h2>
                <span className="w-fit rounded-lg bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-600">
                  {question.difficulty}
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {answerKeys.map((answer) => (
                  <label
                    key={answer}
                    className={`flex cursor-pointer gap-3 rounded-lg border px-3 py-3 text-sm ${
                      answers[question.id] === answer
                        ? 'border-forge-teal bg-forge-mint text-forge-ink'
                        : 'border-forge-line bg-white text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={answer}
                      checked={answers[question.id] === answer}
                      onChange={() => setAnswers((current) => ({ ...current, [question.id]: answer }))}
                      className="mt-1"
                    />
                    <span>
                      <span className="font-semibold">{answer}.</span> {optionText(question, answer)}
                    </span>
                  </label>
                ))}
              </div>
            </Card>
          ))}

          <button
            type="submit"
            disabled={!canSubmit || submitMutation.isPending}
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-forge-teal px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send size={16} aria-hidden="true" />
            {submitMutation.isPending ? 'Submitting' : 'Submit Assessment'}
          </button>
        </form>
      )}
    </div>
  );
}
