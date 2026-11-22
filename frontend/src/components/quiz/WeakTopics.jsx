'use client';
import { useMemo } from 'react';
import { useLang } from '@/i18n/LangProvider.jsx';

/** Per-topic accuracy from the result review. Weakest topics first. Hidden when no question has a topic. */
export function topicStats(review) {
  const map = new Map();
  for (const r of review || []) {
    const topic = (r.topic || '').trim();
    if (!topic) continue;
    const e = map.get(topic) || { topic, total: 0, correct: 0 };
    e.total += 1;
    if (r.status === 'correct') e.correct += 1;
    map.set(topic, e);
  }
  return [...map.values()]
    .map((e) => ({ ...e, pct: Math.round((e.correct / e.total) * 100) }))
    .sort((a, b) => a.pct - b.pct || b.total - a.total);
}

export default function WeakTopics({ review }) {
  const { t } = useLang();
  const rows = useMemo(() => topicStats(review), [review]);
  if (!rows.length) return null;
  return (
    <section className="card p-5 sm:p-6" aria-labelledby="weak-topics">
      <h2 id="weak-topics" className="section-title">{t('weakTopics')}</h2>
      <p className="mt-1 text-sm text-ink-500">{t('weakTopicsHint')}</p>
      <ul className="mt-4 space-y-3">
        {rows.map((r) => (
          <li key={r.topic}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium text-ink-800">{r.topic}</span>
              <span className="tabular-nums text-ink-500">{r.correct}/{r.total} · {r.pct}%</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink-100" role="img" aria-label={`${r.pct}%`}>
              <div className={`h-full rounded-full ${r.pct >= 60 ? 'bg-good-600' : r.pct >= 33 ? 'bg-amberish-500' : 'bg-red-500'}`} style={{ width: `${r.pct}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
