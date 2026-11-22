import SiteShell, { PageBand } from '@/components/site/SiteChrome.jsx';
import { T } from '@/i18n/LangProvider.jsx';

export const metadata = { title: 'संपर्क', description: 'सुझाव या सुधार के लिए संपर्क करें।', alternates: { canonical: '/contact' } };

const EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || '';

export default function Contact() {
  return (
    <SiteShell band={<PageBand title={<T hi="संपर्क" en="Contact" />} />}>
      <div className="prose-hi max-w-2xl">
        <p><T hi="प्रश्न में गलती मिली या कोई सुझाव है? हमें बताइए।" en="Found a mistake in a question or have a suggestion? Tell us." /></p>
        {EMAIL ? (
          <p><a className="font-semibold text-brand-700 underline" href={`mailto:${EMAIL}`}>{EMAIL}</a></p>
        ) : (
          <p className="text-sm text-ink-500"><T hi="संपर्क ईमेल अभी सेट नहीं है। (साइट मालिक: NEXT_PUBLIC_CONTACT_EMAIL सेट करें।)" en="Contact email is not set yet. (Site owner: set NEXT_PUBLIC_CONTACT_EMAIL.)" /></p>
        )}
      </div>
    </SiteShell>
  );
}
