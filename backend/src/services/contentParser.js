/**
 * Parsers for the admin "Short notes" and "Guess paper" paste boxes. Plain text in, structured JSON out.
 *
 * Short notes:               Guess paper:
 *   Chapter 1: Title           Unit 1: Title
 *   ## Section name            1. Q: question — Ans: answer
 *   1. Hindi line              2. Q: question
 *   English line                  Ans: answer
 */
const DEVA = /[ऀ-ॿ]/;
const HEAD = /^(?:Chapter|Unit|चैप्टर|अध्याय|यूनिट)\s*(\d+)\s*[:：.\-–—]\s*(.+)$/i;
const NUM = /^\d+\s*[.)]\s*/;
const SECTION = /^(?:##\s*|Section\s*:\s*|सेक्शन\s*:\s*)(.+)$/i;
const clean = (t) => String(t || '').replace(/ /g, ' ').replace(/[ \t]+/g, ' ').trim();
const asciiSlug = (t) => (String(t).match(/[A-Za-z0-9]+/g) || []).join('-').toLowerCase().slice(0, 60);
const slugOf = (n, title) => [n, asciiSlug(title)].filter(Boolean).join('-');

/** "Hindi / English" (either order) -> { hi, en }. One language is used for both. */
function bilingual(text) {
  const t = clean(text);
  const parts = t.split(/\s+[/|]\s+/);
  if (parts.length === 2) {
    const [a, b] = parts;
    return DEVA.test(a) && !DEVA.test(b) ? { hi: a, en: b } : !DEVA.test(a) && DEVA.test(b) ? { hi: b, en: a } : { hi: t, en: t };
  }
  return { hi: t, en: t };
}

export function parseNotes(text) {
  const warnings = [];
  const chapters = [];
  let ch = null;
  let sec = null;
  let last = null; // last block that has only one language and may still get its second line
  let oneLang = 0;
  const newSection = (hi, en) => {
    sec = { hi, en, blocks: [] };
    ch.sections.push(sec);
    last = null;
  };
  const lines = String(text || '').split(/\r?\n/);
  lines.forEach((raw, idx) => {
    const line = clean(raw);
    if (!line) return;
    const h = HEAD.exec(line);
    if (h) {
      const b = bilingual(h[2]);
      ch = { n: Number(h[1]), title: b.en, sections: [] };
      if (DEVA.test(b.hi)) ch.hi = b.hi;
      chapters.push(ch);
      sec = null;
      last = null;
      return;
    }
    if (!ch) {
      if (warnings.length < 8) warnings.push(`Line ${idx + 1}: pehle "Chapter 1: Title" likho, ye line chhod di: ${line.slice(0, 50)}`);
      return;
    }
    const s = SECTION.exec(line);
    if (s) {
      const b = bilingual(s[1]);
      newSection(b.hi, b.en);
      return;
    }
    if (!sec) newSection('', '');
    const numbered = NUM.test(line);
    const body = line.replace(NUM, '');
    if (!body) return;
    const hasDeva = DEVA.test(body);
    if (!numbered && !hasDeva && last && last.p[1] === last.p[0] && DEVA.test(last.p[0])) {
      last.p[1] = body; // the English line under a Hindi line
      last = null;
      oneLang--;
      return;
    }
    const block = { p: [body, body] };
    sec.blocks.push(block);
    last = hasDeva ? block : null;
    if (hasDeva) oneLang++;
  });
  let points = 0;
  for (const c of chapters) {
    const n = c.sections.reduce((a, s) => a + s.blocks.length, 0);
    points += n;
    if (!n) warnings.push(`Chapter ${c.n} mein koi point nahi mila.`);
  }
  if (!chapters.length) warnings.push('Koi chapter nahi mila. "Chapter 1: Title" jaisi line se shuru karo.');
  const seen = new Set();
  for (const c of chapters) {
    if (seen.has(c.n)) warnings.push(`Chapter ${c.n} do baar aaya hai, doosra pehle ko badal dega.`);
    seen.add(c.n);
  }
  if (oneLang > 0) warnings.push(`${oneLang} Hindi point(s) ke neeche English line nahi mili (wo sirf Hindi mein dikhenge).`);
  const items = chapters.map((c) => ({ ...c, slug: slugOf(c.n, c.title), points: c.sections.reduce((a, s) => a + s.blocks.length, 0) }));
  return { items, warnings, stats: { groups: items.length, entries: points } };
}

const QA_INLINE = /^(?:\d+\s*[.)]\s*)?(?:Q\s*\d*\s*[:.)]\s*|प्रश्न\s*\d*\s*[:.)]\s*)?(.+?)\s+(?:—|–|--)\s*(?:Ans(?:wer)?|उत्तर|A)\s*[:.)]\s*(.+)$/i;
const Q_ONLY = /^(?:\d+\s*[.)]\s*)?(?:Q\s*\d*\s*[:.)]|प्रश्न\s*\d*\s*[:.)])\s*(.+)$/i;
const A_ONLY = /^(?:Ans(?:wer)?|उत्तर|A)\s*[:.)]\s*(.+)$/i;

export function parseGuess(text) {
  const warnings = [];
  const units = [];
  let u = null;
  let pendingQ = null;
  String(text || '').split(/\r?\n/).forEach((raw, idx) => {
    const line = clean(raw);
    if (!line) return;
    const h = HEAD.exec(line);
    if (h) {
      u = { n: Number(h[1]), title: clean(h[2]), items: [] };
      units.push(u);
      pendingQ = null;
      return;
    }
    if (!u) {
      if (warnings.length < 8) warnings.push(`Line ${idx + 1}: pehle "Unit 1: Title" likho, ye line chhod di: ${line.slice(0, 50)}`);
      return;
    }
    let m = QA_INLINE.exec(line);
    if (m) { u.items.push([clean(m[1]), clean(m[2])]); pendingQ = null; return; }
    m = A_ONLY.exec(line);
    if (m && pendingQ) { u.items.push([pendingQ, clean(m[1])]); pendingQ = null; return; }
    m = Q_ONLY.exec(line);
    if (m) { pendingQ = clean(m[1]); return; }
    if (warnings.length < 8) warnings.push(`Line ${idx + 1} samajh nahi aayi (sawal/jawab ka format nahi), chhod di: ${line.slice(0, 50)}`);
  });
  if (pendingQ) warnings.push('Aakhri sawal ka jawab nahi mila.');
  const items = units.map((x) => ({ ...x, slug: slugOf(x.n, x.title) }));
  for (const x of items) if (!x.items.length) warnings.push(`Unit ${x.n} mein koi sawal nahi mila.`);
  const seen = new Set();
  for (const x of items) {
    if (seen.has(x.n)) warnings.push(`Unit ${x.n} do baar aaya hai, doosra pehle ko badal dega.`);
    seen.add(x.n);
  }
  if (!items.length) warnings.push('Koi unit nahi mila. "Unit 1: Title" jaisi line se shuru karo.');
  return { items, warnings, stats: { groups: items.length, entries: items.reduce((a, x) => a + x.items.length, 0) } };
}

export const parseContent = (kind, text) => (kind === 'guess' ? parseGuess(text) : parseNotes(text));
