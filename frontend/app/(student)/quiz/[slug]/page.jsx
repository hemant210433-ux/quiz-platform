import Page from '@/views/QuizLanding.jsx';
import { fetchPublicQuiz } from '@/lib/siteApi.js';
import { pageMeta } from '@/lib/seo.js';

export async function generateMetadata({ params }) {
  const quiz = await fetchPublicQuiz(params.slug);
  if (!quiz) return { title: 'Quiz', robots: { index: false, follow: false } };
  const path = `/quiz/${params.slug}`;
  // A quiz without a Module is a private-link quiz (e.g. for an institute): keep it out of search results.
  if (!quiz.module) return pageMeta({ title: quiz.seoTitle || quiz.title, description: quiz.seoDescription || quiz.description || quiz.title, path, noindex: true });
  const code = String(quiz.module).toUpperCase();
  const stats = [quiz.questionCount && `${quiz.questionCount} प्रश्न`, quiz.durationMinutes && `${quiz.durationMinutes} मिनट`].filter(Boolean).join(', ');
  return pageMeta({
    title: quiz.seoTitle || `${quiz.title} – ${code} O Level मॉक टेस्ट (मुफ़्त)`,
    description: quiz.seoDescription || `${quiz.title}: ${code} का मुफ़्त O Level ऑनलाइन मॉक टेस्ट${stats ? ` – ${stats}` : ''}। हिंदी में, बिना लॉगिन। जवाब और कमज़ोर विषय तुरंत।`,
    path,
  });
}

export default function Route() {
  return <Page />;
}
