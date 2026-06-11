-- =====================================================
-- IRAN - Internship Readiness Analyzer
-- Complete Database Schema
-- Migration: 001_initial_schema.sql
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE user_role AS ENUM ('student', 'trainer', 'placement_officer', 'admin');
CREATE TYPE readiness_category AS ENUM ('not_ready', 'needs_improvement', 'internship_ready', 'highly_ready');
CREATE TYPE assessment_type AS ENUM ('skill', 'aptitude', 'coding');
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE submission_status AS ENUM ('pending', 'evaluated', 'failed');
CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'error');
CREATE TYPE aptitude_section AS ENUM ('quantitative', 'logical', 'verbal');

-- =====================================================
-- USERS TABLE
-- =====================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STUDENT PROFILES TABLE
-- =====================================================

CREATE TABLE student_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  institution TEXT,
  degree TEXT,
  branch TEXT,
  year_of_study INTEGER CHECK (year_of_study BETWEEN 1 AND 6),
  graduation_year INTEGER,
  cgpa DECIMAL(3,2) CHECK (cgpa BETWEEN 0 AND 10),
  skills TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  target_role TEXT,
  target_companies TEXT[] DEFAULT '{}',
  github_url TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  bio TEXT,
  profile_completion INTEGER DEFAULT 0 CHECK (profile_completion BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CERTIFICATIONS TABLE
-- =====================================================

CREATE TABLE certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  issuer TEXT NOT NULL,
  issue_date DATE,
  expiry_date DATE,
  credential_id TEXT,
  credential_url TEXT,
  skills TEXT[] DEFAULT '{}',
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PROJECTS TABLE
-- =====================================================

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  tech_stack TEXT[] DEFAULT '{}',
  github_url TEXT,
  live_url TEXT,
  start_date DATE,
  end_date DATE,
  is_ongoing BOOLEAN DEFAULT false,
  highlights TEXT[] DEFAULT '{}',
  complexity_score INTEGER DEFAULT 0 CHECK (complexity_score BETWEEN 0 AND 10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- RESUMES TABLE
-- =====================================================

CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT DEFAULT 'application/pdf',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- RESUME REPORTS TABLE
-- =====================================================

CREATE TABLE resume_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ats_score INTEGER CHECK (ats_score BETWEEN 0 AND 100),
  quality_score INTEGER CHECK (quality_score BETWEEN 0 AND 100),
  extracted_text TEXT,
  missing_keywords TEXT[] DEFAULT '{}',
  missing_sections TEXT[] DEFAULT '{}',
  grammar_issues TEXT[] DEFAULT '{}',
  strengths TEXT[] DEFAULT '{}',
  weaknesses TEXT[] DEFAULT '{}',
  suggestions TEXT[] DEFAULT '{}',
  skills_found TEXT[] DEFAULT '{}',
  skills_missing TEXT[] DEFAULT '{}',
  project_quality_analysis JSONB DEFAULT '{}',
  full_analysis JSONB DEFAULT '{}',
  ai_model TEXT DEFAULT 'llama-3.3-70b-versatile',
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ASSESSMENTS TABLE
-- =====================================================

CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  type assessment_type NOT NULL DEFAULT 'skill',
  category TEXT,
  difficulty difficulty_level DEFAULT 'medium',
  duration_minutes INTEGER DEFAULT 30,
  total_questions INTEGER DEFAULT 0,
  passing_score INTEGER DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  is_timed BOOLEAN DEFAULT true,
  randomize_questions BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- QUESTIONS TABLE
-- =====================================================

CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'mcq',
  options JSONB DEFAULT '[]',
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  difficulty difficulty_level DEFAULT 'medium',
  marks INTEGER DEFAULT 1,
  section aptitude_section,
  tags TEXT[] DEFAULT '{}',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ATTEMPTS TABLE (skill/aptitude assessments)
-- =====================================================

CREATE TABLE attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  answers JSONB DEFAULT '{}',
  score INTEGER DEFAULT 0,
  percentage DECIMAL(5,2) DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  time_taken_seconds INTEGER,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'in_progress',
  section_scores JSONB DEFAULT '{}',
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CODING QUESTIONS TABLE
-- =====================================================

CREATE TABLE coding_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  problem_statement TEXT NOT NULL,
  difficulty difficulty_level DEFAULT 'medium',
  tags TEXT[] DEFAULT '{}',
  constraints TEXT,
  input_format TEXT,
  output_format TEXT,
  sample_input TEXT,
  sample_output TEXT,
  explanation TEXT,
  hints TEXT[] DEFAULT '{}',
  time_limit_ms INTEGER DEFAULT 2000,
  memory_limit_mb INTEGER DEFAULT 256,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CODING SUBMISSIONS TABLE
-- =====================================================

CREATE TABLE coding_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES coding_questions(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  language TEXT NOT NULL,
  status submission_status DEFAULT 'pending',
  score INTEGER DEFAULT 0,
  test_cases_passed INTEGER DEFAULT 0,
  test_cases_total INTEGER DEFAULT 0,
  completion_percentage DECIMAL(5,2) DEFAULT 0,
  execution_time_ms INTEGER,
  memory_used_mb DECIMAL(8,2),
  feedback TEXT,
  error_message TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- READINESS SCORES TABLE
-- =====================================================

CREATE TABLE readiness_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  overall_score DECIMAL(5,2) DEFAULT 0,
  category readiness_category DEFAULT 'not_ready',
  profile_score DECIMAL(5,2) DEFAULT 0,
  resume_score DECIMAL(5,2) DEFAULT 0,
  coding_score DECIMAL(5,2) DEFAULT 0,
  aptitude_score DECIMAL(5,2) DEFAULT 0,
  projects_score DECIMAL(5,2) DEFAULT 0,
  certifications_score DECIMAL(5,2) DEFAULT 0,
  profile_weight DECIMAL(3,2) DEFAULT 0.15,
  resume_weight DECIMAL(3,2) DEFAULT 0.25,
  coding_weight DECIMAL(3,2) DEFAULT 0.25,
  aptitude_weight DECIMAL(3,2) DEFAULT 0.15,
  projects_weight DECIMAL(3,2) DEFAULT 0.10,
  certifications_weight DECIMAL(3,2) DEFAULT 0.10,
  explanation TEXT,
  improvement_areas TEXT[] DEFAULT '{}',
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- RECOMMENDATIONS TABLE
-- =====================================================

CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  ai_model TEXT DEFAULT 'llama-3.3-70b-versatile',
  is_read BOOLEAN DEFAULT false,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- =====================================================
-- INTERNSHIPS TABLE
-- =====================================================

CREATE TABLE internships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  company_logo TEXT,
  title TEXT NOT NULL,
  description TEXT,
  required_skills TEXT[] DEFAULT '{}',
  preferred_skills TEXT[] DEFAULT '{}',
  location TEXT,
  is_remote BOOLEAN DEFAULT false,
  duration_months INTEGER,
  stipend_min INTEGER,
  stipend_max INTEGER,
  openings INTEGER DEFAULT 1,
  application_deadline DATE,
  start_date DATE,
  category TEXT,
  min_cgpa DECIMAL(3,2),
  eligible_branches TEXT[] DEFAULT '{}',
  eligible_years INTEGER[] DEFAULT '{}',
  apply_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INTERNSHIP MATCHES TABLE
-- =====================================================

CREATE TABLE internship_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  internship_id UUID NOT NULL REFERENCES internships(id) ON DELETE CASCADE,
  match_percentage DECIMAL(5,2) DEFAULT 0,
  matching_skills TEXT[] DEFAULT '{}',
  missing_skills TEXT[] DEFAULT '{}',
  recommendations TEXT[] DEFAULT '{}',
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, internship_id)
);

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type notification_type DEFAULT 'info',
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- AUDIT LOGS TABLE
-- =====================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ANALYTICS EVENTS TABLE
-- =====================================================

CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  session_id TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_student_profiles_user_id ON student_profiles(user_id);
CREATE INDEX idx_certifications_user_id ON certifications(user_id);
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_resumes_user_id ON resumes(user_id);
CREATE INDEX idx_resume_reports_user_id ON resume_reports(user_id);
CREATE INDEX idx_resume_reports_resume_id ON resume_reports(resume_id);
CREATE INDEX idx_assessments_type ON assessments(type);
CREATE INDEX idx_assessments_created_by ON assessments(created_by);
CREATE INDEX idx_questions_assessment_id ON questions(assessment_id);
CREATE INDEX idx_attempts_user_id ON attempts(user_id);
CREATE INDEX idx_attempts_assessment_id ON attempts(assessment_id);
CREATE INDEX idx_coding_submissions_user_id ON coding_submissions(user_id);
CREATE INDEX idx_coding_submissions_question_id ON coding_submissions(question_id);
CREATE INDEX idx_readiness_scores_user_id ON readiness_scores(user_id);
CREATE INDEX idx_recommendations_user_id ON recommendations(user_id);
CREATE INDEX idx_internship_matches_user_id ON internship_matches(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE coding_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coding_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE readiness_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE internship_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;

-- Users can see their own profile
CREATE POLICY "users_own_profile" ON users
  FOR ALL USING (auth.uid()::text = auth_id::text);

-- Admins/trainers/placement can see all users
CREATE POLICY "staff_see_all_users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.auth_id = auth.uid() 
      AND u.role IN ('admin', 'trainer', 'placement_officer')
    )
  );

