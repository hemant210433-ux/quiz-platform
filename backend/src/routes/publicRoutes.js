import { Router } from 'express';
import * as pub from '../controllers/publicController.js';
import { publicSite } from '../controllers/settingsController.js';
import { asyncHandler as a } from '../utils/helpers.js';
import { startLimiter } from '../middleware/rateLimiters.js';
import { publicGet as contentGet } from '../controllers/contentController.js';
import { botGuard } from '../middleware/botGuard.js';

/** Public student API, mounted at /api/public. No admin data, no answers before submission. */
const router = Router();

router.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  next();
});

router.get('/site', a(publicSite));
router.get('/content/:kind/:module', a(contentGet));
router.get('/quizzes', a(pub.listQuizzes));
router.get('/quizzes/:slug', a(pub.getQuiz));
router.post('/quizzes/:slug/start', botGuard, startLimiter, a(pub.start));
router.get('/attempts/:attemptId', botGuard, a(pub.getAttempt));
router.put('/attempts/:attemptId/answers', botGuard, a(pub.saveAnswers));
router.post('/attempts/:attemptId/submit', botGuard, a(pub.submit));
router.post('/attempts/:attemptId/result-token', a(pub.reissueResult));
router.get('/results/:resultToken', botGuard, a(pub.getResult));

export default router;
