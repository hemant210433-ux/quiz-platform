'use client';
import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../services/api.js';
import { Alert, Field, Spinner, Tabs } from '../components/common/ui.jsx';
import { useToast } from '../hooks/useToast.jsx';
import { useConfirm } from '../hooks/useConfirm.jsx';

const MODULES = [
  { value: 'm1-r5', label: 'M1-R5 · IT Tools & Network Basics' },
  { value: 'm2-r5', label: 'M2-R5 · Web Designing & Publishing' },
  { value: 'm3-r5', label: 'M3-R5 · Python' },
  { value: 'm4-r5', label: 'M4-R5 · IoT' },
];
const SAMPLE = {
  notes: `Chapter 1: Introduction to Computer / कंप्यूटर का परिचय
## Computer Basics / Computer की मूल बातें
1. RAM volatile memory है: बिजली बंद होते ही data मिट जाता है।
RAM is volatile memory: its data is lost when power goes off.
2. CPU के तीन मुख्य भाग: ALU, Control Unit और Registers।
The three main parts of the CPU: the ALU, the control unit and registers.

Chapter 2: Operating System`,
  guess: `Unit 1: Internet and Email
1. Q: WWW का full form? — Ans: World Wide Web
2. Q: SMTP किसके लिए है?
   Ans: Email भेजने के लिए
Unit 2: Digital Payment
3. Q: UPI का full form? — Ans: Unified Payments Interface`,
};
const HELP = {
  notes: [
    'Chapter 1: Title   (ya  Chapter 1: Title / हिंदी शीर्षक)  se naya chapter shuru hota hai.',
    '## Section naam   (optional) chapter ke andar heading.',
    'Har point: pehle Hindi line, uske neeche English line. Number (1. 2. 3.) lagana ya na lagana aapki marzi.',
  ],
  guess: [
    'Unit 1: Title   se nayi unit shuru hoti hai.',
    'Har sawal ek line mein:  1. Q: sawal — Ans: jawab',
    'Ya do lines mein:  Q: sawal  aur uske neeche  Ans: jawab',
  ],
};
const when = (d) => (d ? new Date(d).toLocaleString() : '');

