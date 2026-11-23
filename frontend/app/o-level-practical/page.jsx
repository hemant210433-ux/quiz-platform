import Link from 'next/link';
import SiteShell, { PageBand, SectionTitle } from '@/components/site/SiteChrome.jsx';
import JsonLd from '@/components/site/JsonLd.jsx';
import { T } from '@/i18n/LangProvider.jsx';
import { MODULES, NIELIT_SYLLABUS_URL, NIELIT_SITE_URL } from '@/content/modules.js';
import { SITE_URL } from '@/lib/siteApi.js';
import { pageMeta } from '@/lib/seo.js';

export const metadata = pageMeta({
  title: 'O Level प्रैक्टिकल की तैयारी – अभ्यास गाइड हिंदी में',
  description: 'O Level (R5) प्रैक्टिकल की तैयारी कैसे करें: हर मॉड्यूल के हिसाब से अभ्यास के सुझाव, और NIELIT की आधिकारिक जानकारी का लिंक। मुफ़्त मॉक टेस्ट भी दें।',
  path: '/o-level-practical',
});

// Self-practice ideas only. These are NOT exam questions and say nothing about the real exam pattern.
const PRACTICE = {
  'm1-r5': {
    hi: ['वर्ड प्रोसेसर में पत्र, रिज़्यूमे और टेबल वाला डॉक्यूमेंट बनाओ', 'स्प्रेडशीट में सूत्र (formula), चार्ट और छँटाई (sort/filter) का अभ्यास करो', 'प्रेज़ेंटेशन में स्लाइड, चित्र और ट्रांज़िशन बनाओ', 'ईमेल भेजना, फ़ाइल संलग्न करना और इंटरनेट पर खोज करना सीखो'],
    en: ['Make a letter, résumé and a table document in a word processor', 'Practise formulas, charts, sort and filter in a spreadsheet', 'Build slides with images and transitions in a presentation tool', 'Practise sending email with attachments and searching the internet'],
  },
  'm2-r5': {
    hi: ['अपना एक सरल HTML पेज बनाओ: शीर्षक, सूची, लिंक और चित्र', 'CSS से रंग, फ़ॉन्ट और लेआउट बदलकर देखो', 'एक फ़ॉर्म बनाओ: टेक्स्ट बॉक्स, ड्रॉपडाउन और बटन', 'बनी हुई वेबसाइट को ब्राउज़र में खोलकर जाँचो'],
    en: ['Build a simple HTML page: headings, lists, links and images', 'Change colours, fonts and layout with CSS', 'Create a form with text boxes, a dropdown and a button', 'Open and test your pages in a browser'],
  },
  'm3-r5': {
    hi: ['Python में छोटे प्रोग्राम लिखो: जोड़-घटाव, सम-विषम, पहाड़ा', 'if-else और लूप (for/while) पर 10-10 प्रोग्राम हल करो', 'लिस्ट, स्ट्रिंग और फ़ंक्शन का अभ्यास करो', 'अपना प्रोग्राम चलाकर आउटपुट जाँचो और गलती (error) ढूँढना सीखो'],
    en: ['Write small Python programs: arithmetic, odd/even, multiplication table', 'Solve about ten programs each on if-else and loops', 'Practise lists, strings and functions', 'Run your code, check the output and learn to read error messages'],
  },
  'm4-r5': {
    hi: ['सेंसर, एक्चुएटर और माइक्रोकंट्रोलर के नाम और काम समझो', 'एक सरल सर्किट का चित्र बनाकर समझाओ (जैसे LED चालू/बंद)', 'IoT के उदाहरण रोज़मर्रा की चीज़ों में खोजो', 'डेटा इंटरनेट तक कैसे पहुँचता है, इसका ब्लॉक डायग्राम बनाओ'],
    en: ['Learn the names and jobs of sensors, actuators and microcontrollers', 'Draw and explain a simple circuit (for example an LED on/off)', 'Find IoT examples in everyday devices', 'Draw a block diagram of how data reaches the internet'],
  },
};

