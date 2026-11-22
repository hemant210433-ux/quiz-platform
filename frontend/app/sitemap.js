import { MODULES } from '@/content/modules.js';
import { fetchPublicQuizzes, SITE_URL } from '@/lib/siteApi.js';

export const revalidate = 600;

export default async function sitemap() {
  const now = new Date();
  const statics = ['', '/o-level-mock-test', '/o-level-syllabus', '/about', '/privacy', '/contact', ...MODULES.map((m) => `/o-level/${m.slug}`)].map((p) => ({
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
