import Link from 'next/link';
import SiteShell, { PageBand, SectionTitle } from '@/components/site/SiteChrome.jsx';
import JsonLd from '@/components/site/JsonLd.jsx';
import { T } from '@/i18n/LangProvider.jsx';
import { MODULES, NIELIT_SYLLABUS_URL } from '@/content/modules.js';
import { SITE_URL } from '@/lib/siteApi.js';
import { pageMeta } from '@/lib/seo.js';

export const metadata = pageMeta({
  title: 'O Level R5 सिलेबस हिंदी में – M1 से M4 के यूनिट',
  description: 'NIELIT O Level (R5) के चारों मॉड्यूल M1-R5, M2-R5, M3-R5, M4-R5 के यूनिट एक जगह, हिंदी और English में। हर मॉड्यूल का मुफ़्त मॉक टेस्ट भी दें।',
  path: '/o-level-syllabus',
});

export default function Syllabus() {
  return (
    <SiteShell band={<PageBand title={<T hi="O Level (R5) सिलेबस – चारों मॉड्यूल के यूनिट" en="O Level (R5) syllabus – units of all four modules" />} sub={<T hi="तैयारी की योजना बनाने के लिए। हर मॉड्यूल के नीचे उसका मुफ़्त मॉक टेस्ट पेज है।" en="To plan your preparation. Every module links to its free mock-test page." />} />}>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
            { '@type': 'ListItem', position: 2, name: 'O Level Syllabus', item: `${SITE_URL}/o-level-syllabus` },
          ],
        }}
      />
      <p className="max-w-3xl text-[17px] text-ink-700">
        <T
          hi="नीचे NIELIT O Level (R5) के सिद्धांत (theory) मॉड्यूल और उनके यूनिट के शीर्षक हैं। सिलेबस में प्रैक्टिकल (PR1-R5) और प्रोजेक्ट (PJ1-R5) भी हैं; इस साइट पर सिर्फ़ बहुविकल्पीय (MCQ) अभ्यास है। सिलेबस बदल सकता है, इसलिए नवीनतम जानकारी हमेशा NIELIT पर देखें।"
          en="Below are the theory modules of the NIELIT O Level (R5) course and their unit headings. The syllabus also has a practical (PR1-R5) and a project (PJ1-R5); this site offers multiple-choice practice only. The syllabus can change, so always check NIELIT for the latest."
        />{' '}
        <a href={NIELIT_SYLLABUS_URL} rel="noopener noreferrer" target="_blank" className="font-semibold text-brand-700 underline"><T hi="NIELIT सिलेबस पेज" en="NIELIT syllabus page" /></a>
      </p>

      <div className="mt-14 space-y-16">
        {MODULES.map((m) => (
          <section key={m.code} aria-labelledby={m.code}>
            <div id={m.code} className="scroll-mt-6">
              <SectionTitle><T hi={`${m.short}: ${m.hi}`} en={`${m.short}: ${m.en}`} /></SectionTitle>
            </div>
            <ol className="mt-8 grid max-w-4xl gap-x-8 gap-y-1 sm:grid-cols-2">
              {m.units.map((u, i) => (
                <li key={u.en} className="flex items-start gap-3 border-b border-ink-200 py-3 text-lg font-medium">
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blush-100 text-sm font-bold text-brand-800">{i + 1}</span>
                  <T hi={u.hi} en={u.en} />
                </li>
              ))}
            </ol>
            <Link href={`/o-level/${m.slug}`} className="btn-primary mt-6"><T hi={`${m.short} का मॉक टेस्ट दो`} en={`Take the ${m.short} mock test`} /></Link>
          </section>
        ))}
      </div>
    </SiteShell>
  );
}
