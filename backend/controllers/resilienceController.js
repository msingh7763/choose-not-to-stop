import ResilienceScore from '../models/ResilienceScore.js';
import MoodEntry from '../models/MoodEntry.js';
import JournalEntry from '../models/JournalEntry.js';
import { calculateResilienceScore } from '../utils/resilienceScore.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * @desc    Calculate and store resilience score for current week
 * @route   POST /api/resilience/calculate
 * @access  Private
 */
export const calculateResilience = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get current week dates (Monday to Sunday)
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
  const weekStart = new Date(now.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  // Get previous week dates
  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  const prevWeekEnd = new Date(weekStart);
  prevWeekEnd.setDate(prevWeekEnd.getDate() - 1);
  prevWeekEnd.setHours(23, 59, 59, 999);

  // Get current week data
  const currentWeekMoods = await MoodEntry.find({
    user: userId,
    date: { $gte: weekStart, $lte: weekEnd },
  });

  const currentWeekJournals = await JournalEntry.find({
    user: userId,
    createdAt: { $gte: weekStart, $lte: weekEnd },
  });

  // Get previous week data for comparison
  const previousWeekMoods = await MoodEntry.find({
    user: userId,
    date: { $gte: prevWeekStart, $lte: prevWeekEnd },
  });

  const previousWeekJournals = await JournalEntry.find({
    user: userId,
    createdAt: { $gte: prevWeekStart, $lte: prevWeekEnd },
  });

  // Calculate score
  const scoreData = calculateResilienceScore({
    moodEntries: currentWeekMoods,
    journalEntries: currentWeekJournals,
    previousWeekData: {
      moodEntries: previousWeekMoods,
      journalEntries: previousWeekJournals,
    },
  });

  // Check if score already exists for this week
  let resilienceScore = await ResilienceScore.findOne({
    user: userId,
    weekStartDate: weekStart,
  });

  if (resilienceScore) {
    // Update existing score
    resilienceScore.score = scoreData.score;
    resilienceScore.metrics = scoreData.metrics;
    resilienceScore.calculatedAt = new Date();
    await resilienceScore.save();
  } else {
    // Create new score
    resilienceScore = await ResilienceScore.create({
      user: userId,
      score: scoreData.score,
      weekStartDate: weekStart,
      weekEndDate: weekEnd,
      metrics: scoreData.metrics,
    });
  }

  res.status(200).json({
    success: true,
    data: resilienceScore,
    message: 'Resilience score calculated successfully',
  });
});

/**
 * @desc    Get resilience score history
 * @route   GET /api/resilience
 * @access  Private
 */
export const getResilienceScores = asyncHandler(async (req, res) => {
  const { limit = 12 } = req.query;

  const scores = await ResilienceScore.find({ user: req.user.id })
    .sort({ weekStartDate: -1 })
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    count: scores.length,
    data: scores,
  });
});

/**
 * @desc    Get current resilience score
 * @route   GET /api/resilience/current
 * @access  Private
 */
export const getCurrentResilience = asyncHandler(async (req, res) => {
  // Get current week dates
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const weekStart = new Date(now.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);

  const score = await ResilienceScore.findOne({
    user: req.user.id,
    weekStartDate: weekStart,
  });

  if (!score) {
    return res.status(404).json({
      success: false,
      message: 'No resilience score found for current week. Please calculate it first.',
    });
  }

  res.status(200).json({
    success: true,
    data: score,
  });
});

