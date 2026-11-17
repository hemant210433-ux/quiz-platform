import { Router } from 'express';
import * as auth from '../controllers/authController.js';
import { asyncHandler } from '../utils/helpers.js';
import { loginLimiter } from '../middleware/rateLimiters.js';
import { requireAdmin, requireCsrfHeader } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/login', loginLimiter, requireCsrfHeader, asyncHandler(auth.login));
router.post('/logout', requireCsrfHeader, asyncHandler(auth.logout));
router.get('/me', asyncHandler(auth.me));
router.post('/change-password', requireCsrfHeader, requireAdmin, loginLimiter, asyncHandler(auth.changeCredentials));

export default router;
