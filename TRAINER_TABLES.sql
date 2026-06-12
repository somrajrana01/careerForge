-- =====================================================
-- CareerForge Trainer Module Schema
-- Complete trainer-related database tables, indexes, 
-- policies, triggers, and analytics view
-- =====================================================
-- Dependencies: users table (from 001_initial_schema.sql)
-- Functions: update_updated_at_column() (from 001_initial_schema.sql)
-- =====================================================

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE IF NOT EXISTS training_session_status AS ENUM ('scheduled', 'completed', 'cancelled');

-- =====================================================
-- TRAINER TABLES
-- =====================================================

-- Training Batches: Groups of students trained by a trainer
CREATE TABLE IF NOT EXISTS training_batches (
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

-- Training Batch Students: Students enrolled in training batches
CREATE TABLE IF NOT EXISTS training_batch_students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID NOT NULL REFERENCES training_batches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(batch_id, user_id)
);

-- Training Sessions: Individual training sessions within batches
CREATE TABLE IF NOT EXISTS training_sessions (
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

-- =====================================================
-- INDEXES
-- =====================================================

-- Training batches indexes
CREATE INDEX IF NOT EXISTS idx_training_batches_trainer_id ON training_batches(trainer_id);

-- Training batch students indexes
CREATE INDEX IF NOT EXISTS idx_training_batch_students_batch_id ON training_batch_students(batch_id);
CREATE INDEX IF NOT EXISTS idx_training_batch_students_user_id ON training_batch_students(user_id);

-- Training sessions indexes
CREATE INDEX IF NOT EXISTS idx_training_sessions_trainer_id ON training_sessions(trainer_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_batch_id ON training_sessions(batch_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all trainer tables
ALTER TABLE training_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_batch_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- training_batches policies
CREATE POLICY IF NOT EXISTS "trainer_manage_own_batches" ON training_batches
  FOR ALL USING (
    trainer_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY IF NOT EXISTS "staff_read_batches" ON training_batches
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role IN ('admin', 'trainer', 'placement_officer'))
  );

-- training_batch_students policies
CREATE POLICY IF NOT EXISTS "trainer_manage_batch_students" ON training_batch_students
  FOR ALL USING (
    batch_id IN (
      SELECT id FROM training_batches
      WHERE trainer_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    )
    OR user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role = 'admin')
  );

-- training_sessions policies
CREATE POLICY IF NOT EXISTS "trainer_manage_sessions" ON training_sessions
  FOR ALL USING (
    trainer_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY IF NOT EXISTS "staff_read_sessions" ON training_sessions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role IN ('admin', 'trainer', 'placement_officer'))
  );

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp for training_batches
CREATE TRIGGER IF NOT EXISTS update_training_batches_updated_at BEFORE UPDATE ON training_batches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at timestamp for training_sessions
CREATE TRIGGER IF NOT EXISTS update_training_sessions_updated_at BEFORE UPDATE ON training_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ANALYTICS VIEW
-- =====================================================

-- Trainer batch analytics: Aggregated statistics per batch
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
