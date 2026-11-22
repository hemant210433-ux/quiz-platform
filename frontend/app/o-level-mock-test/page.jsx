import Link from 'next/link';
import SiteShell from '@/components/site/SiteChrome.jsx';
import JsonLd from '@/components/site/JsonLd.jsx';
import { QuizList } from '@/components/site/QuizCard.jsx';
import { PageBand } from '@/components/site/SiteChrome.jsx';
import { T } from '@/i18n/LangProvider.jsx';
import { MODULES } from '@/content/modules.js';
import { fetchPublicQuizzes, SITE_URL } from '@/lib/siteApi.js';
import { pageMeta, currentYear } from '@/lib/seo.js';

export const revalidate = 300;

export function generateMetadata() {
  return pageMeta({
    title: `O Level Online Test ${currentYear()} – मुफ़्त मॉक टेस्ट (M1–M4 R5)`,
    description: 'O Level (NIELIT) के चारों मॉड्यूल M1-R5, M2-R5, M3-R5, M4-R5 के मुफ़्त ऑनलाइन मॉक टेस्ट – हिंदी में, बिना लॉगिन। जवाब और कमज़ोर विषय तुरंत देखें।',
    path: '/o-level-mock-test',
  });
}

export default async function MockTests() {
  const quizzes = await fetchPublicQuizzes();
  return (
    <SiteShell
      band={<PageBand title={<T hi="O Level ऑनलाइन टेस्ट – मुफ़्त मॉक टेस्ट" en="O Level online test – free mock tests" />} sub={<T hi="चारों मॉड्यूल के अभ्यास टेस्ट, हिंदी में। अपना मॉड्यूल चुनो, या नीचे सारे टेस्ट देखो।" en="Practice tests for all four modules, in Hindi. Pick your module, or browse every test below." />} />}
    >
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
            { '@type': 'ListItem', position: 2, name: 'O Level Mock Test', item: `${SITE_URL}/o-level-mock-test` },
          ],
        }}
      />
      <p className="max-w-3xl text-[17px] text-ink-700">
        <T
          hi="NIELIT O Level (R5) के M1-R5, M2-R5, M3-R5 और M4-R5 मॉड्यूल के लिए मुफ़्त ऑनलाइन मॉक टेस्ट। लॉगिन नहीं चाहिए, मोबाइल पर भी चलते हैं, और जमा करते ही जवाब तथा कमज़ोर विषयों की रिपोर्ट मिलती है।"
          en="Free online mock tests for the M1-R5, M2-R5, M3-R5 and M4-R5 modules of NIELIT O Level (R5). No login, works on mobile, and you get answers and a weak-topic report the moment you submit."
        />{' '}
        <Link href="/o-level-syllabus" className="font-semibold text-brand-700 underline"><T hi="सिलेबस के यूनिट देखो" en="See the syllabus units" /></Link>
      </p>
      <nav aria-label="Modules" className="mt-6 flex flex-wrap gap-2">
        {MODULES.map((m) => (
          <Link key={m.code} href={`/o-level/${m.slug}`} className="rounded-full bg-white px-4 py-2 text-sm font-bold text-brand-700 ring-1 ring-ink-300 transition hover:bg-brand-700 hover:text-white">
            {m.short} <span className="font-medium text-ink-600"><T hi={m.hi.split(' ').slice(0, 2).join(' ')} en={m.shortEn} /></span>
          </Link>
        ))}
      </nav>
      <div className="mt-6"><QuizList quizzes={quizzes} /></div>
    </SiteShell>
  );
}
