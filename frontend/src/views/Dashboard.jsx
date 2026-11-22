'use client';
import { useEffect, useState } from 'react';
import { Link } from '@/lib/router.jsx';
import { adminApi } from '../services/api.js';
import { EmptyState, ErrorState, PageLoader, StatCard, StatusBadge } from '../components/common/ui.jsx';
import { formatDateTime } from '../utils/format.js';

export default function Dashboard() {
  const [quizzes, setQuizzes] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    adminApi.listQuizzes().then((r) => setQuizzes(r.quizzes)).catch(setError);
  }, []);

  if (error) return <ErrorState message={error.message} />;
  if (!quizzes) return <PageLoader />;

  const published = quizzes.filter((q) => q.status === 'published').length;
  const totalQuestions = quizzes.reduce((s, q) => s + q.questionCount, 0);
  const submissions = quizzes.reduce((s, q) => s + q.submissions, 0);
  const needsAttention = quizzes.filter((q) => q.invalidCount > 0);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="mt-1 text-sm text-ink-500">An overview of your quizzes and student activity.</p>
        </div>
        <Link to="/admin/quizzes/new" className="btn-primary">+ Create quiz</Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Quizzes" value={quizzes.length} />
        <StatCard label="Published" value={published} tone="good" />
        <StatCard label="Questions" value={totalQuestions.toLocaleString()} />
        <StatCard label="Submissions" value={submissions.toLocaleString()} />
      </div>

      {needsAttention.length > 0 && (
        <div className="mt-6 rounded-xl bg-amberish-100/60 px-4 py-3 text-sm text-amberish-700 ring-1 ring-amber-200">
          <span className="font-semibold">Needs attention:</span>{' '}
          {needsAttention.map((q, i) => (
            <span key={q.id}>
              {i > 0 && ', '}
              <Link className="underline" to={`/admin/quizzes/${q.id}/questions`}>{q.title}</Link> ({q.invalidCount} invalid)
            </span>
          ))}
        </div>
      )}

      <div className="mt-8">
        <h2 className="section-title mb-3">Recent quizzes</h2>
        {quizzes.length === 0 ? (
          <EmptyState
            icon="✎"
            title="No quizzes yet"
            message="Create your first quiz, paste your MCQs, and publish a link for students."
            action={<Link to="/admin/quizzes/new" className="btn-primary">Create your first quiz</Link>}
          />
        ) : (
          <div className="card divide-y divide-ink-100">
            {quizzes.slice(0, 6).map((q) => (
              <Link key={q.id} to={`/admin/quizzes/${q.id}`} className="flex flex-wrap items-center gap-3 px-5 py-4 hover:bg-ink-50">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-ink-900">{q.title}</div>
                  <div className="text-xs text-ink-500">Updated {formatDateTime(q.updatedAt)}</div>
                </div>
                <div className="text-sm tabular-nums text-ink-600">{q.questionCount} Qs</div>
                <div className="w-24 text-right text-sm tabular-nums text-ink-600">{q.submissions} results</div>
                <StatusBadge status={q.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
