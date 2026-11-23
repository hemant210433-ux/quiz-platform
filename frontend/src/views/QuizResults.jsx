'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from '@/lib/router.jsx';
import { adminApi, downloadUrls } from '../services/api.js';
import QuizHeader from '../components/admin/QuizHeader.jsx';
import { EmptyState, ErrorState, PageLoader, Pagination, StatCard, Tabs } from '../components/common/ui.jsx';
import { useQuiz } from '../hooks/useQuiz.js';
import { useConfirm } from '../hooks/useConfirm.jsx';
import { useToast } from '../hooks/useToast.jsx';
import { formatDateTime, humanDuration, num } from '../utils/format.js';

const PAGE = 25;
const fmtCode = (c) => (c && c.length === 8 && !c.includes('-') ? `${c.slice(0, 4)}-${c.slice(4)}` : c);

const COLUMNS = [
  { key: 'attemptNumber', label: '#', numeric: true },
  { key: 'studentName', label: 'Student' },
  { key: 'studentId', label: 'ID / Email / Code' },
  { key: 'obtainedMarks', label: 'Score', numeric: true },
  { key: 'percentage', label: '%', numeric: true },
  { key: 'correct', label: 'Correct', numeric: true },
  { key: 'incorrect', label: 'Wrong', numeric: true },
  { key: 'unattempted', label: 'Skipped', numeric: true },
  { key: 'timeTakenSeconds', label: 'Time', numeric: true },
  { key: 'submittedAt', label: 'Submitted' },
];

function useSort(initial) {
  const [sort, setSort] = useState(initial);
  const toggle = (key) => setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }));
  return [sort, toggle];
}

function SortTh({ col, sort, onSort }) {
  const active = sort.key === col.key;
  return (
    <th className={col.numeric ? 'text-right' : ''} aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button className="inline-flex items-center gap-1 uppercase hover:text-ink-800" onClick={() => onSort(col.key)}>
        {col.label}
        <span className={active ? 'text-brand-700' : 'text-ink-300'}>{active ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}</span>
      </button>
    </th>
  );
}

function compare(a, b, key, dir) {
  const va = a[key] ?? '';
  const vb = b[key] ?? '';
  const r = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), undefined, { numeric: true });
  return dir === 'asc' ? r : -r;
}

