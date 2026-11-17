import { z } from 'zod';
import config from '../config/index.js';
import { verifyCredentials, createSession, destroySession, getSession, changePassword, passwordPolicy, usernamePolicy } from '../services/authService.js';
import { parseOrThrow, AppError } from '../utils/helpers.js';

const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username is required.').max(64),
  password: z.string().min(1, 'Password is required.').max(200),
});

function cookieOptions(expiresAt) {
  return {
    httpOnly: true,
    secure: config.session.secure,
    sameSite: config.session.sameSite,
    path: '/',
    ...(expiresAt ? { expires: new Date(expiresAt) } : {}),
  };
}

export async function login(req, res) {
  const { username, password } = parseOrThrow(loginSchema, req.body);
  const admin = await verifyCredentials(username, password);
  if (!admin) throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid username or password.');
  const { token, expiresAt } = await createSession(admin.username);
  res.cookie(config.session.cookieName, token, cookieOptions(expiresAt));
  res.json({ admin: { username: admin.username }, expiresAt: new Date(expiresAt).toISOString() });
}

export async function logout(req, res) {
  await destroySession(req.cookies?.[config.session.cookieName]);
  res.clearCookie(config.session.cookieName, cookieOptions());
  res.json({ ok: true });
}

export async function me(req, res) {
  const session = await getSession(req.cookies?.[config.session.cookieName]);
  if (!session) throw new AppError(401, 'UNAUTHORIZED', 'Not logged in.');
  res.json({ admin: { username: session.username }, expiresAt: new Date(session.expiresAt).toISOString() });
}

const changeSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: passwordPolicy,
  newUsername: usernamePolicy.optional(),
});

export async function changeCredentials(req, res) {
  const body = parseOrThrow(changeSchema, req.body);
  const r = await changePassword(body.currentPassword, body.newPassword, body.newUsername);
  if (!r.ok) throw new AppError(400, 'INVALID_CURRENT_PASSWORD', r.reason);
  res.clearCookie(config.session.cookieName, cookieOptions());
  res.json({ ok: true, message: 'Credentials updated. Please log in again.' });
}
