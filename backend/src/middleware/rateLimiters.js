import rateLimit from 'express-rate-limit';
import config from '../config/index.js';

const int = (name, fallback) => {
  const v = parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(v) ? v : fallback;
};

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
  limit: int('PUBLIC_RATE_MAX_PER_MIN', 3000),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: handler('RATE_LIMITED', 'Too many requests. Please slow down.'),
});

export const startLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: int('START_RATE_MAX_PER_10MIN', 300),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: handler('RATE_LIMITED', 'Too many quiz starts from your network. Please wait a few minutes.'),
});

export const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: int('ADMIN_RATE_MAX_PER_MIN', 600),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: handler('RATE_LIMITED', 'Too many requests.'),
});
