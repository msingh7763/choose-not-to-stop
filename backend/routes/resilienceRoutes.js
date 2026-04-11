import express from 'express';
import {
  calculateResilience,
  getResilienceScores,
  getCurrentResilience,
} from '../controllers/resilienceController.js';
import { protect } from '../middleware/auth.js';
import { resilienceQueryValidation, validateRequest } from '../middleware/validators.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/calculate', calculateResilience);
router.get('/current', getCurrentResilience);
router.get('/', resilienceQueryValidation, validateRequest, getResilienceScores);

export default router;

