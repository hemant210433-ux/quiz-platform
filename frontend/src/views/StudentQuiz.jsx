'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from '@/lib/router.jsx';
import { publicApi } from '../services/api.js';
import QuestionNavGrid from '../components/quiz/QuestionNavGrid.jsx';
import Modal from '../components/common/Modal.jsx';
import { ErrorState, PageLoader, Spinner } from '../components/common/ui.jsx';
import { formatDuration, storage } from '../utils/format.js';
import NotesGuard from '../components/site/NotesGuard.jsx';
import { attemptKey, lastResultKey } from './QuizLanding.jsx';

const KEYS = ['A', 'B', 'C', 'D'];
const SAVE_DEBOUNCE_MS = 1200;

export default function StudentQuiz() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const creds = useMemo(() => storage.get(attemptKey(slug)), [slug]);

  const [attempt, setAttempt] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [marked, setMarked] = useState(() => new Set());
  const [current, setCurrent] = useState(0);
  const [remaining, setRemaining] = useState(null);
  const [saveState, setSaveState] = useState('saved'); // saved | pending | saving | error
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const deadlineRef = useRef(null); // local timestamp (ms) of the server deadline
  const answersRef = useRef(answers);
  const markedRef = useRef(marked);
  const dirtyRef = useRef(false);
  const saveTimer = useRef(null);
  const submittedRef = useRef(false);
  answersRef.current = answers;
  markedRef.current = marked;

  const goToResult = useCallback(
    (token) => {
      storage.remove(attemptKey(slug));
      storage.set(lastResultKey(slug), token);
      navigate(`/result/${token}`, { replace: true });
    },
    [navigate, slug],
  );

  const recoverResult = useCallback(async () => {
    const r = await publicApi.reissueResult(creds.attemptId, creds.accessToken);
    goToResult(r.resultToken);
  }, [creds, goToResult]);

  /* ---------- load / resume ---------- */
  useEffect(() => {
    if (!creds) return;
    let cancelled = false;
    publicApi
      .getAttempt(creds.attemptId, creds.accessToken)
      .then(async (a) => {
        if (cancelled) return;
        if (a.status === 'submitted') {
          submittedRef.current = true;
          await recoverResult();
          return;
        }
        deadlineRef.current = Date.now() + a.remainingSeconds * 1000;
        setRemaining(a.remainingSeconds);
        setAnswers(a.answers || {});
        setMarked(new Set(a.marked || []));
        setAttempt(a);
        const saved = storage.get(`qp:pos:${creds.attemptId}`);
        if (typeof saved === 'number' && saved < a.questions.length) setCurrent(saved);
        document.title = a.quiz.title;
      })
      .catch((e) => {
        if (cancelled) return;
        if (e.status === 403 || e.status === 404) storage.remove(attemptKey(slug));
        setLoadError(e);
      });
    return () => {
      cancelled = true;
    };
  }, [creds, slug, recoverResult]);

  useEffect(() => {
    if (attempt) storage.set(`qp:pos:${attempt.attemptId}`, current);
  }, [current, attempt]);

  /* ---------- submit ---------- */
  const submit = useCallback(
    async (auto = false) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      clearTimeout(saveTimer.current);
      setSubmitting(true);
      setSubmitError('');
      try {
        const r = await publicApi.submit(creds.attemptId, creds.accessToken, answersRef.current, [...markedRef.current], auto);
        goToResult(r.resultToken);
      } catch (e) {
        if (e.status === 409) {
          try {
            await recoverResult();
            return;
          } catch {
            /* fall through */
          }
        }
        submittedRef.current = false;
        setSubmitting(false);
        setSubmitError(
          e.status === 0
            ? 'You appear to be offline. Your answers are safe – reconnect and press Submit again.'
            : e.message,
        );
        if (auto) setConfirmOpen(true);
      }
    },
    [creds, goToResult, recoverResult],
  );

  /* ---------- autosave ---------- */
  const flush = useCallback(
    async ({ keepalive = false } = {}) => {
      if (!dirtyRef.current || submittedRef.current || !creds) return;
      dirtyRef.current = false;
      setSaveState('saving');
      try {
        await publicApi.saveAnswers(creds.attemptId, creds.accessToken, answersRef.current, [...markedRef.current], { keepalive });
        setSaveState(dirtyRef.current ? 'pending' : 'saved');
      } catch (e) {
        if (e.code === 'TIME_UP') return submit(true);
        if (e.status === 409) return recoverResult().catch(() => {});
        dirtyRef.current = true;
        setSaveState('error');
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => flush(), 5000); // retry
      }
    },
    [creds, submit, recoverResult],
  );

  const scheduleSave = useCallback(() => {
    dirtyRef.current = true;
    setSaveState('pending');
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => flush(), SAVE_DEBOUNCE_MS);
  }, [flush]);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush({ keepalive: true });
    };
    const onUnload = (e) => {
      if (dirtyRef.current && !submittedRef.current) {
        flush({ keepalive: true });
        e.preventDefault();
        e.returnValue = '';
      }
    };
    const onOnline = () => dirtyRef.current && flush();
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('beforeunload', onUnload);
    window.addEventListener('online', onOnline);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('beforeunload', onUnload);
      window.removeEventListener('online', onOnline);
    };
  }, [flush]);

  /* ---------- timer (server deadline is authoritative) ---------- */
  useEffect(() => {
    if (!attempt) return undefined;
    const tick = () => {
      const left = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) submit(true);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [attempt, submit]);

  /* ---------- actions ---------- */
  const questions = attempt?.questions || [];
  const q = questions[current];

  const choose = useCallback(
    (letter) => {
      if (!q || submittedRef.current) return;
      setAnswers((a) => ({ ...a, [q.id]: letter }));
      scheduleSave();
    },
    [q, scheduleSave],
  );

  const clearAnswer = () => {
    if (!q) return;
    setAnswers((a) => ({ ...a, [q.id]: null }));
    scheduleSave();
  };

  const toggleMark = () => {
    if (!q) return;
    setMarked((m) => {
      const n = new Set(m);
      if (n.has(q.id)) n.delete(q.id);
      else n.add(q.id);
      return n;
    });
    scheduleSave();
  };

  const go = useCallback((i) => setCurrent((c) => Math.max(0, Math.min(questions.length - 1, typeof i === 'function' ? i(c) : i))), [questions.length]);

  // Keyboard: A–D / 1–4 to answer, ← → to navigate
  useEffect(() => {
    const onKey = (e) => {
      if (confirmOpen || e.ctrlKey || e.metaKey || e.altKey) return;
      const el = document.activeElement;
      if (el && (['TEXTAREA', 'SELECT'].includes(el.tagName) || (el.tagName === 'INPUT' && !['radio', 'checkbox'].includes(el.type)))) return;
      const k = e.key.toUpperCase();
      const idx = ['1', '2', '3', '4'].indexOf(k);
      const allowed = Object.keys(questions[current]?.options || {});
      if (allowed.includes(k)) choose(k);
      else if (idx >= 0 && allowed[idx]) choose(allowed[idx]);
      else if (e.key === 'ArrowRight') go((c) => c + 1);
      else if (e.key === 'ArrowLeft') go((c) => c - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [choose, go, confirmOpen, questions, current]);

  /* ---------- render ---------- */
  if (!creds) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <ErrorState title="No attempt in progress" message="Start the quiz from its link first." action={<Link className="btn-primary" to={`/quiz/${slug}`}>Go to quiz</Link>} />
      </div>
    );
  }
  if (loadError) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <ErrorState title="Could not open your attempt" message={loadError.message} action={<Link className="btn-primary" to={`/quiz/${slug}`}>Back to quiz</Link>} />
      </div>
    );
  }
  if (!attempt) return <PageLoader label="Loading your quiz…" />;

  const answeredCount = questions.filter((x) => answers[x.id]).length;
  const markedCount = questions.filter((x) => marked.has(x.id)).length;
  const lowTime = remaining !== null && remaining <= 60;
  const warnTime = remaining !== null && remaining <= 300;

  const saveLabel = { saved: 'All answers saved', pending: 'Unsaved changes…', saving: 'Saving…', error: 'Offline – retrying…' }[saveState];

  return (
    <div className="flex min-h-screen flex-col bg-ink-50">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-ink-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-ink-900">{attempt.quiz.title}</div>
            <div className={`flex items-center gap-1.5 text-xs ${saveState === 'error' ? 'text-red-600' : 'text-ink-500'}`} aria-live="polite">
              {saveState === 'saving' && <Spinner className="h-3 w-3" />}
              {attempt.studentName} · {saveLabel}
            </div>
          </div>
          <div
            className={`rounded-lg px-3 py-1.5 font-mono text-lg font-semibold tabular-nums ${lowTime ? 'animate-pulse bg-red-600 text-white' : warnTime ? 'bg-amberish-100 text-amberish-700' : 'bg-ink-100 text-ink-900'}`}
            role="timer"
            aria-label={`Time remaining ${formatDuration(remaining)}`}
          >
            {formatDuration(remaining)}
          </div>
          <button className="btn-primary" onClick={() => setConfirmOpen(true)} disabled={submitting}>
            Submit
          </button>
        </div>
        <div className="h-1 bg-ink-100">
          <div className="h-full bg-brand-500 transition-all" style={{ width: `${(answeredCount / questions.length) * 100}%` }} />
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-5 px-4 py-5 lg:grid-cols-[1fr_300px]">
        {/* Question */}
        <NotesGuard mark="olevelmocktest.in">
        <main>
          <div className="card">
            <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3 text-sm">
              <span className="font-semibold text-ink-700">
                Question {current + 1} <span className="font-normal text-ink-400">of {questions.length}</span>
              </span>
              {marked.has(q.id) && <span className="badge bg-amberish-100 text-amberish-700">Marked for review</span>}
            </div>
            <div className="px-5 py-6 sm:px-7">
              <h1 className="prewrap text-lg font-medium leading-relaxed text-ink-900 sm:text-xl" id="question-text">
                {q.question}
              </h1>
              <div className="mt-6 space-y-3" role="radiogroup" aria-labelledby="question-text">
                {(q.type === 'tf' ? ['A', 'B'] : KEYS).map((k) => {
                  const selected = answers[q.id] === k;
                  return (
                    <label
                      key={k}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl px-4 py-3.5 ring-1 ring-inset transition ${selected ? 'bg-brand-50 ring-2 ring-brand-500' : 'bg-white ring-ink-200 hover:bg-ink-50'}`}
                    >
                      <input type="radio" name={`q-${q.id}`} value={k} checked={selected} onChange={() => choose(k)} className="sr-only" />
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${selected ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600'}`}>{k}</span>
                      <span className="prewrap pt-0.5 text-[15px] text-ink-800 sm:text-base">{q.options[k]}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-ink-100 px-5 py-3">
              <button className="btn-secondary" onClick={() => go(current - 1)} disabled={current === 0}>← Previous</button>
              <button className={`btn ${marked.has(q.id) ? 'bg-amberish-100 text-amberish-700 ring-1 ring-inset ring-amber-300' : 'btn-secondary'}`} onClick={toggleMark}>
                {marked.has(q.id) ? '★ Marked' : '☆ Mark for review'}
              </button>
              {answers[q.id] && <button className="btn-ghost" onClick={clearAnswer}>Clear</button>}
              <div className="flex-1" />
              {current < questions.length - 1 ? (
                <button className="btn-primary" onClick={() => go(current + 1)}>Next →</button>
              ) : (
                <button className="btn-primary" onClick={() => setConfirmOpen(true)}>Finish & submit</button>
              )}
            </div>
          </div>
          <p className="mt-3 hidden text-center text-xs text-ink-400 sm:block">Keyboard: A–D or 1–4 to answer · ← → to move between questions</p>
          <button className="btn-secondary mt-4 w-full lg:hidden" onClick={() => setPaletteOpen(true)}>
            Question palette · {answeredCount}/{questions.length} answered
          </button>
        </main>
        </NotesGuard>

        {/* Palette (desktop) */}
        <aside className="hidden lg:block">
          <div className="card sticky top-24 p-4">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-sm font-semibold">Questions</h2>
              <span className="text-xs tabular-nums text-ink-500">{answeredCount}/{questions.length} answered</span>
            </div>
            <div className="max-h-[calc(100vh-15rem)] overflow-y-auto pr-1">
              <QuestionNavGrid questions={questions} answers={answers} marked={marked} current={current} onJump={go} />
            </div>
          </div>
        </aside>
      </div>

      {/* Palette (mobile) */}
      <Modal open={paletteOpen} onClose={() => setPaletteOpen(false)} title={`Questions · ${answeredCount}/${questions.length} answered`}>
        <QuestionNavGrid
          questions={questions}
          answers={answers}
          marked={marked}
          current={current}
          onJump={(i) => {
            go(i);
            setPaletteOpen(false);
          }}
        />
      </Modal>

      {/* Submit confirmation */}
      <Modal open={confirmOpen} onClose={() => !submitting && setConfirmOpen(false)} title="Submit your quiz?">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-brand-50 px-2 py-3"><div className="text-xl font-semibold text-brand-700">{answeredCount}</div><div className="text-xs text-ink-600">Answered</div></div>
          <div className="rounded-lg bg-ink-100 px-2 py-3"><div className="text-xl font-semibold">{questions.length - answeredCount}</div><div className="text-xs text-ink-600">Not answered</div></div>
          <div className="rounded-lg bg-amberish-100 px-2 py-3"><div className="text-xl font-semibold text-amberish-700">{markedCount}</div><div className="text-xs text-ink-600">Marked</div></div>
        </div>
        <p className="mt-4 text-sm text-ink-600">After submitting you cannot change your answers. You will see your result immediately.</p>
        {submitError && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{submitError}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-secondary" onClick={() => setConfirmOpen(false)} disabled={submitting}>Keep answering</button>
          <button className="btn-primary" onClick={() => submit(false)} disabled={submitting}>
            {submitting && <Spinner className="h-4 w-4" />}
            Submit quiz
          </button>
        </div>
      </Modal>

      {submitting && !confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80">
          <div className="flex items-center gap-3 text-ink-700"><Spinner /> Submitting your answers…</div>
        </div>
      )}
    </div>
  );
}
