import Sentiment from 'sentiment';

const sentiment = new Sentiment();

/**
 * Analyze sentiment of text
 * @param {string} text - Text to analyze
 * @returns {Object} Sentiment analysis result with score and label
 */
export const analyzeSentiment = (text) => {
  const result = sentiment.analyze(text);
  
  // Sentiment package returns score from -5 to 5
  // We'll classify:
  // - positive: score > 1
  // - neutral: -1 <= score <= 1
  // - negative: score < -1
  let label;
  if (result.score > 1) {
    label = 'positive';
  } else if (result.score < -1) {
    label = 'negative';
  } else {
    label = 'neutral';
  }

  return {
    score: result.score,
    label: label,
    comparative: result.comparative, // Average sentiment per word
  };
};

