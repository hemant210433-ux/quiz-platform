import config from '../config/index.js';
import { getSession } from '../services/authService.js';
import { AppError } from '../utils/helpers.js';

/** Protects every /api/admin route. */
export async function requireAdmin(req, res, next) {
  try {
    const token = req.cookies?.[config.session.cookieName];
    const session = await getSession(token);
    if (!session) {
      return next(new AppError(401, 'UNAUTHORIZED', 'Admin login required.'));
    }
    req.admin = { username: session.username };
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * CSRF mitigation for cookie-authenticated, state-changing requests:
 * browsers cannot send this custom header cross-origin without a CORS
 * preflight, which our CORS policy only allows for configured origins.
 */
export function requireCsrfHeader(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.get('X-Requested-With') !== 'quiz-platform') {
    return next(new AppError(403, 'CSRF_CHECK_FAILED', 'Missing X-Requested-With header.'));
  }
  next();
}
