import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteShell, { PageBand } from '@/components/site/SiteChrome.jsx';
import JsonLd from '@/components/site/JsonLd.jsx';
import NotesGuard from '@/components/site/NotesGuard.jsx';
import { T } from '@/i18n/LangProvider.jsx';
import { MODULES, getModule } from '@/content/modules.js';
import { chaptersOf, NOTES_UPDATED } from '@/content/notes.js';
import { SITE_URL, getChapters } from '@/lib/siteApi.js';
import { pageMeta, currentYear, SITE_NAME } from '@/lib/seo.js';

export const revalidate = 60;
export const generateStaticParams = () => MODULES.flatMap((m) => chaptersOf(m).map((c) => ({ module: m.slug, chapter: c.slug })));

async function find(params) {
  const m = getModule(params.module);
  if (!m) return {};
  const list = await getChapters(m);
  const i = list.findIndex((c) => c.slug === params.chapter);
  return i < 0 ? {} : { m, list, i, c: list[i] };
}

const cut = (s, n) => (s.length <= n ? s : `${s.slice(0, n - 1).replace(/[\s,·]+\S*$/, '')}…`);

export async function generateMetadata({ params }) {
  const { m, c } = await find(params);
  if (!c) return {};
  const topics = c.sections.slice(0, 4).map((s) => s.hi).join(', ');
  return pageMeta({
    title: cut(`${c.hi} – ${m.short} Short Notes हिंदी | Chapter ${c.n}`, 66),
    description: cut(`${c.hi} (${c.en}) के ${c.points} one liner notes हिंदी और English में: ${topics}। ${m.short} चैप्टर ${c.n}, मुफ़्त revision।`, 158),
    path: `/o-level-short-notes/${m.slug}/${c.slug}`,
    noarchive: true,
    type: 'article',
    keywords: [`${c.en} notes in Hindi`, `${c.hi} नोट्स`, `${m.short} chapter ${c.n} notes`, `${m.short} short notes`, 'O Level one liner notes'],
  });
}

