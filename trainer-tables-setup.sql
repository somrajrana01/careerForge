-- =====================================================
-- CareerForge Trainer Workflow Tables
-- Safe SQL Script for Supabase SQL Editor
-- Date: 2026-06-12
-- =====================================================
-- This script creates trainer workflow tables, indexes, RLS policies, triggers, and views.
-- Dependencies: users table (must exist)
-- Safe to execute: Uses CREATE TABLE IF NOT EXISTS and CREATE OR REPLACE for idempotency
-- =====================================================

-- Step 1: Create ENUM type if it doesn't exist (used by training_sessions.status)
DO $$ BEGIN
  CREATE TYPE training_session_status AS ENUM ('scheduled', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Step 2: Create training_batches table
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

-- Step 3: Create training_batch_students join table
CREATE TABLE IF NOT EXISTS training_batch_students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID NOT NULL REFERENCES training_batches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(batch_id, user_id)
);

-- Step 4: Create training_sessions table
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

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_training_batches_trainer_id ON training_batches(trainer_id);
CREATE INDEX IF NOT EXISTS idx_training_batch_students_batch_id ON training_batch_students(batch_id);
CREATE INDEX IF NOT EXISTS idx_training_batch_students_user_id ON training_batch_students(user_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_trainer_id ON training_sessions(trainer_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_batch_id ON training_sessions(batch_id);

-- Step 6: Enable Row Level Security (RLS)
ALTER TABLE training_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_batch_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS Policies for training_batches
-- Policy: Trainers can manage their own batches; admins can manage all
DROP POLICY IF EXISTS "trainer_manage_own_batches" ON training_batches;
CREATE POLICY "trainer_manage_own_batches" ON training_batches
  FOR ALL USING (
    trainer_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role = 'admin')
  );

-- Policy: Staff (admin, trainer, placement_officer) can read all batches
DROP POLICY IF EXISTS "staff_read_batches" ON training_batches;
CREATE POLICY "staff_read_batches" ON training_batches
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role IN ('admin', 'trainer', 'placement_officer'))
  );

-- Step 8: Create RLS Policies for training_batch_students
-- Policy: Trainers can manage their batch students; admins can manage all; students can view their own enrollments
DROP POLICY IF EXISTS "trainer_manage_batch_students" ON training_batch_students;
CREATE POLICY "trainer_manage_batch_students" ON training_batch_students
  FOR ALL USING (
    batch_id IN (
      SELECT id FROM training_batches
      WHERE trainer_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    )
    OR user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role = 'admin')
  );

-- Step 9: Create RLS Policies for training_sessions
-- Policy: Trainers can manage their own sessions; admins can manage all
DROP POLICY IF EXISTS "trainer_manage_sessions" ON training_sessions;
CREATE POLICY "trainer_manage_sessions" ON training_sessions
  FOR ALL USING (
    trainer_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role = 'admin')
  );

-- Policy: Staff (admin, trainer, placement_officer) can read all sessions
DROP POLICY IF EXISTS "staff_read_sessions" ON training_sessions;
CREATE POLICY "staff_read_sessions" ON training_sessions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role IN ('admin', 'trainer', 'placement_officer'))
  );

-- Step 10: Create triggers for automatic updated_at timestamp
-- Trigger: Update training_batches.updated_at on row update
DROP TRIGGER IF EXISTS update_training_batches_updated_at ON training_batches;
CREATE TRIGGER update_training_batches_updated_at BEFORE UPDATE ON training_batches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update training_sessions.updated_at on row update
DROP TRIGGER IF EXISTS update_training_sessions_updated_at ON training_sessions;
CREATE TRIGGER update_training_sessions_updated_at BEFORE UPDATE ON training_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 11: Create trainer analytics view
-- View: Aggregates batch, student, and session data for trainer analytics
DROP VIEW IF EXISTS trainer_batch_analytics CASCADE;
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

-- Step 12: Grant view access to authenticated users
GRANT SELECT ON trainer_batch_analytics TO authenticated;

-- =====================================================
-- Verification Queries (run after setup to verify)
-- =====================================================
-- Verify tables exist
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name IN ('training_batches', 'training_batch_students', 'training_sessions');

-- Verify indexes exist
-- SELECT indexname FROM pg_indexes 
-- WHERE indexname LIKE 'idx_training%';

-- Verify RLS policies exist
-- SELECT schemaname, tablename, policyname FROM pg_policies 
-- WHERE tablename IN ('training_batches', 'training_batch_students', 'training_sessions');

-- Verify view exists
-- SELECT table_name FROM information_schema.views 
-- WHERE table_schema = 'public' AND table_name = 'trainer_batch_analytics';

-- =====================================================
-- End of Trainer Tables Setup Script
-- =====================================================
