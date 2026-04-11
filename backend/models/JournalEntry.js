import mongoose from 'mongoose';

const journalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Journal content is required'],
      minlength: [10, 'Journal entry must be at least 10 characters'],
      maxlength: [5000, 'Journal entry cannot exceed 5000 characters'],
    },
    sentimentScore: {
      type: Number,
      required: true,
      min: -5,
      max: 5,
    },
    sentimentLabel: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const JournalEntry = mongoose.model('JournalEntry', journalSchema);

export default JournalEntry;

