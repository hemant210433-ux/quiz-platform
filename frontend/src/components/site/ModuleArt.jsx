/** Decorative gold line-art for each module card (no photos needed). */
export default function ModuleArt({ code }) {
  const g = '#d4af5a';
  const art = {
    'm1-r5': (
      <g fill={g} opacity=".55">
        {Array.from({ length: 5 }).flatMap((_, r) => Array.from({ length: 14 }).map((__, c) => <circle key={`${r}-${c}`} cx={20 + c * 27} cy={22 + r * 24} r={r === 2 && c % 4 === 1 ? 4.2 : 1.8} opacity={r === 2 && c % 4 === 1 ? 1 : 0.7} />))}
      </g>
    ),
    'm2-r5': (
      <g fill="none" stroke={g} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity=".6">
        <path d="M120 38 L80 70 L120 102" /><path d="M280 38 L320 70 L280 102" /><path d="M222 28 L178 112" />
      </g>
    ),
    'm3-r5': (
      <g stroke={g} strokeWidth="5" strokeLinecap="round" opacity=".6">
        <path d="M60 30h120M84 52h160M108 74h110M84 96h140M60 118h90" />
      </g>
    ),
    'm4-r5': (
      <g fill="none" stroke={g} strokeWidth="3" opacity=".6">
        <circle cx="200" cy="70" r="9" fill={g} /><circle cx="200" cy="70" r="30" /><circle cx="200" cy="70" r="52" /><circle cx="200" cy="70" r="74" opacity=".6" />
      </g>
    ),
  }[code];
  return (
    <svg viewBox="0 0 400 140" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id={`g-${code}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#650019" /><stop offset="1" stopColor="#33070f" /></linearGradient>
      </defs>
      <rect width="400" height="140" fill={`url(#g-${code})`} />
      {art}
    </svg>
  );
}
