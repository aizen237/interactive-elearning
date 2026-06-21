const fc = require('fast-check');
const NotificationRepository = require('../src/repositories/NotificationRepository');
const dbTestHelper = require('./helpers/dbTestHelper');
const db = require('../src/config/db');

/**
 * Property-Based Tests for Notification Cleanup
 * Uses fast-check library with 5 iterations for faster execution
 */

describe('Notification Cleanup Property Tests', () => {
  afterAll(async () => {
    // Final cleanup after all tests
    await dbTestHelper.cleanup();
    await db.end();
  });

  /**
   * Property 13: Notification Retention
   * **Validates: Requirements 11.2**
   * 
   * For any notification, it SHALL be retained in the database for at least 90 days,
   * and notifications older than 90 days MAY be deleted by the cleanup process.
   */
  describe('Property 13: Notification Retention', () => {
    it('should retain notifications for at least 90 days and delete older ones', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10 }), // Number of recent notifications
          fc.integer({ min: 1, max: 10 }), // Number of old notifications
          async (recentCount, oldCount) => {
            // Setup: Create test user with unique ID
            const userId = 20000 + Math.floor(Math.random() * 100000);
            await dbTestHelper.createTestUser(userId);

            // Create recent notifications (within 90 days)
            const recentIds = [];
            for (let i = 0; i < recentCount; i++) {
              const id = await NotificationRepository.create({
                user_id: userId,
                notification_type: 'badge_earned',
                title: `Recent Badge ${i}`,
                message: `Recent notification ${i}`
              });
              recentIds.push(id);
            }

            // Create old notifications (older than 90 days) using direct SQL
            const oldIds = [];
            for (let i = 0; i < oldCount; i++) {
              const [result] = await db.execute(
                `INSERT INTO notifications (user_id, notification_type, title, message, is_read, created_at)
                 VALUES (?, 'level_up', ?, ?, FALSE, DATE_SUB(NOW(), INTERVAL ? DAY))`,
                [userId, `Old Level ${i}`, `Old notification ${i}`, 91 + i]
              );
              oldIds.push(result.insertId);
            }

            // Verify: All notifications exist before cleanup
            const beforeCleanup = await dbTestHelper.getNotificationsByUser(userId);
            expect(beforeCleanup.length).toBe(recentCount + oldCount);

            // Test: Run cleanup with 90-day retention
            const deletedCount = await NotificationRepository.deleteOldNotifications(90);
            expect(deletedCount).toBeGreaterThanOrEqual(oldCount);

            // Verify: Recent notifications are retained
            const afterCleanup = await dbTestHelper.getNotificationsByUser(userId);
            expect(afterCleanup.length).toBe(recentCount);

            // Verify: All retained notifications are recent ones
            const retainedIds = afterCleanup.map(n => n.id);
            recentIds.forEach(id => {
              expect(retainedIds).toContain(id);
            });

            // Verify: Old notifications are deleted
            oldIds.forEach(id => {
              expect(retainedIds).not.toContain(id);
            });

            // Cleanup this iteration's data
            await db.execute('DELETE FROM notifications WHERE user_id = ?', [userId]);
            await db.execute('DELETE FROM users WHERE id = ?', [userId]);
          }
        ),
        { numRuns: 5 }
      );
    }, 30000); // 30 second timeout for property test

    it('should not delete notifications within 90 days', async () => {
      // Setup: Create test user
      const userId = 20001;
      await dbTestHelper.createTestUser(userId);

      // Create notification 89 days old (should be retained)
      await db.execute(
        `INSERT INTO notifications (user_id, notification_type, title, message, is_read, created_at)
         VALUES (?, 'badge_earned', '89 days old', 'Should be retained', FALSE, DATE_SUB(NOW(), INTERVAL 89 DAY))`,
        [userId]
      );

      // Create notification 91 days old (should be deleted)
      await db.execute(
        `INSERT INTO notifications (user_id, notification_type, title, message, is_read, created_at)
         VALUES (?, 'level_up', '91 days old', 'Should be deleted', FALSE, DATE_SUB(NOW(), INTERVAL 91 DAY))`,
        [userId]
      );

      // Test: Run cleanup
      const deletedCount = await NotificationRepository.deleteOldNotifications(90);
      expect(deletedCount).toBeGreaterThanOrEqual(1);

      // Verify: 89-day old notification is retained
      const notifications = await dbTestHelper.getNotificationsByUser(userId);
      expect(notifications.length).toBe(1);
      expect(notifications[0].title).toBe('89 days old');

      // Cleanup
      await db.execute('DELETE FROM notifications WHERE user_id = ?', [userId]);
      await db.execute('DELETE FROM users WHERE id = ?', [userId]);
    });

    it('should handle cleanup when no old notifications exist', async () => {
      // Setup: Create test user
      const userId = 20002;
      await dbTestHelper.createTestUser(userId);

      // Create only recent notifications
      await NotificationRepository.create({
        user_id: userId,
        notification_type: 'streak_reminder',
        title: 'Recent Streak',
        message: 'Keep going!'
      });

      // Test: Run cleanup
      const deletedCount = await NotificationRepository.deleteOldNotifications(90);
      
      // Verify: No notifications deleted (or at least not this user's)
      const notifications = await dbTestHelper.getNotificationsByUser(userId);
      expect(notifications.length).toBe(1);

      // Cleanup
      await db.execute('DELETE FROM notifications WHERE user_id = ?', [userId]);
      await db.execute('DELETE FROM users WHERE id = ?', [userId]);
    });

    it('should work with different retention periods', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 30, max: 180 }), // Retention period in days
          async (retentionDays) => {
            // Setup: Create test user
            const userId = 20100 + Math.floor(Math.random() * 100000);
            await dbTestHelper.createTestUser(userId);

            // Create notification older than retention period
            await db.execute(
              `INSERT INTO notifications (user_id, notification_type, title, message, is_read, created_at)
               VALUES (?, 'badge_earned', 'Old', 'Should be deleted', FALSE, DATE_SUB(NOW(), INTERVAL ? DAY))`,
              [userId, retentionDays + 1]
            );

            // Create notification within retention period
            await db.execute(
              `INSERT INTO notifications (user_id, notification_type, title, message, is_read, created_at)
               VALUES (?, 'level_up', 'Recent', 'Should be retained', FALSE, DATE_SUB(NOW(), INTERVAL ? DAY))`,
              [userId, retentionDays - 1]
            );

            // Test: Run cleanup with custom retention period
            await NotificationRepository.deleteOldNotifications(retentionDays);

            // Verify: Only recent notification is retained
            const notifications = await dbTestHelper.getNotificationsByUser(userId);
            expect(notifications.length).toBe(1);
            expect(notifications[0].title).toBe('Recent');

            // Cleanup this iteration's data
            await db.execute('DELETE FROM notifications WHERE user_id = ?', [userId]);
            await db.execute('DELETE FROM users WHERE id = ?', [userId]);
          }
        ),
        { numRuns: 5 }
      );
    }, 30000);
  });
});
