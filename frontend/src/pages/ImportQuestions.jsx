import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { adminApi } from '../services/api.js';
import QuizHeader from '../components/admin/QuizHeader.jsx';
import QuestionEditor from '../components/admin/QuestionEditor.jsx';
import { Alert, EmptyState, ErrorState, PageLoader, Spinner, Tabs } from '../components/common/ui.jsx';
import { useQuiz } from '../hooks/useQuiz.js';
import { useToast } from '../hooks/useToast.jsx';
import { useConfirm } from '../hooks/useConfirm.jsx';
import { SAMPLE_MCQS } from '../utils/format.js';

/** Sidebar "Bulk Import" entry: choose which quiz to import into. */
function PickQuiz() {
  const [quizzes, setQuizzes] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    adminApi.listQuizzes().then((r) => setQuizzes(r.quizzes)).catch(setError);
  }, []);
  if (error) return <ErrorState message={error.message} />;
  if (!quizzes) return <PageLoader />;
  const editable = quizzes.filter((q) => q.status !== 'published');
  return (
    <div>
      <h1 className="page-title">Bulk import</h1>
      <p className="mt-1 text-sm text-ink-500">Choose the quiz you want to add questions to, or create a new one.</p>
      <div className="mt-6">
        {editable.length === 0 ? (
          <EmptyState title="No editable quizzes" message="Create a quiz first. Published quizzes must be unpublished before their questions can change." action={<Link className="btn-primary" to="/admin/quizzes/new">Create quiz</Link>} />
        ) : (
          <div className="card divide-y divide-ink-100">
            {editable.map((q) => (
              <Link key={q.id} to={`/admin/quizzes/${q.id}/import`} className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-ink-50">
                <div className="min-w-0">
                  <div className="truncate font-medium">{q.title}</div>
                  <div className="text-xs text-ink-500">{q.questionCount} questions · {q.status}</div>
                </div>
                <span className="text-sm font-medium text-brand-700">Import →</span>
              </Link>
            ))}
            <Link to="/admin/quizzes/new" className="block px-5 py-4 text-sm font-medium text-brand-700 hover:bg-ink-50">+ Create a new quiz</Link>
          </div>
        )}
      </div>
    </div>
  );
}

