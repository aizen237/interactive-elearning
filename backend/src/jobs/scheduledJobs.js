// backend/src/jobs/scheduledJobs.js
const cron = require('node-cron');
const NotificationService = require('../services/NotificationService');
const NotificationRepository = require('../repositories/NotificationRepository');

/**
 * Initialize all scheduled jobs
 */
function initializeScheduledJobs() {
  // Daily streak reminder job - runs at 19:00 every day
  cron.schedule('0 19 * * *', async () => {
    try {
      console.log('[Scheduled Job] Starting daily streak reminders...');
      const reminderCount = await NotificationService.processDailyStreakReminders();
      console.log(`[Scheduled Job] Sent ${reminderCount} streak reminder notifications`);
    } catch (error) {
      console.error('[Scheduled Job] Error processing streak reminders:', error);
    }
  });

  // Daily notification cleanup job - runs at 02:00 every day
  cron.schedule('0 2 * * *', async () => {
    try {
      console.log('[Scheduled Job] Starting notification cleanup...');
      const deletedCount = await NotificationRepository.deleteOldNotifications(90);
      console.log(`[Scheduled Job] Deleted ${deletedCount} old notifications`);
    } catch (error) {
      console.error('[Scheduled Job] Error cleaning up notifications:', error);
    }
  });

  console.log('✅ Scheduled jobs initialized');
  console.log('   - Daily streak reminders: 19:00 every day');
  console.log('   - Daily notification cleanup: 02:00 every day');
}

module.exports = { initializeScheduledJobs };
