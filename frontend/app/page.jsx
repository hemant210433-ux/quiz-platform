import Link from 'next/link';
import SiteShell, { Bubble, SectionTitle } from '@/components/site/SiteChrome.jsx';
import JsonLd from '@/components/site/JsonLd.jsx';
import { QuizList } from '@/components/site/QuizCard.jsx';
import HeroDemo from '@/components/site/HeroDemo.jsx';
import ModuleIndex from '@/components/site/ModuleIndex.jsx';
import { T } from '@/i18n/LangProvider.jsx';
import { MODULES, SITE_NAME_HI, DISCLAIMER_HI, NIELIT_SITE_URL } from '@/content/modules.js';
import { fetchPublicQuizzes, SITE_URL } from '@/lib/siteApi.js';
import { pageMeta, currentYear } from '@/lib/seo.js';

export const revalidate = 300;

export function generateMetadata() {
  return pageMeta({
    title: `O Level Mock Test ${currentYear()} – मुफ़्त ऑनलाइन टेस्ट, हिंदी में`,
    description: 'NIELIT O Level के M1-R5, M2-R5, M3-R5, M4-R5 के मुफ़्त ऑनलाइन मॉक टेस्ट – हिंदी में, बिना लॉगिन। जवाब तुरंत देखो और कमज़ोर विषय जानो। स्वतंत्र अभ्यास साइट।',
    path: '/',
  });
}

const FAQ = [
  {
    q: ['O Level का ऑनलाइन मॉक टेस्ट मुफ़्त कहाँ दे सकते हैं?', 'Where can I take a free O Level online mock test?'],
    a: ['इसी साइट पर। M1-R5, M2-R5, M3-R5 और M4-R5 के मॉक टेस्ट मुफ़्त हैं, लॉगिन नहीं चाहिए। बस अपना नाम लिखो और टेस्ट शुरू करो।', 'Right here. The M1-R5, M2-R5, M3-R5 and M4-R5 mock tests are free and need no login. Just enter your name and start.'],
  },
  {
    q: ['क्या O Level के मॉक टेस्ट हिंदी में मिलते हैं?', 'Are the O Level mock tests available in Hindi?'],
    a: ['हाँ। यह साइट हिंदी-पहले बनी है: पेज, निर्देश और रिज़ल्ट हिंदी में हैं और English का बटन भी है। प्रश्न जिस भाषा में जोड़े गए हैं, उसी में दिखते हैं।', 'Yes. The site is Hindi-first: pages, instructions and results are in Hindi, with an English switch. Questions appear in the language they were written in.'],
  },
  {
    q: ['O Level में कितने मॉड्यूल हैं और कौन-कौन से?', 'How many O Level modules are there and which?'],
    a: ['थ्योरी के चार मॉड्यूल हैं: M1-R5 (Information Technology Tools and Network Basics), M2-R5 (Web Designing and Publishing), M3-R5 (Programming and Problem Solving through Python) और M4-R5 (Internet of Things and its Applications)। सिलेबस में प्रैक्टिकल और प्रोजेक्ट भी हैं; यहाँ सिर्फ़ MCQ अभ्यास है।', 'There are four theory modules: M1-R5 (Information Technology Tools and Network Basics), M2-R5 (Web Designing and Publishing), M3-R5 (Programming and Problem Solving through Python) and M4-R5 (Internet of Things and its Applications). The syllabus also has a practical and a project; this site offers MCQ practice only.'],
  },
  {
    q: ['क्या यहाँ पिछले साल के असली पेपर मिलेंगे?', 'Will I find real previous-year papers here?'],
    a: ['नहीं। यहाँ के प्रश्न अभ्यास के लिए हैं और हम असली परीक्षा के प्रश्न होने का दावा नहीं करते। परीक्षा की सही तैयारी के लिए NIELIT का सिलेबस साथ रखो।', 'No. The questions here are for practice and we do not claim they are real exam questions. Keep the NIELIT syllabus beside you for proper preparation.'],
  },
  {
    q: ['परीक्षा की तारीख़, पैटर्न, एडमिट कार्ड और रिज़ल्ट कहाँ देखें?', 'Where do I check exam dates, pattern, admit card and result?'],
    a: ['सिर्फ़ NIELIT की आधिकारिक वेबसाइट (nielit.gov.in) पर। ये जानकारी बदलती रहती है, इसलिए हम इन्हें यहाँ नहीं देते ताकि गलत जानकारी न जाए।', 'Only on the official NIELIT website (nielit.gov.in). This information changes, so we do not publish it here to avoid giving you outdated details.'],
  },
  {
    q: ['मॉक टेस्ट से कमज़ोर विषय कैसे पता चलते हैं?', 'How do mock tests show my weak topics?'],
    a: ['हर सवाल किसी विषय से जुड़ा होता है। जमा करते ही रिज़ल्ट में विषय के हिसाब से सही-गलत का प्रतिशत दिखता है, ताकि तुम सबसे कमज़ोर विषय से दोहराना शुरू कर सको।', 'Every question is tied to a topic. When you submit, the result shows the percentage right per topic so you can start revising from the weakest one.'],
  },
  {
    q: ['क्या मोबाइल पर टेस्ट दे सकते हैं? लॉगिन चाहिए?', 'Can I take the test on mobile? Do I need to log in?'],
    a: ['हाँ, फ़ोन पर पूरा चलता है और लॉगिन की ज़रूरत नहीं। सिर्फ़ अपना नाम लिखना होता है।', 'Yes, it works fully on a phone and needs no login. You only enter your name.'],
  },
  {
    q: ['क्या यह NIELIT की आधिकारिक वेबसाइट है?', 'Is this the official NIELIT website?'],
    a: [`नहीं। ${DISCLAIMER_HI} परीक्षा से जुड़ी आधिकारिक जानकारी के लिए NIELIT की वेबसाइट देखें।`, 'No. This is an independent practice platform and is not affiliated with NIELIT. Check the NIELIT website for official exam information.'],
  },
];

