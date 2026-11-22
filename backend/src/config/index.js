import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = path.resolve(__dirname, '..', '..');

dotenv.config({ path: path.join(BACKEND_ROOT, '.env') });

const env = process.env.NODE_ENV || 'development';
const isProd = env === 'production';

function int(name, fallback) {
  const v = parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(v) ? v : fallback;
}

const config = {
  env,
  isProd,
  isTest: env === 'test',
  port: int('PORT', 4000),
  backendRoot: BACKEND_ROOT,
  // MongoDB (production). When MONGODB_URI is set the app stores everything in MongoDB
  // instead of local JSON files. Tests always use the file store.
  mongoUri: process.env.MONGODB_URI || '',
  mongoDbName: process.env.MONGODB_DB || 'quizplatform',
  useMongo: Boolean(process.env.MONGODB_URI) && (env !== 'test' || process.env.TEST_USE_MONGO === '1'),
  // DATA_DIR must point to a persistent disk in production.
  dataDir: path.resolve(process.env.DATA_DIR || path.join(BACKEND_ROOT, 'data')),
  // Comma separated list of allowed browser origins (only needed when the
  // frontend is hosted on a different origin than the API).
  corsOrigins: (process.env.CORS_ORIGIN || (isProd ? '' : 'http://localhost:3000'))
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  // Serve the built React app (frontend/dist) from Express. Recommended in production.
  frontendDist: process.env.FRONTEND_DIST
    ? path.resolve(process.env.FRONTEND_DIST)
    : path.resolve(BACKEND_ROOT, '..', 'frontend', 'dist'),
  // Render free tier: self-ping so the service does not fall asleep. Needs RENDER_EXTERNAL_URL
  // (set by Render) or KEEP_ALIVE_URL. Turn off with KEEP_ALIVE=false (e.g. on a paid plan).
  keepAliveUrl: (process.env.KEEP_ALIVE ?? 'true') === 'false' ? '' : process.env.KEEP_ALIVE_URL || process.env.RENDER_EXTERNAL_URL || '',
  keepAliveIntervalMs: Math.max(1, Number(process.env.KEEP_ALIVE_INTERVAL_MIN) || 10) * 60 * 1000,
  serveFrontend: (process.env.SERVE_FRONTEND ?? (isProd ? 'true' : 'false')) === 'true',
  trustProxy: process.env.TRUST_PROXY ?? (isProd ? '1' : ''),
  session: {
    cookieName: process.env.SESSION_COOKIE_NAME || 'qp_admin_session',
    ttlHours: int('SESSION_TTL_HOURS', 12),
    // 'lax' works when frontend and API share a site. Use 'none' (+ HTTPS) for cross-site hosting.
    sameSite: process.env.COOKIE_SAMESITE || 'lax',
    secure: (process.env.COOKIE_SECURE ?? (isProd ? 'true' : 'false')) === 'true',
  },
  loginRateLimit: {
    windowMs: int('LOGIN_RATE_WINDOW_MIN', 15) * 60 * 1000,
    max: int('LOGIN_RATE_MAX', 10),
  },
  // Grace period (seconds) after the deadline during which late network
  // requests (e.g. auto-submit) are still accepted.
  submitGraceSeconds: int('SUBMIT_GRACE_SECONDS', 30),
  maxBackups: int('MAX_BACKUPS', 20),
};

export default config;
