import Link from 'next/link';
import SiteShell, { PageBand } from '@/components/site/SiteChrome.jsx';
import JsonLd from '@/components/site/JsonLd.jsx';
import { T } from '@/i18n/LangProvider.jsx';
import { MODULES } from '@/content/modules.js';
import { unitsOf, totalOf, GUESS_UPDATED } from '@/content/guess.js';
import { SITE_URL } from '@/lib/siteApi.js';
import { pageMeta, currentYear } from '@/lib/seo.js';

const FAQ = [
  ['गेस पेपर क्या है?', 'ये हर यूनिट के महत्वपूर्ण one liner प्रश्न और उनके उत्तर हैं, जो revision के लिए बनाए गए हैं।'],
  ['क्या यही प्रश्न परीक्षा में आएँगे?', 'नहीं, इसकी कोई गारंटी नहीं है। ये अभ्यास के लिए चुने गए महत्वपूर्ण प्रश्न हैं, NIELIT के आधिकारिक प्रश्न नहीं। परीक्षा का पैटर्न और नियम NIELIT की आधिकारिक साइट पर देखें।'],
  ['एक पुराना या अलग उत्तर दिखे तो?', 'कुछ तथ्य (जैसे limits और numbers) समय के साथ बदलते हैं। जहाँ पुराने papers और आज के उत्तर में फ़र्क है, वहाँ दोनों बताने की कोशिश की गई है। आधिकारिक किताब या साइट से मिलान ज़रूर करें।'],
];

export const metadata = pageMeta({
  title: `O Level Guess Paper ${currentYear()} हिंदी – M1 M2 M3 M4 Important Questions`,
  description: 'O Level के सभी मॉड्यूल (M1-R5, M2-R5, M3-R5, M4-R5) के महत्वपूर्ण one liner प्रश्न-उत्तर, यूनिट वाइज़ हिंदी में। revision के लिए मुफ़्त अभ्यास।',
  path: '/o-level-guess-paper',
  noarchive: true,
  keywords: ['O Level guess paper', 'O Level important questions in Hindi', 'O Level one liner questions', 'M1-R5 guess paper', 'M2-R5 guess paper', 'M3-R5 Python guess paper', 'M4-R5 IoT guess paper'],
});

export default function GuessIndex() {
  const url = `${SITE_URL}/o-level-guess-paper`;
  return (
    <SiteShell band={<PageBand title={<T hi="O Level गेस पेपर – महत्वपूर्ण प्रश्न" en="O Level guess paper – important questions" />} sub={<T hi="चारों मॉड्यूल के one liner प्रश्न-उत्तर, यूनिट वाइज़" en="One-liner questions and answers for all four modules, unit by unit" />} />}>
      <JsonLd
        data={[
          { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
            { '@type': 'ListItem', position: 2, name: 'O Level Guess Paper', item: url },
          ] },
          { '@context': 'https://schema.org', '@type': 'ItemList', name: 'O Level guess paper', dateModified: GUESS_UPDATED,
            itemListElement: MODULES.map((m, i) => ({ '@type': 'ListItem', position: i + 1, name: `${m.short} guess paper`, url: `${url}/${m.slug}` })) },
          { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
        ]}
      />
      <p className="max-w-3xl rounded-lg border border-mark-300 bg-mark-100/60 px-4 py-3 text-[16px] text-ink-800">
        <T hi="ये अभ्यास के लिए चुने गए महत्वपूर्ण प्रश्न हैं। इनके परीक्षा में आने की कोई गारंटी नहीं है, और ये NIELIT के आधिकारिक प्रश्न नहीं हैं। परीक्षा का पैटर्न NIELIT की साइट पर देखें।" en="These are important practice questions chosen for revision. There is no guarantee that they will appear in the exam, and they are not official NIELIT questions. Check the exam pattern on the NIELIT site." />
      </p>
      <ul className="mt-8 grid max-w-4xl gap-4 sm:grid-cols-2">
        {MODULES.map((m) => (
          <li key={m.slug}>
            <Link href={`/o-level-guess-paper/${m.slug}`} className="block h-full rounded-xl bg-white p-5 shadow-sm ring-1 ring-ink-200 transition hover:ring-brand-400">
              <div className="text-xs font-bold uppercase tracking-widest text-mark-500">{m.short}</div>
              <h2 className="mt-1 text-[19px] font-bold leading-snug text-ink-900"><T hi={m.hi} en={m.en} /></h2>
              <p className="mt-2 text-[14px] text-ink-600">{unitsOf(m).length} <T hi="यूनिट" en="units" /> · {totalOf(m)} <T hi="प्रश्न" en="questions" /></p>
              <span className="mt-3 inline-block text-sm font-semibold text-brand-700"><T hi="गेस पेपर खोलो" en="Open guess paper" /></span>
            </Link>
          </li>
        ))}
      </ul>
      <section className="mt-14 max-w-3xl" aria-labelledby="faq">
        <h2 id="faq" className="font-display text-2xl font-bold text-brand-900"><T hi="अक्सर पूछे जाने वाले सवाल" en="Frequently asked questions" /></h2>
        <div className="mt-4 space-y-3">
          {FAQ.map(([q, a]) => (
            <details key={q} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-ink-200">
              <summary className="cursor-pointer font-semibold text-ink-900">{q}</summary>
              <p className="mt-2 text-[16px] leading-relaxed text-ink-700">{a}</p>
            </details>
          ))}
        </div>
      </section>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/o-level-mock-test" className="btn-primary"><T hi="मॉक टेस्ट दो" en="Take a mock test" /></Link>
        <Link href="/o-level-short-notes" className="btn-secondary"><T hi="शॉर्ट नोट्स पढ़ो" en="Read short notes" /></Link>
      </div>
    </SiteShell>
  );
}
