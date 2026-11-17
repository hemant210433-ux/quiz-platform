import { Router } from 'express';
import * as results from '../controllers/resultController.js';
import { asyncHandler as a } from '../utils/helpers.js';

/** Admin result routes, mounted at /api/admin (behind requireAdmin). */
const router = Router();

router.get('/results/export', a(results.exportAll));
router.get('/quizzes/:quizId/results', a(results.list));
router.get('/quizzes/:quizId/results/export', a(results.exportCsv));
router.get('/quizzes/:quizId/results/:attemptId', a(results.detail));

export default router;
