import { body, param, query, validationResult } from 'express-validator';

const MOOD_VALUES = ['Happy', 'Neutral', 'Sad', 'Anxious', 'Stressed'];
const REACTION_VALUES = ['💙', '🤗', '💪', '🙏'];

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
    })),
  });
};

export const mongoIdParamValidation = [
  param('id').isMongoId().withMessage('Invalid resource id'),
];

export const authRegisterValidation = [
  body('name')
    .isString()
    .withMessage('Name is required')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isString()
    .withMessage('Password is required')
    .isLength({ min: 10, max: 128 })
    .withMessage('Password must be at least 10 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/)
    .withMessage('Password must include uppercase, lowercase, number, and special character'),
];

export const authLoginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password').isString().withMessage('Password is required').notEmpty(),
];

export const authForgotPasswordValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
];

export const authResetPasswordValidation = [
  param('token')
    .isString()
    .withMessage('Reset token is required')
    .notEmpty(),
  body('password')
    .isString()
    .withMessage('Password is required')
    .isLength({ min: 10, max: 128 })
    .withMessage('Password must be at least 10 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/)
    .withMessage('Password must include uppercase, lowercase, number, and special character'),
];

export const authResendVerificationValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
];

export const moodCreateValidation = [
  body('mood')
    .isIn(MOOD_VALUES)
    .withMessage(`Mood must be one of: ${MOOD_VALUES.join(', ')}`),
  body('sleepHours')
    .optional({ nullable: true })
    .isFloat({ min: 0, max: 24 })
    .withMessage('Sleep hours must be a number between 0 and 24'),
  body('notes')
    .optional()
    .isString()
    .withMessage('Notes must be a string')
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
];

export const moodUpdateValidation = [
  body('mood')
    .optional()
    .isIn(MOOD_VALUES)
    .withMessage(`Mood must be one of: ${MOOD_VALUES.join(', ')}`),
  body('sleepHours')
    .optional({ nullable: true })
    .isFloat({ min: 0, max: 24 })
    .withMessage('Sleep hours must be a number between 0 and 24'),
  body('notes')
    .optional()
    .isString()
    .withMessage('Notes must be a string')
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
];

export const moodQueryValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('startDate must be a valid ISO date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('endDate must be a valid ISO date'),
];

export const journalCreateValidation = [
  body('content')
    .isString()
    .withMessage('Journal content is required')
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Journal content must be between 10 and 5000 characters'),
];

export const journalUpdateValidation = [
  body('content')
    .optional()
    .isString()
    .withMessage('Journal content must be a string')
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Journal content must be between 10 and 5000 characters'),
];

export const journalQueryValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('startDate must be a valid ISO date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('endDate must be a valid ISO date'),
];

export const anonymousCreateValidation = [
  body('content')
    .isString()
    .withMessage('Post content is required')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Post content must be between 10 and 500 characters'),
];

export const anonymousReactionValidation = [
  ...mongoIdParamValidation,
  body('reactionType')
    .isIn(REACTION_VALUES)
    .withMessage(`Reaction must be one of: ${REACTION_VALUES.join(' ')}`),
];

export const anonymousQueryValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

export const resilienceQueryValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 52 })
    .withMessage('Limit must be between 1 and 52'),
];
