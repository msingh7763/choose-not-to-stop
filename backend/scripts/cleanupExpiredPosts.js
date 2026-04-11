import cron from 'node-cron';
import AnonymousPost from '../models/AnonymousPost.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Cron job to clean up expired anonymous posts
 * Runs every hour
 */
export const startCleanupJob = () => {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();
      
      // Delete posts that have expired
      const result = await AnonymousPost.deleteMany({
        expiresAt: { $lt: now },
      });

      if (result.deletedCount > 0) {
        console.log(`Cleaned up ${result.deletedCount} expired anonymous posts at ${now.toISOString()}`);
      }
    } catch (error) {
      console.error('Error cleaning up expired posts:', error);
    }
  });

  console.log('Cleanup job scheduled: runs every hour');
};

// Note: This script is typically imported and started from server.js
// If you need to run it standalone, uncomment the following:
/*
import { connectDB } from '../config/db.js';

connectDB().then(() => {
  startCleanupJob();
  console.log('Cleanup job started. Press Ctrl+C to stop.');
});
*/

