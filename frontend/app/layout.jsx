import '@fontsource/mukta/400.css';
import '@fontsource/mukta/500.css';
import '@fontsource/mukta/600.css';
import '@fontsource/mukta/700.css';
import '@fontsource/tiro-devanagari-hindi/400.css';
import '@fontsource-variable/noto-sans-devanagari';
import Providers from './providers.jsx';
import '../src/index.css';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'O Level Mock Test – मुफ़्त ऑनलाइन अभ्यास (हिंदी)', template: '%s | O Level Mock Test' },
  description: 'NIELIT O Level के मुफ़्त ऑनलाइन मॉक टेस्ट – हिंदी में, बिना लॉगिन। एक स्वतंत्र अभ्यास प्लेटफ़ॉर्म।',
  applicationName: 'O Level Mock Test',
  icons: { icon: '/favicon.svg' },
  openGraph: { type: 'website', locale: 'hi_IN', siteName: 'O Level Mock Test' },
  twitter: { card: 'summary_large_image' },
};

export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#800020' };

export default function RootLayout({ children }) {
  return (
    <html lang="hi">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
