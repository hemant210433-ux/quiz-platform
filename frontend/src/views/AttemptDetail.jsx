'use client';
import { useEffect, useState } from 'react';
import { Link, useParams } from '@/lib/router.jsx';
import { adminApi } from '../services/api.js';
import ResultView from '../components/quiz/ResultView.jsx';
import { Alert, ErrorState, PageLoader } from '../components/common/ui.jsx';
import { formatDateTime } from '../utils/format.js';

export default function AttemptDetail() {
  const { quizId, attemptId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    adminApi.attemptResult(quizId, attemptId).then(setData).catch(setError);
  }, [quizId, attemptId]);

  if (error) return <ErrorState message={error.message} />;
  if (!data) return <PageLoader />;

  return (
    <div>
      <div className="no-print mb-4 flex items-center justify-between">
        <Link to={`/admin/quizzes/${quizId}/results`} className="text-sm text-ink-500 hover:text-ink-800">← Back to results</Link>
        {data.status === 'submitted' && <button className="btn-secondary btn-sm" onClick={() => window.print()}>Print</button>}
      </div>
      {data.status !== 'submitted' ? (
        <Alert tone="info" title={`${data.studentName} is still taking this quiz`}>
          Started {formatDateTime(data.startedAt)} · {data.answeredCount} answered · ends {formatDateTime(data.deadline)}
        </Alert>
      ) : (
        <ResultView result={data} heading={<h1 className="page-title">{data.quiz.title}</h1>} />
      )}
    </div>
  );
}
