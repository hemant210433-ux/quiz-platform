import Link from 'next/link';

export const metadata = { title: 'Page not found', robots: { index: false } };

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="font-display text-6xl font-semibold text-ink-300">404</div>
      <h1 className="mt-2 text-lg font-semibold">पेज नहीं मिला / Page not found</h1>
      <p className="mt-1 text-sm text-ink-500">अगर आपको क्विज़ लिंक मिला था, तो जाँचें कि वह पूरा कॉपी हुआ है।</p>
      <Link href="/" className="btn-secondary mt-6">होम पेज / Home</Link>
    </div>
  );
}
