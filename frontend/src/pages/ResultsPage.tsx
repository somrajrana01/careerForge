import { useLocation, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Gauge } from 'lucide-react';
import { Card } from '../components/Card';
import { Loader } from '../components/Loader';
import { getAssessmentResult, getAssessmentResults } from '../features/assessment/assessmentService';
import type { AssessmentResult } from '../types';

function ResultCard({ result }: { result: AssessmentResult }) {
  return (
    <Card>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-forge-teal">{result.assessmentType}</p>
          <h2 className="mt-1 text-2xl font-semibold text-forge-ink">
            {result.score}/{result.totalQuestions}
          </h2>
          <p className="mt-1 text-sm text-neutral-500">{new Date(result.attemptDate).toLocaleString()}</p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-sm text-neutral-500">Percentage</p>
          <p className="text-3xl font-semibold text-forge-ink">{result.percentage}%</p>
        </div>
      </div>
    </Card>
  );
}

export function ResultsPage() {
  const { attemptId } = useParams();
  const location = useLocation();
  const stateResult = (location.state as { result?: AssessmentResult } | null)?.result;

  const singleResultQuery = useQuery({
    queryKey: ['assessment-result', attemptId],
    queryFn: () => getAssessmentResult(attemptId!),
    enabled: Boolean(attemptId),
    initialData: stateResult,
  });

  const listQuery = useQuery({
    queryKey: ['assessment-results'],
    queryFn: getAssessmentResults,
    enabled: !attemptId,
  });

  if (attemptId) {
    if (singleResultQuery.isLoading || !singleResultQuery.data) {
      return <Loader label="Loading result" />;
    }

    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-forge-mint text-forge-teal">
            <Gauge size={20} aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-forge-ink">Assessment Result</h1>
            <p className="mt-1 text-sm text-neutral-500">Attempt #{singleResultQuery.data.attemptId}</p>
          </div>
        </div>
        <ResultCard result={singleResultQuery.data} />
      </div>
    );
  }

  if (listQuery.isLoading) {
    return <Loader label="Loading results" />;
  }

  const results = listQuery.data ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-forge-mint text-forge-teal">
          <Gauge size={20} aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-forge-ink">Results</h1>
          <p className="mt-1 text-sm text-neutral-500">{results.length} stored attempts</p>
        </div>
      </div>

      <div className="grid gap-4">
        {results.length === 0 ? (
          <Card>
            <p className="text-sm text-neutral-500">No assessment results yet</p>
          </Card>
        ) : (
          results.map((result) => <ResultCard key={result.attemptId} result={result} />)
        )}
      </div>
    </div>
  );
}
