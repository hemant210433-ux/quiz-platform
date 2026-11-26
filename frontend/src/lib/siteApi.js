import { buildChapters, staticRaw } from '@/content/notes.js';
import { buildUnits, staticUnits } from '@/content/guess.js';
/**
 * Server-side fetches for the public SEO pages.
 * Never throws: if the backend is asleep/unreachable (Render free tier) the build and
 * pages fall back to an empty list instead of failing.
 */
const BACKEND = (process.env.BACKEND_URL || 'http://localhost:4000').replace(/\/+$/, '');
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');

export async function fetchPublicQuizzes(module) {
  try {
    const qs = module ? `?module=${encodeURIComponent(module)}` : '';
    const res = await fetch(`${BACKEND}/api/public/quizzes${qs}`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.quizzes) ? data.quizzes : [];
  } catch {
    return [];
  }
}

export async function fetchPublicQuiz(slug) {
  try {
    const res = await fetch(`${BACKEND}/api/public/quizzes/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return (await res.json()).quiz || null;
  } catch {
    return null;
  }
}

/* ---------- Admin-pasted short notes / guess paper (override the built-in text) ---------- */
async function fetchOverride(kind, module) {
  try {
    const res = await fetch(`${BACKEND}/api/public/content/${kind}/${encodeURIComponent(module)}`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    return (await res.json()).override || null;
  } catch {
    return null;
  }
}

function mergeRaw(base, o) {
  if (!o || !Array.isArray(o.items) || !o.items.length) return base;
  const byN = new Map(o.replaceAll ? [] : base.map((c) => [c.n, c]));
  for (const c of o.items) byN.set(c.n, c);
  return [...byN.values()].sort((a, b) => a.n - b.n);
}

/** Chapters of one module: built-in text plus whatever the admin pasted. Falls back to built-in if the backend is asleep. */
export async function getChapters(mod) {
  return buildChapters(mod, mergeRaw(staticRaw(mod), await fetchOverride('notes', mod.slug)));
}
export async function getUnits(mod) {
  return buildUnits(mergeRaw(staticUnits(mod), await fetchOverride('guess', mod.slug)));
}
export async function getAllChapters(mods) {
  return Object.fromEntries(await Promise.all(mods.map(async (m) => [m.slug, await getChapters(m)])));
}
export async function getAllUnits(mods) {
  return Object.fromEntries(await Promise.all(mods.map(async (m) => [m.slug, await getUnits(m)])));
}
