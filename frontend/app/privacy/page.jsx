import SiteShell, { PageBand } from '@/components/site/SiteChrome.jsx';
import { T } from '@/i18n/LangProvider.jsx';

export const metadata = { title: 'प्राइवेसी पॉलिसी', description: 'हम कौन-सी जानकारी रखते हैं और कैसे इस्तेमाल करते हैं।', alternates: { canonical: '/privacy' } };

export default function Privacy() {
  return (
    <SiteShell band={<PageBand title={<T hi="प्राइवेसी पॉलिसी" en="Privacy policy" />} />}>
      <div className="prose-hi max-w-2xl">
        <p><T hi="टेस्ट देने के लिए आप अपना नाम (और वैकल्पिक रूप से स्टूडेंट आईडी) लिखते हैं। यह जानकारी सिर्फ़ आपका रिज़ल्ट बनाने और टेस्ट प्रशासक को दिखाने के लिए रखी जाती है।" en="To take a test you enter your name (and optionally a student ID). It is kept only to produce your result and to show it to the test administrator." /></p>
        <p><T hi="हम आपके ब्राउज़र में भाषा की पसंद और चल रहे टेस्ट की प्रगति सेव करने के लिए लोकल स्टोरेज का उपयोग करते हैं। इस साइट पर विज्ञापन या ट्रैकिंग कुकीज़ नहीं हैं।" en="We use your browser's local storage to remember your language choice and in-progress test. This site has no ads or tracking cookies." /></p>
        <p><T hi="अपना डेटा हटवाने के लिए संपर्क पेज पर दिए माध्यम से अनुरोध करें।" en="To request deletion of your data, contact us using the details on the contact page." /></p>
      </div>
    </SiteShell>
  );
}
