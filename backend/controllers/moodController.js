import MoodEntry from '../models/MoodEntry.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * @desc    Create mood entry
 * @route   POST /api/moods
 * @access  Private
 */
export const createMoodEntry = asyncHandler(async (req, res) => {
  const { mood, sleepHours, notes } = req.body;

  if (!mood) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a mood',
    });
  }

  // Set date to today (start of day in local timezone to represent user's actual day)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if entry already exists for today
  const existingEntry = await MoodEntry.findOne({
    user: req.user.id,
    date: {
      $gte: today,
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
    },
  });

  if (existingEntry) {
    // Update existing entry
    existingEntry.mood = mood;
    if (sleepHours !== undefined) existingEntry.sleepHours = sleepHours;
    if (notes !== undefined) existingEntry.notes = notes;
    
    const updatedEntry = await existingEntry.save();
    
    return res.status(200).json({
      success: true,
      data: updatedEntry,
      message: 'Mood entry updated successfully',
    });
  }

  // Create new entry
  const moodEntry = await MoodEntry.create({
    user: req.user.id,
    mood,
    sleepHours: sleepHours || null,
    notes: notes || '',
    date: today,
  });

  res.status(201).json({
    success: true,
    data: moodEntry,
    message: 'Mood entry created successfully',
  });
});

/**
 * @desc    Get all mood entries for user
 * @route   GET /api/moods
 * @access  Private
 */
export const getMoodEntries = asyncHandler(async (req, res) => {
  const { limit = 30, startDate, endDate } = req.query;

  let query = { user: req.user.id };

  // Add date range filter if provided
  if (startDate || endDate) {
    query.date = {};
    if (startDate) {
      // Parse YYYY-MM-DD format and create date range for the entire day
      // Create start of day in local timezone
      const [year, month, day] = startDate.split('-').map(Number);
      const start = new Date(year, month - 1, day, 0, 0, 0, 0);
      query.date.$gte = start;
    }
    if (endDate) {
      // Parse YYYY-MM-DD format and create date range for the entire day
      // Create end of day in local timezone
      const [year, month, day] = endDate.split('-').map(Number);
      const end = new Date(year, month - 1, day, 23, 59, 59, 999);
      query.date.$lte = end;
    }
  }

  const moodEntries = await MoodEntry.find(query)
    .sort({ date: -1 })
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    count: moodEntries.length,
    data: moodEntries,
  });
});

/**
 * @desc    Get mood entry by ID
 * @route   GET /api/moods/:id
 * @access  Private
 */
export const getMoodEntry = asyncHandler(async (req, res) => {
  const moodEntry = await MoodEntry.findOne({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!moodEntry) {
    return res.status(404).json({
      success: false,
      message: 'Mood entry not found',
    });
  }

  res.status(200).json({
    success: true,
    data: moodEntry,
  });
});

/**
 * @desc    Update mood entry
 * @route   PUT /api/moods/:id
 * @access  Private
 */
export const updateMoodEntry = asyncHandler(async (req, res) => {
  let moodEntry = await MoodEntry.findOne({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!moodEntry) {
    return res.status(404).json({
      success: false,
      message: 'Mood entry not found',
    });
  }

  // Update fields
  if (req.body.mood) moodEntry.mood = req.body.mood;
  if (req.body.sleepHours !== undefined) moodEntry.sleepHours = req.body.sleepHours;
  if (req.body.notes !== undefined) moodEntry.notes = req.body.notes;

  moodEntry = await moodEntry.save();

  res.status(200).json({
    success: true,
    data: moodEntry,
    message: 'Mood entry updated successfully',
  });
});

/**
 * @desc    Delete mood entry
 * @route   DELETE /api/moods/:id
 * @access  Private
 */
export const deleteMoodEntry = asyncHandler(async (req, res) => {
  const moodEntry = await MoodEntry.findOne({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!moodEntry) {
    return res.status(404).json({
      success: false,
      message: 'Mood entry not found',
    });
  }

  await moodEntry.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Mood entry deleted successfully',
  });
});

