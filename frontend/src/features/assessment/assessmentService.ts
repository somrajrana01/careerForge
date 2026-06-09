import { supabase } from '../../services/supabase';
import type {
  AssessmentQuestion,
  AssessmentResult,
  AssessmentStartResponse,
  AssessmentSubmitRequest,
  AssessmentType,
  Question,
  QuestionRequest,
} from '../../types';

interface QuestionRow {
  id: string;
  title: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  category: AssessmentType;
  difficulty: string;
}

interface AssessmentAttemptRow {
  id: string;
  assessment_type: AssessmentType;
  score: number;
  total_questions: number;
  percentage: number;
  attempt_date: string;
}

function toQuestion(row: QuestionRow): Question {
  return {
    id: row.id,
    title: row.title,
    optionA: row.option_a,
    optionB: row.option_b,
    optionC: row.option_c,
    optionD: row.option_d,
    correctAnswer: row.correct_answer,
    category: row.category,
    difficulty: row.difficulty,
  };
}

function toAssessmentQuestion(row: QuestionRow): AssessmentQuestion {
  return {
    id: row.id,
    title: row.title,
    optionA: row.option_a,
    optionB: row.option_b,
    optionC: row.option_c,
    optionD: row.option_d,
    category: row.category,
    difficulty: row.difficulty,
  };
}

function toResult(row: AssessmentAttemptRow): AssessmentResult {
  return {
    attemptId: row.id,
    assessmentType: row.assessment_type,
    score: row.score,
    totalQuestions: row.total_questions,
    percentage: Number(row.percentage),
    attemptDate: row.attempt_date,
  };
}

function toQuestionPayload(payload: QuestionRequest) {
  return {
    title: payload.title,
    option_a: payload.optionA,
    option_b: payload.optionB,
    option_c: payload.optionC,
    option_d: payload.optionD,
    correct_answer: payload.correctAnswer,
    category: payload.category,
    difficulty: payload.difficulty,
  };
}

async function currentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw new Error(error.message);
  }
  if (!data.user) {
    throw new Error('You must be signed in.');
  }
  return data.user.id;
}

export async function startAssessment(type: AssessmentType): Promise<AssessmentStartResponse> {
  const { data, error } = await supabase
    .from('questions')
    .select('id, title, option_a, option_b, option_c, option_d, correct_answer, category, difficulty')
    .eq('category', type)
    .limit(10)
    .returns<QuestionRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  const questions = data.map(toAssessmentQuestion);
  return {
    assessmentType: type,
    totalQuestions: questions.length,
    questions,
  };
}

export async function submitAssessment(type: AssessmentType, payload: AssessmentSubmitRequest) {
  const userId = await currentUserId();
  const questionIds = payload.answers.map((answer) => answer.questionId);

  const { data: questions, error } = await supabase
    .from('questions')
    .select('id, title, option_a, option_b, option_c, option_d, correct_answer, category, difficulty')
    .in('id', questionIds)
    .eq('category', type)
    .returns<QuestionRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  const correctAnswers = new Map(questions.map((question) => [question.id, question.correct_answer]));
  const score = payload.answers.reduce((total, answer) => (
    correctAnswers.get(answer.questionId) === answer.selectedAnswer ? total + 1 : total
  ), 0);
  const totalQuestions = payload.answers.length;
  const percentage = totalQuestions ? Math.round((score / totalQuestions) * 100) : 0;

  const { data, error: insertError } = await supabase
    .from('assessment_attempts')
    .insert({
      user_id: userId,
      assessment_type: type,
      score,
      total_questions: totalQuestions,
      percentage,
    })
    .select('id, assessment_type, score, total_questions, percentage, attempt_date')
    .single<AssessmentAttemptRow>();

  if (insertError) {
    throw new Error(insertError.message);
  }

  return toResult(data);
}

export async function getAssessmentResults() {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from('assessment_attempts')
    .select('id, assessment_type, score, total_questions, percentage, attempt_date')
    .eq('user_id', userId)
    .order('attempt_date', { ascending: false })
    .returns<AssessmentAttemptRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return data.map(toResult);
}

export async function getAssessmentResult(id: string) {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from('assessment_attempts')
    .select('id, assessment_type, score, total_questions, percentage, attempt_date')
    .eq('id', id)
    .eq('user_id', userId)
    .single<AssessmentAttemptRow>();

  if (error) {
    throw new Error(error.message);
  }

  return toResult(data);
}

export async function getAdminQuestions(category?: AssessmentType) {
  let query = supabase
    .from('questions')
    .select('id, title, option_a, option_b, option_c, option_d, correct_answer, category, difficulty')
    .order('category')
    .order('difficulty');

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query.returns<QuestionRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return data.map(toQuestion);
}

export async function createQuestion(payload: QuestionRequest) {
  const { data, error } = await supabase
    .from('questions')
    .insert(toQuestionPayload(payload))
    .select('id, title, option_a, option_b, option_c, option_d, correct_answer, category, difficulty')
    .single<QuestionRow>();

  if (error) {
    throw new Error(error.message);
  }

  return toQuestion(data);
}

export async function updateQuestion(id: string, payload: QuestionRequest) {
  const { data, error } = await supabase
    .from('questions')
    .update(toQuestionPayload(payload))
    .eq('id', id)
    .select('id, title, option_a, option_b, option_c, option_d, correct_answer, category, difficulty')
    .single<QuestionRow>();

  if (error) {
    throw new Error(error.message);
  }

  return toQuestion(data);
}

export async function deleteQuestion(id: string) {
  const { error } = await supabase.from('questions').delete().eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
}
