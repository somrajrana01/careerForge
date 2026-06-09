export type Role = 'STUDENT' | 'TRAINER' | 'PLACEMENT_OFFICER' | 'ADMIN';

export type AssessmentType = 'SKILL' | 'APTITUDE';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  user: UserResponse;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  name: string;
  role: Role;
}

export interface StudentProfile {
  id: string;
  userId: string;
  branch: string;
  semester: number;
  cgpa: number;
  githubUrl: string;
  linkedinUrl: string;
}

export interface StudentProfileRequest {
  branch: string;
  semester: number;
  cgpa: number;
  githubUrl: string;
  linkedinUrl: string;
}

export interface ResumeRecord {
  id: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface ResumeRequest {
  fileName: string;
  fileUrl: string;
}

export interface Question {
  id: string;
  title: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  category: AssessmentType;
  difficulty: string;
}

export interface QuestionRequest {
  title: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  category: AssessmentType;
  difficulty: string;
}

export interface AssessmentQuestion {
  id: string;
  title: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  category: AssessmentType;
  difficulty: string;
}

export interface AssessmentStartResponse {
  assessmentType: AssessmentType;
  totalQuestions: number;
  questions: AssessmentQuestion[];
}

export interface AnswerSubmission {
  questionId: string;
  selectedAnswer: 'A' | 'B' | 'C' | 'D';
}

export interface AssessmentSubmitRequest {
  answers: AnswerSubmission[];
}

export interface AssessmentResult {
  attemptId: string;
  assessmentType: AssessmentType;
  score: number;
  totalQuestions: number;
  percentage: number;
  attemptDate: string;
}

export interface RecentActivity {
  type: string;
  description: string;
  occurredAt: string;
}

export interface DashboardResponse {
  name: string;
  role: Role;
  profileCompletionPercentage: number;
  totalResumes: number;
  skillAssessmentScores: AssessmentResult[];
  aptitudeScores: AssessmentResult[];
  recentActivity: RecentActivity[];
}
