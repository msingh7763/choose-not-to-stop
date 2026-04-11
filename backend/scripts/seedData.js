import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import MoodEntry from '../models/MoodEntry.js';
import JournalEntry from '../models/JournalEntry.js';
import { analyzeSentiment } from '../utils/sentimentAnalyzer.js';

dotenv.config();

/**
 * Seed database with sample data for testing
 */
const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await MoodEntry.deleteMany({});
    await JournalEntry.deleteMany({});

    // Create test user
    console.log('Creating test user...');
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });

    console.log(`Created user: ${user.email}`);

    // Create mood entries for the last 14 days
    console.log('Creating mood entries...');
    const moods = ['Happy', 'Neutral', 'Sad', 'Anxious', 'Stressed'];
    const moodEntries = [];

    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const randomMood = moods[Math.floor(Math.random() * moods.length)];
      const sleepHours = Math.floor(Math.random() * 4) + 6; // 6-9 hours

      const entry = await MoodEntry.create({
        user: user._id,
        mood: randomMood,
        sleepHours: sleepHours,
        date: date,
      });

      moodEntries.push(entry);
    }

    console.log(`Created ${moodEntries.length} mood entries`);

    // Create journal entries
    console.log('Creating journal entries...');
    const journalTemplates = [
      'Today was a great day! I felt productive and happy.',
      'Feeling a bit anxious about the upcoming week. Need to take it one day at a time.',
      'Had a stressful day at work, but I managed to get through it.',
      'Feeling neutral today. Nothing special happened.',
      'Really struggling with my emotions today. Need to practice self-care.',
      'Had a wonderful conversation with a friend. It lifted my spirits.',
      'Feeling overwhelmed by everything. Taking deep breaths helps.',
      'Today I focused on gratitude. It made me feel better.',
    ];

    const journalEntries = [];

    for (let i = 7; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(10 + Math.floor(Math.random() * 8), 0, 0, 0); // Random time during day

      const content = journalTemplates[Math.floor(Math.random() * journalTemplates.length)];
      const sentiment = analyzeSentiment(content);

      const entry = await JournalEntry.create({
        user: user._id,
        content: content,
        sentimentScore: sentiment.score,
        sentimentLabel: sentiment.label,
        createdAt: date,
      });

      journalEntries.push(entry);
    }

    console.log(`Created ${journalEntries.length} journal entries`);

    console.log('\n✅ Seed data created successfully!');
    console.log(`\nTest user credentials:`);
    console.log(`Email: ${user.email}`);
    console.log(`Password: password123`);
    console.log('\nYou can now login with these credentials.');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();

