'use client';
import Link from 'next/link';
import { useLang } from '@/i18n/LangProvider.jsx';

/** One test as a card: title, what it covers, size, start. */
export default function QuizCard({ quiz, isNew = false }) {
  const { t } = useLang();
  return (
    <li>
      <Link href={`/quiz/${quiz.slug}`} className="group flex h-full flex-col rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-200/80 transition duration-300 hover:-translate-y-1 hover:shadow-lift">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-xl leading-snug text-brand-900">{quiz.title}</h3>
          {isNew && <span className="shrink-0 rounded-full bg-mark-100 px-2.5 py-0.5 text-xs font-bold text-mark-500 ring-1 ring-mark-300/60">{t('new')}</span>}
        </div>
        {(quiz.topic || quiz.year) && <p className="mt-1 text-sm font-semibold text-brand-600">{[quiz.topic, quiz.year].filter(Boolean).join(' · ')}</p>}
        {quiz.description && <p className="mt-2 line-clamp-2 text-[15px] text-ink-600">{quiz.description}</p>}
        <div className="mt-auto flex items-center justify-between pt-5">
          <span className="text-sm font-semibold text-ink-600">{quiz.questionCount} {t('questions')} · {quiz.durationMinutes} {t('minutes')}</span>
          <span className="rounded-md bg-brand-700 px-3.5 py-2 text-sm font-bold text-white transition group-hover:bg-brand-800">{t('startTest')}</span>
        </div>
      </Link>
    </li>
  );
}

export function QuizList({ quizzes }) {
  if (!quizzes.length) return <EmptyTests />;
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {quizzes.map((q, i) => <QuizCard key={q.slug} quiz={q} isNew={i === 0 && quizzes.length > 1} />)}
    </ul>
  );
}

export function EmptyTests() {
  const { t } = useLang();
  return (
    <div className="rounded-2xl border border-dashed border-mark-300 bg-white px-5 py-10 text-center text-ink-600">
      <span className="mx-auto mb-3 block h-9 w-9 rounded-full border-[3px] border-mark-300" aria-hidden="true" />
      {t('noTests')}
    </div>
  );
}
