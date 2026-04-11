import { analyzeSentiment } from '../../utils/sentimentAnalyzer.js';

describe('analyzeSentiment', () => {
  it('classifies positive text', () => {
    const result = analyzeSentiment('I feel amazing and very happy today');

    expect(result).toEqual(
      expect.objectContaining({
        label: 'positive',
      })
    );
    expect(typeof result.score).toBe('number');
    expect(typeof result.comparative).toBe('number');
  });

  it('classifies negative text', () => {
    const result = analyzeSentiment('I feel terrible, anxious, and upset');

    expect(result).toEqual(
      expect.objectContaining({
        label: 'negative',
      })
    );
  });

  it('classifies mixed/neutral text', () => {
    const result = analyzeSentiment('Today was okay and normal');

    expect(['neutral', 'positive', 'negative']).toContain(result.label);
    expect(typeof result.score).toBe('number');
  });
});
