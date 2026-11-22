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
