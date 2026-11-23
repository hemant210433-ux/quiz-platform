'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { adminApi } from '../../services/api.js';
import QuestionCard from './QuestionCard.jsx';
import { Alert, EmptyState, Pagination, Spinner, StatCard } from '../common/ui.jsx';
import { useConfirm } from '../../hooks/useConfirm.jsx';
import { useToast } from '../../hooks/useToast.jsx';

const PAGE_SIZE = 20;
const TF_OPTIONS = { A: 'सही (True)', B: 'गलत (False)' };
let keySeq = 0;
const nextKey = () => `k${++keySeq}`;

const toItem = (q) => ({
  _key: nextKey(),
  id: q.id,
  type: q.type === 'tf' ? 'tf' : 'mcq',
  question_no: q.question_no ?? null,
  question: q.question ?? '',
  options: { A: q.options?.A ?? '', B: q.options?.B ?? '', C: q.options?.C ?? '', D: q.options?.D ?? '' },
  correct_answer: q.correct_answer ?? '',
  explanation: q.explanation ?? '',
  source_line: q.source_line ?? null,
  errors: q.errors || [],
  warnings: q.warnings || [],
});

// Parse-time problems (e.g. "option B appears twice") are only known for the
// original text, so keep them until the admin edits that question.
const stripForServer = (it) => ({
  id: it.id,
  type: it.type === 'tf' ? 'tf' : 'mcq',
  question_no: it.question_no,
  question: it.question,
  options: it.options,
  correct_answer: it.correct_answer,
  explanation: it.explanation,
  ...(it._parseErrors ? { parse_errors: it._parseErrors } : {}),
});

function seedParseErrors(q) {
  const pe = (q.errors || []).filter((e) => e.code === 'MALFORMED_BLOCK').map((e) => e.message);
  return pe.length ? pe : undefined;
}

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'valid', label: 'Valid' },
  { value: 'invalid', label: 'Invalid' },
  { value: 'duplicates', label: 'Duplicate numbers' },
  { value: 'missing', label: 'Missing answers' },
];

/**
 * Preview + editor for a (possibly large) list of questions.
 * Edits are kept locally and re-validated on the server (debounced) after every change.
 */
