import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { adminApi } from '../services/api.js';
import QuizHeader from '../components/admin/QuizHeader.jsx';
import { Alert, ErrorState, PageLoader, Spinner, StatCard } from '../components/common/ui.jsx';
import { useQuiz } from '../hooks/useQuiz.js';
import { useToast } from '../hooks/useToast.jsx';
import { useConfirm } from '../hooks/useConfirm.jsx';
import { formatDateTime, quizPublicUrl } from '../utils/format.js';

function ShareBox({ url, title }) {
  const toast = useToast();
  const canShare = typeof navigator !== 'undefined' && !!navigator.share;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard.');
    } catch {
      window.prompt('Copy this link:', url);
    }
  };
  const share = async () => {
    try {
      await navigator.share({ title, text: `Take the quiz: ${title}`, url });
    } catch {
      /* user cancelled */
    }
  };
  return (
    <div className="rounded-xl bg-brand-50 p-4 ring-1 ring-inset ring-brand-200">
      <div className="text-xs font-semibold uppercase tracking-wide text-brand-700">Public student link</div>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input className="input font-mono text-[13px]" readOnly value={url} onFocus={(e) => e.target.select()} aria-label="Public quiz link" />
        <div className="flex gap-2">
          <button className="btn-primary" onClick={copy}>Copy link</button>
          {canShare && <button className="btn-secondary" onClick={share}>Share…</button>}
          <a className="btn-secondary" href={url} target="_blank" rel="noreferrer">Open</a>
        </div>
      </div>
    </div>
  );
}

