import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteShell, { PageBand } from '@/components/site/SiteChrome.jsx';
import JsonLd from '@/components/site/JsonLd.jsx';
import NotesGuard from '@/components/site/NotesGuard.jsx';
import { T } from '@/i18n/LangProvider.jsx';
import { MODULES, getModule } from '@/content/modules.js';
import { unitsOf, GUESS_UPDATED } from '@/content/guess.js';
import { SITE_URL, getUnits } from '@/lib/siteApi.js';
import { pageMeta, currentYear, SITE_NAME } from '@/lib/seo.js';

export const revalidate = 60;
export const generateStaticParams = () => MODULES.flatMap((m) => unitsOf(m).map((u) => ({ module: m.slug, unit: u.slug })));

async function find(params) {
  const m = getModule(params.module);
  if (!m) return {};
  const list = await getUnits(m);
  const i = list.findIndex((u) => u.slug === params.unit);
  return i < 0 ? {} : { m, list, i, u: list[i] };
}
const cut = (s, n) => (s.length <= n ? s : `${s.slice(0, n - 1).replace(/[\s,·]+\S*$/, '')}…`);

export async function generateMetadata({ params }) {
  const { m, u } = await find(params);
  if (!u) return {};
  return pageMeta({
    title: cut(`${u.title} – ${m.short} Guess Paper | Unit ${u.n} Questions`, 66),
    description: cut(`${m.short} यूनिट ${u.n} (${u.title}) के ${u.count} महत्वपूर्ण one liner प्रश्न-उत्तर हिंदी में। revision के लिए मुफ़्त गेस पेपर, परीक्षा में आने की गारंटी नहीं।`, 158),
    path: `/o-level-guess-paper/${m.slug}/${u.slug}`,
    noarchive: true,
    type: 'article',
    keywords: [`${u.title} important questions`, `${m.short} unit ${u.n} guess paper`, `${m.short} one liner questions`, 'O Level guess paper'],
  });
}

export default async function UnitGuess({ params }) {
  const { m, list, i, u } = await find(params);
  if (!u) notFound();
  const prev = list[i - 1];
  const next = list[i + 1];
  const url = `${SITE_URL}/o-level-guess-paper/${m.slug}/${u.slug}`;
  const host = SITE_URL.replace(/^https?:\/\//, '').replace(/^localhost.*/, 'olevelmocktest.in');
  return (
    <SiteShell band={<PageBand kicker={`${m.short} · Unit ${u.n}`} title={u.title} sub={<T hi={`${u.count} महत्वपूर्ण प्रश्न-उत्तर`} en={`${u.count} important questions and answers`} />} />}>
      <JsonLd
        data={[
          { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
            { '@type': 'ListItem', position: 2, name: 'O Level Guess Paper', item: `${SITE_URL}/o-level-guess-paper` },
            { '@type': 'ListItem', position: 3, name: `${m.short} guess paper`, item: `${SITE_URL}/o-level-guess-paper/${m.slug}` },
            { '@type': 'ListItem', position: 4, name: u.title, item: url },
          ] },
          { '@context': 'https://schema.org', '@type': 'Article', headline: `${u.title} – ${m.short} guess paper`, inLanguage: ['hi', 'en'], datePublished: GUESS_UPDATED, dateModified: GUESS_UPDATED,
            mainEntityOfPage: url, image: `${SITE_URL}/opengraph-image`, author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
            publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL }, copyrightHolder: { '@type': 'Organization', name: SITE_NAME }, copyrightYear: currentYear() },
        ]}
      />
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-ink-500">
        <Link href="/o-level-guess-paper" className="underline"><T hi="गेस पेपर" en="Guess paper" /></Link>{' / '}
        <Link href={`/o-level-guess-paper/${m.slug}`} className="underline">{m.short}</Link>
      </nav>
      <p className="notes-print-note">यह सामग्री प्रिंट नहीं की जा सकती। इसे {host} पर पढ़ें।</p>

      <NotesGuard mark={host}>
        <article className="max-w-3xl">
          <p className="rounded-lg border border-mark-300 bg-mark-100/60 px-4 py-3 text-[15px] text-ink-800">
            <T hi="ये अभ्यास के लिए चुने गए प्रश्न हैं। परीक्षा में आने की गारंटी नहीं, और ये NIELIT के आधिकारिक प्रश्न नहीं हैं। कुछ तथ्य समय के साथ बदलते हैं, इसलिए आधिकारिक स्रोत से मिलान करें।" en="These are practice questions chosen for revision. There is no guarantee they will appear in the exam, and they are not official NIELIT questions. Some facts change over time, so check them against official sources." />
          </p>
          <h2 className="mt-8 font-display text-2xl font-bold text-brand-900"><T hi="प्रश्न और उत्तर" en="Questions and answers" /></h2>
          <ol className="mt-4 space-y-3">
            {u.items.map(([q, a], k) => (
              <li key={k} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-ink-200">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-6 min-w-6 shrink-0 place-items-center rounded-full bg-blush-100 px-1 text-[12px] font-bold text-brand-800">{k + 1}</span>
                  <div className="min-w-0 break-words">
                    <p className="text-[17px] font-semibold leading-relaxed text-ink-900">{q}</p>
                    <p className="mt-1 text-[16px] leading-relaxed text-emerald-800"><b>उत्तर:</b> {a}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </article>
      </NotesGuard>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={`/o-level/${m.slug}`} className="btn-primary"><T hi={`${m.short} का मॉक टेस्ट दो`} en={`Take the ${m.short} mock test`} /></Link>
        <Link href={`/o-level-short-notes/${m.slug}`} className="btn-secondary"><T hi="शॉर्ट नोट्स" en="Short notes" /></Link>
      </div>
      <nav aria-label="Units" className="mt-10 grid max-w-3xl gap-3 sm:grid-cols-2">
        {prev ? (
          <Link href={`/o-level-guess-paper/${m.slug}/${prev.slug}`} rel="prev" className="rounded-xl bg-ink-50 p-4 ring-1 ring-ink-200 hover:ring-brand-400">
            <div className="text-xs text-ink-500"><T hi="पिछली यूनिट" en="Previous unit" /></div>
            <div className="font-semibold text-ink-900">{prev.n}. {prev.title}</div>
          </Link>
        ) : <span />}
        {next && (
          <Link href={`/o-level-guess-paper/${m.slug}/${next.slug}`} rel="next" className="rounded-xl bg-ink-50 p-4 ring-1 ring-ink-200 hover:ring-brand-400 sm:text-right">
            <div className="text-xs text-ink-500"><T hi="अगली यूनिट" en="Next unit" /></div>
            <div className="font-semibold text-ink-900">{next.n}. {next.title}</div>
          </Link>
        )}
      </nav>
      <p className="mt-8 max-w-3xl text-sm leading-relaxed text-ink-500">
        <T hi={`© ${currentYear()} ${SITE_NAME}. सर्वाधिकार सुरक्षित। यह एक स्वतंत्र अभ्यास प्लेटफ़ॉर्म है और NIELIT से संबद्ध नहीं है।`} en={`© ${currentYear()} ${SITE_NAME}. All rights reserved. This is an independent practice platform and is not affiliated with NIELIT.`} />
      </p>
    </SiteShell>
  );
}
