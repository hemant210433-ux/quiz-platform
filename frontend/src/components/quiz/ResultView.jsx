'use client';
import { useEffect, useMemo, useState } from 'react';
import { Pagination, Tabs } from '../common/ui.jsx';
import WeakTopics from './WeakTopics.jsx';
import { formatDateTime, humanDuration, num } from '../../utils/format.js';

const PAGE = 20;

function ScoreRing({ pct }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  const color = pct >= 60 ? '#12a150' : pct >= 33 ? '#d4900b' : '#dc2626';
  return (
    <svg viewBox="0 0 120 120" className="h-36 w-36" role="img" aria-label={`${pct}%`}>
      <circle cx="60" cy="60" r={r} fill="none" stroke="#eceef2" strokeWidth="10" />
      <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(clamped / 100) * c} ${c}`} transform="rotate(-90 60 60)" />
      <text x="60" y="58" textAnchor="middle" className="fill-ink-900" style={{ font: '600 24px Mukta, sans-serif' }}>
        {num(pct)}%
      </text>
      <text x="60" y="78" textAnchor="middle" className="fill-ink-500" style={{ font: '500 11px Mukta, sans-serif' }}>
        score
      </text>
    </svg>
  );
}

function ReviewItem({ item }) {
  const tone = {
    correct: { badge: 'bg-good-100 text-good-800', label: 'Correct' },
    incorrect: { badge: 'bg-red-100 text-red-700', label: 'Incorrect' },
    unattempted: { badge: 'bg-ink-100 text-ink-600', label: 'Not answered' },
  }[item.status];
  return (
    <article className="card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-ink-100 bg-ink-50/60 px-4 py-2 text-xs">
        <span className="font-semibold text-ink-700">Question {item.n}</span>
        <span className={`badge ${tone.badge}`}>{tone.label}</span>
      </div>
      <div className="px-4 py-4">
        <p className="prewrap text-[15px] font-medium text-ink-900">{item.question}</p>
        <ul className="mt-3 space-y-1.5">
          {(item.type === 'tf' ? ['A', 'B'] : ['A', 'B', 'C', 'D']).map((k) => {
            const isCorrect = item.correct === k;
            const isSelected = item.selected === k;
            const cls = isCorrect
              ? 'bg-good-50 ring-good-300 text-good-900'
              : isSelected
                ? 'bg-red-50 ring-red-300 text-red-900'
                : 'bg-white ring-ink-100 text-ink-700';
            return (
              <li key={k} className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ring-1 ring-inset ${cls}`}>
                <span className="font-semibold">{k}.</span>
                <span className="prewrap flex-1">{item.options?.[k]}</span>
                {isSelected && <span className="shrink-0 text-xs font-semibold">{isCorrect ? 'Your answer ✓' : 'Your answer ✗'}</span>}
                {!isSelected && isCorrect && <span className="shrink-0 text-xs font-semibold">Correct answer</span>}
              </li>
            );
          })}
        </ul>
        {item.explanation && (
          <div className="prewrap mt-3 rounded-lg bg-ink-50 px-3 py-2 text-sm text-ink-700">
            <span className="font-semibold">Explanation: </span>
            {item.explanation}
          </div>
        )}
      </div>
    </article>
  );
}

export default function ResultView({ result, heading }) {
  const s = result.summary;
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const list = useMemo(() => (filter === 'all' ? result.review : result.review.filter((r) => r.status === filter)), [result, filter]);
  useEffect(() => setPage(1), [filter]);
  const pageCount = Math.max(1, Math.ceil(list.length / PAGE));

  return (
    <div className="space-y-6">
      <section className="card overflow-hidden">
        <div className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:p-8">
          <ScoreRing pct={s.percentage} />
          <div className="flex-1 text-center sm:text-left">
            {heading}
            <div className="mt-2 font-display text-4xl font-semibold tabular-nums text-ink-900">
              {num(s.obtainedMarks)} <span className="text-2xl text-ink-400">/ {num(s.totalMarks)}</span>
            </div>
            <div className="mt-1 text-sm text-ink-500">
              {result.studentName}
              {result.studentId ? ` · ${result.studentId}` : ''} · Attempt #{result.attemptNumber} · Submitted {formatDateTime(result.submittedAt)}
            </div>
            {result.autoSubmitted && <div className="mt-2 inline-block rounded-md bg-amberish-100 px-2 py-1 text-xs font-medium text-amberish-700">Submitted automatically when time ran out</div>}
          </div>
        </div>
        <dl className="grid grid-cols-2 divide-x divide-y divide-ink-100 border-t border-ink-100 sm:grid-cols-3 sm:divide-y-0 lg:grid-cols-6">
          {[
            ['Questions', s.totalQuestions],
            ['Correct', s.correct, 'text-good-700'],
            ['Incorrect', s.incorrect, 'text-red-600'],
            ['Not answered', s.unattempted],
            ['Negative marks', s.negativeMarks ? `−${num(s.negativeMarks)}` : '0'],
            ['Time taken', humanDuration(result.timeTakenSeconds)],
          ].map(([k, v, c]) => (
            <div key={k} className="px-4 py-3 text-center">
              <dt className="text-xs text-ink-500">{k}</dt>
              <dd className={`mt-0.5 text-lg font-semibold tabular-nums ${c || 'text-ink-900'}`}>{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <WeakTopics review={result.review} />

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="section-title">Answer review</h2>
          <Tabs
            value={filter}
            onChange={setFilter}
            tabs={[
              { value: 'all', label: 'All', count: result.review.length },
              { value: 'correct', label: 'Correct', count: s.correct },
              { value: 'incorrect', label: 'Incorrect', count: s.incorrect },
              { value: 'unattempted', label: 'Not answered', count: s.unattempted },
            ]}
          />
        </div>
        {list.slice((page - 1) * PAGE, page * PAGE).map((item) => (
          <ReviewItem key={item.id} item={item} />
        ))}
        {list.length === 0 && <p className="py-8 text-center text-sm text-ink-500">Nothing in this category.</p>}
        <Pagination page={page} pageCount={pageCount} onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} total={list.length} pageSize={PAGE} />
      </section>
    </div>
  );
}