export default function ContentManager() {
  const toast = useToast();
  const confirm = useConfirm();
  const [kind, setKind] = useState('notes');
  const [module, setModule] = useState('m1-r5');
  const [mode, setMode] = useState('merge');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [checked, setChecked] = useState(null); // result of "Check"
  const [live, setLive] = useState(null);

  const load = useCallback(() => {
    adminApi.listContent().then((r) => setLive(r.content)).catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const reset = () => { setChecked(null); setError(null); };
  const noun = kind === 'notes' ? 'chapter' : 'unit';
  const current = live?.[kind]?.[module];

  const check = async () => {
    setBusy(true); setError(null);
    try { setChecked(await adminApi.parseContent(kind, module, text)); } catch (e) { setChecked(null); setError(e.message); }
    setBusy(false);
  };
  const publish = async () => {
    if (mode === 'replaceAll') {
      const ok = await confirm({ title: 'Poora module badlein?', message: `Is module ke built-in aur pehle paste kiye saare ${noun}s hat jayenge, sirf ye paste wale dikhenge.`, confirmLabel: 'Haan, badlo', danger: true });
      if (!ok) return;
    }
    setBusy(true); setError(null);
    try {
      await adminApi.saveContent(kind, module, text, mode);
      toast.success('Publish ho gaya. Site par 1-2 minute mein dikhega.');
      setText(''); setChecked(null); load();
    } catch (e) { setError(e.message); }
    setBusy(false);
  };
  const remove = async (n) => {
    const ok = await confirm({
      title: n == null ? 'Is module ka sab paste kiya hua hatayein?' : `${noun} ${n} hatayein?`,
      message: 'Site par wapas built-in (original) text dikhega.',
      confirmLabel: 'Hatao', danger: true,
    });
    if (!ok) return;
    try { await adminApi.removeContent(kind, module, n); toast.success('Hata diya.'); load(); } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="max-w-4xl">
      <h1 className="page-title">Short notes &amp; Guess paper</h1>
      <p className="mt-1 text-sm text-ink-500">MCQ import ki tarah text copy-paste karo. Pehle "Check karo", sab theek lage to "Publish" dabao.</p>

      <div className="mt-5 space-y-4">
        <Tabs tabs={[{ value: 'notes', label: 'Short notes' }, { value: 'guess', label: 'Guess paper' }]} value={kind} onChange={(v) => { setKind(v); reset(); }} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Module" htmlFor="mod">
            <select id="mod" className="input" value={module} onChange={(e) => { setModule(e.target.value); reset(); }}>
              {MODULES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </Field>
          <Field label="Kaise jodna hai" htmlFor="mode">
            <select id="mode" className="input" value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="merge">Sirf ye {noun}s jodo/badlo (baaki jaise hain waise)</option>
              <option value="replaceAll">Poora module badlo (sirf ye paste wale rahenge)</option>
            </select>
          </Field>
        </div>

        <details className="rounded-lg bg-ink-50 px-4 py-3 text-sm ring-1 ring-inset ring-ink-200">
          <summary className="cursor-pointer font-medium text-ink-800">Format kaisa hona chahiye?</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-600">{HELP[kind].map((h) => <li key={h}>{h}</li>)}</ul>
          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-md bg-white p-3 text-xs text-ink-700 ring-1 ring-inset ring-ink-200">{SAMPLE[kind]}</pre>
          <button type="button" className="btn-secondary btn-sm mt-2" onClick={() => { setText(SAMPLE[kind]); reset(); }}>Ye example daalo</button>
        </details>

        <Field label={`Yahan ${kind === 'notes' ? 'notes' : 'guess paper'} paste karo`} htmlFor="txt">
          <textarea id="txt" className="input min-h-[320px] font-mono text-[13px] leading-relaxed" value={text} onChange={(e) => { setText(e.target.value); setChecked(null); }} placeholder={SAMPLE[kind]} spellCheck={false} />
        </Field>

        {error && <Alert tone="error">{error}</Alert>}
        <div className="flex flex-wrap items-center gap-3">
          <button className="btn-secondary" disabled={busy || !text.trim()} onClick={check}>{busy && !checked ? <Spinner className="h-4 w-4" /> : null} Check karo</button>
          <button className="btn-primary" disabled={busy || !checked || !checked.stats.entries} onClick={publish}>Publish karo</button>
          {text.trim() && <span className="text-xs text-ink-500">{text.length.toLocaleString()} characters</span>}
        </div>

        {checked && (
          <div className="card space-y-3 p-4">
            <div className="text-sm font-semibold text-ink-900">
              {checked.stats.groups} {noun}(s), {checked.stats.entries} {kind === 'notes' ? 'points' : 'sawal'} mile
            </div>
            {checked.warnings.length > 0 && (
              <Alert tone="warn" title="Dhyan do (publish phir bhi ho sakta hai)">
                <ul className="list-disc pl-5">{checked.warnings.map((w) => <li key={w}>{w}</li>)}</ul>
              </Alert>
            )}
            <div className="divide-y divide-ink-100">
              {checked.groups.map((g) => (
                <div key={g.n} className="py-2 text-sm">
                  <div className="font-medium text-ink-900">{noun === 'chapter' ? 'Chapter' : 'Unit'} {g.n}: {g.title} <span className="text-ink-400">· {g.count}</span></div>
                  {g.sample.map((s, i) => <div key={i} className="truncate text-xs text-ink-500">{s}</div>)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <h2 className="mt-10 text-lg font-semibold text-ink-900">Abhi site par kya paste kiya hua hai</h2>
      {!live ? <div className="mt-3"><Spinner /></div> : !current ? (
        <p className="mt-2 text-sm text-ink-500">Is module ({kind === 'notes' ? 'short notes' : 'guess paper'}) mein abhi kuch paste nahi kiya hai. Site par built-in text dikh raha hai.</p>
      ) : (
        <div className="card mt-3 divide-y divide-ink-100">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
            <span className="text-ink-600">{current.replaceAll ? 'Poora module paste wale se badla hua hai.' : 'Built-in text ke upar ye jude/badle hue hain.'} Aakhri badlav: {when(current.updatedAt)}</span>
            <button className="btn-secondary btn-sm" onClick={() => remove(null)}>Sab hatao</button>
          </div>
          {current.items.map((c) => (
            <div key={c.n} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
              <span className="min-w-0 truncate">{noun === 'chapter' ? 'Chapter' : 'Unit'} {c.n}: {c.title} <span className="text-ink-400">· {c.count}</span></span>
              <button className="text-sm font-medium text-red-700 hover:underline" onClick={() => remove(c.n)}>Hatao</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