const PROMISES = [
  { hi: 'हिंदी में अभ्यास', en: 'Practice in Hindi', dh: 'सवाल, विकल्प और स्पष्टीकरण, सब अपनी भाषा में पढ़ो।', de: 'Read questions, options and explanations in your own language.', d: 'M4 6h16M4 12h10M4 18h16' },
  { hi: 'बिना लॉगिन', en: 'No login', dh: 'सिर्फ़ नाम लिखो और टेस्ट शुरू करो। कोई खाता नहीं बनाना।', de: 'Enter your name and start. No account to create.', d: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 20a8 8 0 0116 0' },
  { hi: 'तुरंत जवाब', en: 'Instant answers', dh: 'जमा करते ही हर सवाल का सही जवाब और कारण देखो।', de: 'The moment you submit, see the right answer and the reason for each question.', d: 'M5 12l4 4 10-10' },
  { hi: 'कमज़ोर विषयों की रिपोर्ट', en: 'Weak-topic report', dh: 'जानो कि किस विषय में अंक कटे, और वहीं से दोहराना शुरू करो।', de: 'Find the topics where you lost marks and start revising there.', d: 'M4 20V10M10 20V4M16 20v-8M22 20H2' },
];
const TIPS = [
  { hi: 'पहले आसान सवाल', en: 'Easy questions first', dh: 'जो सवाल तुरंत आते हैं उन्हें पहले करो। अटके हुए सवाल पर समय मत गँवाओ, आगे बढ़ो और बाद में लौटो।', de: 'Answer the questions you know straight away. Do not sit on a stuck one; move on and come back later.' },
  { hi: 'गलती से सीखो', en: 'Learn from mistakes', dh: 'रिज़ल्ट में हर गलत जवाब का कारण पढ़ो। वही बात दोबारा गलत नहीं होगी।', de: 'Read the reason behind every wrong answer in your result. You will not repeat the same mistake.' },
  { hi: 'रोज़ थोड़ा, लगातार', en: 'A little, every day', dh: 'हफ़्ते में एक लंबे टेस्ट से बेहतर है रोज़ एक छोटा टेस्ट। याददाश्त ऐसे ही पक्की होती है।', de: 'One short test a day beats one long test a week. That is how memory sticks.' },
];
const STEPS = [
  [['नाम लिखो', 'Enter your name'], ['बस अपना नाम लिखना है। लॉगिन या पासवर्ड नहीं।', 'Just your name. No login or password.']],
  [['टेस्ट दो', 'Take the test'], ['टाइमर चलता रहेगा। जमा करने से पहले जवाब बदल सकते हो।', 'The timer keeps running. You can change answers before you submit.']],
  [['जवाब मिलाओ', 'Check answers'], ['हर सवाल का सही जवाब और उसका कारण तुरंत मिलता है।', 'The right answer and its reason, for every question, straight away.']],
  [['कमज़ोर विषय सुधारो', 'Fix weak topics'], ['रिपोर्ट देखकर उसी विषय का अगला टेस्ट दो।', 'Use the report to take the next test on that topic.']],
];

function Check() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-good-600" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l4 4 10-10" /></svg>
  );
}