export default function Practical() {
  return (
    <SiteShell band={<PageBand title={<T hi="O Level प्रैक्टिकल की तैयारी" en="O Level practical preparation" />} sub={<T hi="हर मॉड्यूल के हिसाब से अभ्यास के सुझाव, और असली जानकारी के लिए NIELIT का लिंक।" en="Practice ideas for every module, plus the link to NIELIT for the official details." />} />}>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
            { '@type': 'ListItem', position: 2, name: 'O Level Practical', item: `${SITE_URL}/o-level-practical` },
          ],
        }}
      />
      <div className="max-w-3xl space-y-4 text-[17px] text-ink-700">
        <p>
          <T
            hi="O Level के सिलेबस में प्रैक्टिकल (PR1-R5) और प्रोजेक्ट (PJ1-R5) भी हैं। प्रैक्टिकल कंप्यूटर पर हाथ से करके सीखने की चीज़ है, इसलिए यहाँ मॉड्यूल के हिसाब से अभ्यास के सुझाव दिए हैं।"
            en="The O Level syllabus also has a practical (PR1-R5) and a project (PJ1-R5). Practical work is learnt by doing on a computer, so below are practice ideas for each module."
          />
        </p>
        <p className="rounded-lg border border-mark-300 bg-mark-100/60 px-4 py-3 text-base">
          <T
            hi="ध्यान दें: प्रैक्टिकल का पैटर्न, अंक, तारीख़ें और नियम हम यहाँ नहीं बताते। ये बदल सकते हैं, इसलिए हमेशा NIELIT की आधिकारिक साइट पर देखें। नीचे के सुझाव परीक्षा के सवाल नहीं हैं, सिर्फ़ अपनी तैयारी के लिए हैं।"
            en="Note: we do not state the practical exam pattern, marks, dates or rules here. They can change, so always check the official NIELIT site. The ideas below are not exam questions, only for your own preparation."
          />{' '}
          <a href={NIELIT_SYLLABUS_URL} rel="noopener noreferrer" target="_blank" className="font-semibold text-brand-700 underline"><T hi="NIELIT सिलेबस पेज" en="NIELIT syllabus page" /></a>
          {' · '}
          <a href={NIELIT_SITE_URL} rel="noopener noreferrer" target="_blank" className="font-semibold text-brand-700 underline">NIELIT</a>
        </p>
      </div>

      <Link href="/o-level-practical/m2-r5" className="mt-10 block max-w-4xl rounded-2xl bg-brand-900 p-6 text-white shadow-lg ring-1 ring-brand-700 transition hover:bg-brand-800">
        <div className="text-xs font-bold uppercase tracking-widest text-mark-300">M2-R5 · HTML Practical Lab</div>
        <div className="mt-1 font-display text-2xl font-bold"><T hi="HTML के सारे practical – output और code के साथ" en="All HTML practicals – with output and code" /></div>
        <p className="mt-2 text-[16px] text-white/85"><T hi="Tables, Forms, Frames, Lists, Links और HTML5: हर program का अलग पेज, output देखो और code सीखो →" en="Tables, forms, frames, lists, links and HTML5: one page per program, see the output and learn the code →" /></p>
      </Link>

      <div className="mt-14 space-y-14">
        {MODULES.map((m) => (
          <section key={m.code} aria-labelledby={`p-${m.code}`}>
            <div id={`p-${m.code}`} className="scroll-mt-6">
              <SectionTitle><T hi={`${m.short}: ${m.hi}`} en={`${m.short}: ${m.en}`} /></SectionTitle>
            </div>
            <ul className="mt-6 grid max-w-4xl gap-3 sm:grid-cols-2">
              {PRACTICE[m.slug].hi.map((hi, i) => (
                <li key={hi} className="flex items-start gap-3 rounded-xl bg-white p-4 text-[16px] shadow-sm ring-1 ring-ink-200">
                  <span aria-hidden="true" className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-600" />
                  <T hi={hi} en={PRACTICE[m.slug].en[i]} />
                </li>
              ))}
            </ul>
            <Link href={`/o-level/${m.slug}`} className="btn-primary mt-6"><T hi={`${m.short} का मॉक टेस्ट दो`} en={`Take the ${m.short} mock test`} /></Link>
          </section>
        ))}
      </div>
    </SiteShell>
  );
}