-- Student profiles: own profile + staff access
CREATE POLICY "student_own_profile" ON student_profiles
  FOR ALL USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "staff_see_student_profiles" ON student_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.auth_id = auth.uid() 
      AND u.role IN ('admin', 'trainer', 'placement_officer')
    )
  );

-- Certifications: own data + staff read
CREATE POLICY "own_certifications" ON certifications
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "staff_read_certifications" ON certifications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role IN ('admin', 'trainer', 'placement_officer'))
  );

-- Projects: own data + staff read
CREATE POLICY "own_projects" ON projects
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "staff_read_projects" ON projects
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role IN ('admin', 'trainer', 'placement_officer'))
  );

-- Resumes: own resumes
CREATE POLICY "own_resumes" ON resumes
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Resume reports: own + staff
CREATE POLICY "own_resume_reports" ON resume_reports
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Assessments: staff create, everyone reads active
CREATE POLICY "active_assessments_readable" ON assessments
  FOR SELECT USING (is_active = true);

CREATE POLICY "staff_manage_assessments" ON assessments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role IN ('admin', 'trainer'))
  );

-- Questions: readable if assessment is active
CREATE POLICY "questions_readable" ON questions
  FOR SELECT USING (
    assessment_id IN (SELECT id FROM assessments WHERE is_active = true)
  );

