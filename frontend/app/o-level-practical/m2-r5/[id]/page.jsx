import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteShell, { PageBand } from '@/components/site/SiteChrome.jsx';
import JsonLd from '@/components/site/JsonLd.jsx';
import NotesGuard from '@/components/site/NotesGuard.jsx';
import { T } from '@/i18n/LangProvider.jsx';
import { PRACTICALS, getPractical, mainFile, PRACTICAL_UPDATED } from '@/content/practicals.js';
import { SITE_URL } from '@/lib/siteApi.js';
import { pageMeta, currentYear, SITE_NAME } from '@/lib/seo.js';

export const dynamicParams = false;
export const generateStaticParams = () => PRACTICALS.map((p) => ({ id: p.id }));

const cut = (s, n) => (s.length <= n ? s : `${s.slice(0, n - 1).replace(/[\s,·]+\S*$/, '')}…`);
const FRAMES = new Set(['frames']);

export function generateMetadata({ params }) {
  const p = getPractical(params.id);
  if (!p) return {};
  return pageMeta({
    title: cut(`${p.en} – HTML Practical (${p.label}) Output + Code | O Level M2-R5`, 68),
    description: cut(`O Level M2-R5 HTML practical ${p.label}: ${p.question} Output और code हिंदी–English में।`, 158),
    path: `/o-level-practical/m2-r5/${p.id}`,
    type: 'article',
    keywords: [`${p.en} HTML program`, `O Level HTML practical ${p.label}`, ...p.tags.map((t) => `HTML ${t}`), 'O Level M2-R5 practical'],
  });
}

