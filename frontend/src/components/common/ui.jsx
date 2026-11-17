/* Small shared UI pieces. */

export function Spinner({ className = 'h-5 w-5' }) {
  return (
    <svg className={`animate-spin text-current ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity=".2" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-ink-500" role="status">
      <Spinner className="h-7 w-7 text-brand-600" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', message, action }) {
  return (
    <div className="card card-pad mx-auto max-w-lg text-center">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-xl text-red-600">!</div>
      <h2 className="text-lg font-semibold">{title}</h2>
      {message && <p className="mt-1 text-sm text-ink-600">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function EmptyState({ icon = '◇', title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-ink-200 bg-white px-6 py-14 text-center">
      <div className="mb-3 text-3xl text-ink-300" aria-hidden="true">{icon}</div>
      <h3 className="font-semibold text-ink-800">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-ink-500">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

const STATUS = {
  draft: 'bg-ink-100 text-ink-700',
  published: 'bg-brand-100 text-brand-800',
  closed: 'bg-amberish-100 text-amberish-700',
  archived: 'bg-ink-200 text-ink-600',
};

export function StatusBadge({ status }) {
  return (
    <span className={`badge capitalize ${STATUS[status] || STATUS.draft}`}>
      {status === 'published' && <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />}
      {status}
    </span>
  );
}

export function StatCard({ label, value, sub, tone = 'default' }) {
  const tones = {
    default: 'text-ink-900',
    good: 'text-brand-700',
    bad: 'text-red-600',
    warn: 'text-amberish-700',
  };
  return (
    <div className="card px-4 py-4">
      <div className="text-xs font-medium uppercase tracking-wide text-ink-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${tones[tone]}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-ink-500">{sub}</div>}
    </div>
  );
}

export function Pagination({ page, pageCount, onChange, total, pageSize }) {
  if (pageCount <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 text-sm" aria-label="Pagination">
      <span className="text-ink-500">
        {from}–{to} of {total.toLocaleString()}
      </span>
      <div className="flex items-center gap-1">
        <button className="btn-secondary btn-sm" disabled={page <= 1} onClick={() => onChange(1)} aria-label="First page">«</button>
        <button className="btn-secondary btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>Prev</button>
        <span className="px-2 tabular-nums text-ink-600">
          {page} / {pageCount}
        </span>
        <button className="btn-secondary btn-sm" disabled={page >= pageCount} onClick={() => onChange(page + 1)}>Next</button>
        <button className="btn-secondary btn-sm" disabled={page >= pageCount} onClick={() => onChange(pageCount)} aria-label="Last page">»</button>
      </div>
    </nav>
  );
}

export function Field({ label, htmlFor, hint, error, children }) {
  return (
    <div>
      {label && (
        <label className="label" htmlFor={htmlFor}>
          {label}
        </label>
      )}
      {children}
      {error ? <p className="field-error">{error}</p> : hint ? <p className="hint">{hint}</p> : null}
    </div>
  );
}

export function Alert({ tone = 'info', title, children }) {
  const tones = {
    info: 'bg-ink-50 ring-ink-200 text-ink-700',
    warn: 'bg-amberish-100/60 ring-amber-200 text-amberish-700',
    error: 'bg-red-50 ring-red-200 text-red-800',
    success: 'bg-brand-50 ring-brand-200 text-brand-800',
  };
  return (
    <div className={`rounded-lg px-4 py-3 text-sm ring-1 ring-inset ${tones[tone]}`} role={tone === 'error' ? 'alert' : undefined}>
      {title && <div className="font-semibold">{title}</div>}
      {children && <div className={title ? 'mt-1' : ''}>{children}</div>}
    </div>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-lg bg-ink-100 p-1" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition ${value === t.value ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-600 hover:text-ink-900'}`}
        >
          {t.label}
          {t.count !== undefined && <span className="ml-1.5 tabular-nums text-ink-400">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}
