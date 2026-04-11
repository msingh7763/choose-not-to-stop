import mongoose from 'mongoose';

const riskHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  risk: {
    type: String,
    enum: ['SAFE', 'WARNING', 'CRITICAL'],
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  features: {
    sentiment: Number,
    sleep: Number,
    mood: Number,
    negKeywords: Number
  }
}, { timestamps: true });

export default mongoose.model('RiskHistory', riskHistorySchema);
