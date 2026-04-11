import express from 'express';
import { protect } from '../middleware/auth.js';
import DailyLog from '../models/DailyLog.js';
import RiskHistory from '../models/RiskHistory.js';
import MoodEntry from '../models/MoodEntry.js';
import JournalEntry from '../models/JournalEntry.js';

const router = express.Router();
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const parsedTimeoutMs = Number(process.env.ML_REQUEST_TIMEOUT_MS);
const ML_REQUEST_TIMEOUT_MS = Number.isFinite(parsedTimeoutMs) && parsedTimeoutMs > 0
  ? parsedTimeoutMs
  : 5000;

router.use(protect); // Ensure user is authenticated

const moodToScore = {
  Happy: 5,
  Neutral: 3,
  Sad: 2,
  Anxious: 1,
  Stressed: 1,
};

const average = (values, fallback = 0) => {
  if (!values.length) {
    return fallback;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
};

const getRecentCutoffDate = () => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  return cutoff;
};

const buildFeaturesFromDailyLogs = (logs) => {
  const sum = logs.reduce((acc, log) => {
    acc.sentiment += log.sentimentScore;
    acc.sleep += log.sleepHours;
    acc.mood += log.mood;
    acc.negKeywords += log.negativeKeywordCount;
    return acc;
  }, { sentiment: 0, sleep: 0, mood: 0, negKeywords: 0 });

  const totalLogs = logs.length;
  return {
    sentiment: sum.sentiment / totalLogs,
    sleep: sum.sleep / totalLogs,
    mood: sum.mood / totalLogs,
    negKeywords: sum.negKeywords / totalLogs,
  };
};

const buildFeaturesFromMoodAndJournalEntries = (moodEntries, journalEntries) => {
  const moodScores = moodEntries
    .map((entry) => moodToScore[entry.mood])
    .filter((value) => Number.isFinite(value));

  const sleepValues = moodEntries
    .map((entry) => entry.sleepHours)
    .filter((value) => Number.isFinite(value));

  const sentimentScores = journalEntries
    .map((entry) => entry.sentimentScore)
    .filter((value) => Number.isFinite(value));

  const negativeJournalCount = journalEntries.filter(
    (entry) => entry.sentimentLabel === 'negative'
  ).length;

  return {
    sentiment: average(sentimentScores, 0),
    sleep: average(sleepValues, 7),
    mood: average(moodScores, 3),
    negKeywords: negativeJournalCount,
  };
};

const getCutoffDateForDays = (days) => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return cutoff;
};

const getRiskFromHeuristic = (features) => {
  // Weighted score keeps the fallback deterministic and aligned with feature semantics.
  const riskScore =
    (features.sentiment < -0.5 ? 2 : features.sentiment < -0.2 ? 1 : 0) +
    (features.sleep < 5 ? 2 : features.sleep < 6.5 ? 1 : 0) +
    (features.mood <= 2 ? 2 : features.mood < 3 ? 1 : 0) +
    (features.negKeywords >= 4 ? 2 : features.negKeywords >= 2 ? 1 : 0);

  if (riskScore >= 6) {
    return {
      risk: 'CRITICAL',
      reason: 'Fallback model detected multiple high-risk indicators (low sleep, low mood, and negative trend).',
    };
  }

  if (riskScore >= 3) {
    return {
      risk: 'WARNING',
      reason: 'Fallback model detected early warning indicators in recent mood and journal patterns.',
    };
  }

  return {
    risk: 'SAFE',
    reason: 'Fallback model indicates stable emotional indicators in recent data.',
  };
};

const callMlPredictionService = async (features) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ML_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(new URL('/predict', ML_SERVICE_URL), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(features),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`ML service returned ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
};

// Evaluate risk based on the last 7 daily logs
router.post('/evaluate', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const recentCutoff = getRecentCutoffDate();

    // Fetch the last 7 logs
    const logs = await DailyLog.find({ userId })
      .sort({ date: -1 })
      .limit(7);

    let features;
    if (logs.length > 0) {
      features = buildFeaturesFromDailyLogs(logs);
    } else {
      const [moodEntries, journalEntries] = await Promise.all([
        MoodEntry.find({ user: userId, date: { $gte: recentCutoff } })
          .sort({ date: -1 })
          .limit(7),
        JournalEntry.find({ user: userId, createdAt: { $gte: recentCutoff } })
          .sort({ createdAt: -1 })
          .limit(7),
      ]);

      if (moodEntries.length === 0 && journalEntries.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No recent mood or journal data available to evaluate risk. Add entries for at least a few days.',
        });
      }

      features = buildFeaturesFromMoodAndJournalEntries(moodEntries, journalEntries);
    }

    // Call ML Python Service, with local fallback to keep feature available.
    let predictionSource = 'ml_service';
    let mlResponse;
    try {
      mlResponse = await callMlPredictionService(features);
    } catch (mlErr) {
      console.error('ML API Error:', mlErr.message);
      predictionSource = 'fallback_heuristic';
      mlResponse = getRiskFromHeuristic(features);
    }

    const { risk, reason } = mlResponse;

    // Save prediction history
    const historyEntry = await RiskHistory.create({
      userId,
      risk,
      reason,
      features
    });

    res.status(200).json({
      success: true,
      risk,
      reason,
      source: predictionSource,
      historyEntry
    });
  } catch (error) {
    next(error);
  }
});

// Get ML forecasts for multiple behavioral windows
router.get('/forecast', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const windows = [3, 5, 7, 100];

    const forecasts = await Promise.all(windows.map(async (days) => {
      const cutoff = getCutoffDateForDays(days);
      const [moodEntries, journalEntries] = await Promise.all([
        MoodEntry.find({ user: userId, date: { $gte: cutoff } })
          .sort({ date: -1 })
          .limit(days),
        JournalEntry.find({ user: userId, createdAt: { $gte: cutoff } })
          .sort({ createdAt: -1 })
          .limit(days),
      ]);

      if (moodEntries.length === 0 && journalEntries.length === 0) {
        return {
          days,
          risk: null,
          reason: 'Not enough data',
          confidence: 0,
          hasData: false,
        };
      }

      const features = buildFeaturesFromMoodAndJournalEntries(moodEntries, journalEntries);

      let prediction;
      let source = 'ml_service';
      try {
        prediction = await callMlPredictionService(features);
      } catch (mlErr) {
        console.error(`ML API Error for ${days}-day forecast:`, mlErr.message);
        source = 'fallback_heuristic';
        prediction = getRiskFromHeuristic(features);
      }

      // Lightweight confidence proxy based on data density in the window.
      const coverage = Math.min(1, Math.max(moodEntries.length, journalEntries.length) / days);
      const confidence = Math.round(50 + coverage * 45);

      return {
        days,
        risk: prediction.risk,
        reason: prediction.reason,
        confidence,
        source,
        hasData: true,
        features,
      };
    }));

    res.status(200).json({
      success: true,
      data: forecasts,
    });
  } catch (error) {
    next(error);
  }
});

// Get user's risk history for trend charts
router.get('/history', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const history = await RiskHistory.find({ userId })
      .sort({ date: 1 }); // Oldest to newest for graphing
    
    res.status(200).json({
      success: true,
      history
    });
  } catch (error) {
    next(error);
  }
});

export default router;