export default async function Home() {
  const all = await fetchPublicQuizzes();
  const quizzes = all.slice(0, 6);
  const counts = {};
  for (const q of all) if (q.module) counts[q.module] = (counts[q.module] || 0) + 1;

  const hero = (
    <>
      <div className="bg-gradient-to-b from-blush-100 via-blush-50 to-ink-50">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-10 sm:px-6 sm:pb-24 sm:pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-sm font-semibold text-brand-800 shadow-card ring-1 ring-ink-200/70">
              <Bubble className="h-5 w-5" /> <T hi="O Level के विद्यार्थियों के लिए" en="For O Level students" />
            </p>
            <h1 className="mt-5 font-display text-[2.6rem] leading-[1.25] text-brand-900 sm:text-6xl sm:leading-[1.2]">
              <T hi="O Level मॉक टेस्ट – हिंदी में, मुफ़्त" en="Free O Level mock tests, in Hindi" />
            </h1>
            <p className="mt-6 max-w-xl text-lg text-ink-600">
              <T
                hi="O Level के मॉक टेस्ट कंप्यूटर स्क्रीन पर दो, हिंदी में। जवाब तुरंत देखो और जानो कि किस विषय पर अभी मेहनत बाकी है।"
                en="Take O Level mock tests on screen, in Hindi. See answers instantly and find which topics still need work."
              />
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/o-level-mock-test" className="btn-primary btn-lg"><T hi="मॉक टेस्ट शुरू करो" en="Start a mock test" /></Link>
              <a href="#modules" className="btn-outline btn-lg"><T hi="मॉड्यूल देखो" en="Browse modules" /></a>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-base font-semibold text-ink-700">
              {[['मुफ़्त', 'Free'], ['लॉगिन नहीं चाहिए', 'No login'], ['कोई विज्ञापन नहीं', 'No ads']].map(([h, e]) => (
                <li key={h} className="flex items-center gap-2"><Check /><T hi={h} en={e} /></li>
              ))}
            </ul>
          </div>
          <HeroDemo />
        </div>
      </div>
      {/* module strip */}
      <div className="bg-brand-900 text-mark-200">
        <ul className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 py-4 text-[15px] font-semibold sm:px-6">
          {MODULES.map((m) => (
            <li key={m.code} className="flex items-center gap-2.5">
              <Bubble className="h-4 w-4" ring="#d4af5a" />
              <span><span className="text-white">{m.short}</span> <T hi={m.hi.split(' ').slice(0, 3).join(' ')} en={m.en.split(' ').slice(0, 3).join(' ')} /></span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );

  return (
    <SiteShell hero={hero}>
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME_HI, url: SITE_URL, inLanguage: ['hi', 'en'] }} />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q[0], acceptedAnswer: { '@type': 'Answer', text: f.a[0] } })),
        }}
      />

      <section id="modules" aria-labelledby="mods" className="-mt-4 scroll-mt-6">
        <div id="mods"><SectionTitle sub={<T hi="हर मॉड्यूल के अपने मॉक टेस्ट हैं। अपना मॉड्यूल चुनो और शुरू करो।" en="Every module has its own mock tests. Pick yours and begin." />}><T hi="अपना मॉड्यूल चुनो" en="Pick your module" /></SectionTitle></div>
        <div className="mt-10"><ModuleIndex modules={MODULES} counts={counts} /></div>
      </section>

      <section className="mt-24" aria-labelledby="latest">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div id="latest"><SectionTitle><T hi="नए मॉक टेस्ट" en="Latest mock tests" /></SectionTitle></div>
          <Link href="/o-level-mock-test" className="font-bold text-brand-700 hover:underline"><T hi="सभी टेस्ट देखो" en="See all tests" /> <span aria-hidden="true">→</span></Link>
        </div>
        <div className="mt-10"><QuizList quizzes={quizzes} /></div>
      </section>

      <section aria-labelledby="journey" className="mt-24">
        <div id="journey"><SectionTitle center sub={<T hi="चार छोटे क़दम, और हर टेस्ट के बाद तुम्हें पता होता है कि आगे क्या दोहराना है।" en="Four small steps, and after every test you know what to revise next." />}><T hi="तैयारी का सफ़र" en="Your practice journey" /></SectionTitle></div>
        <ol className="relative mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([h, d], k) => (
            <li key={k} className="relative rounded-2xl bg-white p-6 shadow-card ring-1 ring-ink-200/80">
              <span className="font-display text-5xl leading-none text-mark-300">{k + 1}</span>
              <h3 className="mt-3 font-display text-xl text-brand-900"><T hi={h[0]} en={h[1]} /></h3>
              <p className="mt-2 text-[15px] text-ink-600"><T hi={d[0]} en={d[1]} /></p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="promise" className="mt-24 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-800 to-brand-950 px-6 py-14 text-white sm:px-12">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 id="promise" className="font-display text-3xl leading-[1.3] sm:text-4xl"><T hi="सीधा, सरल और मुफ़्त अभ्यास" en="Simple, straight and free practice" /></h2>
            <div className="mt-3 flex items-center gap-3" aria-hidden="true"><span className="h-px w-12 bg-mark-300" /><Bubble className="h-4 w-4" ring="#d4af5a" /></div>
            <p className="mt-5 max-w-md text-lg text-white/80"><T hi="न कोई फ़ीस, न कोई खाता, न कोई विज्ञापन। बस सवाल, जवाब और सुधार।" en="No fees, no account, no ads. Just questions, answers and improvement." /></p>
            <Link href="/o-level-mock-test" className="btn-hl btn-lg mt-8"><T hi="अभी अभ्यास शुरू करो" en="Start practising now" /></Link>
          </div>
          <ul className="grid gap-6 sm:grid-cols-2">
            {PROMISES.map((p) => (
              <li key={p.hi} className="rounded-2xl bg-white/[0.07] p-5 ring-1 ring-white/15">
                <svg viewBox="0 0 24 24" className="h-7 w-7 text-mark-300" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={p.d} /></svg>
                <h3 className="mt-3 font-display text-xl"><T hi={p.hi} en={p.en} /></h3>
                <p className="mt-1.5 text-[15px] text-white/75"><T hi={p.dh} en={p.de} /></p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="tips" className="mt-24">
        <div id="tips"><SectionTitle><T hi="तैयारी के तीन सुझाव" en="Three practice tips" /></SectionTitle></div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {TIPS.map((t) => (
            <article key={t.hi} className="rounded-2xl border border-ink-200 bg-white p-6">
              <h3 className="font-display text-xl text-brand-900"><T hi={t.hi} en={t.en} /></h3>
              <p className="mt-2 text-[15px] text-ink-600"><T hi={t.dh} en={t.de} /></p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-24 max-w-3xl" aria-labelledby="about-tests">
        <div id="about-tests"><SectionTitle><T hi="O Level ऑनलाइन टेस्ट की तैयारी, एक जगह" en="O Level online test preparation, in one place" /></SectionTitle></div>
        <div className="mt-8 space-y-4 text-[17px] text-ink-700">
          <p>
            <T
              hi="स्क्रीन पर सवाल हल करने की आदत तैयारी में बहुत काम आती है। यहाँ NIELIT O Level (R5) के M1-R5, M2-R5, M3-R5 और M4-R5 मॉड्यूल के मॉक टेस्ट हिंदी में मुफ़्त मिलते हैं, ताकि तुम अपने मॉड्यूल के हिसाब से अभ्यास कर सको।"
              en="Getting used to solving questions on screen helps a lot in preparation. Here you get free mock tests for the M1-R5, M2-R5, M3-R5 and M4-R5 modules of NIELIT O Level (R5) in Hindi so you can practise module by module."
            />
          </p>
          <p>
            <T
              hi="हर टेस्ट के बाद हर सवाल का सही जवाब और कारण मिलता है, और विषय-वार रिपोर्ट बताती है कि कहाँ दोहराना है। सिलेबस के यूनिट देखने के लिए "
              en="After every test you get the right answer and reason for each question, and a topic-wise report shows where to revise. To see the syllabus units visit "
            />
            <Link href="/o-level-syllabus" className="font-semibold text-brand-700 underline"><T hi="O Level सिलेबस पेज" en="the O Level syllabus page" /></Link>
            <T hi="। परीक्षा की तारीख़ और पैटर्न के लिए " en=". For exam dates and pattern see " />
            <a href={NIELIT_SITE_URL} rel="noopener noreferrer" target="_blank" className="font-semibold text-brand-700 underline">nielit.gov.in</a>.
          </p>
        </div>
      </section>

      <section className="mt-24 max-w-3xl" aria-labelledby="faq">
        <div id="faq"><SectionTitle><T hi="अक्सर पूछे जाने वाले प्रश्न" en="Frequently asked questions" /></SectionTitle></div>
        <div className="mt-8 divide-y divide-ink-200 border-y border-ink-200">
          {FAQ.map((f) => (
            <details key={f.q[0]} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold text-ink-900">
                <T hi={f.q[0]} en={f.q[1]} />
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink-100 text-xl leading-none text-brand-700 transition group-open:rotate-45 group-open:bg-mark-100" aria-hidden="true">+</span>
              </summary>
              <p className="mt-3 max-w-2xl text-[17px] text-ink-700"><T hi={f.a[0]} en={f.a[1]} /></p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-24 rounded-3xl bg-blush-100 px-6 py-14 text-center ring-1 ring-blush-200 sm:px-12">
        <h2 className="font-display text-3xl leading-[1.3] text-brand-900 sm:text-4xl"><T hi="आज का पहला टेस्ट दो" en="Take your first test today" /></h2>
        <p className="mx-auto mt-3 max-w-xl text-lg text-ink-600"><T hi="कोई लॉगिन नहीं, कोई फ़ीस नहीं। नाम लिखो और शुरू करो।" en="No login, no fee. Enter your name and begin." /></p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/o-level-mock-test" className="btn-primary btn-lg"><T hi="मॉक टेस्ट शुरू करो" en="Start a mock test" /></Link>
          <Link href="/contact" className="btn-outline btn-lg"><T hi="सवाल या सुझाव भेजो" en="Send a question or tip" /></Link>
        </div>
      </section>
    </SiteShell>
  );
}
