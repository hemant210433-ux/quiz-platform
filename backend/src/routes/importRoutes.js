import { Router } from 'express';
import * as imp from '../controllers/importController.js';
import * as quiz from '../controllers/quizController.js';
import { asyncHandler as a } from '../utils/helpers.js';

/** Mounted at /api/admin (behind requireAdmin). */
const router = Router();

router.post('/import/parse', a(imp.parse));
router.post('/import/validate', a(imp.validate));
router.post('/quizzes/:quizId/questions', a(quiz.saveQuestions));
router.put('/quizzes/:quizId/questions/:questionId', a(quiz.updateQuestion));
router.delete('/quizzes/:quizId/questions/:questionId', a(quiz.deleteQuestion));

export default router;
