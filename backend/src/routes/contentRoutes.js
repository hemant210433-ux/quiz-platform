import { Router } from 'express';
import * as c from '../controllers/contentController.js';
import { asyncHandler as a } from '../utils/helpers.js';

/** Mounted at /api/admin (behind requireAdmin). */
const router = Router();
router.get('/content', a(c.list));
router.post('/content/:kind/:module/parse', a(c.parse));
router.put('/content/:kind/:module', a(c.save));
router.delete('/content/:kind/:module', a(c.remove));
export default router;
