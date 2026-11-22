'use client';
import { useEffect, useState } from 'react';
import { API_BASE } from '@/services/api.js';
import { useLang } from '@/i18n/LangProvider.jsx';

/**
 * 1) Fires one background request at /api/health when a page opens (at most once per 8 minutes
 *    per browser) so a sleeping Render backend starts waking before the student presses Start.
 * 2) Shows a banner while a request is waiting for the server to wake up.
 */
export default function WarmUp() {
  const { lang } = useLang();
  const [waking, setWaking] = useState(false);

  useEffect(() => {
    try {
      const last = Number(localStorage.getItem('qp_warm') || 0);
      if (Date.now() - last < 8 * 60 * 1000) return;
      localStorage.setItem('qp_warm', String(Date.now()));
    } catch {}
    fetch(`${API_BASE}/api/health`, { cache: 'no-store' }).catch(() => {});
  }, []);

  useEffect(() => {
    const on = (e) => setWaking(Boolean(e.detail));
    window.addEventListener('qp:waking', on);
    return () => window.removeEventListener('qp:waking', on);
  }, []);

  if (!waking) return null;
  return (
    <div role="status" aria-live="polite" className="no-print fixed inset-x-0 top-0 z-[100] bg-mark-300 px-4 py-2.5 text-center text-sm font-bold text-ink-900 shadow-lg">
      {lang === 'en'
        ? 'The server is waking up. This can take up to a minute — please wait, do not close the page.'
        : 'सर्वर चालू हो रहा है। इसमें 1 मिनट तक लग सकता है – कृपया रुकिए, पेज बंद मत कीजिए।'}
    </div>
  );
}
