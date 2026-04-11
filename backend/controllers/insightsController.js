import MoodEntry from '../models/MoodEntry.js';
import JournalEntry from '../models/JournalEntry.js';
import { generateAllInsights } from '../utils/insightEngine.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * @desc    Get emotional insights for user
 * @route   GET /api/insights
 * @access  Private
 */
export const getInsights = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get mood entries (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const moodEntries = await MoodEntry.find({
    user: userId,
    date: { $gte: thirtyDaysAgo },
  }).sort({ date: 1 });

  // Get journal entries (last 30 days)
  const journalEntries = await JournalEntry.find({
    user: userId,
    createdAt: { $gte: thirtyDaysAgo },
  }).sort({ createdAt: 1 });

  // Generate insights
  const insights = generateAllInsights(moodEntries, journalEntries);

  res.status(200).json({
    success: true,
    count: insights.length,
    data: insights,
  });
});

