import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteShell, { PageBand } from '@/components/site/SiteChrome.jsx';
import JsonLd from '@/components/site/JsonLd.jsx';
import { T } from '@/i18n/LangProvider.jsx';
import { MODULES, getModule } from '@/content/modules.js';
import { chaptersOf, NOTES_UPDATED } from '@/content/notes.js';
import { SITE_URL } from '@/lib/siteApi.js';
import { pageMeta, currentYear } from '@/lib/seo.js';

export const dynamicParams = false;
export const generateStaticParams = () => MODULES.map((m) => ({ module: m.slug }));

export function generateMetadata({ params }) {
  const m = getModule(params.module);
  if (!m) return {};
  const ch = chaptersOf(m);
  const pts = ch.reduce((a, c) => a + c.points, 0);
  return pageMeta({
    title: `${m.short} Short Notes हिंदी में ${currentYear()} – ${m.shortEn}`,
    description: `${m.short} (${m.shortEn}) के ${ch.length} चैप्टर के one liner short notes, ${pts} points, हिंदी और English में। चैप्टर वाइज़, मुफ़्त।`,
    path: `/o-level-short-notes/${m.slug}`,
    noarchive: true,
    keywords: [`${m.short} notes`, `${m.short} short notes in Hindi`, `${m.shortEn} notes Hindi`, 'O Level one liner notes'],
  });
}

export default function ModuleNotes({ params }) {
  const m = getModule(params.module);
  if (!m) notFound();
  const chapters = chaptersOf(m);
  return (
    <SiteShell band={<PageBand title={<T hi={`${m.short} शॉर्ट नोट्स – चैप्टर वाइज़`} en={`${m.short} short notes – chapter wise`} />} sub={<T hi={m.hi} en={m.en} />} />}>
      <JsonLd
        data={[
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
              { '@type': 'ListItem', position: 2, name: 'O Level Short Notes', item: `${SITE_URL}/o-level-short-notes` },
              { '@type': 'ListItem', position: 3, name: `${m.short} short notes`, item: `${SITE_URL}/o-level-short-notes/${m.slug}` },
            ],
          },
          {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: `${m.short} short notes`,
            dateModified: NOTES_UPDATED,
            itemListElement: chapters.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.en, url: `${SITE_URL}/o-level-short-notes/${m.slug}/${c.slug}` })),
          },
        ]}
      />
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-ink-500">
        <Link href="/o-level-short-notes" className="underline"><T hi="सभी शॉर्ट नोट्स" en="All short notes" /></Link>
      </nav>
      <p className="mb-8 max-w-3xl text-[17px] text-ink-700">
        <T
          hi={`${m.short} के ${chapters.length} चैप्टर के one liner notes नीचे हैं। चैप्टर चुनो और हिंदी-English बिंदु पढ़ो।`}
          en={`One-liner notes for the ${chapters.length} chapters of ${m.short} are below. Pick a chapter and read the Hindi and English points.`}
        />
      </p>
      <ol className="grid max-w-4xl gap-4 sm:grid-cols-2">
        {chapters.map((c) => (
          <li key={c.slug}>
            <Link href={`/o-level-short-notes/${m.slug}/${c.slug}`} className="block h-full rounded-xl bg-white p-5 shadow-sm ring-1 ring-ink-200 transition hover:ring-brand-400">
              <div className="flex items-start gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blush-100 text-sm font-bold text-brand-800">{c.n}</span>
                <h2 className="text-[17px] font-bold leading-snug text-ink-900"><T hi={c.hi} en={c.en} /></h2>
              </div>
              <p className="mt-3 text-[14px] text-ink-600">{c.sections.slice(0, 4).map((s) => s.hi).join(' · ')}</p>
              <span className="mt-3 inline-block text-sm font-semibold text-brand-700"><T hi={`नोट्स पढ़ो (${c.points} points)`} en={`Read notes (${c.points} points)`} /></span>
            </Link>
          </li>
        ))}
      </ol>
      <Link href={`/o-level/${m.slug}`} className="btn-primary mt-10"><T hi={`${m.short} का मॉक टेस्ट दो`} en={`Take the ${m.short} mock test`} /></Link>
    </SiteShell>
  );
}
