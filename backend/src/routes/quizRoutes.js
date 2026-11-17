import { Router } from 'express';
import * as quiz from '../controllers/quizController.js';
import * as settings from '../controllers/settingsController.js';
import { asyncHandler as a } from '../utils/helpers.js';

/** Mounted at /api/admin (already behind requireAdmin + CSRF header check). */
const router = Router();

router.get('/quizzes', a(quiz.list));
router.post('/quizzes', a(quiz.create));
router.get('/quizzes/:quizId', a(quiz.get));
router.put('/quizzes/:quizId', a(quiz.update));
router.delete('/quizzes/:quizId', a(quiz.remove));
router.post('/quizzes/:quizId/publish', a(quiz.publish));
router.post('/quizzes/:quizId/unpublish', a(quiz.unpublish));
router.post('/quizzes/:quizId/status', a(quiz.setStatus));
router.post('/quizzes/:quizId/duplicate', a(quiz.duplicate));
router.get('/quizzes/:quizId/export', a(quiz.exportQuestions));

// Settings, backup & restore
router.get('/settings', a(settings.getSettings));
router.put('/settings', a(settings.updateSettings));
router.get('/backup', a(settings.downloadBackup));
router.get('/backups', a(settings.listServerBackups));
router.post('/backups', a(settings.createServerBackup));
router.post('/restore', a(settings.restore));

export default router;
