import { calculateResilienceScore } from '../../utils/resilienceScore.js';

const makeMood = (mood) => ({ mood });
const makeJournal = (sentimentLabel) => ({ sentimentLabel });

describe('calculateResilienceScore', () => {
  it('returns a bounded score with expected metric fields', () => {
    const result = calculateResilienceScore({
      moodEntries: [makeMood('Happy'), makeMood('Neutral'), makeMood('Happy')],
      journalEntries: [makeJournal('positive'), makeJournal('neutral')],
      previousWeekData: {
        moodEntries: [makeMood('Sad')],
        journalEntries: [makeJournal('negative')],
      },
    });

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.metrics).toEqual(
      expect.objectContaining({
        moodConsistency: expect.any(Number),
        positiveSentimentPercent: expect.any(Number),
        copingActionsCount: expect.any(Number),
        weeklyImprovementTrend: expect.any(Number),
      })
    );
  });

  it('handles empty current week data safely', () => {
    const result = calculateResilienceScore({
      moodEntries: [],
      journalEntries: [],
      previousWeekData: {
        moodEntries: [makeMood('Neutral')],
        journalEntries: [makeJournal('neutral')],
      },
    });

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.metrics.positiveSentimentPercent).toBe(0);
  });

  it('rewards stronger positive trend over weaker trend', () => {
    const strong = calculateResilienceScore({
      moodEntries: [makeMood('Happy'), makeMood('Happy'), makeMood('Neutral')],
      journalEntries: [makeJournal('positive'), makeJournal('positive')],
      previousWeekData: {
        moodEntries: [makeMood('Sad'), makeMood('Anxious')],
        journalEntries: [makeJournal('negative'), makeJournal('negative')],
      },
    });

    const weak = calculateResilienceScore({
      moodEntries: [makeMood('Neutral'), makeMood('Sad')],
      journalEntries: [makeJournal('negative')],
      previousWeekData: {
        moodEntries: [makeMood('Happy'), makeMood('Happy')],
        journalEntries: [makeJournal('positive'), makeJournal('positive')],
      },
    });

    expect(strong.score).toBeGreaterThan(weak.score);
  });
});
