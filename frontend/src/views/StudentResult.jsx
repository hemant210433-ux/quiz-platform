'use client';
import { useEffect, useState } from 'react';
import { Link, useParams } from '@/lib/router.jsx';
import { publicApi } from '../services/api.js';
import ResultView from '../components/quiz/ResultView.jsx';
import { ErrorState, PageLoader } from '../components/common/ui.jsx';

export default function StudentResult() {
  const { token } = useParams();
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    publicApi.getResult(token).then((r) => {
      setResult(r);
      document.title = `Result – ${r.quiz.title}`;
    }).catch(setError);
  }, [token]);

  if (error) return <ErrorState title="Result not found" message="This result link is invalid. Results are only available through the private link shown after you submit." />;
  if (!result) return <PageLoader label="Loading your result…" />;

  return (
    <div>
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-ink-500">Bookmark this page – it is your private result link.</p>
        <div className="flex gap-2">
          <button className="btn-secondary btn-sm" onClick={() => window.print()}>Print / save PDF</button>
          <Link className="btn-secondary btn-sm" to={`/quiz/${result.quiz.slug}`}>Back to quiz</Link>
        </div>
      </div>
      <ResultView
        result={result}
        heading={
          <>
            <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">Your result</div>
            <h1 className="mt-1 font-display text-2xl font-semibold text-ink-900">{result.quiz.title}</h1>
          </>
        }
      />
    </div>
  );
}
