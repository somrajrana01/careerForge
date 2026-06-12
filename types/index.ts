// =====================================================
// IRAN - Internship Readiness Analyzer
// Core Type Definitions
// =====================================================

export type UserRole = "student" | "trainer" | "placement_officer" | "admin";
export type ReadinessCategory =
  | "not_ready"
  | "needs_improvement"
  | "internship_ready"
  | "highly_ready";
export type AssessmentType = "skill" | "aptitude" | "coding";
export type DifficultyLevel = "easy" | "medium" | "hard";
export type SubmissionStatus = "pending" | "evaluated" | "failed";
export type NotificationType = "info" | "success" | "warning" | "error";
export type AptitudeSection = "quantitative" | "logical" | "verbal";
export type PlacementDriveStatus = "draft" | "open" | "closed" | "completed" | "cancelled";
export type ApplicationStatus =
  | "saved"
  | "applied"
  | "shortlisted"
  | "interviewing"
  | "selected"
  | "rejected"
  | "withdrawn";
export type TrainingSessionStatus = "scheduled" | "completed" | "cancelled";

// =====================================================
// DATABASE MODELS
// =====================================================

export interface User {
  id: string;
  auth_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  is_active: boolean;
  email_verified: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface StudentProfile {
  id: string;
  user_id: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  institution?: string;
  degree?: string;
  branch?: string;
  year_of_study?: number;
  graduation_year?: number;
  cgpa?: number;
  skills: string[];
  languages: string[];
  target_role?: string;
  target_companies: string[];
  github_url?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  bio?: string;
  profile_completion: number;
  created_at: string;
  updated_at: string;
}

export interface Certification {
  id: string;
  user_id: string;
  name: string;
  issuer: string;
  issue_date?: string;
  expiry_date?: string;
  credential_id?: string;
  credential_url?: string;
  skills: string[];
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  tech_stack: string[];
  github_url?: string;
  live_url?: string;
  start_date?: string;
  end_date?: string;
  is_ongoing: boolean;
  highlights: string[];
  complexity_score: number;
  created_at: string;
  updated_at: string;
}

export interface Resume {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type: string;
  is_active: boolean;
  created_at: string;
}

export interface ResumeReport {
  id: string;
  resume_id: string;
  user_id: string;
  ats_score: number;
  quality_score: number;
  extracted_text?: string;
  missing_keywords: string[];
  missing_sections: string[];
  grammar_issues: string[];
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  skills_found: string[];
  skills_missing: string[];
  project_quality_analysis: ProjectQualityAnalysis;
  full_analysis: FullResumeAnalysis;
  ai_model: string;
  processing_time_ms?: number;
  created_at: string;
}

export interface ProjectQualityAnalysis {
  total_projects: number;
  has_github_links: boolean;
  has_live_links: boolean;
  uses_modern_tech: boolean;
  quality_score: number;
  feedback: string[];
}

export interface FullResumeAnalysis {
  contact_info_complete: boolean;
  education_complete: boolean;
  experience_mentioned: boolean;
  skills_section_present: boolean;
  certifications_present: boolean;
  achievements_present: boolean;
  action_verbs_used: boolean;
  quantified_achievements: boolean;
  overall_format: string;
  word_count: number;
}

export interface Assessment {
  id: string;
  created_by: string;
  title: string;
  description?: string;
  type: AssessmentType;
  category?: string;
  difficulty: DifficultyLevel;
  duration_minutes: number;
  total_questions: number;
  passing_score: number;
  is_active: boolean;
  is_timed: boolean;
  randomize_questions: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  assessment_id: string;
  question_text: string;
  question_type: string;
  options: QuestionOption[];
  correct_answer: string;
  explanation?: string;
  difficulty: DifficultyLevel;
  marks: number;
  section?: AptitudeSection;
  tags: string[];
  order_index: number;
  created_at: string;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Attempt {
  id: string;
  user_id: string;
  assessment_id: string;
  answers: Record<string, string>;
  score: number;
  percentage: number;
  total_questions: number;
  correct_answers: number;
  time_taken_seconds?: number;
  started_at: string;
  completed_at?: string;
  status: string;
  section_scores: Record<string, number>;
  feedback?: string;
  created_at: string;
}

export interface CodingQuestion {
  id: string;
  created_by: string;
  title: string;
  problem_statement: string;
  difficulty: DifficultyLevel;
  tags: string[];
  constraints?: string;
  input_format?: string;
  output_format?: string;
  sample_input?: string;
  sample_output?: string;
  explanation?: string;
  hints: string[];
  time_limit_ms: number;
  memory_limit_mb: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CodingSubmission {
  id: string;
  user_id: string;
  question_id: string;
  code: string;
  language: string;
  status: SubmissionStatus;
  score: number;
  test_cases_passed: number;
  test_cases_total: number;
  completion_percentage: number;
  execution_time_ms?: number;
  memory_used_mb?: number;
  feedback?: string;
  error_message?: string;
  submitted_at: string;
}

export interface ReadinessScore {
  id: string;
  user_id: string;
  overall_score: number;
  category: ReadinessCategory;
  profile_score: number;
  resume_score: number;
  coding_score: number;
  aptitude_score: number;
  projects_score: number;
  certifications_score: number;
  profile_weight: number;
  resume_weight: number;
  coding_weight: number;
  aptitude_weight: number;
  projects_weight: number;
  certifications_weight: number;
  explanation?: string;
  improvement_areas: string[];
  calculated_at: string;
  updated_at: string;
}

export interface Recommendation {
  id: string;
  user_id: string;
  type: string;
  title: string;
  content: RecommendationContent;
  ai_model: string;
  is_read: boolean;
  generated_at: string;
  expires_at?: string;
}

export interface RecommendationContent {
  summary?: string;
  skill_gaps?: SkillGap[];
  estimated_learning_time?: string;
  roadmap?: Roadmap;
  interview_plan?: InterviewPlan;
  dsa_plan?: DSAPlan;
  resume_plan?: ResumePlan;
}

export interface SkillGap {
  skill: string;
  current_level: string;
  required_level: string;
  importance: "critical" | "high" | "medium" | "low";
  resources: string[];
}

export interface Roadmap {
  target_role: string;
  overall_duration: string;
  plan_30_days: RoadmapPhase;
  plan_60_days: RoadmapPhase;
  plan_90_days: RoadmapPhase;
}

export interface RoadmapPhase {
  goals: string[];
  tasks: string[];
  milestones: string[];
  resources: string[];
}

export interface InterviewPlan {
  technical_topics: string[];
  behavioral_topics: string[];
  mock_interview_schedule: string[];
  company_specific_tips: string[];
  resources: string[];
}

export interface DSAPlan {
  weak_areas: string[];
  daily_problems: number;
  topics_to_cover: string[];
  platforms: string[];
  milestones: string[];
}

export interface ResumePlan {
  priority_changes: string[];
  sections_to_add: string[];
  keywords_to_add: string[];
  formatting_tips: string[];
}

export interface Internship {
  id: string;
  company_name: string;
  company_logo?: string;
  title: string;
  description?: string;
  required_skills: string[];
  preferred_skills: string[];
  location?: string;
  is_remote: boolean;
  duration_months?: number;
  stipend_min?: number;
  stipend_max?: number;
  openings: number;
  application_deadline?: string;
  start_date?: string;
  category?: string;
  min_cgpa?: number;
  eligible_branches: string[];
  eligible_years: number[];
  apply_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InternshipMatch {
  id: string;
  user_id: string;
  internship_id: string;
  match_percentage: number;
  matching_skills: string[];
  missing_skills: string[];
  recommendations: string[];
  calculated_at: string;
  internship?: Internship;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface PlacementDrive {
  id: string;
  created_by?: string;
  company_name: string;
  title: string;
  description?: string;
  location?: string;
  start_date?: string;
  application_deadline?: string;
  eligible_branches?: string[];
  eligible_years?: number[];
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlacementApplication {
  id: string;
  drive_id?: string;
  internship_id?: string;
  user_id: string;
  status: ApplicationStatus;
  resume_id?: string;
  notes?: string;
  applied_at: string;
  updated_at: string;
  drive?: PlacementDrive;
  internship?: Internship;
  user?: User;
}

export interface TrainingBatch {
  id: string;
  trainer_id: string;
  name: string;
  description?: string;
  cohort?: string;
  starts_on?: string;
  ends_on?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TrainingBatchStudent {
  id: string;
  batch_id: string;
  user_id: string;
  enrolled_at: string;
  batch?: TrainingBatch;
  user?: User;
}

export interface TrainingSession {
  id: string;
  batch_id?: string;
  trainer_id: string;
  title: string;
  description?: string;
  starts_at?: string;
  duration_minutes: number;
  status: TrainingSessionStatus;
  attendance: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PlacementPipelineAnalytics {
  source_id: string;
  company_name: string;
  title: string;
  applications: number;
  shortlisted: number;
  interviewing: number;
  selected: number;
  rejected: number;
}

export interface TrainerBatchAnalytics {
  batch_id: string;
  trainer_id: string;
  name: string;
  students_count: number;
  sessions_count: number;
  completed_sessions: number;
}

// =====================================================
// API RESPONSE TYPES
// =====================================================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// =====================================================
// DASHBOARD TYPES
// =====================================================

export interface StudentDashboardData {
  user: User;
  profile: StudentProfile | null;
  readiness: ReadinessScore | null;
  recent_attempts: Attempt[];
  recent_submissions: CodingSubmission[];
  recommendations: Recommendation[];
  top_matches: InternshipMatch[];
  notifications: Notification[];
}

export interface TrainerDashboardData {
  total_students: number;
  active_assessments: number;
  avg_readiness_score: number;
  students: User[];
  recent_activity: AuditLog[];
}

export interface PlacementDashboardData {
  total_students: number;
  ready_students: number;
  department_analytics: DepartmentAnalytics[];
  readiness_distribution: ReadinessDistribution[];
}

export interface DepartmentAnalytics {
  branch: string;
  total: number;
  ready: number;
  avg_score: number;
}

export interface ReadinessDistribution {
  category: ReadinessCategory;
  count: number;
  percentage: number;
}

// =====================================================
// FORM TYPES
// =====================================================

export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirm_password: string;
  full_name: string;
  role: UserRole;
}

export interface ProfileForm {
  full_name: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  institution?: string;
  degree?: string;
  branch?: string;
  year_of_study?: number;
  graduation_year?: number;
  cgpa?: number;
  skills: string[];
  target_role?: string;
  github_url?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  bio?: string;
}
