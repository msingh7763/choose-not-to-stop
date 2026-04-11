import mongoose from 'mongoose';

const resilienceScoreSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    weekStartDate: {
      type: Date,
      required: true,
      index: true,
    },
    weekEndDate: {
      type: Date,
      required: true,
    },
    metrics: {
      moodConsistency: {
        type: Number,
        default: 0,
      },
      positiveSentimentPercent: {
        type: Number,
        default: 0,
      },
      copingActionsCount: {
        type: Number,
        default: 0,
      },
      weeklyImprovementTrend: {
        type: Number,
        default: 0,
      },
    },
    calculatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate scores for same week
resilienceScoreSchema.index({ user: 1, weekStartDate: 1 }, { unique: true });

const ResilienceScore = mongoose.model('ResilienceScore', resilienceScoreSchema);

export default ResilienceScore;

