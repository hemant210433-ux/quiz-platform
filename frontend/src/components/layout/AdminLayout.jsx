'use client';
import { useState } from 'react';
import { NavLink, Navigate, useLocation, useNavigate } from '@/lib/router.jsx';
import { useAuth } from '../../hooks/useAuth.jsx';
import { PageLoader } from '../common/ui.jsx';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: 'M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10', end: true },
  { to: '/admin/quizzes', label: 'Quizzes', icon: 'M4 6h16M4 12h16M4 18h10', end: false },
  { to: '/admin/quizzes/new', label: 'Create Quiz', icon: 'M12 5v14M5 12h14', end: true },
  { to: '/admin/import', label: 'Bulk Import', icon: 'M12 3v12m0 0l-4-4m4 4l4-4M4 17v3h16v-3', end: true },
  { to: '/admin/content', label: 'Notes & Guess Paper', icon: 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7', end: false },
  { to: '/admin/results', label: 'Results', icon: 'M5 20V10m7 10V4m7 16v-7', end: false },
  { to: '/admin/settings', label: 'Settings', icon: 'M12 15a3 3 0 100-6 3 3 0 000 6zm7.4-3a7.4 7.4 0 00-.1-1.2l2-1.6-2-3.4-2.4 1a7.6 7.6 0 00-2-1.2L14.5 2h-4l-.4 2.6a7.6 7.6 0 00-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 000 2.4l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 002 1.2l.4 2.6h4l.4-2.6a7.6 7.6 0 002-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z', end: true },
];

function Icon({ d }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function isActive(item, pathname) {
  if (item.end) return pathname === item.to;
  if (item.to === '/admin/quizzes') return pathname.startsWith('/admin/quizzes') && pathname !== '/admin/quizzes/new' && !pathname.endsWith('/results') && !pathname.includes('/results/');
  if (item.to === '/admin/results') return pathname.startsWith('/admin/results') || pathname.includes('/results');
  return pathname.startsWith(item.to);
}

function Sidebar({ onNavigate }) {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  return (
    <div className="flex h-full flex-col bg-brand-900 text-brand-100">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <img src="/favicon.svg" alt="" className="h-8 w-8" />
        <div>
          <div className="font-display text-lg font-semibold leading-none text-white">Quiz Platform</div>
          <div className="mt-1 text-[11px] uppercase tracking-wider text-brand-300">Admin</div>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 px-3 py-2" aria-label="Admin">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={() =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${isActive(item, pathname) ? 'bg-white/10 text-white' : 'text-brand-200 hover:bg-white/5 hover:text-white'}`
            }
          >
            <Icon d={item.icon} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 px-5 py-4">
        <div className="text-xs text-brand-300">Signed in as</div>
        <div className="truncate text-sm font-semibold text-white">{admin?.username}</div>
        <button
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/15"
          onClick={async () => {
            await logout();
            navigate('/admin/login');
          }}
        >
          Log out
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }) {
  const { admin, checking } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  if (checking) return <PageLoader label="Checking your session…" />;
  if (!admin) return <Navigate to={`/admin/login?from=${encodeURIComponent(location.pathname)}`} replace />;

  return (
    <div className="min-h-screen lg:pl-60">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 lg:block">
        <Sidebar />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-ink-100 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <img src="/favicon.svg" alt="" className="h-7 w-7" />
          <span className="font-display font-semibold">Quiz Platform</span>
        </div>
        <button className="btn-ghost btn-sm" onClick={() => setOpen(true)} aria-label="Open menu">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      </header>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 shadow-lift">
            <Sidebar onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {children}
      </main>
    </div>
  );
}
