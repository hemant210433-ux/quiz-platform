import bcrypt from 'bcryptjs';
import { z } from 'zod';
import config from '../config/index.js';
import { readJson, writeJson, updateJson } from '../storage/jsonStorage.js';
import { randomToken, sha256 } from '../utils/helpers.js';
import { now } from '../utils/clock.js';

const BCRYPT_ROUNDS = 12;

export const adminSchema = z.object({
  username: z.string().min(3).max(64),
  passwordHash: z.string().startsWith('$2'),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const passwordPolicy = z
  .string()
  .min(10, 'Password must be at least 10 characters long.')
  .max(200)
  .refine((p) => /[A-Za-z]/.test(p) && /[0-9]/.test(p), 'Password must contain letters and numbers.');

export const usernamePolicy = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters.')
  .max(64)
  .regex(/^[A-Za-z0-9_.@-]+$/, 'Username may contain letters, numbers and _ . @ - only.');

export async function getAdmin() {
  return readJson('admin.json', null);
}

export async function setAdminCredentials(username, password) {
  const u = usernamePolicy.parse(username);
  const p = passwordPolicy.parse(password);
  const existing = await getAdmin();
  const ts = new Date().toISOString();
  const admin = {
    username: u,
    passwordHash: await bcrypt.hash(p, BCRYPT_ROUNDS),
    createdAt: existing?.createdAt || ts,
    updatedAt: ts,
  };
  await writeJson('admin.json', admin, { schema: adminSchema });
  // Changing credentials invalidates every existing session.
  await writeJson('sessions.json', {});
  return { username: u };
}

/**
 * First-boot bootstrap: if admin.json does not exist and ADMIN_USERNAME /
 * ADMIN_PASSWORD are provided, create the admin. Never overwrites an existing admin.
 */
export async function bootstrapAdminFromEnv() {
  const existing = await getAdmin();
  if (existing) return { created: false };
  const { ADMIN_USERNAME, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) return { created: false, missing: true };
  await setAdminCredentials(ADMIN_USERNAME, ADMIN_PASSWORD);
  return { created: true };
}

// A real bcrypt hash used to keep timing similar when the username is wrong.
const DUMMY_HASH = bcrypt.hashSync('timing-equaliser-not-a-password', 10);

export async function verifyCredentials(username, password) {
  const admin = await getAdmin();
  const hash = admin?.passwordHash || DUMMY_HASH;
  const ok = await bcrypt.compare(String(password || ''), hash);
  if (!admin || !ok || admin.username !== String(username || '').trim()) return null;
  return { username: admin.username };
}

/* ---------------- Sessions ----------------
 * Session tokens are random 144-bit values sent in an HTTP-only cookie.
 * Only the SHA-256 of a token is stored (sessions.json), so a leaked data
 * directory does not leak usable sessions.
 */

export async function createSession(username) {
  const token = randomToken(32);
  const expiresAt = now() + config.session.ttlHours * 3600 * 1000;
  await updateJson('sessions.json', {}, (sessions) => {
    for (const [k, s] of Object.entries(sessions)) if (s.expiresAt < now()) delete sessions[k];
    sessions[sha256(token)] = { username, createdAt: now(), expiresAt };
  }, { backup: false });
  return { token, expiresAt };
}

export async function getSession(token) {
  if (!token || typeof token !== 'string' || token.length > 200) return null;
  const sessions = await readJson('sessions.json', {});
  const s = sessions[sha256(token)];
  if (!s || s.expiresAt < now()) return null;
  return s;
}

export async function destroySession(token) {
  if (!token) return;
  await updateJson('sessions.json', {}, (sessions) => {
    delete sessions[sha256(token)];
  }, { backup: false });
}

export async function changePassword(currentPassword, newPassword, newUsername) {
  const admin = await getAdmin();
  if (!admin) return { ok: false, reason: 'No admin configured.' };
  const ok = await bcrypt.compare(String(currentPassword || ''), admin.passwordHash);
  if (!ok) return { ok: false, reason: 'Current password is incorrect.' };
  await setAdminCredentials(newUsername || admin.username, newPassword);
  return { ok: true };
}
