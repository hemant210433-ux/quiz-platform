'use client';
import { useState } from 'react';
import { Navigate, useNavigate } from '@/lib/router.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { Alert, Spinner } from '../components/common/ui.jsx';

export default function AdminLogin() {
  const { admin, login, checking } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Only ever return to an /admin page (no open redirects).
  const target = () => {
    if (typeof window === 'undefined') return '/admin';
    const from = new URLSearchParams(window.location.search).get('from') || '';
    return from.startsWith('/admin') && !from.startsWith('//') ? from : '/admin';
  };

  if (!checking && admin) return <Navigate to={target()} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(username, password);
      navigate(target(), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-brand-900 p-10 text-brand-100 lg:flex">
        <div className="flex items-center gap-2.5">
          <img src="/favicon.svg" alt="" className="h-9 w-9" />
          <span className="font-display text-xl font-semibold text-white">Quiz Platform</span>
        </div>
        <div className="relative z-10">
          <p className="font-display text-3xl leading-snug text-white">Paste a thousand questions. Share one link.</p>
          <p className="mt-4 max-w-sm text-brand-200">Bulk-import MCQs, check every question before it goes live, and see each student’s result the moment they submit.</p>
        </div>
        <div className="text-xs text-brand-300">Admin access only</div>
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full border-[40px] border-white/5" />
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <form onSubmit={submit} className="w-full max-w-sm" noValidate>
          <h1 className="page-title">Admin sign in</h1>
          <p className="mt-1 text-sm text-ink-500">Sign in to manage quizzes and view results.</p>
          <div className="mt-8 space-y-4">
            {error && <Alert tone="error">{error}</Alert>}
            <div>
              <label className="label" htmlFor="username">Username</label>
              <input id="username" className="input" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" type="password" className="input" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn-primary w-full py-2.5" disabled={busy || !username || !password}>
              {busy && <Spinner className="h-4 w-4" />}
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
