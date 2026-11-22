'use client';
import { useState } from 'react';
import { T, useLang } from '@/i18n/LangProvider.jsx';

// Tiny, clearly-labelled sample questions so visitors can feel the test screen.
// They are generic basics, not exam questions.
const DEMO = [
  {
    topic: ['कंप्यूटर की बुनियादी बातें', 'Computer basics'],
    q: ['इनमें से कौन-सा इनपुट डिवाइस है?', 'Which of these is an input device?'],
    opts: [['मॉनिटर', 'Monitor'], ['कीबोर्ड', 'Keyboard'], ['प्रिंटर', 'Printer'], ['स्पीकर', 'Speaker']],
    ans: 1,
    why: ['कीबोर्ड से हम कंप्यूटर को डेटा देते हैं, इसलिए वह इनपुट डिवाइस है।', 'We give data to the computer through the keyboard, so it is an input device.'],
  },
  {
    topic: ['इंटरनेट और ईमेल', 'Internet and email'],
    q: ['ईमेल पते में यूज़रनेम और डोमेन के बीच कौन-सा चिह्न आता है?', 'Which symbol separates the username and domain in an email address?'],
    opts: [['#', '#'], ['$', '$'], ['@', '@'], ['%', '%']],
    ans: 2,
    why: ['जैसे name@example.com – बीच में @ आता है।', 'For example name@example.com – the @ sits in the middle.'],
  },
  {
    topic: ['Python', 'Python'],
    q: ['Python में लिस्ट की लंबाई किस फ़ंक्शन से मिलती है?', 'Which function gives the length of a list in Python?'],
    opts: [['size()', 'size()'], ['count()', 'count()'], ['length()', 'length()'], ['len()', 'len()']],
    ans: 3,
    why: ['len(my_list) लिस्ट में तत्वों की संख्या देता है।', 'len(my_list) returns the number of items in the list.'],
  },
];
const LETTERS = ['A', 'B', 'C', 'D'];

export default function HeroDemo() {
  const { lang } = useLang();
  const i = lang === 'en' ? 1 : 0;
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState([]); // chosen option per question
  const done = step >= DEMO.length;
  const q = DEMO[Math.min(step, DEMO.length - 1)];
  const choice = picked[step];
  const revealed = choice !== undefined;

  const pick = (n) => {
    if (revealed) return;
    setPicked((p) => {
      const c = [...p];
      c[step] = n;
      return c;
    });
  };
  const restart = () => {
    setStep(0);
    setPicked([]);
  };

  const rows = DEMO.map((d, k) => ({ topic: d.topic[i], ok: picked[k] === d.ans })).sort((a, b) => Number(a.ok) - Number(b.ok));
  const score = DEMO.filter((d, k) => picked[k] === d.ans).length;

  return (
    <section
      aria-label={lang === 'en' ? 'Try a sample question' : 'नमूना प्रश्न आज़माओ'}
      className="w-full rounded-2xl bg-white text-ink-900 shadow-soft ring-1 ring-brand-900/10"
    >
      {/* test-screen title bar */}
      <div className="flex items-center justify-between gap-3 rounded-t-2xl bg-brand-800 px-4 py-3 text-sm font-semibold text-white">
        <span><T hi="नमूना प्रश्न – आज़माकर देखो" en="Sample questions – try it" /></span>
        <ol className="flex gap-1.5" aria-label="Question palette">
          {DEMO.map((_, k) => {
            const state = picked[k] === undefined ? 'bg-white/15 text-white' : picked[k] === DEMO[k].ans ? 'bg-good-500 text-white' : 'bg-red-500 text-white';
            const current = k === step && !done;
            return (
              <li key={k} className={`grid h-7 w-7 place-items-center rounded border border-white/50 text-xs font-bold ${state} ${current ? 'ring-2 ring-mark-300 ring-offset-1 ring-offset-brand-800' : ''}`}>{k + 1}</li>
            );
          })}
        </ol>
      </div>

      {!done ? (
        <div className="p-5 sm:p-6">
          <p className="text-sm font-semibold text-brand-700">{q.topic[i]}</p>
          <h2 className="mt-1 text-xl font-bold leading-snug">{q.q[i]}</h2>
          <ul className="mt-4 space-y-2">
            {q.opts.map((o, n) => {
              const isAns = n === q.ans;
              const isChoice = choice === n;
              let cls = 'border-ink-200 bg-white hover:border-brand-500 hover:bg-brand-50';
              let bub = 'border-ink-300 text-ink-600';
              if (revealed && isAns) { cls = 'border-good-600 bg-good-50'; bub = 'border-good-600 bg-good-600 text-white'; }
              else if (revealed && isChoice) { cls = 'border-red-400 bg-red-50'; bub = 'border-red-500 bg-red-500 text-white'; }
              else if (revealed) { cls = 'border-ink-100 bg-white opacity-60'; }
              return (
                <li key={n}>
                  <button
                    type="button"
                    onClick={() => pick(n)}
                    disabled={revealed}
                    className={`flex w-full items-center gap-3 rounded-lg border-2 px-3 py-2.5 text-left text-base font-medium transition ${cls}`}
                  >
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 text-sm font-bold ${bub}`}>{LETTERS[n]}</span>
                    <span className="flex-1">{o[i]}</span>
                    {revealed && isAns && <span className="text-sm font-bold text-good-700"><T hi="सही" en="Correct" /></span>}
                    {revealed && isChoice && !isAns && <span className="text-sm font-bold text-red-700"><T hi="गलत" en="Wrong" /></span>}
                  </button>
                </li>
              );
            })}
          </ul>
          <div aria-live="polite" className="min-h-[3.5rem] pt-3 text-[15px] text-ink-700">
            {revealed ? q.why[i] : <span className="text-ink-500"><T hi="एक विकल्प चुनो – जवाब तुरंत दिखेगा।" en="Pick an option – the answer shows instantly." /></span>}
          </div>
          <div className="flex justify-end">
            <button type="button" className="btn-primary" disabled={!revealed} onClick={() => setStep(step + 1)}>
              {step === DEMO.length - 1 ? <T hi="रिज़ल्ट देखो" en="See result" /> : <T hi="अगला प्रश्न" en="Next question" />}
            </button>
          </div>
        </div>
      ) : (
        <div className="p-5 sm:p-6">
          <p className="text-sm font-semibold text-brand-700"><T hi="आपका नमूना रिज़ल्ट" en="Your sample result" /></p>
          <h2 className="mt-1 font-display text-4xl">{score}/{DEMO.length} <span className="text-lg font-semibold text-ink-500"><T hi="सही" en="correct" /></span></h2>
          <p className="mt-4 text-sm font-bold"><T hi="कमज़ोर विषय – पहले इन्हें दोहराओ" en="Weak topics – revise these first" /></p>
          <ul className="mt-2 space-y-2">
            {rows.map((r) => (
              <li key={r.topic}>
                <div className="flex justify-between text-sm font-medium"><span>{r.topic}</span><span>{r.ok ? '100%' : '0%'}</span></div>
                <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-ink-100">
                  <div className={`h-full rounded-full ${r.ok ? 'bg-good-600' : 'bg-red-500'}`} style={{ width: r.ok ? '100%' : '6%' }} />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-ink-600"><T hi="असली मॉक टेस्ट में ऐसी ही रिपोर्ट हर विषय के लिए बनती है।" en="Real mock tests give a report like this for every topic." /></p>
          <button type="button" className="btn-secondary mt-4" onClick={restart}><T hi="दोबारा आज़माओ" en="Try again" /></button>
        </div>
      )}
    </section>
  );
}
