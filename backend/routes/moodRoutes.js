import express from 'express';
import {
  createMoodEntry,
  getMoodEntries,
  getMoodEntry,
  updateMoodEntry,
  deleteMoodEntry,
} from '../controllers/moodController.js';
import { protect } from '../middleware/auth.js';
import {
  mongoIdParamValidation,
  moodCreateValidation,
  moodQueryValidation,
  moodUpdateValidation,
  validateRequest,
} from '../middleware/validators.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.route('/')
  .post(moodCreateValidation, validateRequest, createMoodEntry)
  .get(moodQueryValidation, validateRequest, getMoodEntries);

router.route('/:id')
  .get(mongoIdParamValidation, validateRequest, getMoodEntry)
  .put([...mongoIdParamValidation, ...moodUpdateValidation], validateRequest, updateMoodEntry)
  .delete(mongoIdParamValidation, validateRequest, deleteMoodEntry);

export default router;

