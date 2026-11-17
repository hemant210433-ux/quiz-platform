import { Link, NavLink } from 'react-router-dom';
import { StatusBadge } from '../common/ui.jsx';

/** Title + sub-navigation shared by every page of a single quiz. */
export default function QuizHeader({ quiz, actions }) {
  if (!quiz) return null;
  const base = `/admin/quizzes/${quiz.id}`;
  const tabs = [
    { to: base, label: 'Overview', end: true },
    { to: `${base}/questions`, label: `Questions (${quiz.questionCount})` },
    { to: `${base}/import`, label: 'Import' },
    { to: `${base}/results`, label: 'Results' },
    { to: `${base}/edit`, label: 'Details' },
  ];
  return (
    <div className="mb-6">
      <Link to="/admin/quizzes" className="text-sm text-ink-500 hover:text-ink-800">
        ← All quizzes
      </Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="page-title break-words">{quiz.title}</h1>
            <StatusBadge status={quiz.status} />
          </div>
          <div className="mt-1 text-sm text-ink-500">
            /quiz/{quiz.slug} · {quiz.durationMinutes} min · {quiz.marksPerQuestion} mark{quiz.marksPerQuestion === 1 ? '' : 's'} per question
            {quiz.negativeMarking ? ` · −${quiz.negativeMarks} per wrong answer` : ''}
          </div>
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      <nav className="mt-5 flex gap-1 overflow-x-auto border-b border-ink-200" aria-label="Quiz sections">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              `-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition ${isActive ? 'border-brand-600 text-brand-800' : 'border-transparent text-ink-500 hover:text-ink-800'}`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
