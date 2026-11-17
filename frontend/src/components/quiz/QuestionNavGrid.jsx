import { memo } from 'react';

/**
 * Palette of question buttons. Colours: answered (green), marked for review (amber),
 * answered + marked (green with amber dot), not answered (white). Current has a ring.
 */
function QuestionNavGrid({ questions, answers, marked, current, onJump }) {
  return (
    <div>
      <div className="mb-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] text-ink-600">
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-brand-600" /> Answered</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-white ring-1 ring-ink-300" /> Not answered</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-amberish-500" /> Marked for review</span>
        <span className="flex items-center gap-1.5"><span className="relative h-3 w-3 rounded bg-brand-600"><span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-amberish-500" /></span> Answered + marked</span>
      </div>
      <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8 lg:grid-cols-6 xl:grid-cols-7">
        {questions.map((q, i) => {
          const a = !!answers[q.id];
          const m = marked.has(q.id);
          const cls = a ? 'bg-brand-600 text-white' : m ? 'bg-amberish-500 text-white' : 'bg-white text-ink-700 ring-1 ring-inset ring-ink-200 hover:bg-ink-50';
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => onJump(i)}
              className={`relative h-9 rounded-md text-xs font-semibold tabular-nums transition ${cls} ${i === current ? 'ring-2 ring-ink-900 ring-offset-1' : ''}`}
              aria-label={`Question ${i + 1}${a ? ', answered' : ', not answered'}${m ? ', marked for review' : ''}`}
              aria-current={i === current ? 'step' : undefined}
            >
              {i + 1}
              {a && m && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-amberish-500 ring-2 ring-white" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default memo(QuestionNavGrid);
