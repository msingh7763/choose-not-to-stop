import express from 'express';
import {
  createAnonymousPost,
  getAnonymousPosts,
  addReaction,
} from '../controllers/anonymousController.js';
import {
  anonymousCreateValidation,
  anonymousQueryValidation,
  anonymousReactionValidation,
  validateRequest,
} from '../middleware/validators.js';

const router = express.Router();

// All routes are public (no authentication required)

router.route('/')
  .post(anonymousCreateValidation, validateRequest, createAnonymousPost)
  .get(anonymousQueryValidation, validateRequest, getAnonymousPosts);

router.post('/:id/reaction', anonymousReactionValidation, validateRequest, addReaction);

export default router;

