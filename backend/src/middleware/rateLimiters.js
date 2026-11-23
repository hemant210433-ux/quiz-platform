import net from 'node:net';
import rateLimit from 'express-rate-limit';
import config from '../config/index.js';

const int = (name, fallback) => {
  const v = parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(v) ? v : fallback;
};

/**
 * Students reach this API through Vercel's proxy, so req.ip is a Vercel address shared by
 * EVERY student. Vercel puts the real visitor address first in X-Forwarded-For; use it so each
 * student/classroom gets its own bucket. (Falls back to req.ip when the header is missing.)
 * Only used for the public limiters – the admin login limiter keeps using req.ip.
 */
export function clientIp(req) {
  const first = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return net.isIP(first) ? first : req.ip || 'unknown';
}

const handler = (code, message) => (req, res) =>
  res.status(429).json({ error: { code, message } });

// Brute-force protection: only FAILED logins count.
export const loginLimiter = rateLimit({
  windowMs: config.loginRateLimit.windowMs,
  limit: config.loginRateLimit.max,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: handler('TOO_MANY_LOGIN_ATTEMPTS', 'Too many failed login attempts. Please wait and try again.'),
});

// Students in one classroom often share a single public IP, so public limits are generous.
export const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: int('PUBLIC_RATE_MAX_PER_MIN', 20000),
  keyGenerator: clientIp,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: handler('RATE_LIMITED', 'Too many requests. Please slow down.'),
});

export const startLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: int('START_RATE_MAX_PER_10MIN', 3000),
  keyGenerator: clientIp,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: handler('RATE_LIMITED', 'Too many quiz starts from your network. Please wait a minute and try again.'),
});

export const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: int('ADMIN_RATE_MAX_PER_MIN', 3000),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: handler('RATE_LIMITED', 'Too many requests.'),
});
