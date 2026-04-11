import express from 'express';
import {
  createJournalEntry,
  getJournalEntries,
  getJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
} from '../controllers/journalController.js';
import { protect } from '../middleware/auth.js';
import {
  journalCreateValidation,
  journalQueryValidation,
  journalUpdateValidation,
  mongoIdParamValidation,
  validateRequest,
} from '../middleware/validators.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.route('/')
  .post(journalCreateValidation, validateRequest, createJournalEntry)
  .get(journalQueryValidation, validateRequest, getJournalEntries);

router.route('/:id')
  .get(mongoIdParamValidation, validateRequest, getJournalEntry)
  .put([...mongoIdParamValidation, ...journalUpdateValidation], validateRequest, updateJournalEntry)
  .delete(mongoIdParamValidation, validateRequest, deleteJournalEntry);

export default router;

