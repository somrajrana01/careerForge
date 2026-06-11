# IRAN — Internship Readiness Analyzer

> AI-powered full-stack platform that evaluates student internship readiness through resume analysis, skill assessments, coding challenges, aptitude tests, and personalized AI roadmaps.

---

## 🚀 Live Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Student | student@iran.dev | demo1234 |
| Trainer | trainer@iran.dev | demo1234 |
| Admin | admin@iran.dev | demo1234 |

---

## 📋 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), TypeScript, TailwindCSS |
| UI | shadcn/ui, Radix UI, Framer Motion, Recharts |
| State | TanStack Query, React Hook Form, Zod |
| Backend | Next.js API Routes + Server Actions |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth + JWT + RBAC |
| Storage | Supabase Storage |
| AI | Groq API (`llama-3.3-70b-versatile`) |
| Deploy | Vercel + Supabase |

---

## ⚡ Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/your-repo/iran-app.git
cd iran-app
npm install
```

### 2. Set Environment Variables

```bash
cp .env.example .env.local
```

Fill in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GROQ_API_KEY=your_groq_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set Up Database

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Open **SQL Editor**
3. Paste and run `supabase/migrations/001_initial_schema.sql`

### 4. Create Storage Buckets

In Supabase Dashboard → **Storage**, create:
- `resumes` (private)
- `avatars` (public)

### 5. Seed Demo Data

```bash
npm run db:seed
```

This creates:
- 10 sample internships
- 10 coding questions (Easy/Medium/Hard)
- 4 assessments with questions
- 3 demo users (student, trainer, admin)

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🏗️ Project Structure

```
iran-app/
├── app/
│   ├── auth/                    # Login, Register, Forgot Password
│   ├── dashboard/
│   │   ├── layout.tsx           # Shared sidebar layout
│   │   ├── student/             # Student pages
│   │   │   ├── page.tsx         # Main dashboard
│   │   │   ├── profile/         # Profile management
│   │   │   ├── resume/          # Resume upload + AI analysis
│   │   │   ├── assessments/     # Skill assessment tests
│   │   │   ├── coding/          # Coding practice
│   │   │   ├── aptitude/        # Aptitude tests + leaderboard
│   │   │   ├── readiness/       # Readiness score breakdown
│   │   │   ├── recommendations/ # AI roadmaps & plans
│   │   │   └── internships/     # Internship matching
│   │   ├── trainer/             # Trainer dashboard
│   │   ├── placement/           # Placement officer dashboard
│   │   └── admin/               # Admin: users, assessments, logs
│   ├── api/
│   │   ├── auth/register/       # User registration
│   │   ├── profile/completion/  # Profile completion calc
│   │   ├── resume/analyze/      # AI resume analysis
│   │   ├── readiness/calculate/ # Deterministic scoring
│   │   ├── recommendations/     # AI recommendation generation
│   │   └── internships/match/   # Internship matching algorithm
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Landing page
├── components/
│   ├── ui/                      # All shadcn/UI components
│   └── shared/                  # ThemeProvider, QueryProvider
├── lib/
│   ├── supabase/                # Client + Server clients
│   ├── groq/                    # AI service functions
│   ├── scoring/                 # Deterministic readiness engine
│   └── utils/                   # Utility functions
├── types/                       # TypeScript type definitions
├── hooks/                       # Custom React hooks
├── supabase/
│   ├── migrations/              # SQL schema migrations
│   └── seed/                    # Demo data seed script
├── middleware.ts                # Route protection + RBAC
└── jest.config.ts               # Test configuration
```

---

## 🎯 Features

### For Students
- **Profile Management** — education, skills, projects, certifications with completion %
- **AI Resume Analyzer** — PDF upload → ATS score, grammar check, keyword analysis
- **Skill Assessments** — MCQ tests with auto-scoring and feedback
- **Coding Practice** — Problem set with in-browser code editor
- **Aptitude Tests** — Quantitative + Logical + Verbal with timer and leaderboard
- **Readiness Score** — Deterministic 6-component scoring formula
- **AI Roadmaps** — 30/60/90-day preparation plans via Groq AI
- **Internship Matching** — Profile-based matching with % score

### For Trainers
- Student progress overview dashboard
- Assessment management
- Analytics and statistics

### For Placement Officers
- Placement readiness analytics
- Department-wise breakdown
- CSV export for reporting

### For Admins
- Full user management (activate/deactivate/role change)
- Assessment creation and management
- Complete audit logs
- Platform analytics

---

## 🧮 Readiness Scoring Formula

The readiness score uses a **deterministic formula** (no AI):

```
Score = (Profile × 15%) + (Resume × 25%) + (Coding × 25%) 
      + (Aptitude × 15%) + (Projects × 10%) + (Certifications × 10%)
