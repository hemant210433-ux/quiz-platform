'use client';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from '@/lib/router.jsx';
import { publicApi } from '../services/api.js';
import { Alert, ErrorState, PageLoader, Spinner } from '../components/common/ui.jsx';
import { formatDateTime, num, storage } from '../utils/format.js';

export const attemptKey = (slug) => `qp:attempt:${slug}`;

/** Random URL-safe id (used for the "same Start press" key and the per-browser device id). */
function randomId(len = 24) {
  const bytes = new Uint8Array(len);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else for (let i = 0; i < len; i++) bytes[i] = Math.floor(Math.random() * 256);
  const abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from(bytes, (b) => abc[b % abc.length]).join('');
}
function deviceId() {
  let id = storage.get('qp:device');
  if (typeof id !== 'string' || id.length < 16) {
    id = randomId(24);
    storage.set('qp:device', id);
  }
  return id;
}
export const lastResultKey = (slug) => `qp:lastResult:${slug}`;

export default function QuizLanding() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  // One key per Start press: if the request is sent twice (slow network / automatic retry) the server
  // returns the same attempt instead of creating a duplicate or saying "attempts used".
  const startKey = useRef(null);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [startError, setStartError] = useState('');
  const saved = storage.get(attemptKey(slug));
  const lastResult = storage.get(lastResultKey(slug));

  useEffect(() => {
    publicApi.getQuiz(slug).then(setData).catch(setError);
  }, [slug]);

  useEffect(() => {
    if (data) document.title = data.quiz.title;
  }, [data]);

  if (error) {
    return (
      <ErrorState
        title={error.status === 404 ? 'Quiz not found' : 'Could not load quiz'}
        message={error.status === 404 ? 'This link is not valid, or the quiz is not published. Please check the link with your teacher.' : error.message}
      />
    );
  }
  if (!data) return <PageLoader label="Loading quiz…" />;

  const { quiz, availability } = data;

  const start = async (e) => {
    e.preventDefault();
    setStartError('');
    const mode = data.quiz.accessMode || 'name';
    if (mode === 'code' && !code.trim()) return setStartError('Please enter your access code.');
    if (mode === 'email' && !/^\S+@\S+\.\S{2,}$/.test(email.trim())) return setStartError('Please enter a valid email address.');
    if (mode !== 'code' && name.trim().length < 2) return setStartError('Please enter your full name.');
    if (!startKey.current) startKey.current = randomId(24);
    setBusy(true);
    try {
      const r = await publicApi.start(slug, {
        studentName: name.trim(),
        studentId: studentId.trim(),
        email: email.trim(),
        code: code.trim(),
        startKey: startKey.current,
        deviceId: deviceId(),
      });
      startKey.current = null;
      storage.set(attemptKey(slug), { attemptId: r.attemptId, accessToken: r.accessToken, studentName: name.trim() || 'student' });
      navigate(`/quiz/${slug}/attempt`);
    } catch (err) {
      setStartError(err.details?.[0]?.message || err.message);
    } finally {
      setBusy(false);
    }
  };

  const instructions = (quiz.instructions || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_340px]">
      <section className="card overflow-hidden">
        <div className="bg-brand-900 px-6 py-8 text-white sm:px-8">
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-300">Online quiz</div>
          <h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-white sm:text-4xl">{quiz.title}</h1>
          {quiz.description && <p className="prewrap mt-3 max-w-xl text-brand-100">{quiz.description}</p>}
        </div>
        <dl className="grid grid-cols-2 divide-x divide-y divide-ink-100 border-b border-ink-100 sm:grid-cols-4 sm:divide-y-0">
          {[
            ['Questions', quiz.questionCount],
            ['Duration', `${quiz.durationMinutes} min`],
            ['Maximum marks', num(quiz.maxMarks)],
            ['Per question', `+${num(quiz.marksPerQuestion)}${quiz.negativeMarking ? ` / −${num(quiz.negativeMarks)}` : ''}`],
          ].map(([k, v]) => (
            <div key={k} className="px-5 py-4">
              <dt className="text-xs text-ink-500">{k}</dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="px-6 py-6 sm:px-8">
          <h2 className="section-title">Instructions</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-700">
            {instructions.map((l, i) => (
              <li key={i} className="flex gap-2"><span className="text-brand-600">•</span><span>{l}</span></li>
            ))}
            <li className="flex gap-2"><span className="text-brand-600">•</span><span>The timer starts when you press <b>Start quiz</b> and keeps running even if you close the page. When time runs out your answers are submitted automatically.</span></li>
            <li className="flex gap-2"><span className="text-brand-600">•</span><span>Your answers are saved as you go. If the page reloads, you can continue on the same device.</span></li>
            <li className="flex gap-2"><span className="text-brand-600">•</span><span>Each question has exactly one correct answer.{quiz.negativeMarking ? ` ${num(quiz.negativeMarks)} mark(s) are deducted for each wrong answer; unanswered questions are not penalised.` : ' There is no penalty for wrong answers.'}</span></li>
            {quiz.maxAttempts && <li className="flex gap-2"><span className="text-brand-600">•</span><span>You may attempt this quiz at most {quiz.maxAttempts} time(s).</span></li>}
            {quiz.endAt && <li className="flex gap-2"><span className="text-brand-600">•</span><span>The quiz closes at {formatDateTime(quiz.endAt)}.</span></li>}
          </ul>
        </div>
      </section>

      <aside className="space-y-4">
        {saved && availability.open && (
          <div className="card card-pad">
            <h2 className="section-title">Continue your attempt</h2>
            <p className="mt-1 text-sm text-ink-500">You have an attempt in progress as <b>{saved.studentName}</b>.</p>
            <Link className="btn-primary mt-4 w-full" to={`/quiz/${slug}/attempt`}>Resume quiz</Link>
          </div>
        )}
        {lastResult && (
          <div className="card card-pad">
            <h2 className="section-title">Your last result</h2>
            <Link className="btn-secondary mt-3 w-full" to={`/result/${lastResult}`}>View result</Link>
          </div>
        )}
        {!availability.open ? (
          <Alert tone="warn" title={availability.reason === 'NOT_STARTED' ? 'Not open yet' : 'Quiz unavailable'}>
            {availability.message}
            {availability.reason === 'NOT_STARTED' && quiz.startAt && <div className="mt-1">Opens {formatDateTime(quiz.startAt)}.</div>}
          </Alert>
        ) : (
          <form onSubmit={start} className="card card-pad space-y-4" noValidate>
            <h2 className="section-title">{saved ? 'Or start a new attempt' : 'Start the quiz'}</h2>
            {startError && <Alert tone="error">{startError}</Alert>}
            {quiz.accessMode === 'code' && (
              <div>
                <label className="label" htmlFor="code">Access code *</label>
                <input id="code" className="input text-center font-mono text-lg uppercase tracking-[0.25em]" value={code} onChange={(e) => setCode(e.target.value)} maxLength={20} autoComplete="off" autoCapitalize="characters" spellCheck={false} placeholder="XXXX-XXXX" inputMode="text" />
                <p className="mt-1 text-xs text-ink-500">Your teacher gave you this personal code. It works only for you.</p>
              </div>
            )}
            {quiz.accessMode === 'email' && (
              <div>
                <label className="label" htmlFor="email">Email *</label>
                <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={120} autoComplete="email" inputMode="email" required />
                {quiz.restrictedEmails && <p className="mt-1 text-xs text-ink-500">Use the email address your teacher has for you.</p>}
              </div>
            )}
            <div>
              <label className="label" htmlFor="name">Your name {quiz.accessMode === 'code' ? <span className="font-normal text-ink-400">(only if asked)</span> : '*'}</label>
              <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} autoComplete="name" required={quiz.accessMode !== 'code'} />
            </div>
            {(quiz.accessMode || 'name') === 'name' && (
              <div>
                <label className="label" htmlFor="sid">Student ID / Roll no. <span className="font-normal text-ink-400">(optional)</span></label>
                <input id="sid" className="input" value={studentId} onChange={(e) => setStudentId(e.target.value)} maxLength={50} />
              </div>
            )}
            <label className="flex items-start gap-2 text-sm text-ink-700">
              <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-600" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
              I have read the instructions.
            </label>
            <button className="btn-primary btn-lg w-full" disabled={busy || !agree || (quiz.accessMode === 'code' ? !code.trim() : !name.trim())}>
              {busy && <Spinner className="h-4 w-4" />}
              Start quiz
            </button>
          </form>
        )}
      </aside>
    </div>
  );
}
