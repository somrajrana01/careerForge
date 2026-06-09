import { ArrowRight, ClipboardCheck, ShieldCheck } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function LandingPage() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="min-h-screen bg-forge-wash">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-forge-mint text-forge-teal">
              <ShieldCheck size={22} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-forge-teal">TALENTFORGE</p>
              <p className="text-xs text-neutral-500">Internship Readiness Analyzer</p>
            </div>
          </div>
          <Link
            to="/login"
            className="focus-ring inline-flex items-center gap-2 rounded-lg border border-forge-line bg-white px-4 py-2 text-sm font-medium text-forge-ink hover:bg-neutral-50"
          >
            Login
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </header>

        <section className="grid flex-1 items-center gap-8 py-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-lg border border-forge-line bg-white px-3 py-2 text-sm text-neutral-600">
              <ClipboardCheck size={16} aria-hidden="true" />
              Internship readiness foundation
            </p>
            <h1 className="text-4xl font-semibold text-forge-ink sm:text-5xl">
              TALENTFORGE
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-neutral-600">
              Manage student profiles, resume metadata, question banks, assessments, and stored results from one connected application.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/register"
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-forge-teal px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800"
              >
                Create Account
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link
                to="/login"
                className="focus-ring inline-flex items-center justify-center rounded-lg border border-forge-line bg-white px-5 py-3 text-sm font-semibold text-forge-ink hover:bg-neutral-50"
              >
                Sign In
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-forge-line bg-white p-5 shadow-sm">
            <div className="grid gap-3">
              {['Role-based access', 'Student profile management', 'Resume metadata', 'Skill and aptitude assessments'].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-lg border border-forge-line px-4 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-forge-amber" />
                  <span className="text-sm font-medium text-forge-ink">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
