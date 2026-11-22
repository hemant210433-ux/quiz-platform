'use client';
import Link from 'next/link';
import { T, useLang } from '@/i18n/LangProvider.jsx';
import ModuleArt from './ModuleArt.jsx';

export default function ModuleIndex({ modules, counts = {} }) {
  const { lang, t } = useLang();
  return (
    <ul className="grid gap-6 md:grid-cols-2">
      {modules.map((m) => {
        const n = counts[m.code] || 0;
        return (
          <li key={m.code}>
            <Link href={`/o-level/${m.slug}`} className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-ink-200/80 transition duration-300 hover:-translate-y-1 hover:shadow-lift">
              <div className="relative h-36 overflow-hidden">
                <ModuleArt code={m.code} />
                <span className="absolute bottom-3 left-5 font-display text-5xl leading-none text-mark-300">{m.short.split('-')[0]}</span>
                <span className="absolute right-4 top-4 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white ring-1 ring-white/30">{m.short}</span>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="font-display text-2xl leading-snug text-brand-900"><T hi={m.hi} en={m.en} /></h3>
                <p className="mt-2 text-[15px] text-ink-600"><T hi={m.descHi} en={m.descEn} /></p>
                <p className="mt-3 text-sm text-ink-500">{(lang === 'en' ? m.topicsEn : m.topicsHi).slice(0, 3).join(' · ')}</p>
                <div className="mt-5 flex items-center justify-between border-t border-ink-100 pt-4">
                  <span className="text-sm font-bold text-ink-700">{n > 0 ? `${n} ${lang === 'en' ? (n === 1 ? 'test' : 'tests') : 'टेस्ट'}` : t('comingSoon')}</span>
                  <span className="text-sm font-bold text-brand-700 group-hover:underline">{t('viewTests')} <span aria-hidden="true">→</span></span>
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