function StudentTable({ quizId, results, onDelete }) {
  const [search, setSearch] = useState('');
  const [band, setBand] = useState('all');
  const [minPct, setMinPct] = useState(40);
  const [sort, toggle] = useSort({ key: 'submittedAt', dir: 'desc' });
  const [page, setPage] = useState(1);

  const rows = useMemo(() => {
    const s = search.trim().toLowerCase();
    return results
      .filter((r) => !s || [r.studentName, r.studentId, r.email, r.accessCode].some((x) => (x || '').toLowerCase().includes(s)))
      .filter((r) => (band === 'pass' ? r.percentage >= minPct : band === 'fail' ? r.percentage < minPct : band === 'auto' ? r.autoSubmitted : true))
      .sort((a, b) => compare(a, b, sort.key, sort.dir));
  }, [results, search, band, minPct, sort]);

  useEffect(() => setPage(1), [search, band, minPct, sort]);
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE));
  const view = rows.slice((page - 1) * PAGE, page * PAGE);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <input className="input lg:max-w-xs" placeholder="Search name, ID, email or code…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search students" />
        <div className="flex flex-wrap items-center gap-2">
          <select className="input w-auto" value={band} onChange={(e) => setBand(e.target.value)} aria-label="Filter results">
            <option value="all">All results</option>
            <option value="pass">Score ≥ pass mark</option>
            <option value="fail">Score below pass mark</option>
            <option value="auto">Auto-submitted (time up)</option>
          </select>
          {(band === 'pass' || band === 'fail') && (
            <label className="flex items-center gap-2 text-sm text-ink-600">
              Pass mark
              <input type="number" className="input w-20" value={minPct} min={0} max={100} onChange={(e) => setMinPct(Number(e.target.value))} />%
            </label>
          )}
          <span className="text-sm text-ink-500">{rows.length} shown</span>
        </div>
      </div>
      {rows.length === 0 ? (
        <EmptyState title="No matching results" />
      ) : (
        <>
        <ul className="space-y-3 md:hidden">
          {view.map((r) => (
            <li key={r.attemptId} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold leading-snug text-ink-900">{r.studentName}</div>
                  <div className="mt-0.5 break-all text-xs text-ink-500">{[fmtCode(r.accessCode), r.email, r.studentId].filter(Boolean).join(' · ') || `Attempt ${r.attemptNumber}`}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className={`text-xl font-bold tabular-nums ${r.percentage >= 60 ? 'text-good-700' : r.percentage < 33 ? 'text-red-600' : 'text-ink-800'}`}>{num(r.percentage)}%</div>
                  <div className="text-xs tabular-nums text-ink-500">{num(r.obtainedMarks)} / {num(r.totalMarks)}</div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2 rounded-lg bg-ink-50 px-2 py-2 text-center text-xs">
                <div><div className="font-semibold tabular-nums text-good-700">{r.correct}</div>Correct</div>
                <div><div className="font-semibold tabular-nums text-red-600">{r.incorrect}</div>Wrong</div>
                <div><div className="font-semibold tabular-nums text-ink-700">{r.unattempted}</div>Skipped</div>
                <div><div className="font-semibold tabular-nums text-ink-700">{humanDuration(r.timeTakenSeconds)}</div>Time</div>
              </div>
              <div className="mt-2 text-xs text-ink-500">
                {formatDateTime(r.submittedAt)}
                {r.autoSubmitted && <span className="badge ml-1 bg-amberish-100 text-amberish-700">auto</span>}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link className="btn-secondary btn-sm" to={`/admin/quizzes/${quizId}/results/${r.attemptId}`}>View</Link>
                <button className="btn-secondary btn-sm text-red-600" onClick={() => onDelete(r)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
        <div className="card hidden overflow-x-auto md:block">
          <table className="table-base">
            <thead>
              <tr>
                {COLUMNS.map((c) => (
                  <SortTh key={c.key} col={c} sort={sort} onSort={toggle} />
                ))}
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {view.map((r) => (
                <tr key={r.attemptId} className="hover:bg-ink-50/60">
                  <td className="text-right tabular-nums text-ink-500">{r.attemptNumber}</td>
                  <td className="max-w-[220px] truncate font-medium">{r.studentName}</td>
                  <td className="max-w-[200px] truncate text-ink-600">{fmtCode(r.accessCode) || r.email || r.studentId || '—'}</td>
                  <td className="text-right tabular-nums">{num(r.obtainedMarks)} / {num(r.totalMarks)}</td>
                  <td className={`text-right font-semibold tabular-nums ${r.percentage >= 60 ? 'text-good-700' : r.percentage < 33 ? 'text-red-600' : 'text-ink-800'}`}>{num(r.percentage)}%</td>
                  <td className="text-right tabular-nums text-good-700">{r.correct}</td>
                  <td className="text-right tabular-nums text-red-600">{r.incorrect}</td>
                  <td className="text-right tabular-nums text-ink-500">{r.unattempted}</td>
                  <td className="text-right tabular-nums">{humanDuration(r.timeTakenSeconds)}</td>
                  <td className="text-ink-600">
                    {formatDateTime(r.submittedAt)}
                    {r.autoSubmitted && <span className="badge ml-1 bg-amberish-100 text-amberish-700">auto</span>}
                  </td>
                  <td className="whitespace-nowrap">
                    <Link className="btn-ghost btn-sm" to={`/admin/quizzes/${quizId}/results/${r.attemptId}`}>View</Link>
                    <button className="btn-ghost btn-sm text-red-600 hover:bg-red-50" onClick={() => onDelete(r)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
      <Pagination page={page} pageCount={pageCount} onChange={setPage} total={rows.length} pageSize={PAGE} />
    </div>
  );
}

function QuestionPerformance({ items }) {
  const [sort, toggle] = useSort({ key: 'n', dir: 'asc' });
  const [page, setPage] = useState(1);
  const rows = useMemo(() => [...items].sort((a, b) => compare(a, b, sort.key, sort.dir)), [items, sort]);
  useEffect(() => setPage(1), [sort]);
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE));
  const cols = [
    { key: 'n', label: '#', numeric: true },
    { key: 'question', label: 'Question' },
    { key: 'attempted', label: 'Attempted', numeric: true },
    { key: 'correct', label: 'Correct', numeric: true },
    { key: 'accuracy', label: 'Accuracy', numeric: true },
  ];
  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-500">Sort by accuracy to find the hardest questions. The distribution shows how many students picked each option.</p>
      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              {cols.map((c) => (
                <SortTh key={c.key} col={c} sort={sort} onSort={toggle} />
              ))}
              <th>Picks (A / B / C / D)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {rows.slice((page - 1) * PAGE, page * PAGE).map((q) => (
              <tr key={q.id}>
                <td className="text-right tabular-nums text-ink-500">{q.n}</td>
                <td className="max-w-[360px] truncate" title={q.question}>{q.question}</td>
                <td className="text-right tabular-nums">{q.attempted}</td>
                <td className="text-right tabular-nums">{q.correct}</td>
                <td className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-ink-100">
                      <div className={`h-full ${q.accuracy >= 60 ? 'bg-good-500' : q.accuracy >= 35 ? 'bg-amberish-500' : 'bg-red-500'}`} style={{ width: `${q.accuracy}%` }} />
                    </div>
                    <span className="w-12 tabular-nums">{q.attempted ? `${num(q.accuracy)}%` : '—'}</span>
                  </div>
                </td>
                <td className="tabular-nums text-ink-600">
                  {(q.type === 'tf' ? ['A', 'B'] : ['A', 'B', 'C', 'D']).map((k, i) => (
                    <span key={k} className={k === q.correct_answer ? 'font-semibold text-good-700' : ''}>
                      {i > 0 && ' / '}
                      {q.distribution[k]}
                    </span>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pageCount={pageCount} onChange={setPage} total={rows.length} pageSize={PAGE} />
    </div>
  );
}

function StartedList({ items, onDelete }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-500">These students pressed Start but have not submitted. If someone is stuck or this is a duplicate, delete it so they can start again. Unfinished attempts are scored automatically when their time is over.</p>
      <ul className="card divide-y divide-ink-100">
        {items.map((r) => (
          <li key={r.attemptId} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium text-ink-900">{r.studentName}</div>
              <div className="truncate text-xs text-ink-500">{[r.accessCode, r.email, r.studentId].filter(Boolean).join(' · ') || '—'} · started {formatDateTime(r.startedAt)}</div>
            </div>
            <button className="btn-ghost btn-sm text-red-600 hover:bg-red-50" onClick={() => onDelete(r)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function QuizResults() {
  const { quizId } = useParams();
  const { quiz } = useQuiz(quizId);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('students');
  const confirm = useConfirm();
  const toast = useToast();

  const removeAttempt = async (r, started = false) => {
    const ok = await confirm({
      title: 'Delete this attempt?',
      message: `${r.studentName}${started ? ' (not submitted yet)' : ` – ${num(r.obtainedMarks)} / ${num(r.totalMarks)}`} will be removed from the results and the totals, and the student can try again.`,
      confirmLabel: 'Delete attempt',
      danger: true,
    });
    if (!ok) return;
    try {
      await adminApi.deleteAttempt(quizId, r.attemptId);
      toast.success('Attempt deleted.');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const load = useCallback(() => {
    adminApi.results(quizId).then(setData).catch(setError);
  }, [quizId]);
  useEffect(() => {
    load();
  }, [load]);

  if (error) return <ErrorState message={error.message} />;
  if (!data || !quiz) return <PageLoader />;
  const a = data.analytics;

  return (
    <div>
      <QuizHeader
        quiz={quiz}
        actions={
          <>
            <button className="btn-secondary btn-sm" onClick={load}>Refresh</button>
            <a className="btn-primary btn-sm" href={downloadUrls.resultsCsv(quiz.id)}>Export CSV</a>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total attempts" value={a.totalAttempts} sub={a.inProgressAttempts ? `${a.inProgressAttempts} in progress` : undefined} />
        <StatCard label="Completed" value={a.completedAttempts} />
        <StatCard label="Average score" value={num(a.averageScore)} sub={`of ${num(data.quiz.totalMarks)}`} />
        <StatCard label="Highest" value={num(a.highestScore)} tone="good" />
        <StatCard label="Lowest" value={num(a.lowestScore)} tone={a.completedAttempts ? 'bad' : 'default'} />
        <StatCard label="Average %" value={`${num(a.averagePercentage)}%`} />
      </div>

      <div className="mt-6">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'students', label: 'Student results', count: data.results.length },
            { value: 'questions', label: 'Question-wise performance', count: data.questionPerformance.length },
            ...(data.inProgress?.length ? [{ value: 'started', label: 'Started, not submitted', count: data.inProgress.length }] : []),
          ]}
        />
      </div>
      <div className="mt-4">
        {tab === 'started' ? (
          <StartedList items={data.inProgress || []} onDelete={(r) => removeAttempt(r, true)} />
        ) : data.results.length === 0 && tab === 'students' ? (
          <EmptyState icon="◷" title="No submissions yet" message={quiz.status === 'published' ? 'Results will appear here as soon as students submit.' : 'Publish the quiz and share the link to start collecting results.'} />
        ) : tab === 'students' ? (
          <StudentTable quizId={quiz.id} results={data.results} onDelete={removeAttempt} />
        ) : (
          <QuestionPerformance items={data.questionPerformance} />
        )}
      </div>
    </div>
  );
}