export default function PracticalPage({ params }) {
  const i = PRACTICALS.findIndex((x) => x.id === params.id);
  if (i < 0) notFound();
  const p = PRACTICALS[i];
  const prev = PRACTICALS[i - 1];
  const next = PRACTICALS[i + 1];
  const url = `${SITE_URL}/o-level-practical/m2-r5/${p.id}`;
  const height = FRAMES.has(p.topic) ? 460 : p.id.startsWith('q10') || p.id.startsWith('s2') ? 520 : 420;
  const mark = SITE_URL.replace(/^https?:\/\//, '').replace(/^localhost.*/, 'olevelmocktest.in');
  return (
    <SiteShell band={<PageBand kicker={`M2-R5 · ${p.label}`} title={<T hi={p.hi} en={p.en} />} sub={<T hi="HTML Practical: output और code" en="HTML practical: output and code" />} />}>
      <JsonLd
        data={[
          { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
            { '@type': 'ListItem', position: 2, name: 'O Level Practical', item: `${SITE_URL}/o-level-practical` },
            { '@type': 'ListItem', position: 3, name: 'M2-R5 HTML Practical Lab', item: `${SITE_URL}/o-level-practical/m2-r5` },
            { '@type': 'ListItem', position: 4, name: p.en, item: url },
          ] },
          { '@context': 'https://schema.org', '@type': 'TechArticle', headline: `${p.en} – HTML practical program with output`, alternativeHeadline: p.hi, description: p.question, inLanguage: ['hi', 'en'],
            proficiencyLevel: 'Beginner', dependencies: 'Web browser, text editor', datePublished: PRACTICAL_UPDATED, dateModified: PRACTICAL_UPDATED, mainEntityOfPage: url,
            image: `${SITE_URL}/opengraph-image`, author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL }, publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
            copyrightHolder: { '@type': 'Organization', name: SITE_NAME }, copyrightYear: currentYear() },
        ]}
      />
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-ink-500">
        <Link href="/o-level-practical" className="underline"><T hi="प्रैक्टिकल" en="Practical" /></Link>{' / '}
        <Link href="/o-level-practical/m2-r5" className="underline">M2-R5 HTML Lab</Link>
      </nav>

      <div className="max-w-4xl">
        <h2 className="font-display text-xl font-bold text-brand-900"><T hi="सवाल" en="Question" /> {p.label}</h2>
        <p className="mt-2 rounded-xl bg-white p-4 text-[17px] leading-relaxed text-ink-900 shadow-sm ring-1 ring-ink-200">{p.question}</p>
        {p.note && <p className="mt-3 text-[15px] text-ink-600">{p.note}</p>}
        {p.steps && (
          <>
            <h2 className="mt-6 font-display text-xl font-bold text-brand-900">Steps</h2>
            <ol className="mt-2 list-decimal space-y-1 pl-6 text-[16px] text-ink-800">{p.steps.map((s) => <li key={s}>{s}</li>)}</ol>
          </>
        )}

        <h2 className="mt-8 font-display text-xl font-bold text-brand-900"><T hi="Output (नीचे के code से बना)" en="Output (made by the code below)" /></h2>
        <div className="mt-2 overflow-hidden rounded-xl bg-white ring-1 ring-ink-300">
          <iframe title={`Output: ${p.en}`} src={`/practical-preview/${p.id}/${mainFile(p)}`} loading="lazy" sandbox="allow-forms allow-popups" className="block w-full bg-white" style={{ height }} />
        </div>
        <p className="mt-2 text-sm text-ink-500"><T hi="Output बॉक्स के अंदर लिंक और बटन चलाकर देख सकते हो।" en="You can click the links and buttons inside the output box." /></p>

        <h2 className="mt-8 font-display text-xl font-bold text-brand-900"><T hi="HTML Code" en="HTML code" /></h2>
        <NotesGuard mark={mark}>
          <div className="mt-2 space-y-4">
            {p.files.map((f) => (
              <figure key={f.name} className="overflow-hidden rounded-xl bg-[#0f1b2d] ring-1 ring-ink-300">
                <figcaption className="flex items-center justify-between bg-[#17283f] px-4 py-2 font-mono text-[13px] text-sky-200">
                  <span>{f.name}</span>{p.files.length > 1 && f.name === mainFile(p) && <span className="text-amber-300">main file</span>}
                </figcaption>
                <pre className="overflow-x-auto p-4 font-mono text-[13.5px] leading-relaxed text-slate-100"><code>{f.code}</code></pre>
              </figure>
            ))}
          </div>
        </NotesGuard>
        {p.files.length > 1 && <p className="mt-3 text-[15px] text-ink-600"><T hi="सारी files एक ही folder में, ऊपर दिखाए नामों से save करो, फिर main file खोलो।" en="Save all the files in one folder with the names shown above, then open the main file." /></p>}

        <p className="mt-6 text-[15px] text-ink-600"><T hi={`इस program में ये tags/attributes इस्तेमाल हुए हैं: ${p.tags.join(', ')}।`} en={`Tags and attributes used in this program: ${p.tags.join(', ')}.`} /></p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/o-level/m2-r5" className="btn-primary"><T hi="M2-R5 का मॉक टेस्ट दो" en="Take the M2-R5 mock test" /></Link>
          <Link href="/o-level-practical/m2-r5" className="btn-secondary"><T hi="सारे practical" en="All practicals" /></Link>
        </div>

        <nav aria-label="Practicals" className="mt-10 grid gap-3 sm:grid-cols-2">
          {prev ? (
            <Link href={`/o-level-practical/m2-r5/${prev.id}`} rel="prev" className="rounded-xl bg-ink-50 p-4 ring-1 ring-ink-200 hover:ring-brand-400">
              <div className="text-xs text-ink-500"><T hi="पिछला practical" en="Previous practical" /></div>
              <div className="font-semibold text-ink-900">{prev.label}. <T hi={prev.hi} en={prev.en} /></div>
            </Link>
          ) : <span />}
          {next && (
            <Link href={`/o-level-practical/m2-r5/${next.id}`} rel="next" className="rounded-xl bg-ink-50 p-4 ring-1 ring-ink-200 hover:ring-brand-400 sm:text-right">
              <div className="text-xs text-ink-500"><T hi="अगला practical" en="Next practical" /></div>
              <div className="font-semibold text-ink-900">{next.label}. <T hi={next.hi} en={next.en} /></div>
            </Link>
          )}
        </nav>
        <p className="mt-8 text-sm leading-relaxed text-ink-500">
          <T hi={`© ${currentYear()} ${SITE_NAME}. सर्वाधिकार सुरक्षित। ये अभ्यास के सवाल हैं, परीक्षा का पैटर्न नहीं बताते। यह एक स्वतंत्र अभ्यास प्लेटफ़ॉर्म है और NIELIT से संबद्ध नहीं है।`} en={`© ${currentYear()} ${SITE_NAME}. All rights reserved. Practice questions only; they do not describe the exam pattern. This is an independent practice platform and is not affiliated with NIELIT.`} />
        </p>
      </div>
    </SiteShell>
  );
}
