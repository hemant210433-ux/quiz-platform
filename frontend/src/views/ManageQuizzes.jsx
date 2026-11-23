'use client';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from '@/lib/router.jsx';
import { adminApi } from '../services/api.js';
import { EmptyState, ErrorState, PageLoader, StatusBadge, Tabs } from '../components/common/ui.jsx';
import { useToast } from '../hooks/useToast.jsx';
import { useConfirm } from '../hooks/useConfirm.jsx';
import { formatDateTime } from '../utils/format.js';

export default function ManageQuizzes() {
  const [quizzes, setQuizzes] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const toast = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();

  const load = () => adminApi.listQuizzes().then((r) => setQuizzes(r.quizzes)).catch(setError);
  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(() => {
    if (!quizzes) return [];
    const s = search.trim().toLowerCase();
    return quizzes.filter((q) => (filter === 'all' || q.status === filter) && (!s || q.title.toLowerCase().includes(s) || q.slug.includes(s)));
  }, [quizzes, filter, search]);

  if (error) return <ErrorState message={error.message} />;
  if (!quizzes) return <PageLoader />;

  const count = (s) => quizzes.filter((q) => q.status === s).length;

  const duplicate = async (q) => {
    try {
      const r = await adminApi.duplicate(q.id);
      toast.success('Quiz duplicated as a draft.');
      navigate(`/admin/quizzes/${r.quiz.id}`);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const remove = async (q) => {
    const ok = await confirm({
      title: 'Delete quiz?',
      message: (
        <>
          This permanently deletes <b>{q.title}</b>, its {q.questionCount} questions and {q.attempts} student attempts. This cannot be undone.
        </>
      ),
      confirmLabel: 'Delete quiz',
      danger: true,
      requireText: q.attempts > 0 ? 'DELETE' : undefined,
    });
    if (!ok) return;
    try {
      await adminApi.deleteQuiz(q.id);
      toast.success('Quiz deleted.');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Quizzes</h1>
          <p className="mt-1 text-sm text-ink-500">Create, edit, publish and manage every quiz.</p>
        </div>
        <Link to="/admin/quizzes/new" className="btn-primary">+ Create quiz</Link>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={filter}
          onChange={setFilter}
          tabs={[
            { value: 'all', label: 'All', count: quizzes.length },
            { value: 'published', label: 'Published', count: count('published') },
            { value: 'draft', label: 'Draft', count: count('draft') },
            { value: 'closed', label: 'Closed', count: count('closed') },
            { value: 'archived', label: 'Archived', count: count('archived') },
          ]}
        />
        <input className="input sm:max-w-xs" placeholder="Search quizzes…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search quizzes" />
      </div>

      <div className="mt-4">
        {visible.length === 0 ? (
          <EmptyState title={quizzes.length ? 'No quizzes match' : 'No quizzes yet'} message={quizzes.length ? 'Try another filter or search.' : 'Create a quiz to get started.'} action={!quizzes.length && <Link to="/admin/quizzes/new" className="btn-primary">Create quiz</Link>} />
        ) : (
          <>
          <ul className="space-y-3 md:hidden">
            {visible.map((q) => (
              <li key={q.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <Link to={`/admin/quizzes/${q.id}`} className="min-w-0 font-semibold leading-snug text-ink-900">{q.title}</Link>
                  <StatusBadge status={q.status} />
                </div>
                <div className="mt-0.5 break-all text-xs text-ink-500">/quiz/{q.slug}</div>
                <dl className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-ink-50 px-3 py-2 text-center">
                  <div><dt className="text-[11px] text-ink-500">Questions</dt><dd className="font-semibold tabular-nums">{q.questionCount}</dd></div>
                  <div><dt className="text-[11px] text-ink-500">Results</dt><dd className="font-semibold tabular-nums">{q.submissions}</dd></div>
                  <div><dt className="text-[11px] text-ink-500">Attempts</dt><dd className="font-semibold tabular-nums">{q.attempts ?? 0}</dd></div>
                </dl>
                {q.invalidCount > 0 && <p className="mt-2 text-xs font-semibold text-red-600">{q.invalidCount} invalid question(s)</p>}
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <Link to={`/admin/quizzes/${q.id}`} className="btn-secondary btn-sm">Open</Link>
                  <button className="btn-secondary btn-sm" onClick={() => duplicate(q)}>Duplicate</button>
                  <button className="btn-secondary btn-sm text-red-600" onClick={() => remove(q)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
          <div className="card hidden overflow-x-auto md:block">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Quiz</th>
                  <th>Status</th>
                  <th className="text-right">Questions</th>
                  <th className="text-right">Results</th>
                  <th>Updated</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {visible.map((q) => (
                  <tr key={q.id} className="hover:bg-ink-50/60">
                    <td className="max-w-xs">
                      <Link to={`/admin/quizzes/${q.id}`} className="block truncate font-medium text-ink-900 hover:text-brand-700">{q.title}</Link>
                      <div className="truncate text-xs text-ink-500">/quiz/{q.slug}</div>
                    </td>
                    <td><StatusBadge status={q.status} /></td>
                    <td className="text-right tabular-nums">
                      {q.questionCount}
                      {q.invalidCount > 0 && <span className="ml-1 text-xs font-semibold text-red-600">({q.invalidCount} invalid)</span>}
                    </td>
                    <td className="text-right tabular-nums">
                      <Link to={`/admin/quizzes/${q.id}/results`} className="hover:text-brand-700">{q.submissions}</Link>
                    </td>
                    <td className="text-ink-500">{formatDateTime(q.updatedAt)}</td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link to={`/admin/quizzes/${q.id}`} className="btn-ghost btn-sm">Open</Link>
                        <button className="btn-ghost btn-sm" onClick={() => duplicate(q)}>Duplicate</button>
                        <button className="btn-ghost btn-sm text-red-600 hover:bg-red-50" onClick={() => remove(q)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>
    </div>
  );
}
