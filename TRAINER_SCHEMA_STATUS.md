# Trainer Schema Application Guide

**Date**: 2026-06-12  
**Status**: Ready for Supabase database application  
**Build Status**: ✓ PASSED (npm run build)  

## Problem Statement

The Trainer Students page (`/dashboard/trainer/students`) is failing with:
```
Could not find the table `public.training_batches` in the schema cache.
```

The trainer module schema is defined in the migration file but has **NOT been applied** to the Supabase database.

## Solution

A production-ready SQL script is available to apply the trainer schema in one step.

## Files

| File | Purpose |
|------|---------|
| `TRAINER_SCHEMA_APPLY.sql` | **Main file** - Copy/paste into Supabase SQL Editor |
| `TRAINER_TABLES.sql` | Reference copy of schema (same content) |
| `TRAINER_SCHEMA_STATUS.md` | This file - Application guide |
| `supabase/migrations/002_role_workflows.sql` | Original migration (source) |

## Application Steps

### Step 1: Open Supabase SQL Editor
1. Log into your Supabase project
2. Go to **SQL Editor** section
3. Click **New Query**

### Step 2: Copy SQL Script
1. Open this repository and locate `TRAINER_SCHEMA_APPLY.sql`
2. Copy the **entire file contents** (all ~300 lines)
3. Paste into the Supabase SQL Editor query window

### Step 3: Execute
1. Click **RUN** (or press Cmd+Enter / Ctrl+Enter)
2. Wait for execution to complete (typically 2-3 seconds)
3. Should see: `✓ Success. No rows returned.`

### Step 4: Verify
Run each verification query in Supabase SQL Editor:

**Verify tables created**:
```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' AND tablename LIKE 'training%';
```

Expected result:
```
tablename
─────────────────────────────
training_batches
training_batch_students
training_sessions
```

**Verify indexes created**:
```sql
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public' AND indexname LIKE 'idx_training%';
```

Expected result:
```
indexname
──────────────────────────────────────────
idx_training_batches_trainer_id
idx_training_batch_students_batch_id
idx_training_batch_students_user_id
idx_training_sessions_trainer_id
idx_training_sessions_batch_id
```

**Verify RLS enabled**:
```sql
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename LIKE 'training%' AND schemaname = 'public';
```

Expected result:
```
tablename                   rowsecurity
─────────────────────────   ───────────
training_batches            t
training_batch_students     t
training_sessions           t
```

**Verify view created**:
```sql
SELECT * FROM information_schema.views 
WHERE table_schema = 'public' AND table_name = 'trainer_batch_analytics';
```

Expected result: One row confirming view exists

## Schema Overview

### Tables

**training_batches**
- Primary key: `id` (UUID)
- Foreign key: `trainer_id` → `users.id`
- Fields: name, description, cohort, starts_on, ends_on, is_active, created_at, updated_at

**training_batch_students**
- Primary key: `id` (UUID)
- Foreign keys: `batch_id` → `training_batches.id`, `user_id` → `users.id`
- Unique constraint: (batch_id, user_id)
- Fields: enrolled_at

**training_sessions**
- Primary key: `id` (UUID)
- Foreign keys: `batch_id` → `training_batches.id`, `trainer_id` → `users.id`
- Fields: title, description, starts_at, duration_minutes, status, attendance, created_at, updated_at

### Indexes (Query Performance)

- `idx_training_batches_trainer_id` - Fast lookup of batches by trainer
- `idx_training_batch_students_batch_id` - Fast lookup of students in batch
- `idx_training_batch_students_user_id` - Fast lookup of student's batches
- `idx_training_sessions_trainer_id` - Fast lookup of sessions by trainer
- `idx_training_sessions_batch_id` - Fast lookup of sessions in batch

### RLS Policies (Security)

| Table | Policy | Access |
|-------|--------|--------|
| training_batches | trainer_manage_own_batches | Trainers manage own; admins full |
| training_batches | staff_read_batches | Admin/trainer/placement_officer can read |
| training_batch_students | trainer_manage_batch_students | Trainers manage own batch; students view own |
| training_sessions | trainer_manage_sessions | Trainers manage own; admins full |
| training_sessions | staff_read_sessions | Admin/trainer/placement_officer can read |

