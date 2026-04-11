import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { startCleanupJob } from './scripts/cleanupExpiredPosts.js';
import app from './app.js';

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Start cleanup cron job for expired anonymous posts
startCleanupJob();

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

