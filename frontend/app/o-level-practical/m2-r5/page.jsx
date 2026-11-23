import Link from 'next/link';
import SiteShell, { PageBand } from '@/components/site/SiteChrome.jsx';
import JsonLd from '@/components/site/JsonLd.jsx';
import { T } from '@/i18n/LangProvider.jsx';
import { TOPICS, PRACTICALS, practicalsOf, PRACTICAL_UPDATED } from '@/content/practicals.js';
import { SITE_URL } from '@/lib/siteApi.js';
import { pageMeta, currentYear } from '@/lib/seo.js';

const FAQ = [
  ['ये practical कैसे चलाऊँ?', 'हर question के पेज पर ऊपर output दिखता है और नीचे उसका HTML code। Notepad या VS Code में वही code टाइप करो, .html नाम से save करो और browser में खोलो।'],
  ['क्या इसमें CSS या JavaScript है?', 'नहीं। ये सारे practical सिर्फ़ HTML से बने हैं, ताकि शुरुआत करने वाले भी आसानी से टाइप कर सकें।'],
  ['क्या ये NIELIT के असली परीक्षा के सवाल हैं?', 'नहीं। ये अभ्यास के सवाल हैं। परीक्षा का पैटर्न, अंक और नियम हम नहीं बताते; उसके लिए NIELIT की आधिकारिक साइट देखो। यह एक स्वतंत्र अभ्यास प्लेटफ़ॉर्म है और NIELIT से संबद्ध नहीं है।'],
  ['Frames आज भी क्यों सिखाए जाते हैं?', 'HTML5 में frameset हटा दिया गया है, पर ये कई practical सूचियों का हिस्सा है और ब्राउज़र में अभी चलता है, इसलिए इसका अभ्यास यहाँ भी दिया है।'],
];

export const metadata = pageMeta({
  title: `O Level M2-R5 HTML Practical ${currentYear()} – सभी Programs Output और Code के साथ`,
  description: 'O Level M2-R5 के HTML practical programs: tables, forms, frames, lists, links और HTML5, हर program का output और code हिंदी–English में। मुफ़्त अभ्यास।',
  path: '/o-level-practical/m2-r5',
  keywords: ['O Level HTML practical', 'M2-R5 practical programs', 'HTML practical questions with output', 'O Level web designing practical', 'HTML table form frames program'],
});

export default function HtmlLab() {
  const url = `${SITE_URL}/o-level-practical/m2-r5`;
  return (
    <SiteShell band={<PageBand kicker="M2-R5" title={<T hi="HTML Practical Lab – सभी programs output के साथ" en="HTML Practical Lab – every program with output" />} sub={<T hi={`${PRACTICALS.length} practical, सिर्फ़ HTML से। हर program का output और code एक ही पेज पर।`} en={`${PRACTICALS.length} practicals made with HTML only. Output and code for every program on one page.`} />} />}>
      <JsonLd
        data={[
          { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
            { '@type': 'ListItem', position: 2, name: 'O Level Practical', item: `${SITE_URL}/o-level-practical` },
            { '@type': 'ListItem', position: 3, name: 'M2-R5 HTML Practical Lab', item: url },
          ] },
          { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'O Level M2-R5 HTML Practical Lab', url, inLanguage: ['hi', 'en'], dateModified: PRACTICAL_UPDATED,
            hasPart: PRACTICALS.map((p) => ({ '@type': 'LearningResource', name: `${p.label}: ${p.en}`, url: `${url}/${p.id}` })) },
          { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
        ]}
      />
      <div className="max-w-3xl space-y-3 text-[17px] text-ink-700">
        <p><T hi="किसी भी practical पर क्लिक करो: ऊपर उसका output दिखेगा और नीचे code। वही code Notepad में टाइप करके चलाओ।" en="Open any practical: the output is on top and the code below it. Type the same code in Notepad and run it." /></p>
        <p className="rounded-lg border border-mark-300 bg-mark-100/60 px-4 py-3 text-base"><T hi="ये अभ्यास के सवाल हैं, NIELIT परीक्षा के असली सवाल नहीं। परीक्षा का पैटर्न और नियम NIELIT की साइट पर देखें।" en="These are practice questions, not real NIELIT exam questions. Check the exam pattern and rules on the NIELIT site." /></p>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {TOPICS.map((t) => (
          <section key={t.id} className={`rounded-2xl p-5 ring-1 ring-ink-200 ${t.color}`} aria-labelledby={`t-${t.id}`}>
            <h2 id={`t-${t.id}`} className="font-display text-[19px] font-bold leading-snug text-brand-900"><T hi={t.hi} en={t.en} /></h2>
            <ul className="mt-3 space-y-1.5 text-[15.5px]">
              {practicalsOf(t.id).map((p) => (
                <li key={p.id}>
                  <Link href={`/o-level-practical/m2-r5/${p.id}`} className="text-brand-800 underline decoration-brand-300 underline-offset-2 hover:text-brand-600">
                    <b>{p.label}.</b> <T hi={p.hi} en={p.en} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

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
        <Link href="/o-level/m2-r5" className="btn-primary"><T hi="M2-R5 का मॉक टेस्ट दो" en="Take the M2-R5 mock test" /></Link>
        <Link href="/o-level-short-notes/m2-r5" className="btn-secondary"><T hi="M2-R5 शॉर्ट नोट्स" en="M2-R5 short notes" /></Link>
      </div>
    </SiteShell>
  );
}
