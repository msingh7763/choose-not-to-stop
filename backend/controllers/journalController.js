import JournalEntry from '../models/JournalEntry.js';
import sanitizeHtml from 'sanitize-html';
import { analyzeSentiment } from '../utils/sentimentAnalyzer.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * @desc    Create journal entry
 * @route   POST /api/journals
 * @access  Private
 */
export const createJournalEntry = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const sanitizedContent = sanitizeHtml(content || '', {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();

  if (!sanitizedContent || sanitizedContent.length < 10) {
    return res.status(400).json({
      success: false,
      message: 'Journal content must be at least 10 characters',
    });
  }

  // Analyze sentiment
  const sentiment = analyzeSentiment(sanitizedContent);

  // Create journal entry
  const journalEntry = await JournalEntry.create({
    user: req.user.id,
    content: sanitizedContent,
    sentimentScore: sentiment.score,
    sentimentLabel: sentiment.label,
  });

  res.status(201).json({
    success: true,
    data: journalEntry,
    message: 'Journal entry created successfully',
  });
});

/**
 * @desc    Get all journal entries for user
 * @route   GET /api/journals
 * @access  Private
 */
export const getJournalEntries = asyncHandler(async (req, res) => {
  const { limit = 30, startDate, endDate } = req.query;

  let query = { user: req.user.id };

  // Add date range filter if provided
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      query.createdAt.$lte = new Date(endDate);
    }
  }

  const journalEntries = await JournalEntry.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    count: journalEntries.length,
    data: journalEntries,
  });
});

/**
 * @desc    Get journal entry by ID
 * @route   GET /api/journals/:id
 * @access  Private
 */
export const getJournalEntry = asyncHandler(async (req, res) => {
  const journalEntry = await JournalEntry.findOne({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!journalEntry) {
    return res.status(404).json({
      success: false,
      message: 'Journal entry not found',
    });
  }

  res.status(200).json({
    success: true,
    data: journalEntry,
  });
});

/**
 * @desc    Update journal entry
 * @route   PUT /api/journals/:id
 * @access  Private
 */
export const updateJournalEntry = asyncHandler(async (req, res) => {
  let journalEntry = await JournalEntry.findOne({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!journalEntry) {
    return res.status(404).json({
      success: false,
      message: 'Journal entry not found',
    });
  }

  // If content is updated, re-analyze sentiment
  if (req.body.content) {
    const sanitizedContent = sanitizeHtml(req.body.content, {
      allowedTags: [],
      allowedAttributes: {},
    }).trim();

    if (sanitizedContent.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Journal content must be at least 10 characters',
      });
    }

    const sentiment = analyzeSentiment(sanitizedContent);
    journalEntry.content = sanitizedContent;
    journalEntry.sentimentScore = sentiment.score;
    journalEntry.sentimentLabel = sentiment.label;
  }

  journalEntry = await journalEntry.save();

  res.status(200).json({
    success: true,
    data: journalEntry,
    message: 'Journal entry updated successfully',
  });
});

/**
 * @desc    Delete journal entry
 * @route   DELETE /api/journals/:id
 * @access  Private
 */
export const deleteJournalEntry = asyncHandler(async (req, res) => {
  const journalEntry = await JournalEntry.findOne({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!journalEntry) {
    return res.status(404).json({
      success: false,
      message: 'Journal entry not found',
    });
  }

  await journalEntry.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Journal entry deleted successfully',
  });
});

