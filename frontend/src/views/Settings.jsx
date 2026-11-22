'use client';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from '@/lib/router.jsx';
import { adminApi, authApi, downloadUrls } from '../services/api.js';
import { Alert, ErrorState, Field, PageLoader, Spinner } from '../components/common/ui.jsx';
import { useToast } from '../hooks/useToast.jsx';
import { useConfirm } from '../hooks/useConfirm.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { formatDateTime } from '../utils/format.js';

function SiteSettings() {
  const toast = useToast();
  const [s, setS] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    adminApi.getSettings().then((r) => setS(r.settings)).catch(setError);
  }, []);
  if (error) return <ErrorState message={error.message} />;
  if (!s) return <PageLoader />;
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await adminApi.updateSettings({ siteName: s.siteName, publicBaseUrl: s.publicBaseUrl.trim() });
      setS({ siteName: r.settings.siteName, publicBaseUrl: r.settings.publicBaseUrl || '' });
      toast.success('Settings saved.');
    } catch (err) {
      toast.error(err.details?.[0]?.message || err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={save} className="card card-pad space-y-4">
      <h2 className="section-title">General</h2>
      <Field label="Site name" htmlFor="siteName" hint="Shown at the top of student pages.">
        <input id="siteName" className="input" value={s.siteName} onChange={(e) => setS({ ...s, siteName: e.target.value })} maxLength={100} />
      </Field>
      <Field label="Public base URL (optional)" htmlFor="baseUrl" hint="Used to build share links, e.g. https://quiz.example.com. Leave empty to use the current address.">
        <input id="baseUrl" className="input" value={s.publicBaseUrl} onChange={(e) => setS({ ...s, publicBaseUrl: e.target.value })} placeholder="https://quiz.example.com" />
      </Field>
      <div className="flex justify-end">
        <button className="btn-primary" disabled={busy}>{busy && <Spinner className="h-4 w-4" />}Save</button>
      </div>
    </form>
  );
}

function PasswordSettings() {
  const toast = useToast();
  const { admin, setAdmin } = useAuth();
  const navigate = useNavigate();
  const [f, setF] = useState({ currentPassword: '', newUsername: '', newPassword: '', confirm: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const save = async (e) => {
    e.preventDefault();
    setErr('');
    if (f.newPassword !== f.confirm) return setErr('New passwords do not match.');
    setBusy(true);
    try {
      await authApi.changePassword({ currentPassword: f.currentPassword, newPassword: f.newPassword, ...(f.newUsername.trim() ? { newUsername: f.newUsername.trim() } : {}) });
      toast.success('Credentials updated. Please sign in again.');
      setAdmin(null);
      navigate('/admin/login');
    } catch (e2) {
      setErr(e2.details?.map((d) => d.message).join(' ') || e2.message);
    } finally {
      setBusy(false);
    }
  };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <form onSubmit={save} className="card card-pad space-y-4">
      <div>
        <h2 className="section-title">Admin account</h2>
        <p className="mt-1 text-sm text-ink-500">Signed in as <b>{admin?.username}</b>. Changing credentials signs out every session.</p>
      </div>
      {err && <Alert tone="error">{err}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Current password" htmlFor="cur">
          <input id="cur" type="password" className="input" autoComplete="current-password" value={f.currentPassword} onChange={set('currentPassword')} required />
        </Field>
        <Field label="New username (optional)" htmlFor="nu">
          <input id="nu" className="input" autoComplete="username" value={f.newUsername} onChange={set('newUsername')} placeholder={admin?.username} />
        </Field>
        <Field label="New password" htmlFor="np" hint="At least 10 characters with letters and numbers.">
          <input id="np" type="password" className="input" autoComplete="new-password" value={f.newPassword} onChange={set('newPassword')} required />
        </Field>
        <Field label="Confirm new password" htmlFor="cp">
          <input id="cp" type="password" className="input" autoComplete="new-password" value={f.confirm} onChange={set('confirm')} required />
        </Field>
      </div>
      <div className="flex justify-end">
        <button className="btn-primary" disabled={busy || !f.currentPassword || !f.newPassword}>{busy && <Spinner className="h-4 w-4" />}Update credentials</button>
      </div>
    </form>
  );
}

function BackupSettings() {
  const toast = useToast();
  const confirm = useConfirm();
  const [backups, setBackups] = useState(null);
  const [busy, setBusy] = useState(null);
  const fileRef = useRef(null);
  const load = () => adminApi.listBackups().then((r) => setBackups(r.backups)).catch((e) => toast.error(e.message));
  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const create = async () => {
    setBusy('create');
    try {
      const r = await adminApi.createBackup();
      setBackups(r.backups);
      toast.success('Backup saved on the server.');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  const doRestore = async (body, label) => {
    const ok = await confirm({
      title: 'Restore this backup?',
      message: `All current quizzes, questions, attempts and results will be replaced by ${label}. A safety backup of the current state is created first.`,
      confirmLabel: 'Restore',
      danger: true,
      requireText: 'RESTORE',
    });
    if (!ok) return;
    setBusy('restore');
    try {
      const r = await adminApi.restore(body);
      toast.success(`Restored ${r.restoredFiles} files. Safety backup: ${r.safetyBackup}`);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try {
      const bundle = JSON.parse(await f.text());
      await doRestore({ bundle }, `the file “${f.name}”`);
    } catch {
      toast.error('That file is not valid JSON.');
    }
  };

  return (
    <section className="card card-pad space-y-4">
      <div>
        <h2 className="section-title">Backup & restore</h2>
        <p className="mt-1 text-sm text-ink-500">A backup is a single JSON file containing every quiz, question, attempt and result. Keep copies somewhere other than this server.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <a className="btn-primary" href={downloadUrls.backup()}>Download backup</a>
        <button className="btn-secondary" onClick={create} disabled={!!busy}>{busy === 'create' && <Spinner className="h-4 w-4" />}Save backup on server</button>
        <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={onFile} />
        <button className="btn-secondary" onClick={() => fileRef.current?.click()} disabled={!!busy}>{busy === 'restore' && <Spinner className="h-4 w-4" />}Restore from file…</button>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold text-ink-700">Server backups</h3>
        {!backups ? (
          <Spinner />
        ) : backups.length === 0 ? (
          <p className="text-sm text-ink-500">No server backups yet.</p>
        ) : (
          <ul className="divide-y divide-ink-100 rounded-lg ring-1 ring-ink-100">
            {backups.map((b) => (
              <li key={b.name} className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
                <span className="min-w-0 flex-1 truncate font-mono text-xs">{b.name}</span>
                <span className="text-xs text-ink-500">{formatDateTime(b.createdAt)} · {(b.size / 1024).toFixed(0)} KB</span>
                <button className="btn-ghost btn-sm" disabled={!!busy} onClick={() => doRestore({ name: b.name }, 'this server backup')}>Restore</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default function Settings() {
  return (
    <div>
      <h1 className="page-title">Settings</h1>
      <p className="mt-1 text-sm text-ink-500">Site details, admin credentials and data backups.</p>
      <div className="mt-6 space-y-6">
        <SiteSettings />
        <PasswordSettings />
        <BackupSettings />
      </div>
    </div>
  );
}
