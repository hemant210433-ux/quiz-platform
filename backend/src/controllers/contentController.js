import { z } from 'zod';
import { readJson, updateJson } from '../storage/jsonStorage.js';
import { parseContent } from '../services/contentParser.js';
import { parseOrThrow, badRequest, notFound } from '../utils/helpers.js';

const FILE = 'site-content.json';
const KINDS = ['notes', 'guess'];
const MODULES = ['m1-r5', 'm2-r5', 'm3-r5', 'm4-r5'];
const where = z.object({ kind: z.enum(KINDS), module: z.enum(MODULES) });
const body = z.object({ text: z.string().max(3_000_000), mode: z.enum(['merge', 'replaceAll']).default('merge') });

const preview = (items) => items.map((c) => ({ n: c.n, title: c.title, hi: c.hi, count: c.points ?? c.items?.length ?? 0 }));

/** POST /api/admin/content/:kind/:module/parse – check pasted text, nothing is saved. */
export async function parse(req, res) {
  const { kind } = parseOrThrow(where, req.params);
  const { text } = parseOrThrow(body, req.body);
  if (!text.trim()) throw badRequest('Pehle text paste karo.');
  const r = parseContent(kind, text);
  const sample = r.items.slice(0, 40).map((c) => {
    const first = kind === 'guess' ? c.items.slice(0, 2).map((q) => `${q[0]} → ${q[1]}`) : c.sections.flatMap((s) => s.blocks).slice(0, 2).map((b) => b.p[0]);
    return { n: c.n, title: c.title, count: c.points ?? c.items.length, sample: first };
  });
  res.json({ groups: sample, warnings: r.warnings, stats: r.stats });
}

/** PUT /api/admin/content/:kind/:module – parse and publish. */
export async function save(req, res) {
  const { kind, module } = parseOrThrow(where, req.params);
  const { text, mode } = parseOrThrow(body, req.body);
  const r = parseContent(kind, text);
  if (!r.items.length || !r.stats.entries) throw badRequest(r.warnings[0] || 'Is text mein kuch nahi mila.');
  const saved = await updateJson(FILE, {}, (all, ctx) => {
    const cur = all[kind]?.[module] || { replaceAll: false, items: [] };
    let items;
    if (mode === 'replaceAll') items = r.items;
    else {
      const byN = new Map(cur.items.map((c) => [c.n, c]));
      for (const c of r.items) byN.set(c.n, c);
      items = [...byN.values()];
    }
    items.sort((a, b) => a.n - b.n);
    const next = { replaceAll: mode === 'replaceAll' ? true : cur.replaceAll, items, updatedAt: new Date().toISOString() };
    all[kind] = { ...(all[kind] || {}), [module]: next };
    ctx.result = next;
    return all;
  });
  res.json({ saved: true, replaceAll: saved.replaceAll, items: preview(saved.items), updatedAt: saved.updatedAt });
}

/** GET /api/admin/content – what is overridden right now. */
export async function list(req, res) {
  const all = await readJson(FILE, {});
  const out = {};
  for (const k of KINDS) for (const [m, v] of Object.entries(all[k] || {})) (out[k] ||= {})[m] = { replaceAll: v.replaceAll, updatedAt: v.updatedAt, items: preview(v.items) };
  res.json({ content: out });
}

/** DELETE /api/admin/content/:kind/:module[?n=3] – back to the built-in text (one chapter/unit, or all). */
export async function remove(req, res) {
  const { kind, module } = parseOrThrow(where, req.params);
  const n = req.query.n === undefined ? null : Number(req.query.n);
  if (n !== null && !Number.isInteger(n)) throw badRequest('Invalid number.');
  const found = await updateJson(FILE, {}, (all, ctx) => {
    const cur = all[kind]?.[module];
    if (!cur) { ctx.skipWrite = true; ctx.result = false; return all; }
    if (n === null) delete all[kind][module];
    else {
      const items = cur.items.filter((c) => c.n !== n);
      if (items.length === cur.items.length) { ctx.skipWrite = true; ctx.result = false; return all; }
      if (items.length) all[kind][module] = { ...cur, items, updatedAt: new Date().toISOString() };
      else delete all[kind][module];
    }
    ctx.result = true;
    return all;
  });
  if (!found) throw notFound('Ye content nahi mila.');
  res.json({ removed: true });
}

/** GET /api/public/content/:kind/:module – the pasted override for the public pages (or null). */
export async function publicGet(req, res) {
  const { kind, module } = parseOrThrow(where, req.params);
  const all = await readJson(FILE, {});
  res.json({ override: all[kind]?.[module] || null });
}
