import express from 'express';
import { protect } from '../middleware/auth.js';
import DailyTask from '../models/DailyTask.js';

const router = express.Router();
router.use(protect);

const DEFAULT_TASKS = [
  { id: '1', title: '60-second mood check-in', completed: false },
  { id: '2', title: '2-minute breathing reset', completed: false },
  { id: '3', title: 'Write one kind sentence to yourself', completed: false },
  { id: '4', title: 'Review your insight before sleeping', completed: false }
];

router.get('/', async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let dailyTask = await DailyTask.findOne({
      userId: req.user._id,
      date: { $gte: today }
    });

    if (!dailyTask) {
      dailyTask = await DailyTask.create({
        userId: req.user._id,
        tasks: DEFAULT_TASKS
      });
    }

    res.status(200).json({ success: true, dailyTask });
  } catch (error) {
    next(error);
  }
});

router.put('/:taskId', async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyTask = await DailyTask.findOne({
      userId: req.user._id,
      date: { $gte: today }
    });

    if (!dailyTask) {
      return res.status(404).json({ success: false, message: 'Tasks not found for today' });
    }

    const taskIndex = dailyTask.tasks.findIndex(t => t.id === req.params.taskId);
    if (taskIndex !== -1) {
      dailyTask.tasks[taskIndex].completed = !dailyTask.tasks[taskIndex].completed;
      await dailyTask.save();
    }

    res.status(200).json({ success: true, dailyTask });
  } catch (error) {
    next(error);
  }
});

export default router;
