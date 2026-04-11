import express from 'express';
import {
  register,
  login,
  getMe,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import {
  authLoginValidation,
  authRegisterValidation,
  validateRequest,
} from '../middleware/validators.js';

const router = express.Router();

router.post('/register', authRegisterValidation, validateRequest, register);
router.post('/login', authLoginValidation, validateRequest, login);
router.get('/me', protect, getMe);

export default router;

