import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { publicApi } from '../../services/api.js';

export function useSiteName() {
  const [name, setName] = useState('Quiz Platform');
  useEffect(() => {
    publicApi.site().then((r) => setName(r.siteName)).catch(() => {});
  }, []);
  return name;
}

export default function PublicLayout() {
  const siteName = useSiteName();
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#eef6f4,_#f6f7f9_55%)]">
      <header className="no-print mx-auto flex max-w-4xl items-center gap-2.5 px-4 py-5">
        <img src="/favicon.svg" alt="" className="h-7 w-7" />
        <span className="font-display text-lg font-semibold text-ink-900">{siteName}</span>
      </header>
      <main className="mx-auto max-w-4xl px-4 pb-16">
        <Outlet />
      </main>
    </div>
  );
}
