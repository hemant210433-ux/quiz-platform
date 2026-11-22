'use client';
import { useEffect, useState } from 'react';
import { SiteFooter, SiteHeader } from '../site/SiteChrome.jsx';
import { publicApi } from '../../services/api.js';

export function useSiteName() {
  const [name, setName] = useState('Quiz Platform');
  useEffect(() => {
    publicApi.site().then((r) => setName(r.siteName)).catch(() => {});
  }, []);
  return name;
}

export default function PublicLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-blush-100 via-ink-50 to-ink-50">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-8 pt-8 sm:pt-12">{children}</main>
      <SiteFooter />
    </div>
  );
}
