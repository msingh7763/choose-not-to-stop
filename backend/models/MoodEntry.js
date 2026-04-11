import mongoose from 'mongoose';

const moodSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    mood: {
      type: String,
      required: true,
      enum: ['Happy', 'Neutral', 'Sad', 'Anxious', 'Stressed'],
    },
    sleepHours: {
      type: Number,
      min: 0,
      max: 24,
      default: null,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate entries for same day
moodSchema.index({ user: 1, date: 1 }, { unique: true });

// Virtual to get date string (YYYY-MM-DD) for easier querying
moodSchema.virtual('dateString').get(function () {
  return this.date.toISOString().split('T')[0];
});

// Ensure virtuals are included in JSON output
moodSchema.set('toJSON', { virtuals: true });

const MoodEntry = mongoose.model('MoodEntry', moodSchema);

export default MoodEntry;

