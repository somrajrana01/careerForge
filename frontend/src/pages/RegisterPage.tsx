import { FormEvent, useState } from 'react';
import { ArrowRight, UserPlus } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { useAuth } from '../contexts/AuthContext';
import { useApiError } from '../hooks/useApiError';
import type { Role } from '../types';

const roles: Role[] = ['STUDENT', 'TRAINER', 'PLACEMENT_OFFICER', 'ADMIN'];

export function RegisterPage() {
  const { isAuthenticated, register } = useAuth();
  const navigate = useNavigate();
  const getError = useApiError();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('STUDENT');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await register({ name, email, password, role });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(getError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-forge-wash px-4 py-8">
      <Card className="w-full max-w-md">
        <div className="mb-6">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-forge-mint text-forge-teal">
            <UserPlus size={22} aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-semibold text-forge-ink">Register</h1>
          <p className="mt-1 text-sm text-neutral-500">Create a role-aware account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-forge-ink">
            Name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className="focus-ring mt-2 w-full rounded-lg border border-forge-line px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm font-medium text-forge-ink">
            Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              required
              className="focus-ring mt-2 w-full rounded-lg border border-forge-line px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm font-medium text-forge-ink">
            Password
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              minLength={6}
              required
              className="focus-ring mt-2 w-full rounded-lg border border-forge-line px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm font-medium text-forge-ink">
            Role
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as Role)}
              className="focus-ring mt-2 w-full rounded-lg border border-forge-line px-3 py-2 text-sm"
            >
              {roles.map((item) => (
                <option key={item} value={item}>
                  {item.replace('_', ' ')}
                </option>
              ))}
            </select>
          </label>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-lg bg-forge-teal px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Creating account' : 'Create Account'}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-neutral-600">
          Already registered?{' '}
          <Link className="font-semibold text-forge-teal hover:text-teal-800" to="/login">
            Sign in
          </Link>
        </p>
      </Card>
    </main>
  );
}
