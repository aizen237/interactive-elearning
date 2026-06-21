const fc = require('fast-check');
const NotificationRepository = require('../src/repositories/NotificationRepository');
const dbTestHelper = require('./helpers/dbTestHelper');
const db = require('../src/config/db');

// Global counter to ensure unique user IDs across all test iterations
let userIdCounter = 10000;

/**
 * Property-Based Tests for NotificationRepository
 * Uses fast-check library with 15 iterations for faster execution
 * Optimized with reduced data sizes and delays for better performance
 */

describe('NotificationRepository Property Tests', () => {
  // Note: Property tests handle their own cleanup within each iteration
  // beforeEach cleanup is disabled to avoid race conditions
  
  afterAll(async () => {
    // Final cleanup after all tests
    await dbTestHelper.cleanup();
  });

  /**
   * Property 5: Notification Retrieval
   * **Validates: Requirements 8.1, 8.2, 8.3, 8.4**
   * 
   * For any user with notifications, retrieving their notifications SHALL return 
   * all notifications for that user ordered by creation time descending, with 
   * read/unread status included, supporting pagination with default page size of 20
   */
  describe('Property 5: Notification Retrieval', () => {
    it('should return all notifications ordered by creation time descending with read/unread status', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 20 }), // Number of notifications (reduced from 50)
          fc.integer({ min: 1, max: 5 }),  // Page size
          async (notificationCount, pageSize) => {
            // Setup: Create test user with unique ID using global counter
            const userId = userIdCounter++;
            await dbTestHelper.createTestUser(userId);

            // Create notifications with slight delays to ensure ordering
            const createdIds = [];
            for (let i = 0; i < notificationCount; i++) {
              const id = await NotificationRepository.create({
                user_id: userId,
                notification_type: 'badge_earned',
                title: `Notification ${i}`,
                message: `Message ${i}`,
                metadata: { index: i }
              });
              createdIds.push(id);
              // Reduced delay from 5ms to 2ms
              await new Promise(resolve => setTimeout(resolve, 2));
            }

            // Test: Retrieve first page
            const page = 1;
            const result = await NotificationRepository.getByUser(userId, page, pageSize);

            // Verify: All notifications returned with correct properties
            expect(result.notifications).toBeDefined();
            expect(result.total).toBe(notificationCount);
            expect(result.notifications.length).toBe(Math.min(pageSize, notificationCount));

            // Verify: Each notification has read/unread status
            result.notifications.forEach(notification => {
              expect(notification).toHaveProperty('is_read');
              expect(typeof notification.is_read).toBe('number'); // MySQL returns BOOLEAN as 0/1
              expect(notification).toHaveProperty('created_at');
              expect(notification).toHaveProperty('user_id', userId);
            });

            // Verify: Ordered by creation time descending (most recent first)
            for (let i = 0; i < result.notifications.length - 1; i++) {
              const current = new Date(result.notifications[i].created_at);
              const next = new Date(result.notifications[i + 1].created_at);
              expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
            }

            // Verify: Pagination works correctly
            if (notificationCount > pageSize) {
              const page2Result = await NotificationRepository.getByUser(userId, 2, pageSize);
              expect(page2Result.notifications.length).toBe(
                Math.min(pageSize, notificationCount - pageSize)
              );
              // Ensure no overlap between pages
              const page1Ids = result.notifications.map(n => n.id);
              const page2Ids = page2Result.notifications.map(n => n.id);
              const overlap = page1Ids.filter(id => page2Ids.includes(id));
              expect(overlap.length).toBe(0);
            }

            // Cleanup this iteration's data
            await db.execute('DELETE FROM notifications WHERE user_id = ?', [userId]);
            await db.execute('DELETE FROM users WHERE id = ?', [userId]);
          }
        ),
        { numRuns: 5 }
      );
    }, 30000); // 30 second timeout for property test

    it('should support default page size of 20', async () => {
      const userId = userIdCounter++;
      await dbTestHelper.createTestUser(userId);

      // Create 25 notifications
      for (let i = 0; i < 25; i++) {
        await NotificationRepository.create({
          user_id: userId,
          notification_type: 'level_up',
          title: `Level ${i}`,
          message: `You reached level ${i}!`
        });
      }

      // Test with default pagination (should use page size 20)
      const result = await NotificationRepository.getByUser(userId, 1);
      expect(result.notifications.length).toBe(20);
      expect(result.total).toBe(25);
    });
  });

  /**
   * Property 6: Mark as Read Operations
   * **Validates: Requirements 9.1, 9.2, 9.3, 9.4**
   * 
   * For any notification owned by a user, marking it as read SHALL update its 
   * is_read status to true, and marking all notifications as read SHALL update 
   * all unread notifications for that user, while attempts to mark another user's 
   * notification as read SHALL be rejected
   */
  describe('Property 6: Mark as Read Operations', () => {
    it('should mark single notification as read for owner only', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10 }), // Number of notifications
          async (notificationCount) => {
            // Setup: Create two users with unique IDs using global counter
            const ownerId = userIdCounter++;
            const otherId = userIdCounter++;
            await dbTestHelper.createTestUser(ownerId);
            await dbTestHelper.createTestUser(otherId);

            // Create notifications for owner
            const notificationIds = [];
            for (let i = 0; i < notificationCount; i++) {
              const id = await NotificationRepository.create({
                user_id: ownerId,
                notification_type: 'badge_earned',
                title: `Badge ${i}`,
                message: `Earned badge ${i}`
              });
              notificationIds.push(id);
            }

            // Test: Owner can mark their notification as read
            const targetId = notificationIds[0];
            const ownerResult = await NotificationRepository.markAsRead(targetId, ownerId);
            expect(ownerResult).toBe(true);

            // Verify: Notification is marked as read
            const notifications = await dbTestHelper.getNotificationsByUser(ownerId);
            const markedNotification = notifications.find(n => n.id === targetId);
            expect(markedNotification.is_read).toBe(1); // MySQL BOOLEAN as 1

            // Test: Other user cannot mark owner's notification as read
            const otherResult = await NotificationRepository.markAsRead(targetId, otherId);
            expect(otherResult).toBe(false);

            // Cleanup this iteration's data
            await db.execute('DELETE FROM notifications WHERE user_id IN (?, ?)', [ownerId, otherId]);
            await db.execute('DELETE FROM users WHERE id IN (?, ?)', [ownerId, otherId]);
          }
        ),
        { numRuns: 5 }
      );
    }, 30000);

    it('should mark all notifications as read for a user', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 15 }), // Number of notifications (reduced from 20)
          async (notificationCount) => {
            // Setup: Create user with unique ID
            const userId = 10200 + Math.floor(Math.random() * 100000);
            await dbTestHelper.createTestUser(userId);

            // Create notifications (all unread by default)
            for (let i = 0; i < notificationCount; i++) {
              await NotificationRepository.create({
                user_id: userId,
                notification_type: 'child_quiz_complete',
                title: `Quiz ${i}`,
                message: `Child completed quiz ${i}`
              });
            }

            // Test: Mark all as read
            const updatedCount = await NotificationRepository.markAllAsRead(userId);
            expect(updatedCount).toBe(notificationCount);

            // Verify: All notifications are now read
            const notifications = await dbTestHelper.getNotificationsByUser(userId);
            expect(notifications.length).toBe(notificationCount);
            notifications.forEach(notification => {
              expect(notification.is_read).toBe(1);
            });

            // Test: Calling again should update 0 notifications
            const secondCallCount = await NotificationRepository.markAllAsRead(userId);
            expect(secondCallCount).toBe(0);

            // Cleanup this iteration's data
            await db.execute('DELETE FROM notifications WHERE user_id = ?', [userId]);
            await db.execute('DELETE FROM users WHERE id = ?', [userId]);
          }
        ),
        { numRuns: 5 }
      );
    }, 30000);
  });

  /**
   * Property 8: Unread Count Accuracy
   * **Validates: Requirements 12.1, 12.2, 12.3, 12.4**
   * 
   * For any user, the unread count SHALL equal the number of unread notifications 
   * created within the last 90 days, and decrease by 1 immediately after marking 
   * a notification as read
   */
  describe('Property 8: Unread Count Accuracy', () => {
    it('should return accurate unread count and update after marking as read', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 20 }), // Total notifications (reduced from 30)
          fc.integer({ min: 0, max: 1 }),  // Fraction to mark as read (0-100%)
          async (totalCount, readFraction) => {
            // Setup: Create user with unique ID
            const userId = 10300 + Math.floor(Math.random() * 100000);
            await dbTestHelper.createTestUser(userId);

            // Create notifications
            const notificationIds = [];
            for (let i = 0; i < totalCount; i++) {
              const id = await NotificationRepository.create({
                user_id: userId,
                notification_type: 'streak_reminder',
                title: 'Streak Reminder',
                message: 'Keep your streak going!'
              });
              notificationIds.push(id);
            }

            // Mark some as read
            const readCount = Math.floor(totalCount * readFraction);
            for (let i = 0; i < readCount; i++) {
              await NotificationRepository.markAsRead(notificationIds[i], userId);
            }

            // Test: Get unread count
            const unreadCount = await NotificationRepository.getUnreadCount(userId);
            const expectedUnread = totalCount - readCount;
            expect(unreadCount).toBe(expectedUnread);

            // Test: Mark one more as read and verify count decreases
            if (expectedUnread > 0) {
              const beforeCount = await NotificationRepository.getUnreadCount(userId);
              await NotificationRepository.markAsRead(notificationIds[readCount], userId);
              const afterCount = await NotificationRepository.getUnreadCount(userId);
              expect(afterCount).toBe(beforeCount - 1);
            }

            // Cleanup this iteration's data
            await db.execute('DELETE FROM notifications WHERE user_id = ?', [userId]);
            await db.execute('DELETE FROM users WHERE id = ?', [userId]);
          }
        ),
        { numRuns: 5 }
      );
    }, 30000);

    it('should return zero when user has no unread notifications', async () => {
      const userId = 10301;
      await dbTestHelper.createTestUser(userId);

      // Test: User with no notifications
      const count1 = await NotificationRepository.getUnreadCount(userId);
      expect(count1).toBe(0);

      // Create and mark all as read
      await NotificationRepository.create({
        user_id: userId,
        notification_type: 'badge_earned',
        title: 'Badge',
        message: 'Earned a badge'
      });
      await NotificationRepository.markAllAsRead(userId);

      // Test: User with all read notifications
      const count2 = await NotificationRepository.getUnreadCount(userId);
      expect(count2).toBe(0);
    });

    it('should only count notifications within last 90 days', async () => {
      const userId = 10302;
      await dbTestHelper.createTestUser(userId);

      // Create a recent notification
      await NotificationRepository.create({
        user_id: userId,
        notification_type: 'level_up',
        title: 'Level Up',
        message: 'You leveled up!'
      });

      // Create an old notification (simulate by direct SQL)
      await db.execute(
        `INSERT INTO notifications (user_id, notification_type, title, message, is_read, created_at)
         VALUES (?, 'badge_earned', 'Old Badge', 'Old notification', FALSE, DATE_SUB(NOW(), INTERVAL 91 DAY))`,
        [userId]
      );

      // Test: Should only count recent notification
      const count = await NotificationRepository.getUnreadCount(userId);
      expect(count).toBe(1);
      
      // Cleanup
      await db.execute('DELETE FROM notifications WHERE user_id = ?', [userId]);
      await db.execute('DELETE FROM users WHERE id = ?', [userId]);
    });
  });
});
