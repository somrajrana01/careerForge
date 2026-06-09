import { FormEvent, useState } from 'react';
import { ArrowRight, LogIn } from 'lucide-react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { useAuth } from '../contexts/AuthContext';
import { useApiError } from '../hooks/useApiError';

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const getError = useApiError();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(getError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-forge-wash px-4">
      <Card className="w-full max-w-md">
        <div className="mb-6">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-forge-mint text-forge-teal">
            <LogIn size={22} aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-semibold text-forge-ink">Login</h1>
          <p className="mt-1 text-sm text-neutral-500">Access your TALENTFORGE workspace.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              required
              className="focus-ring mt-2 w-full rounded-lg border border-forge-line px-3 py-2 text-sm"
            />
          </label>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-lg bg-forge-teal px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Signing in' : 'Sign In'}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-neutral-600">
          New here?{' '}
          <Link className="font-semibold text-forge-teal hover:text-teal-800" to="/register">
            Create an account
          </Link>
        </p>
      </Card>
    </main>
  );
}
