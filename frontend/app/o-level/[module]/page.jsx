import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteShell, { PageBand, SectionTitle } from '@/components/site/SiteChrome.jsx';
import JsonLd from '@/components/site/JsonLd.jsx';
import { QuizList } from '@/components/site/QuizCard.jsx';
import { T } from '@/i18n/LangProvider.jsx';
import { MODULES, getModule, moduleSeoTitle, NIELIT_SYLLABUS_URL } from '@/content/modules.js';
import { fetchPublicQuizzes, SITE_URL } from '@/lib/siteApi.js';
import { pageMeta, currentYear } from '@/lib/seo.js';

export const revalidate = 300;
export const dynamicParams = false;

export function generateStaticParams() {
  return MODULES.map((m) => ({ module: m.slug }));
}

export function generateMetadata({ params }) {
  const m = getModule(params.module);
  if (!m) return {};
  return pageMeta({ title: moduleSeoTitle(m, currentYear()), description: m.seoDescription, path: `/o-level/${m.slug}` });
}

export default async function ModulePage({ params }) {
  const m = getModule(params.module);
  if (!m) notFound();
  const quizzes = await fetchPublicQuizzes(m.code);
  const others = MODULES.filter((x) => x.code !== m.code);
  return (
    <SiteShell band={<PageBand kicker={m.short} title={<T hi={`${m.short} मॉक टेस्ट: ${m.hi}`} en={`${m.short} mock test: ${m.en}`} />} sub={<T hi={m.descHi} en={m.descEn} />} />}>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
            { '@type': 'ListItem', position: 2, name: 'O Level Mock Test', item: `${SITE_URL}/o-level-mock-test` },
            { '@type': 'ListItem', position: 3, name: m.short, item: `${SITE_URL}/o-level/${m.slug}` },
          ],
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: m.faq.map((f) => ({ '@type': 'Question', name: f.q[0], acceptedAnswer: { '@type': 'Answer', text: f.a[0] } })),
        }}
      />

      <div className="max-w-3xl space-y-4 text-[17px] text-ink-700">
        {m.introHi.map((t, i) => (
          <p key={i}><T hi={t} en={m.introEn[i]} /></p>
        ))}
      </div>

      <div className="mt-14"><SectionTitle><T hi={`${m.short} के मॉक टेस्ट`} en={`${m.short} mock tests`} /></SectionTitle></div>
      <div className="mt-8"><QuizList quizzes={quizzes} /></div>

      <div className="mt-20"><SectionTitle sub={<T hi="NIELIT के R5 सिलेबस के यूनिट के अनुसार। हर यूनिट पर अभ्यास करो और रिपोर्ट में देखो कि कौन-सा कमज़ोर है।" en="Following the units of the NIELIT R5 syllabus. Practise each unit and use the report to see which one is weak." />}><T hi={`${m.short} में क्या-क्या पढ़ना है`} en={`What ${m.short} covers`} /></SectionTitle></div>
      <ol className="mt-8 grid max-w-4xl gap-x-8 gap-y-1 sm:grid-cols-2">
        {m.units.map((u, i) => (
          <li key={u.en} className="flex items-start gap-3 border-b border-ink-200 py-3 text-lg font-medium">
            <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blush-100 text-sm font-bold text-brand-800">{i + 1}</span>
            <T hi={u.hi} en={u.en} />
          </li>
        ))}
      </ol>
      <p className="mt-4 text-sm text-ink-500">
        <T hi="सिलेबस NIELIT बदल सकता है। नवीनतम सिलेबस और परीक्षा की जानकारी के लिए " en="NIELIT may revise the syllabus. For the latest syllabus and exam information see " />
        <a href={NIELIT_SYLLABUS_URL} rel="noopener noreferrer" target="_blank" className="font-semibold text-brand-700 underline">NIELIT</a>.
      </p>

      <div className="mt-20 max-w-3xl">
        <SectionTitle><T hi={`${m.short} – अक्सर पूछे जाने वाले प्रश्न`} en={`${m.short} – frequently asked questions`} /></SectionTitle>
        <div className="mt-8 divide-y divide-ink-200 border-y border-ink-200">
          {m.faq.map((f) => (
            <details key={f.q[0]} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold text-ink-900">
                <T hi={f.q[0]} en={f.q[1]} />
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink-100 text-xl leading-none text-brand-700 transition group-open:rotate-45 group-open:bg-mark-100" aria-hidden="true">+</span>
              </summary>
              <p className="mt-3 max-w-2xl text-[17px] text-ink-700"><T hi={f.a[0]} en={f.a[1]} /></p>
            </details>
          ))}
        </div>
      </div>

      <nav aria-label="Other modules" className="mt-20">
        <SectionTitle><T hi="दूसरे मॉड्यूल के मॉक टेस्ट" en="Mock tests for other modules" /></SectionTitle>
        <ul className="mt-8 flex flex-wrap gap-3">
          {others.map((o) => (
            <li key={o.code}>
              <Link href={`/o-level/${o.slug}`} className="inline-flex rounded-lg bg-white px-4 py-2.5 text-base font-bold text-brand-800 shadow-card ring-1 ring-ink-200 transition hover:bg-blush-100">
                {o.short} <span className="ml-2 font-medium text-ink-600"><T hi={o.hi.split(' ').slice(0, 3).join(' ')} en={o.shortEn} /></span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </SiteShell>
  );
}
