import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FilePlus, FileText, Trash2 } from 'lucide-react';
import { Card } from '../components/Card';
import { Loader } from '../components/Loader';
import { createResume, deleteResume, getResumes } from '../features/resume/resumeService';
import { useApiError } from '../hooks/useApiError';
import type { ResumeRequest } from '../types';

const emptyResume: ResumeRequest = {
  fileName: '',
  fileUrl: '',
};

export function ResumePage() {
  const queryClient = useQueryClient();
  const getError = useApiError();
  const [form, setForm] = useState<ResumeRequest>(emptyResume);
  const [error, setError] = useState('');

  const { data: resumes = [], isLoading } = useQuery({
    queryKey: ['resumes'],
    queryFn: getResumes,
  });

  const createMutation = useMutation({
    mutationFn: createResume,
    onSuccess: async () => {
      setForm(emptyResume);
      setError('');
      await queryClient.invalidateQueries({ queryKey: ['resumes'] });
      await queryClient.invalidateQueries({ queryKey: ['student-dashboard'] });
    },
    onError: (err) => setError(getError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteResume,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['resumes'] });
      await queryClient.invalidateQueries({ queryKey: ['student-dashboard'] });
    },
    onError: (err) => setError(getError(err)),
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    createMutation.mutate(form);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-forge-mint text-forge-teal">
          <FileText size={20} aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-forge-ink">Resume Records</h1>
          <p className="mt-1 text-sm text-neutral-500">Metadata storage only</p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
          <label className="block text-sm font-medium text-forge-ink">
            File Name
            <input
              value={form.fileName}
              onChange={(event) => setForm((current) => ({ ...current, fileName: event.target.value }))}
              required
              className="focus-ring mt-2 w-full rounded-lg border border-forge-line px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm font-medium text-forge-ink">
            File URL
            <input
              value={form.fileUrl}
              onChange={(event) => setForm((current) => ({ ...current, fileUrl: event.target.value }))}
              required
              className="focus-ring mt-2 w-full rounded-lg border border-forge-line px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="focus-ring mt-0 inline-flex items-center justify-center gap-2 rounded-lg bg-forge-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60 lg:mt-7"
          >
            <FilePlus size={16} aria-hidden="true" />
            Save
          </button>
        </form>
        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </Card>

      {isLoading ? (
        <Loader label="Loading resumes" />
      ) : (
        <div className="grid gap-4">
          {resumes.length === 0 ? (
            <Card>
              <p className="text-sm text-neutral-500">No resume records yet</p>
            </Card>
          ) : (
            resumes.map((resume) => (
              <Card key={resume.id}>
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-semibold text-forge-ink">{resume.fileName}</p>
                    <p className="mt-1 break-all text-sm text-neutral-500">{resume.fileUrl}</p>
                    <p className="mt-2 text-xs text-neutral-500">{new Date(resume.uploadedAt).toLocaleString()}</p>
                  </div>
                  <button
                    type="button"
                    title="Delete resume record"
                    onClick={() => deleteMutation.mutate(resume.id)}
                    className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-lg border border-red-200 bg-white text-red-700 hover:bg-red-50"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
