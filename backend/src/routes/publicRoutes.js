import { Router } from 'express';
import * as pub from '../controllers/publicController.js';
import { publicSite } from '../controllers/settingsController.js';
import { asyncHandler as a } from '../utils/helpers.js';
import { startLimiter } from '../middleware/rateLimiters.js';

/** Public student API, mounted at /api/public. No admin data, no answers before submission. */
const router = Router();

router.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

router.get('/site', a(publicSite));
router.get('/quizzes/:slug', a(pub.getQuiz));
router.post('/quizzes/:slug/start', startLimiter, a(pub.start));
router.get('/attempts/:attemptId', a(pub.getAttempt));
router.put('/attempts/:attemptId/answers', a(pub.saveAnswers));
router.post('/attempts/:attemptId/submit', a(pub.submit));
router.post('/attempts/:attemptId/result-token', a(pub.reissueResult));
router.get('/results/:resultToken', a(pub.getResult));

export default router;
