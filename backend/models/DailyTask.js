import mongoose from 'mongoose';

const dailyTaskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  tasks: [{
    id: String,
    title: String,
    completed: {
      type: Boolean,
      default: false
    }
  }]
}, { timestamps: true });

export default mongoose.model('DailyTask', dailyTaskSchema);