CREATE POLICY "staff_manage_questions" ON questions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role IN ('admin', 'trainer'))
  );

-- Attempts: own attempts
CREATE POLICY "own_attempts" ON attempts
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "staff_read_attempts" ON attempts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role IN ('admin', 'trainer', 'placement_officer'))
  );

-- Coding questions: everyone reads active
CREATE POLICY "active_coding_questions_readable" ON coding_questions
  FOR SELECT USING (is_active = true);

CREATE POLICY "staff_manage_coding_questions" ON coding_questions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role IN ('admin', 'trainer'))
  );

-- Coding submissions: own
CREATE POLICY "own_coding_submissions" ON coding_submissions
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Readiness scores: own + staff read
CREATE POLICY "own_readiness_scores" ON readiness_scores
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "staff_read_readiness" ON readiness_scores
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role IN ('admin', 'trainer', 'placement_officer'))
  );

-- Recommendations: own
CREATE POLICY "own_recommendations" ON recommendations
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Internships: everyone reads
CREATE POLICY "internships_readable" ON internships FOR SELECT USING (is_active = true);
CREATE POLICY "staff_manage_internships" ON internships
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role IN ('admin', 'placement_officer'))
  );

-- Internship matches: own + staff
CREATE POLICY "own_internship_matches" ON internship_matches
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Notifications: own
CREATE POLICY "own_notifications" ON notifications
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Audit logs: staff read
CREATE POLICY "staff_read_audit" ON audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role = 'admin')
  );

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_profiles_updated_at BEFORE UPDATE ON student_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certifications_updated_at BEFORE UPDATE ON certifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_internships_updated_at BEFORE UPDATE ON internships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate profile completion
CREATE OR REPLACE FUNCTION calculate_profile_completion(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  completion INTEGER := 0;
  profile student_profiles%ROWTYPE;
  cert_count INTEGER;
  proj_count INTEGER;
  resume_count INTEGER;
BEGIN
  SELECT * INTO profile FROM student_profiles WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN RETURN 0; END IF;
  
  -- Basic info (30 points)
  IF profile.phone IS NOT NULL THEN completion := completion + 5; END IF;
  IF profile.institution IS NOT NULL THEN completion := completion + 5; END IF;
  IF profile.degree IS NOT NULL THEN completion := completion + 5; END IF;
  IF profile.cgpa IS NOT NULL THEN completion := completion + 5; END IF;
  IF profile.graduation_year IS NOT NULL THEN completion := completion + 5; END IF;
  IF profile.bio IS NOT NULL AND length(profile.bio) > 50 THEN completion := completion + 5; END IF;
  
  -- Skills (20 points)
  IF array_length(profile.skills, 1) >= 3 THEN completion := completion + 10; END IF;
  IF array_length(profile.skills, 1) >= 7 THEN completion := completion + 10; END IF;
  
  -- Target (10 points)
  IF profile.target_role IS NOT NULL THEN completion := completion + 5; END IF;
  IF array_length(profile.target_companies, 1) >= 1 THEN completion := completion + 5; END IF;
  
  -- Links (20 points)
  IF profile.github_url IS NOT NULL THEN completion := completion + 10; END IF;
  IF profile.linkedin_url IS NOT NULL THEN completion := completion + 10; END IF;
  
  -- Certifications (10 points)
  SELECT COUNT(*) INTO cert_count FROM certifications WHERE user_id = p_user_id;
  IF cert_count >= 1 THEN completion := completion + 5; END IF;
  IF cert_count >= 3 THEN completion := completion + 5; END IF;
  
  -- Projects (10 points)
  SELECT COUNT(*) INTO proj_count FROM projects WHERE user_id = p_user_id;
  IF proj_count >= 1 THEN completion := completion + 5; END IF;
  IF proj_count >= 2 THEN completion := completion + 5; END IF;
  
  RETURN LEAST(completion, 100);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STORAGE BUCKETS (run in Supabase dashboard)
-- =====================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- =====================================================
-- VIEWS FOR ANALYTICS
-- =====================================================

CREATE OR REPLACE VIEW student_analytics AS
SELECT 
  u.id as user_id,
  u.full_name,
  u.email,
  sp.institution,
  sp.branch,
  sp.graduation_year,
  sp.cgpa,
  sp.profile_completion,
  rs.overall_score as readiness_score,
  rs.category as readiness_category,
  rs.coding_score,
  rs.aptitude_score,
  rs.resume_score,
  (SELECT COUNT(*) FROM attempts a WHERE a.user_id = u.id AND a.status = 'completed') as assessments_completed,
  (SELECT COUNT(*) FROM coding_submissions cs WHERE cs.user_id = u.id) as coding_submissions,
  (SELECT COUNT(*) FROM certifications c WHERE c.user_id = u.id) as certifications_count,
  (SELECT COUNT(*) FROM projects p WHERE p.user_id = u.id) as projects_count,
  u.created_at as joined_at
FROM users u
LEFT JOIN student_profiles sp ON sp.user_id = u.id
LEFT JOIN readiness_scores rs ON rs.user_id = u.id
WHERE u.role = 'student';

-- Leaderboard view
CREATE OR REPLACE VIEW aptitude_leaderboard AS
SELECT 
  u.id as user_id,
  u.full_name,
  sp.institution,
  sp.branch,
  MAX(a.score) as best_score,
  MAX(a.percentage) as best_percentage,
  COUNT(a.id) as attempts_count,
  AVG(a.percentage) as avg_percentage,
  RANK() OVER (ORDER BY MAX(a.percentage) DESC) as rank
FROM users u
JOIN student_profiles sp ON sp.user_id = u.id
JOIN attempts a ON a.user_id = u.id
JOIN assessments ass ON ass.id = a.assessment_id AND ass.type = 'aptitude'
WHERE a.status = 'completed'
GROUP BY u.id, u.full_name, sp.institution, sp.branch;
