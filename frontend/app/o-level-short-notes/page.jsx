import Link from 'next/link';
import SiteShell, { PageBand, SectionTitle } from '@/components/site/SiteChrome.jsx';
import JsonLd from '@/components/site/JsonLd.jsx';
import { T } from '@/i18n/LangProvider.jsx';
import { MODULES } from '@/content/modules.js';
import { chaptersOf, totalPoints, totalChapters, NOTES_UPDATED } from '@/content/notes.js';
import { SITE_URL } from '@/lib/siteApi.js';
import { pageMeta, currentYear } from '@/lib/seo.js';

const FAQ = [
  ['O Level short notes क्या हैं और इन्हें कैसे पढ़ें?', 'ये one liner notes हैं: हर चैप्टर के मुख्य बिंदु एक-एक लाइन में, पहले हिंदी और उसके नीचे English में। पहले चैप्टर पढ़ो, फिर उसी मॉड्यूल का मॉक टेस्ट देकर देखो कि कितना याद रहा।'],
  ['क्या ये शॉर्ट नोट्स मुफ़्त हैं?', 'हाँ, इस वेबसाइट पर ये नोट्स मुफ़्त पढ़ सकते हो। कोई लॉगिन या पेमेंट नहीं है।'],
  ['क्या इसमें O Level के सभी मॉड्यूल हैं?', 'हाँ। M1-R5 (IT Tools और Network Basics), M2-R5 (Web Designing और Publishing), M3-R5 (Python) और M4-R5 (IoT) के चैप्टर वाइज़ नोट्स यहाँ हैं।'],
  ['क्या ये NIELIT के आधिकारिक नोट्स हैं?', 'नहीं। यह एक स्वतंत्र अभ्यास प्लेटफ़ॉर्म है और NIELIT से संबद्ध नहीं है। परीक्षा की सही और ताज़ा जानकारी के लिए NIELIT की आधिकारिक साइट देखो।'],
  ['क्या मैं इन नोट्स को कॉपी करके दूसरी जगह डाल सकता हूँ?', 'नहीं। सामग्री इस साइट की है। बिना अनुमति कॉपी, दोबारा प्रकाशित या बेचना मना है। पढ़ने के लिए इस साइट पर ही आओ।'],
];

export const metadata = pageMeta({
  title: `O Level Short Notes हिंदी में ${currentYear()} – चैप्टर वाइज़ One Liner Notes`,
  description: 'O Level के M1-R5, M2-R5, M3-R5 और M4-R5 के चैप्टर वाइज़ short notes हिंदी और English में। एक-एक लाइन में मुख्य बिंदु, मुफ़्त और बिना लॉगिन।',
  path: '/o-level-short-notes',
  noarchive: true,
  keywords: ['O Level short notes in Hindi', 'O Level notes Hindi', 'O Level one liner notes', 'M1-R5 notes', 'M2-R5 notes', 'M3-R5 Python notes', 'M4-R5 IoT notes', 'O Level chapter wise notes'],
});

export default function ShortNotes() {
  const chapters = totalChapters(MODULES);
  const points = totalPoints(MODULES);
  return (
    <SiteShell band={<PageBand title={<T hi="O Level शॉर्ट नोट्स हिंदी में – चैप्टर वाइज़" en="O Level short notes – chapter wise" />} sub={<T hi={`${MODULES.length} मॉड्यूल, ${chapters} चैप्टर, ${points.toLocaleString('en-IN')} one liner points. हिंदी और English साथ-साथ।`} en={`${MODULES.length} modules, ${chapters} chapters, ${points.toLocaleString('en-IN')} one-liner points. Hindi and English together.`} />} />}>
      <JsonLd
        data={[
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
              { '@type': 'ListItem', position: 2, name: 'O Level Short Notes', item: `${SITE_URL}/o-level-short-notes` },
            ],
          },
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'O Level Short Notes in Hindi and English',
            inLanguage: ['hi', 'en'],
            dateModified: NOTES_UPDATED,
            url: `${SITE_URL}/o-level-short-notes`,
            hasPart: MODULES.map((m) => ({ '@type': 'WebPage', name: `${m.short} short notes`, url: `${SITE_URL}/o-level-short-notes/${m.slug}` })),
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
          },
        ]}
      />
      <div className="max-w-3xl space-y-3 text-[17px] text-ink-700">
        <p>
          <T
            hi="यहाँ O Level के हर मॉड्यूल के चैप्टर वाइज़ short notes हैं। हर बिंदु पहले हिंदी में, उसके नीचे English में है, ताकि दोनों भाषाओं के शब्द साथ-साथ याद हों।"
            en="Chapter-wise short notes for every O Level module. Each point is in Hindi first with English below it, so you learn the terms in both languages."
          />
        </p>
        <p>
          <T
            hi="नोट्स पढ़ने के बाद मॉक टेस्ट दो, और कमज़ोर विषय दोबारा पढ़ो। ये नोट्स सिर्फ़ दोहराने के लिए हैं, परीक्षा का पैटर्न नहीं बताते।"
            en="After reading, take a mock test and revisit weak topics. These notes are for revision only and do not describe the exam pattern."
          />
        </p>
      </div>

      <nav aria-label="Modules" className="mt-8 flex flex-wrap gap-2">
        {MODULES.map((m) => (
          <a key={m.code} href={`#n-${m.code}`} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-800 shadow-sm ring-1 ring-ink-200 hover:ring-brand-400">{m.short} · {m.shortEn}</a>
        ))}
      </nav>

      <div className="mt-12 space-y-14">
        {MODULES.map((m) => (
          <section key={m.code} aria-labelledby={`n-${m.code}`}>
            <div id={`n-${m.code}`} className="scroll-mt-6">
              <SectionTitle><T hi={`${m.short} शॉर्ट नोट्स: ${m.hi}`} en={`${m.short} short notes: ${m.en}`} /></SectionTitle>
            </div>
            <ol className="mt-6 grid max-w-4xl gap-3 sm:grid-cols-2">
              {chaptersOf(m).map((c) => (
                <li key={c.slug}>
                  <Link href={`/o-level-short-notes/${m.slug}/${c.slug}`} className="flex h-full items-start gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-ink-200 transition hover:ring-brand-400">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blush-100 text-sm font-bold text-brand-800">{c.n}</span>
                    <span className="min-w-0">
                      <span className="block text-[16px] font-semibold leading-snug text-ink-900"><T hi={c.hi} en={c.en} /></span>
                      <span className="mt-0.5 block text-xs text-ink-500"><T hi={`${c.points} points`} en={`${c.points} points`} /></span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={`/o-level-short-notes/${m.slug}`} className="btn-secondary"><T hi={`${m.short} के सारे चैप्टर`} en={`All ${m.short} chapters`} /></Link>
              <Link href={`/o-level/${m.slug}`} className="btn-primary"><T hi={`${m.short} का मॉक टेस्ट`} en={`${m.short} mock test`} /></Link>
            </div>
          </section>
        ))}
      </div>

      <section className="mt-16 max-w-3xl" aria-labelledby="faq">
        <div id="faq"><SectionTitle><T hi="अक्सर पूछे जाने वाले सवाल" en="Frequently asked questions" /></SectionTitle></div>
        <div className="mt-6 space-y-3">
          {FAQ.map(([q, a]) => (
            <details key={q} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-ink-200">
              <summary className="cursor-pointer text-[17px] font-semibold text-ink-900">{q}</summary>
              <p className="mt-2 text-[16px] text-ink-700">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
