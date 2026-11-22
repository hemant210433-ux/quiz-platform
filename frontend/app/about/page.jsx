import SiteShell, { PageBand } from '@/components/site/SiteChrome.jsx';
import { T } from '@/i18n/LangProvider.jsx';

export const metadata = { title: 'हमारे बारे में', description: 'O Level Mock Test एक स्वतंत्र, मुफ़्त अभ्यास प्लेटफ़ॉर्म है जो NIELIT से संबद्ध नहीं है।', alternates: { canonical: '/about' } };

export default function About() {
  return (
    <SiteShell band={<PageBand title={<T hi="हमारे बारे में" en="About" />} />}>
      <div className="prose-hi max-w-2xl">
        <p><T hi="यह साइट O Level के विद्यार्थियों को हिंदी में मुफ़्त अभ्यास टेस्ट देने के लिए बनाई गई है।" en="This site offers free practice tests in Hindi for O Level students." /></p>
        <p><T hi="यह एक स्वतंत्र अभ्यास प्लेटफ़ॉर्म है और NIELIT से संबद्ध नहीं है। यहाँ के प्रश्न अभ्यास के लिए हैं और वास्तविक परीक्षा के प्रश्न होने का दावा नहीं करते।" en="This is an independent practice platform and is not affiliated with NIELIT. Questions here are for practice and do not claim to be actual exam questions." /></p>
        <p><T hi="परीक्षा की तारीख़, पैटर्न और सिलेबस के लिए हमेशा NIELIT की आधिकारिक सूचना देखें।" en="Always check the official NIELIT notice for exam dates, pattern and syllabus." /></p>
      </div>
    </SiteShell>
  );
}
