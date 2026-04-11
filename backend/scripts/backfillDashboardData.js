import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import MoodEntry from '../models/MoodEntry.js';
import JournalEntry from '../models/JournalEntry.js';
import RiskHistory from '../models/RiskHistory.js';
import ResilienceScore from '../models/ResilienceScore.js';
import { analyzeSentiment } from '../utils/sentimentAnalyzer.js';
import { calculateResilienceScore } from '../utils/resilienceScore.js';

dotenv.config();

const moodToScore = {
  Happy: 5,
  Neutral: 3,
  Sad: 2,
  Anxious: 1,
  Stressed: 1,
};

const moodPattern = [
  'Stressed',
  'Anxious',
  'Sad',
  'Neutral',
  'Neutral',
  'Happy',
  'Neutral',
  'Happy',
  'Happy',
  'Happy',
];

const sleepPattern = [4.8, 5.2, 5.8, 6.4, 6.8, 7.2, 6.9, 7.4, 7.6, 7.9];

const journalTemplates = [
  'Today felt heavy and I struggled to focus. I want to reset tomorrow.',
  'I felt anxious for part of the day, but breathing exercises helped a little.',
  'My mood dipped and I felt tired. I still completed one small healthy step.',
  'A calmer day overall. I was not perfect but I managed my stress better.',
  'I felt neutral and steady. Sleep was better and I stayed consistent.',
  'I noticed a positive shift after taking breaks and journaling for ten minutes.',
  'Today was balanced. I stayed mindful and kept my routine mostly on track.',
  'I felt hopeful and productive. Small wins made a meaningful difference.',
  'Energy and mood improved today. I connected with someone supportive.',
  'I feel stronger this week and more in control of my emotions.',
];

const getDateDaysAgo = (daysAgo) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(0, 0, 0, 0);
  return date;
};

const getDayEnd = (dayStart) => {
  const dayEnd = new Date(dayStart);
  dayEnd.setHours(23, 59, 59, 999);
  return dayEnd;
};

const getWeekStart = (date) => {
  const target = new Date(date);
  const day = target.getDay();
  const diff = target.getDate() - day + (day === 0 ? -6 : 1);
  target.setDate(diff);
  target.setHours(0, 0, 0, 0);
  return target;
};

const getWeekEnd = (weekStart) => {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return weekEnd;
};

const deriveRisk = (features) => {
  const score =
    (features.sentiment < -0.5 ? 2 : features.sentiment < -0.2 ? 1 : 0) +
    (features.sleep < 5 ? 2 : features.sleep < 6.5 ? 1 : 0) +
    (features.mood <= 2 ? 2 : features.mood < 3 ? 1 : 0) +
    (features.negKeywords >= 3 ? 2 : features.negKeywords >= 1 ? 1 : 0);

  if (score >= 6) {
    return {
      risk: 'CRITICAL',
      reason: 'Low sleep + low mood + negative trend signals detected.',
    };
  }

  if (score >= 3) {
    return {
      risk: 'WARNING',
      reason: 'Early warning indicators detected in recent behavior.',
    };
  }

  return {
    risk: 'SAFE',
    reason: 'Indicators look stable for this period.',
  };
};

const ensureMoodEntry = async (userId, dayStart, mood, sleepHours, note) => {
  const dayEnd = getDayEnd(dayStart);

  const existing = await MoodEntry.findOne({
    user: userId,
    date: { $gte: dayStart, $lte: dayEnd },
  });

  if (existing) {
    return { created: false, doc: existing };
  }

  const created = await MoodEntry.create({
    user: userId,
    mood,
    sleepHours,
    notes: note,
    date: dayStart,
  });

  return { created: true, doc: created };
};

const ensureJournalEntry = async (userId, dayStart, content) => {
  const dayEnd = getDayEnd(dayStart);

  const existing = await JournalEntry.findOne({
    user: userId,
    createdAt: { $gte: dayStart, $lte: dayEnd },
  });

  if (existing) {
    return { created: false, doc: existing };
  }

  const sentiment = analyzeSentiment(content);
  const boundedSentimentScore = Math.max(-5, Math.min(5, sentiment.score));
  const createdAt = new Date(dayStart);
  createdAt.setHours(10, 30, 0, 0);

  const created = await JournalEntry.create({
    user: userId,
    content,
    sentimentScore: boundedSentimentScore,
    sentimentLabel: sentiment.label,
    createdAt,
  });

  return { created: true, doc: created };
};

