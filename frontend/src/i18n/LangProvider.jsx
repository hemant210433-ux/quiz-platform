'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import hi from './hi.js';
import en from './en.js';

const DICTS = { hi, en };
const Ctx = createContext({ lang: 'hi', setLang: () => {}, t: (k) => hi[k] ?? k });

export function LangProvider({ children }) {
  const [lang, setLangState] = useState('hi'); // Hindi first; server HTML is always Hindi (good for SEO)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('omt_lang');
      if (saved === 'en' || saved === 'hi') setLangState(saved);
    } catch {}
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const setLang = useCallback((l) => {
    setLangState(l);
    try { localStorage.setItem('omt_lang', l); } catch {}
  }, []);
  const t = useCallback((k) => DICTS[lang][k] ?? DICTS.hi[k] ?? k, [lang]);
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);

/** Inline bilingual text: <T hi="..." en="..." />. Hindi is what crawlers see. */
export function T({ hi: h, en: e }) {
  const { lang } = useLang();
  return lang === 'en' ? e : h;
}
