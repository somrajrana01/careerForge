# TALENTFORGE - Internship Readiness Analyzer

TALENTFORGE is now a React/Vite project powered by Supabase for auth, database, roles, and stored assessment data.

You do not need Docker, Maven, Java, or a local PostgreSQL installation to run the current app.

## Current Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS
- Backend platform: Supabase
- Auth: Supabase Auth
- Database: Supabase Postgres
- Local runtime: Node.js and npm

The old Spring Boot backend is still in the repository for reference, but the frontend no longer depends on it.

## Folder Structure

```text
careerforge/
  frontend/
    src/
      pages/
      components/
      features/
      services/
      hooks/
      contexts/
      types/
      layouts/
      routes/
    .env.example
    package.json
  supabase/
    schema.sql
  backend/
    legacy Spring Boot backend, not required for the Supabase app
```

## Features

- Supabase registration and login
- Roles: `STUDENT`, `TRAINER`, `PLACEMENT_OFFICER`, `ADMIN`
- Protected frontend routes
- Student profile create/view/edit/delete
- Resume metadata create/view/delete
- Admin question bank create/view/update/delete
- Skill and aptitude assessment start/submit
- Assessment result storage
- Student dashboard with profile completion, resume count, scores, and recent activity

## From-Zero Setup

### 1. Install Node.js

Install the LTS version from:

```text
https://nodejs.org/en/download
```

After installing, open a new PowerShell and check:

```powershell
node -v
npm -v
```

Both commands should print version numbers.

### 2. Create a Supabase Project

1. Go to:

```text
https://supabase.com
```

2. Sign in or create an account.
3. Click `New project`.
4. Choose an organization.
5. Enter a project name, for example:

```text
talentforge
```

6. Set a database password and save it somewhere safe.
7. Choose a region near you.
8. Create the project and wait until Supabase finishes provisioning it.

### 3. Disable Email Confirmation for Local Demo

This project logs users in immediately after registration. For that to work:

1. Open your Supabase project.
2. Go to `Authentication`.
3. Go to `Providers`.
4. Open `Email`.
5. Turn off `Confirm email`.
6. Save.

If you leave email confirmation enabled, registration may succeed but login will not happen until the email is confirmed.

### 4. Create the Database Tables

1. In Supabase, go to `SQL Editor`.
2. Click `New query`.
3. Open this local file:

```text
supabase/schema.sql
```

4. Copy the whole SQL file.
5. Paste it into Supabase SQL Editor.
6. Click `Run`.

This creates:

- `profiles`
- `student_profiles`
- `resumes`
- `questions`
- `assessment_attempts`
- row-level security policies
- starter assessment questions

### 5. Get Supabase API Keys

In Supabase:

1. Go to `Project Settings`.
2. Go to `API`.
3. Copy `Project URL`.
4. Copy the `anon public` key.

### 6. Create Frontend Environment File

In the project, create:

```text
frontend/.env
```

Use this format:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

You can also copy from:

```text
frontend/.env.example
```

### 7. Install Frontend Dependencies

Open PowerShell:

```powershell
cd C:\Users\Somraj\Desktop\careerforge\frontend
npm install
```

### 8. Run the App

From the same `frontend` folder:

```powershell
npm run dev
```

Open:

```text
http://localhost:5173
```

## How to Use

1. Register a `STUDENT` account.
2. Create a student profile.
3. Add resume records.
4. Start and submit assessments.
5. View results and dashboard stats.
6. Register an `ADMIN` account.
7. Log in as admin and manage the question bank.

## Build Command

```powershell
cd C:\Users\Somraj\Desktop\careerforge\frontend
npm run build
```

## Important Notes

- No backend server is required now.
- No Docker is required now.
- No Maven is required now.
- The Supabase anon key is safe to use in frontend apps.
- Keep the Supabase database password private.
- Assessment scoring currently happens in the frontend for simplicity. For a production-grade exam system, move scoring into a Supabase Edge Function.
