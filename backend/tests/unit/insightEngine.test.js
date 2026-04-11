import { generateAllInsights } from '../../utils/insightEngine.js';

describe('insightEngine personalized action plans', () => {
  it('attaches recommended actions to negative mood streak insights', () => {
    const now = new Date();
    const day1 = new Date(now);
    day1.setDate(now.getDate() - 2);
    const day2 = new Date(now);
    day2.setDate(now.getDate() - 1);

    const moodEntries = [
      { mood: 'Sad', date: day1.toISOString() },
      { mood: 'Anxious', date: day2.toISOString() },
      { mood: 'Stressed', date: now.toISOString() },
    ];

    const insights = generateAllInsights(moodEntries, []);
    const streakInsight = insights.find(
      (insight) => insight.type === 'mood_streak' && insight.category === 'negative'
    );

    expect(streakInsight).toBeDefined();
    expect(Array.isArray(streakInsight.recommendedActions)).toBe(true);
    expect(streakInsight.recommendedActions.length).toBeGreaterThanOrEqual(3);
  });

  it('attaches recommended actions to sentiment trend insights', () => {
    const now = new Date();
    const journalEntries = [
      { sentimentLabel: 'negative', createdAt: now.toISOString() },
      { sentimentLabel: 'negative', createdAt: now.toISOString() },
      { sentimentLabel: 'negative', createdAt: now.toISOString() },
      { sentimentLabel: 'positive', createdAt: now.toISOString() },
    ];

    const insights = generateAllInsights([], journalEntries);
    const sentimentInsight = insights.find((insight) => insight.type === 'sentiment_trend');

    expect(sentimentInsight).toBeDefined();
    expect(Array.isArray(sentimentInsight.recommendedActions)).toBe(true);
    expect(sentimentInsight.recommendedActions.length).toBeGreaterThanOrEqual(3);
  });
});