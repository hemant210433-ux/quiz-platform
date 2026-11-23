'use client';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from '@/lib/router.jsx';
import { adminApi } from '../services/api.js';
import { Alert, ErrorState, Field, PageLoader, Spinner } from '../components/common/ui.jsx';
import QuizHeader from '../components/admin/QuizHeader.jsx';
import AccessCodes from '../components/admin/AccessCodes.jsx';
import { useToast } from '../hooks/useToast.jsx';
import { isoToLocalInput, localInputToIso } from '../utils/format.js';

const EMPTY = {
  title: '',
  description: '',
  instructions: '',
  durationMinutes: 30,
  marksPerQuestion: 1,
  negativeMarking: false,
  negativeMarks: 0.25,
  maxAttempts: '',
  startAt: '',
  endAt: '',
  slug: '',
  accessMode: 'name',
  lockDevice: true,
  allowedEmails: '',
  module: '',
  topic: '',
  year: '',
  seoTitle: '',
  seoDescription: '',
};

function fromQuiz(q) {
  return {
    title: q.title,
    description: q.description,
    instructions: q.instructions,
    durationMinutes: q.durationMinutes,
    marksPerQuestion: q.marksPerQuestion,
    negativeMarking: q.negativeMarking,
    negativeMarks: q.negativeMarking ? q.negativeMarks : 0.25,
    maxAttempts: q.maxAttempts ?? '',
    accessMode: q.accessMode || 'name',
    lockDevice: q.lockDevice !== false,
    allowedEmails: (q.allowedEmails || []).join('\n'),
    module: q.module || '',
    topic: q.topic || '',
    year: q.year ?? '',
    seoTitle: q.seoTitle || '',
    seoDescription: q.seoDescription || '',
    startAt: isoToLocalInput(q.startAt),
    endAt: isoToLocalInput(q.endAt),
    slug: q.slug,
  };
}