const upsertRiskHistoryEntry = async (userId, dayStart, features) => {
  const dayEnd = getDayEnd(dayStart);
  const riskData = deriveRisk(features);

  const date = new Date(dayStart);
  date.setHours(18, 0, 0, 0);

  const update = {
    userId,
    date,
    risk: riskData.risk,
    reason: riskData.reason,
    features,
  };

  await RiskHistory.findOneAndUpdate(
    {
      userId,
      date: { $gte: dayStart, $lte: dayEnd },
    },
    update,
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );
};

const upsertResilienceForWeek = async (userId, weekStart) => {
  const weekEnd = getWeekEnd(weekStart);

  const previousWeekStart = new Date(weekStart);
  previousWeekStart.setDate(previousWeekStart.getDate() - 7);
  const previousWeekEnd = getWeekEnd(previousWeekStart);

  const [currentWeekMoods, currentWeekJournals, previousWeekMoods, previousWeekJournals] = await Promise.all([
    MoodEntry.find({ user: userId, date: { $gte: weekStart, $lte: weekEnd } }),
    JournalEntry.find({ user: userId, createdAt: { $gte: weekStart, $lte: weekEnd } }),
    MoodEntry.find({ user: userId, date: { $gte: previousWeekStart, $lte: previousWeekEnd } }),
    JournalEntry.find({ user: userId, createdAt: { $gte: previousWeekStart, $lte: previousWeekEnd } }),
  ]);

  const scoreData = calculateResilienceScore({
    moodEntries: currentWeekMoods,
    journalEntries: currentWeekJournals,
    previousWeekData: {
      moodEntries: previousWeekMoods,
      journalEntries: previousWeekJournals,
    },
  });

  await ResilienceScore.findOneAndUpdate(
    { user: userId, weekStartDate: weekStart },
    {
      user: userId,
      score: scoreData.score,
      weekStartDate: weekStart,
      weekEndDate: weekEnd,
      metrics: scoreData.metrics,
      calculatedAt: new Date(),
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );
};

const parseArg = (name, fallback) => {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  if (!found) return fallback;
  return found.slice(prefix.length);
};

const run = async () => {
  try {
    await connectDB();

    const daysToBackfill = Number(parseArg('days', '10'));
    const targetEmail = parseArg('email', '');

    const userQuery = targetEmail ? { email: targetEmail.toLowerCase() } : {};
    const users = await User.find(userQuery).select('_id email name');

    if (users.length === 0) {
      console.log('No users found for backfill.');
      process.exit(0);
    }

    let createdMoods = 0;
    let createdJournals = 0;

    for (const user of users) {
      for (let i = daysToBackfill - 1; i >= 0; i--) {
        const dayStart = getDateDaysAgo(i);
        const patternIndex = Math.min(moodPattern.length - 1, daysToBackfill - 1 - i);

        const mood = moodPattern[patternIndex] || 'Neutral';
        const sleepHours = sleepPattern[patternIndex] || 7;
        const content = journalTemplates[patternIndex] || journalTemplates[journalTemplates.length - 1];

        const moodResult = await ensureMoodEntry(
          user._id,
          dayStart,
          mood,
          sleepHours,
          `Backfill entry for trend visibility (${mood.toLowerCase()}).`
        );

        const journalResult = await ensureJournalEntry(user._id, dayStart, content);

        if (moodResult.created) createdMoods += 1;
        if (journalResult.created) createdJournals += 1;

        const journalSentiment = journalResult.doc?.sentimentScore ?? 0;
        const negativeKeywordCount = /stress|anxious|overwhelmed|sad|tired/gi.test(content) ? 2 : 0;

        await upsertRiskHistoryEntry(user._id, dayStart, {
          sentiment: journalSentiment,
          sleep: sleepHours,
          mood: moodToScore[mood] || 3,
          negKeywords: negativeKeywordCount,
        });
      }

      const currentWeekStart = getWeekStart(new Date());
      const previousWeekStart = new Date(currentWeekStart);
      previousWeekStart.setDate(previousWeekStart.getDate() - 7);

      await upsertResilienceForWeek(user._id, previousWeekStart);
      await upsertResilienceForWeek(user._id, currentWeekStart);

      console.log(`Backfilled data for user: ${user.email}`);
    }

    console.log(`\nBackfill complete.`);
    console.log(`Created mood entries: ${createdMoods}`);
    console.log(`Created journal entries: ${createdJournals}`);
    console.log('Risk history and resilience scores were upserted for trend charts.');

    process.exit(0);
  } catch (error) {
    console.error('Backfill failed:', error);
    process.exit(1);
  }
};

run();
