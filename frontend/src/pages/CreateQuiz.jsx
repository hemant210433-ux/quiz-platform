import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminApi } from '../services/api.js';
import { Alert, ErrorState, Field, PageLoader, Spinner } from '../components/common/ui.jsx';
import QuizHeader from '../components/admin/QuizHeader.jsx';
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
