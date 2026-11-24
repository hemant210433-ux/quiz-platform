import { unitsOf } from '@/content/guess.js';
import { PRACTICALS } from '@/content/practicals.js';
import { MODULES } from '@/content/modules.js';
import { chaptersOf } from '@/content/notes.js';
import { fetchPublicQuizzes, SITE_URL } from '@/lib/siteApi.js';

export const revalidate = 600;

export default async function sitemap() {
  const now = new Date();
  const statics = ['', '/o-level-mock-test', '/o-level-syllabus', '/o-level-practical', '/o-level-practical/m2-r5', ...PRACTICALS.map((p) => `/o-level-practical/m2-r5/${p.id}`), '/o-level-guess-paper', ...MODULES.map((m) => `/o-level-guess-paper/${m.slug}`), ...MODULES.flatMap((m) => unitsOf(m).map((u) => `/o-level-guess-paper/${m.slug}/${u.slug}`)), '/o-level-short-notes', ...MODULES.map((m) => `/o-level-short-notes/${m.slug}`), ...MODULES.flatMap((m) => chaptersOf(m).map((c) => `/o-level-short-notes/${m.slug}/${c.slug}`)), '/about', '/privacy', '/contact', ...MODULES.map((m) => `/o-level/${m.slug}`)].map((p) => ({
    url: `${SITE_URL}${p}`,
    lastModified: now,
    changeFrequency: p === '' ? 'daily' : 'weekly',
    priority: p === '' ? 1 : 0.7,
  }));
  const quizzes = await fetchPublicQuizzes(); // [] if the API is unreachable -> static routes only
  return [
    ...statics,
    ...quizzes.map((q) => ({ url: `${SITE_URL}/quiz/${q.slug}`, lastModified: q.publishedAt ? new Date(q.publishedAt) : now, changeFrequency: 'weekly', priority: 0.6 })),
  ];
}
