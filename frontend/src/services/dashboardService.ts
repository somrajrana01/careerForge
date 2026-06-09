import { supabase } from './supabase';
import type { AssessmentResult, DashboardResponse, RecentActivity, Role } from '../types';

interface ProfileRow {
  name: string;
  role: Role;
}

interface StudentProfileRow {
  branch: string | null;
  semester: number | null;
  cgpa: number | null;
  github_url: string | null;
  linkedin_url: string | null;
}

interface ResumeRow {
  id: string;
  file_name: string;
  uploaded_at: string;
}

interface AttemptRow {
  id: string;
  assessment_type: 'SKILL' | 'APTITUDE';
  score: number;
  total_questions: number;
  percentage: number;
  attempt_date: string;
}

function toResult(row: AttemptRow): AssessmentResult {
  return {
    attemptId: row.id,
    assessmentType: row.assessment_type,
    score: row.score,
    totalQuestions: row.total_questions,
    percentage: Number(row.percentage),
    attemptDate: row.attempt_date,
  };
}

function profileCompletion(profile: StudentProfileRow | null) {
  if (!profile) {
    return 0;
  }

  const fields = [profile.branch, profile.semester, profile.cgpa, profile.github_url, profile.linkedin_url];
  const completed = fields.filter((value) => value !== null && value !== '').length;
  return Math.round((completed / fields.length) * 100);
}

export async function getStudentDashboard(): Promise<DashboardResponse> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) {
    throw new Error(authError.message);
  }
  if (!authData.user) {
    throw new Error('You must be signed in.');
  }

  const userId = authData.user.id;

  const [profileResult, studentProfileResult, resumesResult, attemptsResult] = await Promise.all([
    supabase.from('profiles').select('name, role').eq('id', userId).single<ProfileRow>(),
    supabase
      .from('student_profiles')
      .select('branch, semester, cgpa, github_url, linkedin_url')
      .eq('user_id', userId)
      .maybeSingle<StudentProfileRow>(),
    supabase
      .from('resumes')
      .select('id, file_name, uploaded_at')
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false })
      .returns<ResumeRow[]>(),
    supabase
      .from('assessment_attempts')
      .select('id, assessment_type, score, total_questions, percentage, attempt_date')
      .eq('user_id', userId)
      .order('attempt_date', { ascending: false })
      .returns<AttemptRow[]>(),
  ]);

  if (profileResult.error) {
    throw new Error(profileResult.error.message);
  }
  if (studentProfileResult.error) {
    throw new Error(studentProfileResult.error.message);
  }
  if (resumesResult.error) {
    throw new Error(resumesResult.error.message);
  }
  if (attemptsResult.error) {
    throw new Error(attemptsResult.error.message);
  }

  const attempts = attemptsResult.data.map(toResult);
  const resumeActivities: RecentActivity[] = resumesResult.data.slice(0, 3).map((resume) => ({
    type: 'RESUME',
    description: `Resume saved: ${resume.file_name}`,
    occurredAt: resume.uploaded_at,
  }));
  const attemptActivities: RecentActivity[] = attempts.slice(0, 3).map((attempt) => ({
    type: 'ASSESSMENT',
    description: `${attempt.assessmentType} assessment completed with ${attempt.score}/${attempt.totalQuestions}`,
    occurredAt: attempt.attemptDate,
  }));

  return {
    name: profileResult.data.name,
    role: profileResult.data.role,
    profileCompletionPercentage: profileCompletion(studentProfileResult.data),
    totalResumes: resumesResult.data.length,
    skillAssessmentScores: attempts.filter((attempt) => attempt.assessmentType === 'SKILL'),
    aptitudeScores: attempts.filter((attempt) => attempt.assessmentType === 'APTITUDE'),
    recentActivity: [...resumeActivities, ...attemptActivities]
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
      .slice(0, 5),
  };
}
