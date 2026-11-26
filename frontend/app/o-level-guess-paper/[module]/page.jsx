import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteShell, { PageBand } from '@/components/site/SiteChrome.jsx';
import JsonLd from '@/components/site/JsonLd.jsx';
import { T } from '@/i18n/LangProvider.jsx';
import { MODULES, getModule } from '@/content/modules.js';
import { GUESS_UPDATED } from '@/content/guess.js';
import { SITE_URL, getUnits } from '@/lib/siteApi.js';
import { pageMeta, currentYear } from '@/lib/seo.js';

export const revalidate = 60;
export const generateStaticParams = () => MODULES.map((m) => ({ module: m.slug }));

export async function generateMetadata({ params }) {
  const m = getModule(params.module);
  if (!m) return {};
  const us = await getUnits(m);
  const total = us.reduce((a, u) => a + u.count, 0);
  return pageMeta({
    title: `${m.short} Guess Paper ${currentYear()} – ${m.shortEn} Important Questions`,
    description: `${m.short} (${m.shortEn}) के ${total} महत्वपूर्ण one liner प्रश्न-उत्तर, ${us.length} यूनिट में, हिंदी में। revision के लिए मुफ़्त गेस पेपर।`,
    path: `/o-level-guess-paper/${m.slug}`,
    noarchive: true,
    keywords: [`${m.short} guess paper`, `${m.short} important questions`, `${m.shortEn} one liner questions`, 'O Level guess paper in Hindi'],
  });
}

export default async function ModuleGuess({ params }) {
  const m = getModule(params.module);
  if (!m) notFound();
  const units = await getUnits(m);
  const totalOf = () => units.reduce((a, u) => a + u.count, 0);
  const url = `${SITE_URL}/o-level-guess-paper/${m.slug}`;
  return (
    <SiteShell band={<PageBand title={<T hi={`${m.short} गेस पेपर – यूनिट वाइज़`} en={`${m.short} guess paper – unit wise`} />} sub={<T hi={m.hi} en={m.en} />} />}>
      <JsonLd
        data={[
          { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
            { '@type': 'ListItem', position: 2, name: 'O Level Guess Paper', item: `${SITE_URL}/o-level-guess-paper` },
            { '@type': 'ListItem', position: 3, name: `${m.short} guess paper`, item: url },
          ] },
          { '@context': 'https://schema.org', '@type': 'ItemList', name: `${m.short} guess paper`, dateModified: GUESS_UPDATED,
            itemListElement: units.map((u, i) => ({ '@type': 'ListItem', position: i + 1, name: u.title, url: `${url}/${u.slug}` })) },
        ]}
      />
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-ink-500">
        <Link href="/o-level-guess-paper" className="underline"><T hi="सभी गेस पेपर" en="All guess papers" /></Link>
      </nav>
      <p className="mb-8 max-w-3xl text-[17px] text-ink-700">
        <T hi={`${m.short} के ${totalOf(m)} महत्वपूर्ण प्रश्न ${units.length} यूनिट में बाँटे गए हैं। यूनिट चुनो और प्रश्न-उत्तर पढ़ो। ये अभ्यास के प्रश्न हैं, परीक्षा में आने की गारंटी नहीं।`} en={`${totalOf(m)} important questions of ${m.short} are split into ${units.length} units. Pick a unit and read the questions and answers. These are practice questions, not a promise of what will be asked.`} />
      </p>
      <ol className="grid max-w-4xl gap-4 sm:grid-cols-2">
        {units.map((u) => (
          <li key={u.slug}>
            <Link href={`/o-level-guess-paper/${m.slug}/${u.slug}`} className="block h-full rounded-xl bg-white p-5 shadow-sm ring-1 ring-ink-200 transition hover:ring-brand-400">
              <div className="flex items-start gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blush-100 text-sm font-bold text-brand-800">{u.n}</span>
                <h2 className="text-[17px] font-bold leading-snug text-ink-900">{u.title}</h2>
              </div>
              <span className="mt-3 inline-block text-sm font-semibold text-brand-700"><T hi={`${u.count} प्रश्न देखो`} en={`View ${u.count} questions`} /></span>
            </Link>
          </li>
        ))}
      </ol>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href={`/o-level/${m.slug}`} className="btn-primary"><T hi={`${m.short} का मॉक टेस्ट दो`} en={`Take the ${m.short} mock test`} /></Link>
        <Link href={`/o-level-short-notes/${m.slug}`} className="btn-secondary"><T hi="शॉर्ट नोट्स" en="Short notes" /></Link>
      </div>
    </SiteShell>
  );
}
