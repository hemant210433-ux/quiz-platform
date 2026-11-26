'use client';
import Link from 'next/link';
import { useLang, T } from '@/i18n/LangProvider.jsx';
import { DISCLAIMER_EN, DISCLAIMER_HI, MODULES, SITE_NAME_EN, SITE_NAME_HI } from '@/content/modules.js';

/** An OMR bubble with the answer filled in: the site's one recurring mark. */
export function Bubble({ className = 'h-8 w-8', ring = 'currentColor', fill = '#d4af5a' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="12.5" fill="none" stroke={ring} strokeWidth="2.6" />
      <circle cx="16" cy="16" r="6.2" fill={fill} />
    </svg>
  );
}

/** Thin gold rule with a bubble in the middle: used as a section ornament. */
export function Ornament({ className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`} aria-hidden="true">
      <span className="h-px w-12 bg-mark-300" />
      <Bubble className="h-4 w-4 text-mark-400" ring="#b9923c" />
      <span className="h-px w-12 bg-mark-300" />
    </div>
  );
}

const navLink = 'whitespace-nowrap rounded-md px-2.5 py-2 text-[15px] font-semibold text-ink-700 transition hover:bg-brand-50 hover:text-brand-800';

export function SiteHeader() {
  const { lang, setLang, t } = useLang();
  return (
    <header className="no-print relative z-20 border-b border-ink-200/70 bg-ink-50/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3.5 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 text-brand-800" aria-label="Home">
          <Bubble className="h-9 w-9" />
          <span className="leading-none">
            <span className="block whitespace-nowrap font-display text-[22px] text-brand-900"><T hi={SITE_NAME_HI} en={SITE_NAME_EN} /></span>
            <span className="mt-1 block text-[11px] font-semibold text-ink-500"><T hi="मुफ़्त अभ्यास प्लेटफ़ॉर्म" en="Free practice platform" /></span>
          </span>
        </Link>
        <nav aria-label="Main" className="ml-auto hidden items-center gap-0.5 lg:flex">
          <Link className={navLink} href="/">{t('home')}</Link>
          <Link className={navLink} href="/o-level-mock-test">{t('tests')}</Link>
          <Link className={navLink} href="/o-level-short-notes">{t('shortNotes')}</Link>
          <Link className={navLink} href="/o-level-guess-paper">{t('guessPaper')}</Link>
          <Link className={navLink} href="/o-level-practical">{t('practical')}</Link>
          <Link className={navLink} href="/#modules">{t('modules')}</Link>
          <Link className={navLink} href="/about">{t('about')}</Link>
          <Link className={navLink} href="/contact">{t('contact')}</Link>
        </nav>
        <div className="ml-auto flex items-center gap-2 lg:ml-3">
          <div role="group" aria-label="Language" className="flex overflow-hidden rounded-md ring-1 ring-ink-300">
            {[['hi', 'हिं'], ['en', 'EN']].map(([code, label]) => (
              <button
                key={code}
                type="button"
                onClick={() => setLang(code)}
                aria-pressed={lang === code}
                className={`px-2.5 py-1.5 text-xs font-bold transition ${lang === code ? 'bg-brand-700 text-white' : 'text-ink-600 hover:bg-ink-100'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <Link href="/o-level-mock-test" className="btn-primary hidden whitespace-nowrap xl:inline-flex">{t('startPractice')}</Link>
          <details className="relative lg:hidden">
            <summary className="grid h-9 w-9 cursor-pointer list-none place-items-center rounded-md ring-1 ring-ink-300" aria-label={t('menu')}>
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            </summary>
            <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white p-2 shadow-lift ring-1 ring-ink-200">
              {[['/', 'home'], ['/o-level-mock-test', 'tests'], ['/o-level-short-notes', 'shortNotes'], ['/o-level-guess-paper', 'guessPaper'], ['/o-level-practical', 'practical'], ['/#modules', 'modules'], ['/about', 'about'], ['/contact', 'contact']].map(([href, k]) => (
                <Link key={k} href={href} className="block rounded-md px-3 py-2.5 text-[15px] font-semibold text-ink-800 hover:bg-brand-50">{t(k)}</Link>
              ))}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}

export function Disclaimer({ className = '' }) {
  return (
    <p className={`text-sm leading-relaxed ${className}`}>
      <T hi={DISCLAIMER_HI} en={DISCLAIMER_EN} />
    </p>
  );
}

export function SiteFooter() {
  const { t, lang } = useLang();
  return (
    <footer className="no-print mt-24 bg-brand-950 text-white/75">
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1.2fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5 text-white">
              <Bubble className="h-9 w-9" ring="#ffffff" />
              <span className="font-display text-2xl"><T hi={SITE_NAME_HI} en={SITE_NAME_EN} /></span>
            </Link>
            <p className="mt-4 max-w-sm text-[15px] leading-relaxed">
              <T
                hi="O Level की तैयारी के लिए मुफ़्त मॉक टेस्ट। हिंदी में अभ्यास करो, जवाब तुरंत देखो और कमज़ोर विषय पहचानो।"
                en="Free mock tests for O Level preparation. Practise in Hindi, see answers instantly and spot your weak topics."
              />
            </p>
          </div>
          <nav aria-label="Footer">
            <h2 className="font-display text-lg text-mark-300">{t('explore')}</h2>
            <ul className="mt-3 space-y-2 text-[15px]">
              <li><Link href="/o-level-mock-test" className="hover:text-white hover:underline">{t('tests')}</Link></li>
              <li><Link href="/o-level-short-notes" className="hover:text-white hover:underline">{t('shortNotes')}</Link></li>
              <li><Link href="/o-level-guess-paper" className="hover:text-white hover:underline">{t('guessPaper')}</Link></li>
              <li><Link href="/o-level-practical" className="hover:text-white hover:underline">{t('practical')}</Link></li>
              <li><Link href="/o-level-syllabus" className="hover:text-white hover:underline">{t('syllabus')}</Link></li>
              <li><Link href="/about" className="hover:text-white hover:underline">{t('about')}</Link></li>
              <li><Link href="/privacy" className="hover:text-white hover:underline">{t('privacy')}</Link></li>
              <li><Link href="/contact" className="hover:text-white hover:underline">{t('contact')}</Link></li>
            </ul>
          </nav>
          <nav aria-label="Modules">
            <h2 className="font-display text-lg text-mark-300">{t('modules')}</h2>
            <ul className="mt-3 space-y-2 text-[15px]">
              {MODULES.map((m) => (
                <li key={m.code}><Link href={`/o-level/${m.slug}`} className="hover:text-white hover:underline">{m.short} · {lang === 'en' ? m.en : m.hi}</Link></li>
              ))}
            </ul>
          </nav>
        </div>
        {/* Required on every public page: both languages always visible. */}
        <p className="mt-10 border-t border-white/15 pt-6 text-sm leading-relaxed text-white/80">
          {DISCLAIMER_HI}
          <br />
          {DISCLAIMER_EN}
        </p>
      </div>
    </footer>
  );
}

/** Header + optional hero / page title band + page body + footer. */
export default function SiteShell({ children, hero, band }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      {hero}
      {band && (
        <div className="border-b border-ink-200/70 bg-gradient-to-b from-blush-100 to-ink-50">
          <div className="mx-auto max-w-6xl px-4 pb-10 pt-10 sm:px-6 sm:pb-12 sm:pt-14">{band}</div>
        </div>
      )}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-12 sm:px-6 sm:pt-16">{children}</main>
      <SiteFooter />
    </div>
  );
}

export function PageBand({ title, sub, kicker }) {
  return (
    <div className="max-w-3xl">
      {kicker && <div className="mb-3 inline-block rounded-full bg-mark-100 px-3 py-1 text-sm font-bold text-mark-500 ring-1 ring-mark-300/60">{kicker}</div>}
      <h1 className="font-display text-4xl leading-[1.4] text-brand-900 sm:text-5xl">{title}</h1>
      <Ornament className="mt-4" />
      {sub && <p className="mt-4 max-w-2xl text-lg text-ink-600">{sub}</p>}
    </div>
  );
}

export function SectionTitle({ children, sub, center = false }) {
  return (
    <div className={center ? 'text-center' : ''}>
      <h2 className="font-display text-3xl leading-[1.4] text-brand-900 sm:text-4xl">{children}</h2>
      <Ornament className={`mt-3 ${center ? 'justify-center' : ''}`} />
      {sub && <p className={`mt-3 max-w-2xl text-lg text-ink-600 ${center ? 'mx-auto' : ''}`}>{sub}</p>}
    </div>
  );
}
