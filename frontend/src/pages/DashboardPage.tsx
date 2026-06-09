import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ClipboardCheck, FileText, Gauge, UserRound } from 'lucide-react';
import { Card } from '../components/Card';
import { Loader } from '../components/Loader';
import { useAuth } from '../contexts/AuthContext';
import { getStudentDashboard } from '../services/dashboardService';
import type { AssessmentResult } from '../types';

function latestScore(scores: AssessmentResult[]) {
  return scores.length ? `${scores[0].score}/${scores[0].totalQuestions}` : 'No attempts';
}

export function DashboardPage() {
  const { user } = useAuth();
  const isStudent = user?.role === 'STUDENT';
  const { data, isLoading } = useQuery({
    queryKey: ['student-dashboard'],
    queryFn: getStudentDashboard,
    enabled: isStudent,
  });

  if (!isStudent) {
    return (
      <div className="mx-auto max-w-5xl space-y-5">
        <div>
          <h1 className="text-2xl font-semibold text-forge-ink">Dashboard</h1>
          <p className="mt-1 text-sm text-neutral-500">{user?.role.replace('_', ' ')} workspace</p>
        </div>
        <Card>
          <h2 className="text-lg font-semibold text-forge-ink">{user?.name}</h2>
          <p className="mt-2 text-sm text-neutral-600">Role-based access is active for this account.</p>
          {user?.role === 'ADMIN' && (
            <Link
              to="/questions"
              className="focus-ring mt-5 inline-flex items-center gap-2 rounded-lg bg-forge-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
            >
              Manage Questions
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          )}
        </Card>
      </div>
    );
  }

  if (isLoading || !data) {
    return <Loader label="Loading dashboard" />;
  }

  const stats = [
    { label: 'Profile', value: `${data.profileCompletionPercentage}%`, icon: UserRound },
    { label: 'Resumes', value: String(data.totalResumes), icon: FileText },
    { label: 'Skill', value: latestScore(data.skillAssessmentScores), icon: ClipboardCheck },
    { label: 'Aptitude', value: latestScore(data.aptitudeScores), icon: Gauge },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-forge-ink">Dashboard</h1>
          <p className="mt-1 text-sm text-neutral-500">{data.name} · {data.role}</p>
        </div>
        <Link
          to="/assessments"
          className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-forge-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
        >
          Start Assessment
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-neutral-500">{stat.label}</p>
                <Icon size={18} className="text-forge-teal" aria-hidden="true" />
              </div>
              <p className="mt-3 text-2xl font-semibold text-forge-ink">{stat.value}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-forge-ink">Profile Completion</h2>
            <span className="text-sm font-semibold text-forge-teal">{data.profileCompletionPercentage}%</span>
          </div>
          <div className="mt-4 h-3 rounded-full bg-neutral-100">
            <div
              className="h-3 rounded-full bg-forge-teal"
              style={{ width: `${data.profileCompletionPercentage}%` }}
            />
          </div>
          <Link className="mt-5 inline-flex text-sm font-semibold text-forge-teal hover:text-teal-800" to="/profile">
            Update profile
          </Link>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-forge-ink">Recent Activity</h2>
          <div className="mt-4 divide-y divide-forge-line">
            {data.recentActivity.length === 0 ? (
              <p className="py-3 text-sm text-neutral-500">No activity yet</p>
            ) : (
              data.recentActivity.map((activity) => (
                <div key={`${activity.type}-${activity.occurredAt}`} className="py-3">
                  <p className="text-sm font-medium text-forge-ink">{activity.description}</p>
                  <p className="mt-1 text-xs text-neutral-500">{new Date(activity.occurredAt).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