export default function QuestionEditor({ initialQuestions, globalErrors = [], readOnly = false, actions = [], onDirtyChange, headerExtra }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [items, setItems] = useState(() =>
    initialQuestions.map((q) => {
      const it = toItem(q);
      const pe = seedParseErrors(q);
      if (pe) it._parseErrors = pe;
      return it;
    }),
  );
  const [version, setVersion] = useState(0); // bumps on every local edit
  const [validatedVersion, setValidatedVersion] = useState(0);
  const [stats, setStats] = useState(null);
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [dirty, setDirty] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editingKey, setEditingKey] = useState(null);
  const [saving, setSaving] = useState(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => onDirtyChange?.(dirty), [dirty, onDirtyChange]);

  // Warn before leaving with unsaved edits
  useEffect(() => {
    if (!dirty) return undefined;
    const h = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  const runValidation = useCallback(async (v, signal) => {
    setValidating(true);
    setValidationError('');
    try {
      const snapshot = itemsRef.current;
      const r = await adminApi.validateQuestions(snapshot.map(stripForServer), signal);
      setItems((cur) => {
        if (cur !== snapshot) return cur; // edited meanwhile – a newer validation will follow
        return cur.map((it, i) => ({ ...it, errors: r.questions[i]?.errors || [], warnings: it.warnings }));
      });
      setStats(r.stats);
      setValidatedVersion(v);
    } catch (e) {
      if (e.name !== 'AbortError') setValidationError(e.message);
    } finally {
      setValidating(false);
    }
  }, []);

  // Initial validation + debounced re-validation after edits
  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(() => runValidation(version, ctrl.signal), version === 0 ? 0 : 500);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [version, runValidation]);

  const mutate = (fn) => {
    setItems((cur) => fn([...cur]));
    setVersion((v) => v + 1);
    setDirty(true);
  };

  const dupNumbers = useMemo(() => new Set(stats?.duplicateNumberList || []), [stats]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    const out = [];
    items.forEach((it, idx) => {
      const invalid = it.errors.length > 0;
      if (filter === 'valid' && invalid) return;
      if (filter === 'invalid' && !invalid) return;
      if (filter === 'duplicates' && !dupNumbers.has(it.question_no)) return;
      if (filter === 'missing' && !it.errors.some((e) => e.code === 'MISSING_ANSWER')) return;
      if (s) {
        const hay = `${it.question_no ?? ''} ${it.question} ${Object.values(it.options).join(' ')} ${it.explanation}`.toLowerCase();
        if (!hay.includes(s)) return;
      }
      out.push({ it, idx });
    });
    return out;
  }, [items, filter, search, dupNumbers]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => setPage(1), [filter, search]);

  const counts = {
    total: items.length,
    invalid: items.filter((i) => i.errors.length).length,
  };
  counts.valid = counts.total - counts.invalid;
  const upToDate = validatedVersion === version && !validating;

  const move = async (idx, dir) => {
    let target;
    if (dir === 'to') {
      const v = window.prompt(`Move to position (1–${items.length}):`, String(idx + 1));
      if (v === null) return;
      target = Math.min(items.length, Math.max(1, parseInt(v, 10) || idx + 1)) - 1;
    } else {
      target = idx + dir;
    }
    if (target < 0 || target >= items.length || target === idx) return;
    mutate((arr) => {
      const [x] = arr.splice(idx, 1);
      arr.splice(target, 0, x);
      return arr;
    });
  };

  const remove = async (idx) => {
    const it = items[idx];
    const ok = await confirm({
      title: 'Delete question?',
      message: `Question #${idx + 1} (Q${it.question_no ?? '?'}) will be removed from this list.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (ok) mutate((arr) => arr.filter((x) => x._key !== it._key));
  };

  const apply = (key, patch) => {
    mutate((arr) => arr.map((x) => (x._key === key ? { ...x, ...patch, _parseErrors: undefined, warnings: [] } : x)));
    setEditingKey(null);
  };

  const addQuestion = (type = 'mcq') => {
    const maxNo = items.reduce((m, x) => Math.max(m, Number(x.question_no) || 0), 0);
    const tf = type === 'tf';
    const blank = toItem({
      type: tf ? 'tf' : 'mcq',
      question_no: maxNo + 1,
      question: '',
      options: tf ? TF_OPTIONS : {},
      correct_answer: '',
    });
    mutate((arr) => [...arr, blank]);
    setFilter('all');
    setSearch('');
    setEditingKey(blank._key);
    setPage(Math.ceil((items.length + 1) / PAGE_SIZE));
  };

  const renumber = async () => {
    const ok = await confirm({ title: 'Renumber questions?', message: 'Question numbers will be set to 1, 2, 3… in the current order.', confirmLabel: 'Renumber' });
    if (ok) mutate((arr) => arr.map((x, i) => ({ ...x, question_no: i + 1 })));
  };

  const removeInvalid = async () => {
    const ok = await confirm({
      title: `Delete ${counts.invalid} invalid question(s)?`,
      message: 'Only questions currently marked as invalid will be removed. Consider fixing them instead.',
      confirmLabel: 'Delete invalid',
      danger: true,
    });
    if (ok) mutate((arr) => arr.filter((x) => !x.errors.length));
  };

  const runAction = async (action) => {
    if (editingKey) {
      toast.error('Apply or cancel the question you are editing first.');
      return;
    }
    setSaving(action.label);
    try {
      await action.onClick(items.map(stripForServer), { stats, invalid: counts.invalid });
      setDirty(false);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="Total" value={counts.total.toLocaleString()} />
        <StatCard label="Valid" value={counts.valid.toLocaleString()} tone="good" />
        <StatCard label="Invalid" value={counts.invalid.toLocaleString()} tone={counts.invalid ? 'bad' : 'default'} />
        <StatCard label="Duplicate Nos." value={stats?.duplicateNumbers ?? '–'} tone={stats?.duplicateNumbers ? 'warn' : 'default'} />
        <StatCard label="Missing answers" value={stats?.missingAnswers ?? '–'} tone={stats?.missingAnswers ? 'warn' : 'default'} />
      </div>

      {globalErrors.map((g, i) => (
        <Alert key={i} tone="warn">{g.message}</Alert>
      ))}
      {validationError && <Alert tone="error" title="Validation failed">{validationError}</Alert>}
      {headerExtra}

      <div className="card sticky top-0 z-10 flex flex-col gap-3 p-3 lg:top-2 lg:flex-row lg:items-center">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <select className="input w-auto" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter questions">
            {FILTERS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
          <input className="input min-w-[160px] flex-1" placeholder="Search text, options, number…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search questions" />
          <span className="flex items-center gap-1.5 text-xs text-ink-500" aria-live="polite">
            {validating || !upToDate ? (
              <>
                <Spinner className="h-3.5 w-3.5" /> Validating…
              </>
            ) : (
              <>✓ Validated</>
            )}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {!readOnly && (
            <>
              <button className="btn-secondary btn-sm" onClick={() => addQuestion('mcq')}>+ MCQ</button>
              <button className="btn-secondary btn-sm" onClick={() => addQuestion('tf')}>+ True/False</button>
              <button className="btn-secondary btn-sm" onClick={() => runValidation(version)} disabled={validating}>Validate again</button>
              <button className="btn-secondary btn-sm" onClick={renumber} disabled={!items.length}>Renumber</button>
              {counts.invalid > 0 && (
                <button className="btn-secondary btn-sm text-red-600" onClick={removeInvalid}>Delete invalid</button>
              )}
            </>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState title="No questions" message={readOnly ? 'This quiz has no questions.' : 'Import questions or add one manually.'} action={!readOnly && <button className="btn-primary" onClick={() => addQuestion('mcq')}>Add a question</button>} />
      ) : filtered.length === 0 ? (
        <EmptyState title="Nothing matches" message="No questions match this filter or search." />
      ) : (
        <div className="space-y-3">
          {pageItems.map(({ it, idx }) => (
            <QuestionCard
              key={it._key}
              item={it}
              position={idx + 1}
              total={items.length}
              readOnly={readOnly}
              editing={editingKey === it._key}
              onEdit={() => setEditingKey(it._key)}
              onCancel={() => setEditingKey(null)}
              onApply={(patch) => apply(it._key, patch)}
              onDelete={() => remove(idx)}
              onMove={(d) => move(idx, d)}
            />
          ))}
        </div>
      )}

      <Pagination page={safePage} pageCount={pageCount} onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} total={filtered.length} pageSize={PAGE_SIZE} />

      {actions.length > 0 && (
        <div className="sticky bottom-0 z-10 -mx-4 border-t border-ink-200 bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:shadow-lift">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-ink-600">
              {dirty ? <span className="font-medium text-amberish-700">Unsaved changes · </span> : null}
              {counts.invalid > 0 ? (
                <span className="text-red-600">{counts.invalid} invalid question(s) must be fixed or deleted before publishing.</span>
              ) : (
                <span>All {counts.total.toLocaleString()} questions are valid.</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {actions.map((a) => (
                <button key={a.label} className={a.primary ? 'btn-primary' : 'btn-secondary'} disabled={!!saving || !upToDate || (a.disabled?.({ counts, dirty }) ?? false)} onClick={() => runAction(a)}>
                  {saving === a.label && <Spinner className="h-4 w-4" />}
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
