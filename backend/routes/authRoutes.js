import express from 'express';
import {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import {
  authLoginValidation,
  authForgotPasswordValidation,
  authRegisterValidation,
  authResetPasswordValidation,
  authResendVerificationValidation,
  validateRequest,
} from '../middleware/validators.js';

const router = express.Router();

router.post('/register', authRegisterValidation, validateRequest, register);
router.post('/login', authLoginValidation, validateRequest, login);
router.post('/forgot-password', authForgotPasswordValidation, validateRequest, forgotPassword);
router.post('/reset-password/:token', authResetPasswordValidation, validateRequest, resetPassword);
router.post('/verify-email/:token', verifyEmail);
router.post('/resend-verification', authResendVerificationValidation, validateRequest, resendVerificationEmail);
router.get('/me', protect, getMe);

export default router;

