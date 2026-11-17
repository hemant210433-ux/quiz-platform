import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi, downloadUrls } from '../services/api.js';
import { EmptyState, ErrorState, PageLoader, StatusBadge } from '../components/common/ui.jsx';

/** Sidebar "Results": pick a quiz, or export everything. */
export default function ResultsIndex() {
  const [quizzes, setQuizzes] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    adminApi.listQuizzes().then((r) => setQuizzes(r.quizzes)).catch(setError);
  }, []);
  if (error) return <ErrorState message={error.message} />;
  if (!quizzes) return <PageLoader />;
  const sorted = [...quizzes].sort((a, b) => b.submissions - a.submissions);
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Results</h1>
          <p className="mt-1 text-sm text-ink-500">Choose a quiz to see analytics and every student’s result.</p>
        </div>
        <a className="btn-secondary" href={downloadUrls.allResultsCsv()}>Export all results (CSV)</a>
      </div>
      <div className="mt-6">
        {sorted.length === 0 ? (
          <EmptyState title="No quizzes yet" />
        ) : (
          <div className="card divide-y divide-ink-100">
            {sorted.map((q) => (
              <Link key={q.id} to={`/admin/quizzes/${q.id}/results`} className="flex flex-wrap items-center gap-3 px-5 py-4 hover:bg-ink-50">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{q.title}</div>
                  <div className="text-xs text-ink-500">{q.attempts} attempts started</div>
                </div>
                <div className="text-sm font-semibold tabular-nums">{q.submissions} submitted</div>
                <StatusBadge status={q.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