export default function CreateQuiz() {
  const { quizId } = useParams();
  const editing = Boolean(quizId);
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(editing);
  const [loadError, setLoadError] = useState(null);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!editing) return;
    adminApi
      .getQuiz(quizId)
      .then((r) => {
        setQuiz(r.quiz);
        setForm(fromQuiz(r.quiz));
      })
      .catch(setLoadError)
      .finally(() => setLoading(false));
  }, [editing, quizId]);

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setFormError('');
    const payload = {
      title: form.title.trim(),
      description: form.description,
      instructions: form.instructions,
      durationMinutes: Number(form.durationMinutes),
      marksPerQuestion: Number(form.marksPerQuestion),
      negativeMarking: form.negativeMarking,
      negativeMarks: form.negativeMarking ? Number(form.negativeMarks) : 0,
      maxAttempts: form.maxAttempts === '' ? null : Number(form.maxAttempts),
      startAt: localInputToIso(form.startAt),
      endAt: localInputToIso(form.endAt),
      slug: form.slug.trim() || undefined,
      accessMode: form.accessMode,
      lockDevice: form.lockDevice,
      allowedEmails: form.accessMode === 'email' ? form.allowedEmails : '',
      module: form.module || null,
      topic: form.topic.trim() || null,
      year: form.year === '' ? null : Number(form.year),
      seoTitle: form.seoTitle.trim() || null,
      seoDescription: form.seoDescription.trim() || null,
    };
    // quick client-side checks; the server validates again
    const errs = {};
    if (!payload.title) errs.title = 'Title is required.';
    if (!(payload.durationMinutes >= 1)) errs.durationMinutes = 'Enter at least 1 minute.';
    if (!(payload.marksPerQuestion > 0)) errs.marksPerQuestion = 'Must be greater than 0.';
    if (payload.startAt && payload.endAt && payload.endAt <= payload.startAt) errs.endAt = 'End must be after start.';
    if (Object.keys(errs).length) return setErrors(errs);

    setBusy(true);
    try {
      if (editing) {
        const r = await adminApi.updateQuiz(quizId, payload);
        setQuiz(r.quiz);
        setForm(fromQuiz(r.quiz));
        toast.success('Quiz details saved.');
      } else {
        const r = await adminApi.createQuiz(payload);
        toast.success('Quiz created. Now add your questions.');
        navigate(`/admin/quizzes/${r.quiz.id}/import`);
      }
    } catch (err) {
      if (err.details?.length) {
        const map = {};
        for (const d of err.details) if (d.path) map[d.path] = d.message;
        setErrors(map);
      }
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <PageLoader />;
  if (loadError) return <ErrorState message={loadError.message} />;

  return (
    <div>
      {editing ? (
        <QuizHeader quiz={quiz} />
      ) : (
        <div className="mb-6">
          <h1 className="page-title">Create a new quiz</h1>
          <p className="mt-1 text-sm text-ink-500">Set up the quiz details. You’ll paste or import questions in the next step.</p>
        </div>
      )}

      <form onSubmit={submit} className="space-y-6" noValidate>
        {formError && <Alert tone="error">{formError}</Alert>}

        <section className="card card-pad space-y-5">
          <h2 className="section-title">Basics</h2>
          <Field label="Quiz title *" htmlFor="title" error={errors.title}>
            <input id="title" className={`input ${errors.title ? 'input-error' : ''}`} value={form.title} onChange={set('title')} maxLength={200} placeholder="e.g. CCC Practice Test – September 2026" />
          </Field>
          <Field label="Description" htmlFor="description" hint="Shown to students on the quiz landing page.">
            <textarea id="description" className="input min-h-[80px]" value={form.description} onChange={set('description')} maxLength={5000} />
          </Field>
          <Field label="Instructions" htmlFor="instructions" hint="One instruction per line works well.">
            <textarea id="instructions" className="input min-h-[110px]" value={form.instructions} onChange={set('instructions')} maxLength={10000} placeholder={'Each question has one correct answer.\nYou can change answers until you submit.'} />
          </Field>
          {editing && (
            <Field label="Public link" htmlFor="slug" error={errors.slug} hint="Lowercase letters, numbers and hyphens. Changing it breaks links you already shared.">
              <div className="flex items-center rounded-lg ring-1 ring-inset ring-ink-200 focus-within:ring-2 focus-within:ring-brand-500">
                <span className="pl-3 text-sm text-ink-400">/quiz/</span>
                <input id="slug" className="input ring-0 focus:ring-0" value={form.slug} onChange={set('slug')} maxLength={80} />
              </div>
            </Field>
          )}
        </section>

        <section className="card card-pad space-y-5">
          <h2 className="section-title">Timing & marking</h2>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Duration (minutes) *" htmlFor="duration" error={errors.durationMinutes}>
              <input id="duration" type="number" min="1" max="1440" className="input" value={form.durationMinutes} onChange={set('durationMinutes')} />
            </Field>
            <Field label="Marks per question *" htmlFor="marks" error={errors.marksPerQuestion}>
              <input id="marks" type="number" min="0.25" step="0.25" className="input" value={form.marksPerQuestion} onChange={set('marksPerQuestion')} />
            </Field>
            <Field label="Max attempts per student" htmlFor="maxAttempts" hint="Leave empty for unlimited." error={errors.maxAttempts}>
              <input id="maxAttempts" type="number" min="1" className="input" value={form.maxAttempts} onChange={set('maxAttempts')} placeholder="Unlimited" />
            </Field>
          </div>
          <div className="rounded-lg bg-ink-50 p-4">
            <label className="flex items-center gap-3 text-sm font-medium text-ink-800">
              <input type="checkbox" className="h-4 w-4 rounded border-ink-300 text-brand-600" checked={form.negativeMarking} onChange={set('negativeMarking')} />
              Enable negative marking
            </label>
            {form.negativeMarking && (
              <div className="mt-3 max-w-xs">
                <Field label="Marks deducted per wrong answer" htmlFor="neg" error={errors.negativeMarks}>
                  <input id="neg" type="number" min="0" step="0.05" className="input" value={form.negativeMarks} onChange={set('negativeMarks')} />
                </Field>
              </div>
            )}
          </div>
        </section>

        <section className="card card-pad space-y-5">
          <div>
            <h2 className="section-title">Availability (optional)</h2>
            <p className="mt-1 text-sm text-ink-500">Students can only start the quiz inside this window. Times use your local time zone.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Opens at" htmlFor="startAt" error={errors.startAt}>
              <input id="startAt" type="datetime-local" className="input" value={form.startAt} onChange={set('startAt')} />
            </Field>
            <Field label="Closes at" htmlFor="endAt" error={errors.endAt} hint="Attempts in progress end at this time.">
              <input id="endAt" type="datetime-local" className="input" value={form.endAt} onChange={set('endAt')} />
            </Field>
          </div>
        </section>

        <section className="card card-pad space-y-5">
          <div>
            <h2 className="section-title">How students identify themselves</h2>
            <p className="mt-1 text-sm text-ink-500">This decides who can start the quiz and what counts as “the same student” for the attempt limit.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Student identification">
            {[
              ['name', 'Name + Roll no.', 'Anyone with the link. Easiest, but a student can type a different name.'],
              ['email', 'Email', 'Limit is counted per email. Optionally allow only your list of emails.'],
              ['code', 'Personal access code', 'Best for your institute. One secret code per student – like a password.'],
            ].map(([v, title, hint]) => (
              <label key={v} className={`cursor-pointer rounded-xl p-4 ring-1 ring-inset transition ${form.accessMode === v ? 'bg-brand-50 ring-2 ring-brand-500' : 'bg-white ring-ink-200 hover:bg-ink-50'}`}>
                <input type="radio" name="accessMode" value={v} checked={form.accessMode === v} onChange={set('accessMode')} className="sr-only" />
                <div className="text-sm font-bold text-ink-900">{title}</div>
                <div className="mt-1 text-xs leading-relaxed text-ink-600">{hint}</div>
              </label>
            ))}
          </div>
          {form.accessMode !== 'code' && (
            <label className="flex items-start gap-3 rounded-lg bg-ink-50 p-4 text-sm text-ink-800">
              <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-600" checked={form.lockDevice} onChange={set('lockDevice')} />
              <span>
                <b>Also limit by device</b> (recommended)
                <span className="block text-xs text-ink-600">If “Max attempts” is set, the same phone/computer cannot start again just by changing the name. Turn this off if several students share one device.</span>
              </span>
            </label>
          )}
          {form.accessMode === 'email' && (
            <Field label="Allowed emails (optional)" htmlFor="allowedEmails" hint="One per line. Leave empty to accept any email. Students must enter exactly one of these.">
              <textarea id="allowedEmails" className="input min-h-[100px] font-mono text-sm" value={form.allowedEmails} onChange={set('allowedEmails')} placeholder={'student1@gmail.com\nstudent2@gmail.com'} />
            </Field>
          )}
          {form.accessMode === 'code' &&
            (editing ? (
              <div>
                <h3 className="text-sm font-bold text-ink-900">Access codes</h3>
                <p className="mb-3 mt-0.5 text-xs text-ink-500">Save the quiz details first if you just switched to “Personal access code”.</p>
                {quiz?.accessMode === 'code' ? <AccessCodes quizId={quizId} /> : <Alert tone="warn">Click “Save details” below, then create the codes here.</Alert>}
              </div>
            ) : (
              <Alert tone="info">After you create the quiz, open its “Edit details” page to generate the codes.</Alert>
            ))}
        </section>

        <section className="card card-pad space-y-5">
          <h2 className="section-title">Public website (optional)</h2>
          <p className="-mt-3 text-sm text-ink-500">Used to list this quiz under an O Level module and for search-engine titles. Leave empty for a private quiz link.</p>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Module" htmlFor="module">
              <select id="module" className="input" value={form.module} onChange={set('module')}>
                <option value="">— None —</option>
                <option value="m1-r5">M1-R5 · IT Tools and Network Basics</option>
                <option value="m2-r5">M2-R5 · Web Designing and Publishing</option>
                <option value="m3-r5">M3-R5 · Programming (Python)</option>
                <option value="m4-r5">M4-R5 · Introduction to IoT</option>
              </select>
            </Field>
            <Field label="Topic" htmlFor="topic">
              <input id="topic" className="input" value={form.topic} onChange={set('topic')} maxLength={120} />
            </Field>
            <Field label="Year" htmlFor="year" hint="Only if the paper is year-wise.">
              <input id="year" type="number" min="2000" max="2100" className="input" value={form.year} onChange={set('year')} />
            </Field>
          </div>
          <Field label="SEO title" htmlFor="seoTitle" hint="Shown in Google results. Leave empty to use the quiz title.">
            <input id="seoTitle" className="input" value={form.seoTitle} onChange={set('seoTitle')} maxLength={120} />
          </Field>
          <Field label="SEO description" htmlFor="seoDescription">
            <textarea id="seoDescription" className="input min-h-[70px]" value={form.seoDescription} onChange={set('seoDescription')} maxLength={300} />
          </Field>
        </section>

        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy && <Spinner className="h-4 w-4" />}
            {editing ? 'Save details' : 'Create quiz & add questions'}
          </button>
        </div>
      </form>
    </div>
  );
}
