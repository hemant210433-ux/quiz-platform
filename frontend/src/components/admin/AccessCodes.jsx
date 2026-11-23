'use client';
import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../../services/api.js';
import { Alert, Spinner } from '../common/ui.jsx';
import { useConfirm } from '../../hooks/useConfirm.jsx';
import { useToast } from '../../hooks/useToast.jsx';

function copy(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  ta.remove();
  return Promise.resolve();
}

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

/** Personal access codes (one per student). Shown on the quiz edit page when "Access code" is selected. */
export default function AccessCodes({ quizId }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [codes, setCodes] = useState(null);
  const [error, setError] = useState('');
  const [count, setCount] = useState(10);
  const [names, setNames] = useState('');
  const [mode, setMode] = useState('count');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => adminApi.listCodes(quizId).then((r) => setCodes(r.codes)).catch((e) => setError(e.message)), [quizId]);
  useEffect(() => {
    load();
  }, [load]);

  const generate = async () => {
    setBusy(true);
    setError('');
    try {
      const list = names.split('\n').map((n) => n.trim()).filter(Boolean);
      const r = await adminApi.generateCodes(quizId, mode === 'names' ? { names: list } : { count: Number(count) });
      setCodes(r.codes);
      setNames('');
      toast.success(mode === 'names' ? `${list.length} code(s) created.` : `${count} code(s) created.`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (c) => {
    const ok = await confirm({ title: 'Delete this code?', message: `${c.display}${c.label ? ` (${c.label})` : ''} will stop working. Results already submitted stay.`, confirmLabel: 'Delete', danger: true });
    if (!ok) return;
    try {
      const r = await adminApi.deleteCode(quizId, c.code);
      setCodes(r.codes);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const copyAll = async () => {
    await copy(codes.map((c) => `${c.label ? `${c.label}\t` : ''}${c.display}`).join('\n'));
    toast.success('All codes copied.');
  };
  const download = () => {
    const rows = [['Name', 'Access code', 'Attempts used'], ...codes.map((c) => [c.label, c.display, c.attempts])];
    const blob = new Blob(['﻿' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'access-codes.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  return (
    <div className="space-y-4">
      {error && <Alert tone="error">{error}</Alert>}

      <div className="rounded-lg bg-ink-50 p-4">
        <div className="inline-flex rounded-lg bg-ink-200/60 p-0.5 text-sm font-semibold" role="group" aria-label="How to create codes">
          {[['count', 'Make N codes'], ['names', 'One per student name']].map(([v, l]) => (
            <button key={v} type="button" aria-pressed={mode === v} onClick={() => setMode(v)} className={`rounded-md px-3 py-1.5 ${mode === v ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-600'}`}>{l}</button>
          ))}
        </div>
        {mode === 'count' ? (
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div>
              <label className="label" htmlFor="codeCount">How many codes?</label>
              <input id="codeCount" type="number" min="1" max="500" className="input w-28" value={count} onChange={(e) => setCount(e.target.value)} />
            </div>
            <button type="button" className="btn-primary" onClick={generate} disabled={busy || !(Number(count) >= 1)}>{busy && <Spinner className="h-4 w-4" />}Create codes</button>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            <div>
              <label className="label" htmlFor="codeNames">Student names (one per line)</label>
              <textarea id="codeNames" className="input min-h-[110px]" value={names} onChange={(e) => setNames(e.target.value)} placeholder={'Pooja Singh\nRahul Verma'} />
              <p className="mt-1 text-xs text-ink-500">Each student gets one code. The name is fixed to the code, so it cannot be changed by the student.</p>
            </div>
            <button type="button" className="btn-primary" onClick={generate} disabled={busy || !names.trim()}>{busy && <Spinner className="h-4 w-4" />}Create codes</button>
          </div>
        )}
      </div>

      {!codes ? (
        <div className="py-6 text-center"><Spinner className="mx-auto h-5 w-5" /></div>
      ) : codes.length === 0 ? (
        <p className="text-sm text-ink-500">No codes yet. Create codes above, then give each student their own code (WhatsApp / printed).</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-ink-700">{codes.length} code(s)</span>
            <button type="button" className="btn-secondary btn-sm" onClick={copyAll}>Copy all</button>
            <button type="button" className="btn-secondary btn-sm" onClick={download}>Download CSV</button>
          </div>
          <ul className="divide-y divide-ink-100 rounded-lg ring-1 ring-inset ring-ink-200">
            {codes.map((c) => (
              <li key={c.code} className="px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <code className="rounded bg-ink-100 px-2 py-1 font-mono text-[15px] font-bold tracking-wider text-ink-900">{c.display}</code>
                  <span className={`badge ${c.submitted ? 'bg-good-100 text-good-800' : c.attempts ? 'bg-amberish-100 text-amberish-700' : 'bg-ink-100 text-ink-600'}`}>
                    {c.submitted ? 'Submitted' : c.attempts ? 'Started' : 'Unused'}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <span className="min-w-0 break-words text-sm text-ink-700">{c.label || <span className="text-ink-400">no name</span>}</span>
                  <span className="flex shrink-0 gap-1">
                    <button type="button" className="btn-ghost btn-sm" onClick={() => copy(c.display).then(() => toast.success('Copied.'))}>Copy</button>
                    <button type="button" className="btn-ghost btn-sm text-red-600 hover:bg-red-50" onClick={() => remove(c)}>Delete</button>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
