import crypto from 'node:crypto';

export class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (msg, details) => new AppError(400, 'BAD_REQUEST', msg, details);
export const notFound = (msg = 'Not found') => new AppError(404, 'NOT_FOUND', msg);
export const forbidden = (msg = 'Forbidden') => new AppError(403, 'FORBIDDEN', msg);
export const conflict = (msg, details) => new AppError(409, 'CONFLICT', msg, details);
export const unauthorized = (msg = 'Authentication required') => new AppError(401, 'UNAUTHORIZED', msg);

/** Random URL-safe token. 18 bytes => 144 bits of entropy. */
export function randomToken(bytes = 18) {
  return crypto.randomBytes(bytes).toString('base64url');
}

/** Short lowercase alphanumeric id (safe for file names). */
export function shortId(len = 10) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.randomBytes(len);
  let s = '';
  for (let i = 0; i < len; i++) s += alphabet[bytes[i] % alphabet.length];
  return s;
}

export function sha256(s) {
  return crypto.createHash('sha256').update(s).digest('hex');
}

export function slugify(text) {
  return String(text || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
}

export function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Wrap async route handlers so rejected promises reach the error middleware. */
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** Parse with a Zod schema or throw a 400 with field-level details. */
export function parseOrThrow(schema, data, message = 'Invalid request') {
  const r = schema.safeParse(data);
  if (!r.success) {
    throw badRequest(
      message,
      r.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    );
  }
  return r.data;
}

export function csvEscape(value) {
  if (value === null || value === undefined) return '';
  let s = String(value);
  // Neutralise spreadsheet formula injection.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(headers, rows) {
  const lines = [headers.map(csvEscape).join(',')];
  for (const r of rows) lines.push(r.map(csvEscape).join(','));
  // BOM so Excel opens UTF-8 (Hindi names) correctly.
  return '﻿' + lines.join('\r\n') + '\r\n';
}