function ImportIntoQuiz({ quizId }) {
  const { quiz, loading, error } = useQuiz(quizId);
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const [source, setSource] = useState('text');
  const [text, setText] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [busy, setBusy] = useState(false);
  const [inputError, setInputError] = useState(null);
  const [parsed, setParsed] = useState(null); // { questions, globalErrors, stats, mode }
  const fileRef = useRef(null);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error.message} />;

  const locked = quiz.status === 'published';
  const lineCount = text ? text.split(/\r\n|\r|\n/).length : 0;

  const parseText = async () => {
    setInputError(null);
    setBusy(true);
    try {
      const r = await adminApi.parseText(text);
      if (!r.questions.length) {
        setInputError({ message: r.globalErrors[0]?.message || 'No questions found.' });
      } else {
        setParsed(r);
        window.scrollTo({ top: 0 });
      }
    } catch (e) {
      setInputError(e);
    } finally {
      setBusy(false);
    }
  };

  const validateJson = async (raw) => {
    setInputError(null);
    setBusy(true);
    try {
      const r = await adminApi.validateJson(raw);
      if (!r.questions.length) setInputError({ message: 'The JSON contains no questions.' });
      else {
        setParsed({ questions: r.questions, globalErrors: [], stats: r.stats, mode: 'json' });
        window.scrollTo({ top: 0 });
      }
    } catch (e) {
      setInputError(e);
    } finally {
      setBusy(false);
    }
  };

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (f.size > 20 * 1024 * 1024) return setInputError({ message: 'File is larger than 20 MB.' });
    const content = await f.text();
    if (f.name.toLowerCase().endsWith('.json')) {
      setSource('json');
      setJsonText(content);
      validateJson(content);
    } else {
      setSource('text');
      setText(content);
    }
  };

  const save = (mode) => async (questions, { invalid }) => {
    if (mode === 'replace' && quiz.questionCount > 0) {
      const ok = await confirm({
        title: 'Replace all questions?',
        message: `The quiz currently has ${quiz.questionCount} question(s). They will be replaced by the ${questions.length} imported question(s).`,
        confirmLabel: 'Replace',
        danger: true,
      });
      if (!ok) throw Object.assign(new Error('Cancelled'), { silent: true });
    }
    const r = await adminApi.saveQuestions(quiz.id, questions, mode);
    toast.success(`${r.stats.total} questions saved to the quiz${invalid ? ` (${r.stats.invalid} still invalid)` : ''}.`);
    navigate(r.stats.invalid ? `/admin/quizzes/${quiz.id}/questions` : `/admin/quizzes/${quiz.id}`);
  };

  const wrap = (fn) => async (...args) => {
    try {
      await fn(...args);
    } catch (e) {
      if (!e.silent) throw e;
    }
  };

  return (
    <div>
      <QuizHeader quiz={quiz} />

      {locked ? (
        <Alert tone="warn" title="This quiz is published">
          Unpublish it from the <Link className="underline" to={`/admin/quizzes/${quiz.id}`}>Overview</Link> before importing questions, so students in the middle of an attempt are not affected.
        </Alert>
      ) : parsed ? (
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="section-title">Review imported questions</h2>
              <p className="text-sm text-ink-500">
                Nothing is saved yet. Fix or delete invalid questions, then save them to the quiz.
                {parsed.stats?.parseMs !== undefined && ` Parsed in ${parsed.stats.parseMs} ms.`}
              </p>
            </div>
            <button className="btn-secondary btn-sm" onClick={async () => {
              if (await confirm({ title: 'Discard this preview?', message: 'Edits made in the preview will be lost.', confirmLabel: 'Discard' })) setParsed(null);
            }}>
              ← Back to input
            </button>
          </div>
          <QuestionEditor
            key={parsed.questions.length + (parsed.mode || '')}
            initialQuestions={parsed.questions}
            globalErrors={parsed.globalErrors}
            actions={[
              ...(quiz.questionCount > 0 ? [{ label: `Append to existing ${quiz.questionCount}`, onClick: wrap(save('append')) }] : []),
              { label: quiz.questionCount > 0 ? 'Replace all questions' : 'Save questions to quiz', primary: true, onClick: wrap(save('replace')) },
            ]}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Tabs value={source} onChange={setSource} tabs={[{ value: 'text', label: 'Paste MCQ text' }, { value: 'json', label: 'Import JSON' }]} />
            <div className="flex gap-2">
              <input ref={fileRef} type="file" accept=".txt,.json,text/plain,application/json" className="hidden" onChange={onFile} />
              <button className="btn-secondary btn-sm" onClick={() => fileRef.current?.click()}>Upload .txt / .json file</button>
            </div>
          </div>

          {inputError && (
            <Alert tone="error" title={inputError.message}>
              {Array.isArray(inputError.details) && (
                <ul className="mt-1 list-disc pl-5">
                  {inputError.details.slice(0, 8).map((d, i) => (
                    <li key={i}>{d.message || String(d)}</li>
                  ))}
                </ul>
              )}
            </Alert>
          )}

          {source === 'text' ? (
            <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
              <div className="card overflow-hidden">
                <textarea
                  className="block h-[60vh] min-h-[320px] w-full resize-y border-0 p-4 font-mono text-[13px] leading-relaxed focus:ring-0"
                  placeholder={'Q1. What is the full form of CPU?\nA. Central Processing Unit\nB. Computer Processing Unit\nC. Central Program Unit\nD. Control Processing Unit\nAnswer: A\nExplanation: CPU stands for Central Processing Unit.\n\nQ2. …'}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  spellCheck={false}
                  aria-label="Paste MCQ text"
                />
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink-100 bg-ink-50 px-4 py-2.5">
                  <span className="text-xs tabular-nums text-ink-500">{lineCount.toLocaleString()} lines · {text.length.toLocaleString()} characters</span>
                  <div className="flex gap-2">
                    {text && <button className="btn-ghost btn-sm" onClick={() => setText('')}>Clear</button>}
                    <button className="btn-primary" onClick={parseText} disabled={busy || !text.trim()}>
                      {busy && <Spinner className="h-4 w-4" />}
                      Parse & validate
                    </button>
                  </div>
                </div>
              </div>
              <aside className="card card-pad h-fit text-sm text-ink-600">
                <h3 className="font-semibold text-ink-900">Supported format</h3>
                <ul className="mt-2 space-y-1.5">
                  <li><b>Questions:</b> <code>Q1.</code> <code>Q.1</code> <code>Question 1:</code> <code>प्रश्न 1.</code> (or plain <code>1.</code>)</li>
                  <li><b>Options:</b> <code>A.</code> <code>(a)</code> <code>A)</code> <code>(क)</code></li>
                  <li><b>Answer:</b> <code>Answer: A</code> <code>Ans - (b)</code> <code>उत्तर: ख</code></li>
                  <li><b>Explanation</b> (optional): <code>Explanation:</code> <code>Solution:</code> <code>व्याख्या:</code></li>
                </ul>
                <p className="mt-3">Questions, options and explanations may span several lines. Blank lines are ignored. Up to thousands of questions at once.</p>
                <button className="btn-secondary btn-sm mt-4 w-full" onClick={() => setText(SAMPLE_MCQS)}>Load sample questions</button>
              </aside>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <textarea
                className="block h-[50vh] min-h-[280px] w-full resize-y border-0 p-4 font-mono text-[13px] focus:ring-0"
                placeholder={'[\n  {\n    "question_no": 1,\n    "question": "What is the full form of CPU?",\n    "options": { "A": "…", "B": "…", "C": "…", "D": "…" },\n    "correct_answer": "A",\n    "explanation": "…"\n  }\n]'}
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                spellCheck={false}
                aria-label="Paste questions JSON"
              />
              <div className="flex justify-end border-t border-ink-100 bg-ink-50 px-4 py-2.5">
                <button className="btn-primary" onClick={() => validateJson(jsonText)} disabled={busy || !jsonText.trim()}>
                  {busy && <Spinner className="h-4 w-4" />}
                  Validate JSON
                </button>
              </div>
            </div>
          )}
          <p className="text-xs text-ink-400">
            Tip: you can also add or edit questions one by one on the{' '}
            <Link className="underline" to={`/admin/quizzes/${quiz.id}/questions`}>Questions</Link> tab.
          </p>
        </div>
      )}
    </div>
  );
}

export default function ImportQuestions() {
  const { quizId } = useParams();
  return quizId ? <ImportIntoQuiz quizId={quizId} /> : <PickQuiz />;
}