```

| Score Range | Category |
|-------------|----------|
| 0–40 | Not Ready |
| 41–60 | Needs Improvement |
| 61–80 | Internship Ready |
| 81–100 | Highly Ready |

---

## 🤖 AI Module (Groq)

Uses `llama-3.3-70b-versatile` with structured JSON outputs validated by Zod:

- `analyzeResume()` — ATS score, keywords, grammar, skill gaps
- `generateRoadmap()` — 30/60/90-day plans
- `generateSkillGapAnalysis()` — Prioritized gap analysis
- `generateInterviewPreparation()` — Technical + behavioral plan
- `generateDSAPlan()` — Topic-wise DSA schedule

All AI functions have **deterministic fallbacks** if the API fails.

---

## 🔒 Security

- **RBAC** — Route-level protection in `middleware.ts`
- **RLS** — Row Level Security on all Supabase tables
- **Input validation** — Zod schemas on all API routes
- **Service role** — Only used server-side for admin operations
- **Audit logs** — All significant actions are logged

---

## 🧪 Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm test -- --coverage
```

Test coverage includes:
- Scoring engine (all 6 components + overall)
- Internship matching algorithm
- Utility functions
- Role permission logic
- Category threshold validation

---

## 🚀 Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Vercel

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GROQ_API_KEY
NEXT_PUBLIC_APP_URL
```

### Supabase Production Checklist

- [ ] Run migration SQL in production
- [ ] Create `resumes` and `avatars` storage buckets
- [ ] Configure email templates in Supabase Auth
- [ ] Enable email confirmations
- [ ] Set redirect URLs in Supabase Auth settings
- [ ] Configure RLS policies (included in migration)

---

## 📦 Getting API Keys

### Supabase
1. Create project at [supabase.com](https://supabase.com)
2. Settings → API → copy `URL`, `anon key`, `service_role key`

### Groq
1. Sign up at [console.groq.com](https://console.groq.com)
2. API Keys → Create new key
3. Free tier gives generous limits

---

## 🗄️ Database Tables

| Table | Purpose |
|-------|---------|
| `users` | Auth users with roles |
| `student_profiles` | Detailed student info |
| `certifications` | User certifications |
| `projects` | Portfolio projects |
| `resumes` | Uploaded resume files |
| `resume_reports` | AI analysis results |
| `assessments` | Test/quiz definitions |
| `questions` | MCQ questions |
| `attempts` | Assessment attempts |
| `coding_questions` | Coding problems |
| `coding_submissions` | Code submissions |
| `readiness_scores` | Calculated scores |
| `recommendations` | AI recommendations |
| `internships` | Internship listings |
| `internship_matches` | Profile matches |
| `notifications` | User notifications |
| `audit_logs` | System audit trail |
| `analytics_events` | Usage analytics |

---

## 📄 License

MIT — Free to use for educational and portfolio purposes.

---

## 👨‍💻 About

Built as a **Final Year BTech Major Project** demonstrating:
- Full-stack Next.js 15 with App Router
- Real-world Supabase auth, storage, and database
- AI integration with Groq
- Production-grade RBAC and security
- Comprehensive test coverage
- Modern SaaS UI design patterns
