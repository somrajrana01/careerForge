import { FormEvent, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, Trash2, UserRound } from 'lucide-react';
import { Card } from '../components/Card';
import { Loader } from '../components/Loader';
import { createProfile, deleteProfile, getProfile, updateProfile } from '../features/profile/profileService';
import { useApiError } from '../hooks/useApiError';
import type { StudentProfileRequest } from '../types';

const emptyProfile: StudentProfileRequest = {
  branch: '',
  semester: 1,
  cgpa: 0,
  githubUrl: '',
  linkedinUrl: '',
};

export function ProfilePage() {
  const queryClient = useQueryClient();
  const getError = useApiError();
  const [form, setForm] = useState<StudentProfileRequest>(emptyProfile);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    retry: false,
  });

  useEffect(() => {
    if (profile) {
      setForm({
        branch: profile.branch,
        semester: profile.semester,
        cgpa: profile.cgpa,
        githubUrl: profile.githubUrl ?? '',
        linkedinUrl: profile.linkedinUrl ?? '',
      });
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: (payload: StudentProfileRequest) => (profile ? updateProfile(payload) : createProfile(payload)),
    onSuccess: async () => {
      setMessage(profile ? 'Profile updated' : 'Profile created');
      setError('');
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      await queryClient.invalidateQueries({ queryKey: ['student-dashboard'] });
    },
    onError: (err) => {
      setMessage('');
      setError(getError(err));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProfile,
    onSuccess: async () => {
      setForm(emptyProfile);
      setMessage('Profile deleted');
      setError('');
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      await queryClient.invalidateQueries({ queryKey: ['student-dashboard'] });
    },
    onError: (err) => {
      setMessage('');
      setError(getError(err));
    },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    saveMutation.mutate(form);
  };

  if (isLoading) {
    return <Loader label="Loading profile" />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-forge-mint text-forge-teal">
          <UserRound size={20} aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-forge-ink">Student Profile</h1>
          <p className="mt-1 text-sm text-neutral-500">{profile ? 'Profile record found' : 'No profile record'}</p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-forge-ink">
            Branch
            <input
              value={form.branch}
              onChange={(event) => setForm((current) => ({ ...current, branch: event.target.value }))}
              required
              className="focus-ring mt-2 w-full rounded-lg border border-forge-line px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm font-medium text-forge-ink">
            Semester
            <input
              value={form.semester}
              onChange={(event) => setForm((current) => ({ ...current, semester: Number(event.target.value) }))}
              type="number"
              min={1}
              max={12}
              required
              className="focus-ring mt-2 w-full rounded-lg border border-forge-line px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm font-medium text-forge-ink">
            CGPA
            <input
              value={form.cgpa}
              onChange={(event) => setForm((current) => ({ ...current, cgpa: Number(event.target.value) }))}
              type="number"
              min={0}
              max={10}
              step={0.01}
              required
              className="focus-ring mt-2 w-full rounded-lg border border-forge-line px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm font-medium text-forge-ink">
            GitHub URL
            <input
              value={form.githubUrl}
              onChange={(event) => setForm((current) => ({ ...current, githubUrl: event.target.value }))}
              className="focus-ring mt-2 w-full rounded-lg border border-forge-line px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm font-medium text-forge-ink sm:col-span-2">
            LinkedIn URL
            <input
              value={form.linkedinUrl}
              onChange={(event) => setForm((current) => ({ ...current, linkedinUrl: event.target.value }))}
              className="focus-ring mt-2 w-full rounded-lg border border-forge-line px-3 py-2 text-sm"
            />
          </label>

          {(message || error) && (
            <p className={`rounded-lg px-3 py-2 text-sm sm:col-span-2 ${error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
              {error || message}
            </p>
          )}

          <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row">
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-forge-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
            >
              <Save size={16} aria-hidden="true" />
              {profile ? 'Save Changes' : 'Create Profile'}
            </button>
            {profile && (
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
              >
                <Trash2 size={16} aria-hidden="true" />
                Delete Profile
              </button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
