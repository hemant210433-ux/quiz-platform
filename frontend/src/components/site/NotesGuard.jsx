'use client';
import { useEffect, useRef } from 'react';

/**
 * Discourages casual copying of the notes: no text selection, copy/cut/drag/right-click blocked, print hidden,
 * and a faint tiled site-name watermark so screenshots carry the source.
 * This is a deterrent only. Text must stay in the page HTML for search engines, so anyone determined
 * (screenshot, view-source, JavaScript turned off) can still take it. Copyright text on the page is the legal protection.
 */
export default function NotesGuard({ children, mark = 'olevelmocktest.in' }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
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
  }, [mark]);

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='220'><text x='20' y='120' transform='rotate(-24 150 110)' font-family='sans-serif' font-size='17' font-weight='600' fill='%23500b22' fill-opacity='0.07'>${mark}</text></svg>`;
  return (
    <div ref={ref} className="notes-protected relative select-none" style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10" style={{ backgroundImage: `url("data:image/svg+xml;utf8,${svg}")` }} />
      <div className="relative">{children}</div>
    </div>
  );
}