export default function QuizOverview() {
  const { quizId } = useParams();
  const { quiz, stats, loading, error, reload } = useQuiz(quizId);
  const [busy, setBusy] = useState(null);
  const [problems, setProblems] = useState(null);
  const [counts, setCounts] = useState(null);
  const [baseUrl, setBaseUrl] = useState('');
  const toast = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();

  useEffect(() => {
    adminApi.listQuizzes().then((r) => setCounts(r.quizzes.find((q) => q.id === quizId) || null)).catch(() => {});
    adminApi.getSettings().then((r) => setBaseUrl(r.settings.publicBaseUrl)).catch(() => {});
  }, [quizId, quiz?.updatedAt]);

  if (loading && !quiz) return <PageLoader />;
  if (error) return <ErrorState message={error.message} />;

  const url = quizPublicUrl(quiz.slug, baseUrl);
  const ready = stats.total > 0 && stats.invalid === 0;

  const act = async (label, fn, successMsg) => {
    setBusy(label);
    setProblems(null);
    try {
      await fn();
      if (successMsg) toast.success(successMsg);
      await reload();
    } catch (e) {
      if (Array.isArray(e.details)) setProblems(e.details);
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  const publish = async () => {
    const ok = await confirm({
      title: 'Publish this quiz?',
      message: (
        <>
          Anyone with the link will be able to take <b>{quiz.title}</b> ({stats.total} questions, {quiz.durationMinutes} minutes). Questions are locked while the quiz is published.
        </>
      ),
      confirmLabel: 'Publish quiz',
    });
    if (ok) act('publish', () => adminApi.publish(quiz.id), 'Quiz published. Share the link with your students.');
  };

  const unpublish = async () => {
    const ok = await confirm({
      title: 'Unpublish quiz?',
      message: 'The link will stop working for new students and the quiz returns to Draft. Students currently taking it can still submit.',
      confirmLabel: 'Unpublish',
    });
    if (ok) act('unpublish', () => adminApi.unpublish(quiz.id), 'Quiz moved back to draft.');
  };

  const setStatus = async (status, msg) => {
    const labels = { closed: 'Close quiz', archived: 'Archive quiz' };
    const ok = await confirm({
      title: `${labels[status]}?`,
      message: status === 'closed' ? 'Students will no longer be able to start the quiz. Results stay available.' : 'The quiz is hidden from students and kept for your records.',
      confirmLabel: labels[status],
    });
    if (ok) act(status, () => adminApi.setStatus(quiz.id, status), msg);
  };

  const duplicate = () =>
    act('duplicate', async () => {
      const r = await adminApi.duplicate(quiz.id);
      navigate(`/admin/quizzes/${r.quiz.id}`);
    }, 'Quiz duplicated as a draft.');

  const remove = async () => {
    const ok = await confirm({
      title: 'Delete this quiz?',
      message: 'The quiz, all its questions and all student results will be permanently deleted.',
      confirmLabel: 'Delete permanently',
      danger: true,
      requireText: 'DELETE',
    });
    if (!ok) return;
    try {
      await adminApi.deleteQuiz(quiz.id);
      toast.success('Quiz deleted.');
      navigate('/admin/quizzes');
    } catch (e) {
      toast.error(e.message);
    }
  };

  const B = ({ id, className = 'btn-secondary', onClick, children, disabled }) => (
    <button className={className} onClick={onClick} disabled={!!busy || disabled}>
      {busy === id && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );

  return (
    <div>
      <QuizHeader quiz={quiz} />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <section className="card card-pad">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="section-title">Publishing</h2>
                <p className="mt-1 text-sm text-ink-500">
                  {quiz.status === 'published' && `Live since ${formatDateTime(quiz.publishedAt)}. Students can open the link and take the quiz.`}
                  {quiz.status === 'draft' && 'This quiz is a draft. Only you can see it.'}
                  {quiz.status === 'closed' && 'This quiz is closed. The link shows a “closed” message.'}
                  {quiz.status === 'archived' && 'This quiz is archived and hidden from students.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {quiz.status !== 'published' && (
                  <B id="publish" className="btn-primary" onClick={publish} disabled={!ready}>Publish quiz</B>
                )}
                {quiz.status === 'published' && (
                  <>
                    <B id="unpublish" onClick={unpublish}>Unpublish</B>
                    <B id="closed" onClick={() => setStatus('closed', 'Quiz closed.')}>Close quiz</B>
                  </>
                )}
                {quiz.status !== 'archived' && quiz.status !== 'published' && (
                  <B id="archived" onClick={() => setStatus('archived', 'Quiz archived.')}>Archive</B>
                )}
              </div>
            </div>

            {quiz.status === 'published' && <div className="mt-5"><ShareBox url={url} title={quiz.title} /></div>}

            {quiz.status !== 'published' && (
              <ul className="mt-5 space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className={stats.total > 0 ? 'text-brand-600' : 'text-ink-300'}>{stats.total > 0 ? '✓' : '○'}</span>
                  At least one question <span className="text-ink-400">({stats.total} added)</span>
                  {stats.total === 0 && <Link className="ml-auto text-brand-700 underline" to={`/admin/quizzes/${quiz.id}/import`}>Import questions</Link>}
                </li>
                <li className="flex items-center gap-2">
                  <span className={stats.total > 0 && stats.invalid === 0 ? 'text-brand-600' : 'text-ink-300'}>{stats.total > 0 && stats.invalid === 0 ? '✓' : '○'}</span>
                  All questions valid {stats.invalid > 0 && <span className="text-red-600">({stats.invalid} invalid)</span>}
                  {stats.invalid > 0 && <Link className="ml-auto text-brand-700 underline" to={`/admin/quizzes/${quiz.id}/questions`}>Fix questions</Link>}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-brand-600">✓</span> Details set ({quiz.durationMinutes} min, {quiz.marksPerQuestion} mark/question)
                  <Link className="ml-auto text-brand-700 underline" to={`/admin/quizzes/${quiz.id}/edit`}>Edit details</Link>
                </li>
              </ul>
            )}

            {problems && (
              <div className="mt-4">
                <Alert tone="error" title="Cannot publish yet">
                  <ul className="list-disc pl-5">
                    {problems.map((p, i) => (
                      <li key={i}>{typeof p === 'string' ? p : p.message}</li>
                    ))}
                  </ul>
                </Alert>
              </div>
            )}
          </section>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="Questions" value={stats.total} />
            <StatCard label="Max marks" value={(stats.total * quiz.marksPerQuestion).toLocaleString()} />
            <StatCard label="Attempts" value={counts?.attempts ?? '–'} />
            <StatCard label="Submissions" value={counts?.submissions ?? '–'} tone="good" />
          </div>

          {(quiz.startAt || quiz.endAt || quiz.maxAttempts) && (
            <Alert tone="info">
              {quiz.startAt && <div>Opens: {formatDateTime(quiz.startAt)}</div>}
              {quiz.endAt && <div>Closes: {formatDateTime(quiz.endAt)}</div>}
              {quiz.maxAttempts && <div>Max {quiz.maxAttempts} attempt(s) per student (matched by name + student ID)</div>}
            </Alert>
          )}
        </div>

        <aside className="space-y-3">
          <div className="card card-pad space-y-2">
            <h3 className="section-title mb-1">Quick actions</h3>
            <Link className="btn-secondary w-full" to={`/admin/quizzes/${quiz.id}/results`}>View results</Link>
            <Link className="btn-secondary w-full" to={`/admin/quizzes/${quiz.id}/questions`}>Review questions</Link>
            <Link className="btn-secondary w-full" to={`/admin/quizzes/${quiz.id}/edit`}>Edit details</Link>
            <B id="duplicate" className="btn-secondary w-full" onClick={duplicate}>Duplicate quiz</B>
            <button className="btn w-full text-red-600 ring-1 ring-inset ring-red-200 hover:bg-red-50" onClick={remove}>Delete quiz</button>
          </div>
          {quiz.status !== 'published' && (
            <p className="px-1 text-xs text-ink-500">Public link after publishing: <span className="break-all font-mono">{url}</span></p>
          )}
        </aside>
      </div>
    </div>
  );
}
