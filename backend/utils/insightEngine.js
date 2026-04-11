/**
 * Emotional Insight Engine
 * Detects patterns and provides insights from user's mood and journal data
 */

/**
 * Detect mood streaks (consecutive days with same mood category)
 * @param {Array} moodEntries - Array of mood entries sorted by date
 * @returns {Array} Array of insight objects
 */
export const detectMoodStreaks = (moodEntries) => {
  const insights = [];
  
  if (moodEntries.length < 2) return insights;

  // Categorize moods
  const positiveMoods = ['Happy'];
  const negativeMoods = ['Sad', 'Anxious', 'Stressed'];

  let currentStreak = 1;
  let currentCategory = getMoodCategory(moodEntries[0].mood, positiveMoods, negativeMoods);
  let streakStart = moodEntries[0].date;

  for (let i = 1; i < moodEntries.length; i++) {
    const category = getMoodCategory(moodEntries[i].mood, positiveMoods, negativeMoods);
    
    if (category === currentCategory) {
      currentStreak++;
    } else {
      // Streak ended
      if (currentStreak >= 3) {
        insights.push({
          type: 'mood_streak',
          category: currentCategory,
          days: currentStreak,
          startDate: streakStart,
          endDate: moodEntries[i - 1].date,
          message: generateStreakMessage(currentCategory, currentStreak),
        });
      }
      currentStreak = 1;
      currentCategory = category;
      streakStart = moodEntries[i].date;
    }
  }

  // Check final streak
  if (currentStreak >= 3) {
    insights.push({
      type: 'mood_streak',
      category: currentCategory,
      days: currentStreak,
      startDate: streakStart,
      endDate: moodEntries[moodEntries.length - 1].date,
      message: generateStreakMessage(currentCategory, currentStreak),
    });
  }

  return insights;
};

/**
 * Detect sudden mood drops
 * @param {Array} moodEntries - Array of mood entries sorted by date
 * @returns {Array} Array of insight objects
 */
export const detectMoodDrops = (moodEntries) => {
  const insights = [];
  
  if (moodEntries.length < 2) return insights;

  const moodValues = {
    'Happy': 5,
    'Neutral': 3,
    'Sad': 2,
    'Anxious': 1,
    'Stressed': 1,
  };

  for (let i = 1; i < moodEntries.length; i++) {
    const prevValue = moodValues[moodEntries[i - 1].mood];
    const currentValue = moodValues[moodEntries[i].mood];
    
    // Detect significant drop (3+ points)
    if (prevValue - currentValue >= 3) {
      insights.push({
        type: 'mood_drop',
        previousMood: moodEntries[i - 1].mood,
        currentMood: moodEntries[i].mood,
        date: moodEntries[i].date,
        message: `You experienced a sudden mood drop from ${moodEntries[i - 1].mood} to ${moodEntries[i].mood}.`,
      });
    }
  }

  return insights;
};

/**
 * Calculate negative sentiment percentage for a week
 * @param {Array} journalEntries - Array of journal entries for the week
 * @returns {number} Percentage of negative sentiment entries
 */
export const calculateNegativeSentimentPercent = (journalEntries) => {
  if (journalEntries.length === 0) return 0;

  const negativeCount = journalEntries.filter(
    (entry) => entry.sentimentLabel === 'negative'
  ).length;

  return Math.round((negativeCount / journalEntries.length) * 100);
};

/**
 * Detect mood patterns (e.g., weekends worse than weekdays)
 * @param {Array} moodEntries - Array of mood entries
 * @returns {Array} Array of insight objects
 */
export const detectMoodPatterns = (moodEntries) => {
  const insights = [];
  
  if (moodEntries.length < 7) return insights;

  const moodValues = {
    'Happy': 5,
    'Neutral': 3,
    'Sad': 2,
    'Anxious': 1,
    'Stressed': 1,
  };

  // Separate weekdays and weekends
  const weekdayMoods = [];
  const weekendMoods = [];

  moodEntries.forEach((entry) => {
    const dayOfWeek = new Date(entry.date).getDay();
    const moodValue = moodValues[entry.mood];
    
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // Sunday (0) or Saturday (6)
      weekendMoods.push(moodValue);
    } else {
      weekdayMoods.push(moodValue);
    }
  });

  if (weekdayMoods.length > 0 && weekendMoods.length > 0) {
    const weekdayAvg = weekdayMoods.reduce((a, b) => a + b, 0) / weekdayMoods.length;
    const weekendAvg = weekendMoods.reduce((a, b) => a + b, 0) / weekendMoods.length;

    if (weekendAvg < weekdayAvg - 0.5) {
      insights.push({
        type: 'pattern',
        pattern: 'weekend_low',
        message: 'You tend to experience lower moods on weekends compared to weekdays.',
      });
    } else if (weekdayAvg < weekendAvg - 0.5) {
      insights.push({
        type: 'pattern',
        pattern: 'weekday_low',
        message: 'You tend to experience lower moods on weekdays compared to weekends.',
      });
    }
  }

  return insights;
};

