'use client';
import { memo, useState } from 'react';

const KEYS = ['A', 'B', 'C', 'D'];

function QuestionEditForm({ item, onApply, onCancel }) {
  const [d, setD] = useState(() => ({
    question_no: item.question_no ?? '',
    question: item.question,
    options: { ...item.options },
    correct_answer: item.correct_answer,
    explanation: item.explanation,
  }));
  const setOpt = (k, v) => setD((x) => ({ ...x, options: { ...x.options, [k]: v } }));
  const idp = `q-${item._key}`;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[110px_1fr]">
        <div>
          <label className="label" htmlFor={`${idp}-no`}>Number</label>
          <input id={`${idp}-no`} type="number" min="1" className="input" value={d.question_no} onChange={(e) => setD({ ...d, question_no: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor={`${idp}-text`}>Question</label>
          <textarea id={`${idp}-text`} className="input min-h-[72px]" value={d.question} onChange={(e) => setD({ ...d, question: e.target.value })} autoFocus />
        </div>
      </div>
      <fieldset>
        <legend className="label">Options — select the correct answer</legend>
        <div className="space-y-2">
          {KEYS.map((k) => (
            <div key={k} className="flex items-start gap-2">
              <label className={`mt-1 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-sm font-semibold ring-1 ring-inset ${d.correct_answer === k ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-ink-600 ring-ink-200 hover:bg-ink-50'}`} title={`Mark ${k} as correct`}>
                <input type="radio" name={`${idp}-ans`} value={k} checked={d.correct_answer === k} onChange={() => setD({ ...d, correct_answer: k })} className="sr-only" />
                {k}
              </label>
              <textarea rows={1} className="input min-h-[38px]" aria-label={`Option ${k}`} value={d.options[k]} onChange={(e) => setOpt(k, e.target.value)} />
            </div>
          ))}
        </div>
      </fieldset>
      <div>
        <label className="label" htmlFor={`${idp}-exp`}>Explanation (optional)</label>
        <textarea id={`${idp}-exp`} className="input min-h-[60px]" value={d.explanation} onChange={(e) => setD({ ...d, explanation: e.target.value })} />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary btn-sm" onClick={onCancel}>Cancel</button>
        <button
          type="button"
          className="btn-primary btn-sm"
          onClick={() =>
            onApply({
              ...d,
              question_no: d.question_no === '' ? null : Number(d.question_no),
            })
          }
        >
          Apply changes
        </button>
      </div>
    </div>
  );
}

function QuestionCard({ item, position, total, editing, readOnly, onEdit, onApply, onCancel, onDelete, onMove }) {
  const invalid = item.errors?.length > 0;
  return (
    <article className={`card overflow-hidden ${invalid ? 'ring-red-200' : ''}`} aria-label={`Question at position ${position}`}>
      <div className={`flex flex-wrap items-center gap-2 border-b px-4 py-2.5 text-xs ${invalid ? 'border-red-100 bg-red-50/70' : 'border-ink-100 bg-ink-50/60'}`}>
        <span className="font-semibold text-ink-800">#{position}</span>
        <span className="text-ink-500">Q{item.question_no ?? '?'}</span>
        {item.source_line ? <span className="text-ink-400">line {item.source_line}</span> : null}
        {invalid ? <span className="badge bg-red-100 text-red-700">Invalid</span> : <span className="badge bg-good-100 text-good-800">Valid</span>}
        <div className="ml-auto flex items-center gap-0.5">
          {!readOnly && !editing && (
            <>
              <button className="btn-ghost btn-sm px-2" onClick={() => onMove(-1)} disabled={position === 1} aria-label="Move up" title="Move up">↑</button>
              <button className="btn-ghost btn-sm px-2" onClick={() => onMove(1)} disabled={position === total} aria-label="Move down" title="Move down">↓</button>
              <button className="btn-ghost btn-sm" onClick={() => onMove('to')} title="Move to position">Move…</button>
              <button className="btn-ghost btn-sm" onClick={onEdit}>Edit</button>
              <button className="btn-ghost btn-sm text-red-600 hover:bg-red-50" onClick={onDelete}>Delete</button>
            </>
          )}
        </div>
      </div>

      <div className="px-4 py-4">
        {editing ? (
          <QuestionEditForm item={item} onApply={onApply} onCancel={onCancel} />
        ) : (
          <>
            <p className={`prewrap font-medium ${item.question ? 'text-ink-900' : 'italic text-ink-400'}`}>{item.question || 'No question text'}</p>
            <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
              {KEYS.map((k) => {
                const correct = item.correct_answer === k;
                const text = item.options?.[k];
                return (
                  <li key={k} className={`flex gap-2 rounded-lg px-3 py-2 text-sm ${correct ? 'bg-good-50 text-good-900 ring-1 ring-inset ring-good-200' : 'bg-ink-50 text-ink-700'}`}>
                    <span className={`font-semibold ${correct ? 'text-good-700' : 'text-ink-500'}`}>{k}.</span>
                    <span className={`prewrap ${text ? '' : 'italic text-ink-400'}`}>{text || 'empty'}</span>
                    {correct && <span className="ml-auto text-good-700" aria-label="Correct answer">✓</span>}
                  </li>
                );
              })}
            </ul>
            {item.explanation && (
              <p className="prewrap mt-3 border-l-2 border-ink-200 pl-3 text-sm text-ink-600">
                <span className="font-semibold text-ink-700">Explanation: </span>
                {item.explanation}
              </p>
            )}
            {invalid && (
              <ul className="mt-3 space-y-1 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {item.errors.map((e, i) => (
                  <li key={i}>• {e.message}</li>
                ))}
              </ul>
            )}
            {item.warnings?.length > 0 && (
              <ul className="mt-2 space-y-0.5 text-xs text-amberish-700">
                {item.warnings.map((w, i) => (
                  <li key={i}>⚠ {w}</li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </article>
  );
}

export default memo(QuestionCard);
