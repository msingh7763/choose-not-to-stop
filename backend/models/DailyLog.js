import mongoose from 'mongoose';

const dailyLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  mood: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  sleepHours: {
    type: Number,
    min: 0,
    max: 24,
    required: true
  },
  sentimentScore: {
    type: Number,
    required: true
  },
  negativeKeywordCount: {
    type: Number,
    required: true
  }
}, { timestamps: true });

export default mongoose.model('DailyLog', dailyLogSchema);
