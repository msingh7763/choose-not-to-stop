/**
 * Resilience Score Algorithm
 * Calculates a score (0-100) based on multiple factors
 */

/**
 * Calculate mood consistency score (0-30 points)
 * Higher consistency = higher score
 */
const calculateMoodConsistency = (moodEntries) => {
  if (moodEntries.length < 2) return 0;

  const moodValues = {
    'Happy': 5,
    'Neutral': 3,
    'Sad': 2,
    'Anxious': 1,
    'Stressed': 1,
  };

  const values = moodEntries.map((entry) => moodValues[entry.mood]);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  
  // Calculate standard deviation
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  // Lower standard deviation = higher consistency
  // Max score when stdDev is 0, min when stdDev is high
  // Normalize to 0-30 range
  const maxStdDev = 2; // Approximate max for our scale
  const consistencyScore = Math.max(0, 30 * (1 - stdDev / maxStdDev));
  
  return Math.round(consistencyScore);
};

/**
 * Calculate positive sentiment percentage score (0-30 points)
 */
const calculateSentimentScore = (journalEntries) => {
  if (journalEntries.length === 0) return 15; // Neutral if no entries

  const positiveCount = journalEntries.filter(
    (entry) => entry.sentimentLabel === 'positive'
  ).length;

  const positivePercent = (positiveCount / journalEntries.length) * 100;
  
  // Direct mapping: 0% = 0 points, 100% = 30 points
  return Math.round((positivePercent / 100) * 30);
};

/**
 * Calculate coping actions score (0-20 points)
 * Based on number of journal entries and mood tracking consistency
 */
const calculateCopingActionsScore = (journalEntries, moodEntries) => {
  // Reward consistent tracking
  const journalScore = Math.min(10, journalEntries.length * 0.5);
  const moodTrackingScore = Math.min(10, moodEntries.length * 0.3);
  
  return Math.round(journalScore + moodTrackingScore);
};

/**
 * Calculate weekly improvement trend score (0-20 points)
 * Compares current week to previous week
 */
const calculateImprovementTrend = (currentWeekData, previousWeekData) => {
  if (!previousWeekData || previousWeekData.moodEntries.length === 0) {
    return 10; // Neutral if no previous data
  }

  const moodValues = {
    'Happy': 5,
    'Neutral': 3,
    'Sad': 2,
    'Anxious': 1,
    'Stressed': 1,
  };

  // Calculate average mood for each week
  const currentAvg = currentWeekData.moodEntries.length > 0
    ? currentWeekData.moodEntries.reduce(
        (sum, entry) => sum + moodValues[entry.mood],
        0
      ) / currentWeekData.moodEntries.length
    : 3;

  const previousAvg = previousWeekData.moodEntries.reduce(
    (sum, entry) => sum + moodValues[entry.mood],
    0
  ) / previousWeekData.moodEntries.length;

  // Calculate sentiment improvement
  const currentPositive = currentWeekData.journalEntries.filter(
    (e) => e.sentimentLabel === 'positive'
  ).length;
  const currentSentimentPercent = currentWeekData.journalEntries.length > 0
    ? (currentPositive / currentWeekData.journalEntries.length) * 100
    : 50;

  const previousPositive = previousWeekData.journalEntries.filter(
    (e) => e.sentimentLabel === 'positive'
  ).length;
  const previousSentimentPercent = previousWeekData.journalEntries.length > 0
    ? (previousPositive / previousWeekData.journalEntries.length) * 100
    : 50;

  // Improvement factors
  const moodImprovement = currentAvg - previousAvg; // -4 to +4 range
  const sentimentImprovement = currentSentimentPercent - previousSentimentPercent; // -100 to +100

  // Normalize to 0-20 range
  // Mood improvement: -4 to +4 maps to 0-10
  const moodScore = Math.max(0, Math.min(10, 10 + (moodImprovement * 2.5)));
  
  // Sentiment improvement: -100 to +100 maps to 0-10
  const sentimentScore = Math.max(0, Math.min(10, 10 + (sentimentImprovement * 0.1)));

  return Math.round((moodScore + sentimentScore) / 2);
};

/**
 * Calculate overall resilience score (0-100)
 * @param {Object} data - Object containing moodEntries, journalEntries, and previousWeekData
 * @returns {Object} Score object with breakdown
 */
export const calculateResilienceScore = (data) => {
  const { moodEntries, journalEntries, previousWeekData } = data;

  // Calculate component scores
  const moodConsistency = calculateMoodConsistency(moodEntries);
  const sentimentScore = calculateSentimentScore(journalEntries);
  const copingActions = calculateCopingActionsScore(journalEntries, moodEntries);
  const improvementTrend = calculateImprovementTrend(
    { moodEntries, journalEntries },
    previousWeekData
  );

  // Total score
  const totalScore = moodConsistency + sentimentScore + copingActions + improvementTrend;

  return {
    score: Math.min(100, Math.max(0, totalScore)), // Clamp between 0-100
    metrics: {
      moodConsistency,
      positiveSentimentPercent: Math.round(
        (journalEntries.filter((e) => e.sentimentLabel === 'positive').length /
          Math.max(1, journalEntries.length)) *
          100
      ),
      copingActionsCount: journalEntries.length + moodEntries.length,
      weeklyImprovementTrend: improvementTrend,
    },
  };
};

