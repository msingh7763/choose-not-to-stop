import AnonymousPost from '../models/AnonymousPost.js';
import sanitizeHtml from 'sanitize-html';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * @desc    Create anonymous post
 * @route   POST /api/anonymous
 * @access  Public
 */
export const createAnonymousPost = asyncHandler(async (req, res) => {
  const { content } = req.body;

  const sanitizedContent = sanitizeHtml(content || '', {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();

  if (!sanitizedContent || sanitizedContent.length < 10) {
    return res.status(400).json({
      success: false,
      message: 'Post content must be at least 10 characters',
    });
  }

  const lineCount = sanitizedContent.split(/\r?\n/).length;
  const isPersistent = lineCount > 4;

  // Posts with 4 or fewer lines expire in 24 hours.
  const expiresAt = isPersistent
    ? null
    : (() => {
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + 24);
      return expiry;
    })();

  const post = await AnonymousPost.create({
    content: sanitizedContent,
    isPersistent,
    expiresAt,
  });

  res.status(201).json({
    success: true,
    data: post,
    message: isPersistent
      ? 'Post created successfully. This post stays on the wall.'
      : 'Post created successfully. This post expires in 24 hours.',
  });
});

/**
 * @desc    Get all active anonymous posts
 * @route   GET /api/anonymous
 * @access  Public
 */
export const getAnonymousPosts = asyncHandler(async (req, res) => {
  const { limit = 50 } = req.query;

  // Get persistent posts and non-expired short posts.
  const posts = await AnonymousPost.find({
    $or: [
      { isPersistent: true },
      { expiresAt: { $gt: new Date() } },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    count: posts.length,
    data: posts,
  });
});

/**
 * @desc    Add reaction to anonymous post
 * @route   POST /api/anonymous/:id/reaction
 * @access  Public
 */
export const addReaction = asyncHandler(async (req, res) => {
  const { reactionType } = req.body;

  if (!reactionType) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a reaction type',
    });
  }

  const post = await AnonymousPost.findById(req.params.id);

  if (!post) {
    return res.status(404).json({
      success: false,
      message: 'Post not found',
    });
  }

  // Check if post has expired
  if (!post.isPersistent && post.expiresAt && post.expiresAt < new Date()) {
    return res.status(400).json({
      success: false,
      message: 'This post has expired',
    });
  }

  // Add reaction
  await post.addReaction(reactionType);

  res.status(200).json({
    success: true,
    data: post,
    message: 'Reaction added successfully',
  });
});

