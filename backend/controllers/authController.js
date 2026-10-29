import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import crypto from 'crypto';
import { sendPasswordResetEmail, sendVerificationEmail } from '../utils/sendEmail.js';

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Validation
  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields',
    });
  }

  // Check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({
      success: false,
      message: 'User already exists with this email',
    });
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
  });

  const verificationToken = user.generateEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  const frontendBaseUrl = process.env.FRONTEND_URL?.split(',')[0]?.trim() || 'http://localhost:5173';
  const verificationUrl = `${frontendBaseUrl}/verify-email/${verificationToken}`;

  const emailResult = await sendVerificationEmail({
    to: user.email,
    verificationUrl,
    name: user.name,
  });

  res.status(201).json({
    success: true,
    message: emailResult.delivered
      ? 'Registration successful. Please verify your email before signing in.'
      : 'Registration successful. Email verification link could not be sent automatically.',
    ...(process.env.NODE_ENV !== 'production' || !emailResult.delivered ? { verificationUrl } : {}),
  });
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password',
    });
  }

  // Check if user exists and get password
  const user = await User.findOne({ email }).select('+password +isEmailVerified');
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }

  if (!user.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email before signing in.',
    });
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }

  // Generate token
  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  });
});

/**
 * @desc    Get current user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
  });
});

/**
 * @desc    Request password reset
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    return res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a reset link has been generated.',
    });
  }

  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const frontendBaseUrl = process.env.FRONTEND_URL?.split(',')[0]?.trim() || 'http://localhost:5173';
  const resetUrl = `${frontendBaseUrl}/reset-password/${resetToken}`;

  const emailResult = await sendPasswordResetEmail({
    to: user.email,
    resetUrl,
    name: user.name,
  });

  const response = {
    success: true,
    message: emailResult.delivered
      ? 'If an account with that email exists, a password reset email has been sent.'
      : 'If an account with that email exists, a reset link has been generated.',
  };

  if (!emailResult.delivered || process.env.NODE_ENV !== 'production') {
    response.resetUrl = resetUrl;
  }

  return res.status(200).json(response);
});

/**
 * @desc    Reset password using token
 * @route   POST /api/auth/reset-password/:token
 * @access  Public
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+password +passwordResetToken +passwordResetExpires');

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Reset token is invalid or has expired',
    });
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  return res.status(200).json({
    success: true,
    message: 'Password reset successful. Please sign in with your new password.',
  });
});

/**
 * @desc    Verify email using token
 * @route   POST /api/auth/verify-email/:token
 * @access  Public
 */
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  }).select('+emailVerificationToken +emailVerificationExpires +isEmailVerified');

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Verification link is invalid or has expired',
    });
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json({
    success: true,
    message: 'Email verified successfully. You can now sign in.',
  });
});

/**
 * @desc    Resend verification email
 * @route   POST /api/auth/resend-verification
 * @access  Public
 */
export const resendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email }).select('+emailVerificationToken +emailVerificationExpires +isEmailVerified');

  if (!user) {
    return res.status(200).json({
      success: true,
      message: 'If an account exists, a verification email has been sent.',
    });
  }

  if (user.isEmailVerified) {
    return res.status(200).json({
      success: true,
      message: 'If an account exists, a verification email has been sent.',
    });
  }

  const verificationToken = user.generateEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  const frontendBaseUrl = process.env.FRONTEND_URL?.split(',')[0]?.trim() || 'http://localhost:5173';
  const verificationUrl = `${frontendBaseUrl}/verify-email/${verificationToken}`;

  const emailResult = await sendVerificationEmail({
    to: user.email,
    verificationUrl,
    name: user.name,
  });

  return res.status(200).json({
    success: true,
    message: emailResult.delivered
      ? 'If an account exists, a verification email has been sent.'
      : 'If an account exists, a verification link has been generated.',
    ...(process.env.NODE_ENV !== 'production' || !emailResult.delivered ? { verificationUrl } : {}),
  });
});

