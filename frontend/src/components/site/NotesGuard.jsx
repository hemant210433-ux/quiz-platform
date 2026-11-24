'use client';
import { useEffect, useRef, useState } from 'react';

/**
 * Discourages casual copying: no text selection, copy/cut/drag/right-click blocked, print hidden,
 * and a faint tiled site-name watermark so screenshots carry the source.
 * This is a deterrent only. Text must stay in the page HTML for search engines, so anyone determined
 * (screenshot, view-source, JavaScript turned off) can still take it. Copyright text on the page is the legal protection.
 *
 * Owner mode: when the site owner is logged in to the admin panel (same browser), every restriction is lifted
 * and a small toolbar lets them copy the page text or link.
 */
export default function NotesGuard({ children, mark = 'olevelmocktest.in' }) {
  const ref = useRef(null);
  const [owner, setOwner] = useState(false);
  const [done, setDone] = useState('');

  useEffect(() => {
    let live = true;
    fetch('/api/auth/me', { credentials: 'same-origin', cache: 'no-store' })
      .then((r) => { if (live && r.ok) setOwner(true); })
      .catch(() => {});
    return () => { live = false; };
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || owner) return undefined;
    const stop = (e) => e.preventDefault();
    const onCopy = (e) => {
      e.preventDefault();
      try {
        e.clipboardData?.setData('text/plain', `यह सामग्री कॉपी नहीं की जा सकती. © ${mark}`);
      } catch {}
    };
    const onKey = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (['c', 'x', 'a', 's', 'p', 'u'].includes(String(e.key).toLowerCase())) e.preventDefault();
    };
    el.addEventListener('copy', onCopy);
    el.addEventListener('cut', onCopy);
    el.addEventListener('contextmenu', stop);
    el.addEventListener('dragstart', stop);
    el.addEventListener('selectstart', stop);
    document.addEventListener('keydown', onKey);
    return () => {
      el.removeEventListener('copy', onCopy);
      el.removeEventListener('cut', onCopy);
      el.removeEventListener('contextmenu', stop);
      el.removeEventListener('dragstart', stop);
      el.removeEventListener('selectstart', stop);
      document.removeEventListener('keydown', onKey);
    };
  }, [mark, owner]);

  const copy = async (what) => {
    try {
      await navigator.clipboard.writeText(what === 'link' ? window.location.href : ref.current?.innerText || '');
      setDone(what);
      setTimeout(() => setDone(''), 1800);
    } catch {}
  };

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='220'><text x='20' y='120' transform='rotate(-24 150 110)' font-family='sans-serif' font-size='17' font-weight='600' fill='%23500b22' fill-opacity='0.07'>${mark}</text></svg>`;
  return (
    <div>
      {owner && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-mark-300 bg-mark-100/60 px-3 py-2 text-sm text-ink-800">
          <b>Owner mode</b> <span>(admin logged in: copy, select and print are on for you only)</span>
          <button type="button" onClick={() => copy('text')} className="ml-auto rounded-md bg-white px-3 py-1 font-semibold ring-1 ring-ink-300">{done === 'text' ? 'Copied' : 'Copy page text'}</button>
          <button type="button" onClick={() => copy('link')} className="rounded-md bg-white px-3 py-1 font-semibold ring-1 ring-ink-300">{done === 'link' ? 'Copied' : 'Copy link'}</button>
        </div>
      )}
      <div
        ref={ref}
        data-owner={owner ? 'true' : undefined}
        className={`notes-protected relative ${owner ? '' : 'select-none'}`}
        style={owner ? undefined : { WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
      >
        {!owner && <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10" style={{ backgroundImage: `url("data:image/svg+xml;utf8,${svg}")` }} />}
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}