### Triggers (Auto-maintenance)

- `update_training_batches_updated_at` - Auto-update timestamp on batch changes
- `update_training_sessions_updated_at` - Auto-update timestamp on session changes

### View (Analytics)

**trainer_batch_analytics**
- Aggregates: `batch_id`, `trainer_id`, `name`, `students_count`, `sessions_count`, `completed_sessions`
- Used by: `/api/trainer` and `/dashboard/trainer/analytics`

## API Endpoints Verified

All endpoints in `app/api/trainer/route.ts` are ready to use:

| Endpoint | Method | Query | Purpose |
|----------|--------|-------|---------|
| `/api/trainer` | GET | resource=students | Student analytics list |
| `/api/trainer` | GET | resource=batches | List all batches (filtered by trainer role) |
| `/api/trainer` | GET | resource=sessions | List all sessions (filtered by trainer role) |
| `/api/trainer` | POST | action=create_batch | Create new training batch |
| `/api/trainer` | POST | action=enroll_student | Enroll student in batch |
| `/api/trainer` | POST | action=create_session | Create training session |
| `/api/trainer` | PATCH | id, resource | Update batch or session |

## Dashboard Pages Verified

All pages are ready to function once schema is applied:

| Page | Resource | Query |
|------|----------|-------|
| `/dashboard/trainer/page.tsx` | Overview | batches, sessions, analytics |
| `/dashboard/trainer/students` | Student roster | students, batches (enrollment) |
| `/dashboard/trainer/analytics` | Batch analytics | trainer_batch_analytics |
| `/dashboard/trainer/assessments` | Assessments | `/api/assessments` |

## Testing After Application

### Test 1: API Endpoint
```bash
curl "http://localhost:3000/api/trainer?resource=batches" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json"
```

Expected: Returns array (empty `[]` if no batches created yet)

### Test 2: Dashboard Page
1. Navigate to `/dashboard/trainer/students`
2. Should display without 500 error
3. "Students" table should be empty (no students enrolled yet)

### Test 3: Create Batch (Manual)
1. In Supabase, verify you have a user with `role = 'trainer'`
2. Call `/api/trainer` POST with:
```json
{
  "action": "create_batch",
  "name": "Test Batch",
  "description": "Test cohort"
}
```
3. Verify response includes batch with `id`

### Test 4: Enroll Student
1. Get a valid `user_id` (student) and `batch_id` from previous test
2. Call `/api/trainer` POST with:
```json
{
  "action": "enroll_student",
  "batch_id": "...",
  "user_id": "..."
}
```
3. Verify response includes enrollment record

## Rollback (if needed)

To remove trainer schema:
```sql
DROP VIEW IF EXISTS trainer_batch_analytics;
DROP TABLE IF EXISTS training_sessions;
DROP TABLE IF EXISTS training_batch_students;
DROP TABLE IF EXISTS training_batches;
DROP TYPE IF EXISTS training_session_status;
```

## Dependencies

**Prerequisites** (must exist in Supabase):
- `users` table (from `001_initial_schema.sql`)
- `update_updated_at_column()` function (from `001_initial_schema.sql`)

If these are missing, the script will fail. These are part of the base schema migration.

## Notes

- All `CREATE TABLE` statements use `IF NOT EXISTS` for idempotence
- All foreign keys use `ON DELETE CASCADE` for referential integrity
- RLS policies require at least one trainer or admin user for testing
- The `trainer_batch_analytics` view aggregates data with LEFT JOINs for empty batches
- Indexes are created without `UNIQUE` constraint (allows future duplicate handling)

## Support

If the script fails:
1. Check the error message in Supabase SQL Editor
2. Verify `users` and `update_updated_at_column()` exist: 
   ```sql
   SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users');
   SELECT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'update_updated_at_column');
   ```
3. If missing, apply `supabase/migrations/001_initial_schema.sql` first

---

**Status**: ✓ Ready for production  
**Last updated**: 2026-06-12