/**
 * Generate all insights for a user
 * @param {Array} moodEntries - Array of mood entries
 * @param {Array} journalEntries - Array of journal entries
 * @returns {Array} Combined array of all insights
 */
export const generateAllInsights = (moodEntries, journalEntries) => {
  const insights = [];

  // Sort entries by date
  const sortedMoods = [...moodEntries].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );
  const sortedJournals = [...journalEntries].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );

  // Get last 30 days of data
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentMoods = sortedMoods.filter(
    (entry) => new Date(entry.date) >= thirtyDaysAgo
  );
  const recentJournals = sortedJournals.filter(
    (entry) => new Date(entry.createdAt) >= thirtyDaysAgo
  );

  // Detect streaks
  insights.push(...detectMoodStreaks(recentMoods));

  // Detect mood drops
  insights.push(...detectMoodDrops(recentMoods));

  // Detect patterns
  insights.push(...detectMoodPatterns(recentMoods));

  // Weekly negative sentiment
  const lastWeekJournals = recentJournals.filter(
    (entry) => {
      const entryDate = new Date(entry.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return entryDate >= weekAgo;
    }
  );

  if (lastWeekJournals.length > 0) {
    const negativePercent = calculateNegativeSentimentPercent(lastWeekJournals);
    if (negativePercent > 50) {
      insights.push({
        type: 'sentiment_trend',
        negativePercent: negativePercent,
        message: `Your journal entries showed ${negativePercent}% negative sentiment this week.`,
      });
    }
  }

  return insights.map((insight) => ({
    ...insight,
    recommendedActions: generateRecommendedActions(insight),
  }));
};

// Helper functions
function getMoodCategory(mood, positiveMoods, negativeMoods) {
  if (positiveMoods.includes(mood)) return 'positive';
  if (negativeMoods.includes(mood)) return 'negative';
  return 'neutral';
}

function generateStreakMessage(category, days) {
  if (category === 'negative') {
    return `You experienced ${days} consecutive low-mood days.`;
  } else if (category === 'positive') {
    return `You've had ${days} consecutive positive mood days!`;
  } else {
    return `You've had ${days} consecutive neutral mood days.`;
  }
}

function generateRecommendedActions(insight) {
  if (insight.type === 'mood_streak' && insight.category === 'negative') {
    return [
      'Do a 2-minute breathing reset (inhale 4s, hold 2s, exhale 4s).',
      'Write one journal entry focused on what felt hardest today.',
      'Reach out to one trusted person and share how you are feeling.',
    ];
  }

  if (insight.type === 'mood_streak' && insight.category === 'positive') {
    return [
      'Capture what worked well in your journal so you can repeat it.',
      'Schedule one small self-care activity for tomorrow.',
      'Share your progress with someone supportive to reinforce momentum.',
    ];
  }

  if (insight.type === 'mood_drop') {
    return [
      'Pause for 5 minutes and do grounding: name 5 things you can see.',
      'Add a quick note about possible triggers in your journal.',
      'Choose one gentle action now: water, stretch, or a short walk.',
    ];
  }

  if (insight.type === 'pattern' && insight.pattern === 'weekend_low') {
    return [
      'Plan one meaningful weekend activity in advance.',
      'Set a simple weekend routine for sleep and meals.',
      'Book a social check-in call to reduce isolation.',
    ];
  }

  if (insight.type === 'pattern' && insight.pattern === 'weekday_low') {
    return [
      'Break your weekday into short, manageable tasks.',
      'Take one 10-minute outdoor break during the day.',
      'End your day with a short reflection on one win.',
    ];
  }

  if (insight.type === 'sentiment_trend') {
    return [
      'Use one prompt today: "What do I need most right now?"',
      'Try a 10-minute calming activity before bedtime.',
      'If this persists, use Crisis Support and contact a helpline or trusted person.',
    ];
  }

  return [
    'Take 3 deep breaths before your next task.',
    'Log today\'s mood and one short journal note.',
    'Pick one supportive habit you can repeat tomorrow.',
  ];
}

