-- =====================================================
-- CareerForge role workflow backend coverage
-- Migration: 002_role_workflows.sql
-- =====================================================

CREATE TYPE placement_drive_status AS ENUM ('draft', 'open', 'closed', 'completed', 'cancelled');
CREATE TYPE application_status AS ENUM ('saved', 'applied', 'shortlisted', 'interviewing', 'selected', 'rejected', 'withdrawn');
CREATE TYPE training_session_status AS ENUM ('scheduled', 'completed', 'cancelled');

/* LEGACY placement tables commented out — project now uses `internships` and `internship_matches`.
CREATE TABLE legacy_placement_drives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by UUID REFERENCES users(id),
  company_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  legacy_drive_date TIMESTAMPTZ,
  registration_deadline TIMESTAMPTZ,
  legacy_eligibility_criteria JSONB DEFAULT '{}',
  status placement_drive_status DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE legacy_placement_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  drive_id UUID REFERENCES legacy_placement_drives(id) ON DELETE CASCADE,
  internship_id UUID REFERENCES internships(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status application_status DEFAULT 'applied',
  resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
  notes TEXT,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(drive_id, user_id),
  UNIQUE(internship_id, user_id)
);
*/

CREATE TABLE training_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  cohort TEXT,
  starts_on DATE,
  ends_on DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE training_batch_students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID NOT NULL REFERENCES training_batches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(batch_id, user_id)
);

CREATE TABLE training_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID REFERENCES training_batches(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  starts_at TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 60,
  status training_session_status DEFAULT 'scheduled',
  attendance JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

/* legacy placement indexes commented out
CREATE INDEX idx_legacy_placement_drives_status ON legacy_placement_drives(status);
CREATE INDEX idx_legacy_placement_applications_user_id ON legacy_placement_applications(user_id);
CREATE INDEX idx_legacy_placement_applications_drive_id ON legacy_placement_applications(drive_id);
*/
CREATE INDEX idx_training_batches_trainer_id ON training_batches(trainer_id);
CREATE INDEX idx_training_batch_students_batch_id ON training_batch_students(batch_id);
CREATE INDEX idx_training_batch_students_user_id ON training_batch_students(user_id);
CREATE INDEX idx_training_sessions_trainer_id ON training_sessions(trainer_id);
CREATE INDEX idx_training_sessions_batch_id ON training_sessions(batch_id);

/* legacy placement RLS commented out
ALTER TABLE legacy_placement_drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE legacy_placement_applications ENABLE ROW LEVEL SECURITY;
*/
ALTER TABLE training_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_batch_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;

/* legacy placement policies commented out
CREATE POLICY "staff_read_legacy_placement_drives" ON legacy_placement_drives
  FOR SELECT USING (
    status IN ('open', 'completed')
    OR EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role IN ('admin', 'placement_officer'))
  );

CREATE POLICY "placement_staff_manage_legacy_drives" ON legacy_placement_drives
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role IN ('admin', 'placement_officer'))
  );

CREATE POLICY "own_legacy_placement_applications" ON legacy_placement_applications
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "staff_read_legacy_placement_applications" ON legacy_placement_applications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role IN ('admin', 'placement_officer'))
  );

CREATE POLICY "placement_staff_manage_legacy_applications" ON legacy_placement_applications
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role IN ('admin', 'placement_officer'))
  );
*/

CREATE POLICY "trainer_manage_own_batches" ON training_batches
  FOR ALL USING (
    trainer_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "staff_read_batches" ON training_batches
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role IN ('admin', 'trainer', 'placement_officer'))
  );

CREATE POLICY "trainer_manage_batch_students" ON training_batch_students
  FOR ALL USING (
    batch_id IN (
      SELECT id FROM training_batches
      WHERE trainer_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    )
    OR user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "trainer_manage_sessions" ON training_sessions
  FOR ALL USING (
    trainer_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "staff_read_sessions" ON training_sessions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role IN ('admin', 'trainer', 'placement_officer'))
  );

/* legacy placement triggers commented out
CREATE TRIGGER update_legacy_placement_drives_updated_at BEFORE UPDATE ON legacy_placement_drives
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_legacy_placement_applications_updated_at BEFORE UPDATE ON legacy_placement_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
*/

CREATE TRIGGER update_training_batches_updated_at BEFORE UPDATE ON training_batches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_sessions_updated_at BEFORE UPDATE ON training_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

/* legacy placement view commented out
CREATE OR REPLACE VIEW legacy_placement_pipeline_analytics AS
SELECT
  COALESCE(pd.id, i.id) AS source_id,
  COALESCE(pd.company_name, i.company_name) AS company_name,
  COALESCE(pd.title, i.title) AS title,
  COUNT(pa.id) AS applications,
  COUNT(*) FILTER (WHERE pa.status = 'shortlisted') AS shortlisted,
  COUNT(*) FILTER (WHERE pa.status = 'interviewing') AS interviewing,
  COUNT(*) FILTER (WHERE pa.status = 'selected') AS selected,
  COUNT(*) FILTER (WHERE pa.status = 'rejected') AS rejected
FROM legacy_placement_applications pa
LEFT JOIN legacy_placement_drives pd ON pd.id = pa.drive_id
LEFT JOIN internships i ON i.id = pa.internship_id
GROUP BY COALESCE(pd.id, i.id), COALESCE(pd.company_name, i.company_name), COALESCE(pd.title, i.title);
*/

CREATE OR REPLACE VIEW trainer_batch_analytics AS
SELECT
  tb.id AS batch_id,
  tb.trainer_id,
  tb.name,
  COUNT(tbs.id) AS students_count,
  COUNT(ts.id) AS sessions_count,
  COUNT(ts.id) FILTER (WHERE ts.status = 'completed') AS completed_sessions
FROM training_batches tb
LEFT JOIN training_batch_students tbs ON tbs.batch_id = tb.id
LEFT JOIN training_sessions ts ON ts.batch_id = tb.id
GROUP BY tb.id, tb.trainer_id, tb.name;