function Table({ rows }) {
  const [head, ...body] = rows;
  return (
    <div className="my-4 overflow-x-auto rounded-xl ring-1 ring-ink-200">
      <table className="w-full min-w-[320px] border-collapse bg-white text-left text-[15px]">
        <thead className="bg-blush-100 text-brand-900">
          <tr>{head.map((h, i) => <th key={i} className="px-3 py-2 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody>
          {body.map((r, i) => (
            <tr key={i} className="border-t border-ink-100">
              {r.map((c, k) => <td key={k} className="px-3 py-2 align-top text-ink-800">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function ChapterNotes({ params }) {
  const { m, list, i, c } = await find(params);
  if (!c) notFound();
  const prev = list[i - 1];
  const next = list[i + 1];
  const url = `${SITE_URL}/o-level-short-notes/${m.slug}/${c.slug}`;
  return (
    <SiteShell band={<PageBand title={<T hi={c.hi} en={c.en} />} sub={<T hi={`${m.short} शॉर्ट नोट्स · चैप्टर ${c.n} · ${c.points} points`} en={`${m.short} short notes · Chapter ${c.n} · ${c.points} points`} />} />}>
      <JsonLd
        data={[
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
              { '@type': 'ListItem', position: 2, name: 'O Level Short Notes', item: `${SITE_URL}/o-level-short-notes` },
              { '@type': 'ListItem', position: 3, name: `${m.short} short notes`, item: `${SITE_URL}/o-level-short-notes/${m.slug}` },
              { '@type': 'ListItem', position: 4, name: c.en, item: url },
            ],
          },
          {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: `${c.en} – ${m.short} short notes`,
            alternativeHeadline: c.hi,
            inLanguage: ['hi', 'en'],
            dateModified: NOTES_UPDATED,
            datePublished: NOTES_UPDATED,
            mainEntityOfPage: url,
            image: `${SITE_URL}/opengraph-image`,
            author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
            publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
            copyrightHolder: { '@type': 'Organization', name: SITE_NAME },
            copyrightYear: currentYear(),
          },
        ]}
      />
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-ink-500">
        <Link href="/o-level-short-notes" className="underline"><T hi="शॉर्ट नोट्स" en="Short notes" /></Link>
        {' / '}
        <Link href={`/o-level-short-notes/${m.slug}`} className="underline">{m.short}</Link>
      </nav>

      <p className="notes-print-note">यह सामग्री प्रिंट नहीं की जा सकती। इसे {SITE_URL.replace(/^https?:\/\//, '')} पर पढ़ें।</p>

      <NotesGuard mark={SITE_URL.replace(/^https?:\/\//, '').replace(/^localhost.*/, 'olevelmocktest.in')}>
        <article className="max-w-3xl">
          <p className="text-[16px] text-ink-700">
            <T hi={`${m.short} के इस चैप्टर के ${c.points} one liner points हिंदी और English में। पहले हिंदी, उसके नीचे English।`} en={`${c.points} one-liner points for this ${m.short} chapter in Hindi and English. Hindi first, English below.`} />
          </p>

          <nav aria-label="Sections" className="mt-5 rounded-xl bg-white p-4 shadow-sm ring-1 ring-ink-200">
            <h2 className="text-[15px] font-bold text-ink-900"><T hi="इस चैप्टर में" en="In this chapter" /></h2>
            <ul className="mt-2 grid gap-x-6 gap-y-1 text-[15px] sm:grid-cols-2">
              {c.sections.map((s) => (
                <li key={s.id}><a href={`#${s.id}`} className="text-brand-700 underline decoration-brand-300 underline-offset-2">{s.hi === s.en ? s.hi : `${s.hi}`}</a></li>
              ))}
            </ul>
          </nav>

          {c.sections.map((s) => (
            <section key={s.id} id={s.id} className="mt-9 scroll-mt-6" aria-labelledby={`${s.id}-h`}>
              <h2 id={`${s.id}-h`} className="font-display text-[22px] font-bold leading-snug text-brand-900">
                {s.hi}
                {s.en && s.en !== s.hi && <span className="block text-[15px] font-medium text-ink-500">{s.en}</span>}
              </h2>
              <ol className="mt-3 space-y-2.5">
                {s.blocks.map((b, k) =>
                  b.table ? (
                    <li key={k} className="list-none"><Table rows={b.table} /></li>
                  ) : (
                    <li key={k} value={b.no} className="flex items-start gap-3 rounded-xl bg-white p-3.5 shadow-sm ring-1 ring-ink-200">
                      <span className="mt-0.5 grid h-6 min-w-6 shrink-0 place-items-center rounded-full bg-blush-100 px-1 text-[12px] font-bold text-brand-800">{b.no}</span>
                      <span className="min-w-0 break-words">
                        <span className="block text-[17px] font-medium leading-relaxed text-ink-900">{b.p[0]}</span>
                        <span className="mt-0.5 block text-[15px] leading-relaxed text-ink-600">{b.p[1]}</span>
                      </span>
                    </li>
                  ),
                )}
              </ol>
            </section>
          ))}
        </article>
      </NotesGuard>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href={`/o-level/${m.slug}`} className="btn-primary"><T hi={`${m.short} का मॉक टेस्ट दो`} en={`Take the ${m.short} mock test`} /></Link>
        <Link href={`/o-level-short-notes/${m.slug}`} className="btn-secondary"><T hi="इस मॉड्यूल के सारे चैप्टर" en="All chapters of this module" /></Link>
      </div>

      <nav aria-label="Chapters" className="mt-10 grid max-w-3xl gap-3 sm:grid-cols-2">
        {prev ? (
          <Link href={`/o-level-short-notes/${m.slug}/${prev.slug}`} rel="prev" className="rounded-xl bg-ink-50 p-4 ring-1 ring-ink-200 hover:ring-brand-400">
            <div className="text-xs text-ink-500"><T hi="पिछला चैप्टर" en="Previous chapter" /></div>
            <div className="font-semibold text-ink-900"><T hi={prev.hi} en={prev.en} /></div>
          </Link>
        ) : <span />}
        {next && (
          <Link href={`/o-level-short-notes/${m.slug}/${next.slug}`} rel="next" className="rounded-xl bg-ink-50 p-4 ring-1 ring-ink-200 hover:ring-brand-400 sm:text-right">
            <div className="text-xs text-ink-500"><T hi="अगला चैप्टर" en="Next chapter" /></div>
            <div className="font-semibold text-ink-900"><T hi={next.hi} en={next.en} /></div>
          </Link>
        )}
      </nav>

      <p className="mt-8 max-w-3xl text-sm leading-relaxed text-ink-500">
        <T
          hi={`© ${currentYear()} ${SITE_NAME}. सर्वाधिकार सुरक्षित। इन नोट्स की कॉपी, दोबारा प्रकाशन या बिक्री बिना अनुमति मना है। ये नोट्स सिर्फ़ दोहराने के लिए हैं और परीक्षा का पैटर्न नहीं बताते; सही और ताज़ा जानकारी के लिए NIELIT का सिलेबस देखें।`}
          en={`© ${currentYear()} ${SITE_NAME}. All rights reserved. Copying, republishing or selling these notes without permission is not allowed. They are for revision only and do not describe the exam pattern; for official, current details see the NIELIT syllabus.`}
        />
      </p>
    </SiteShell>
  );
}
