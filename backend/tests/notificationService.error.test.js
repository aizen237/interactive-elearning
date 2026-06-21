const NotificationService = require('../src/services/NotificationService');
const NotificationRepository = require('../src/repositories/NotificationRepository');
const NotificationPreferencesService = require('../src/services/NotificationPreferencesService');
const dbTestHelper = require('./helpers/dbTestHelper');
const db = require('../src/config/db');

/**
 * Error Handling Tests for NotificationService and NotificationRepository
 * Tests validation, database errors, and edge cases
 * **Validates: Requirements 9.4**
 */

describe('NotificationService and Repository Error Handling Tests', () => {
  beforeEach(async () => {
    await dbTestHelper.cleanup();
  });

  afterEach(async () => {
    await dbTestHelper.cleanup();
  });

  afterAll(async () => {
    await dbTestHelper.cleanup();
  });

  describe('NotificationRepository.create - Validation Errors', () => {
    it('should throw error when creating notification with missing user_id', async () => {
      await expect(
        NotificationRepository.create({
          notification_type: 'badge_earned',
          title: 'Test',
          message: 'Test message',
          metadata: {}
        })
      ).rejects.toThrow();
    });

    it('should throw error when creating notification with missing title', async () => {
      const userId = 40001;
      await dbTestHelper.createTestUser(userId, 'Student');

      await expect(
        NotificationRepository.create({
          user_id: userId,
          notification_type: 'badge_earned',
          message: 'Test message',
          metadata: {}
        })
      ).rejects.toThrow();
    });

    it('should throw error when creating notification with missing message', async () => {
      const userId = 40002;
      await dbTestHelper.createTestUser(userId, 'Student');

      await expect(
        NotificationRepository.create({
          user_id: userId,
          notification_type: 'badge_earned',
          title: 'Test',
          metadata: {}
        })
      ).rejects.toThrow();
    });

    it('should throw error when creating notification for non-existent user', async () => {
      const nonExistentUserId = 999999;

      await expect(
        NotificationRepository.create({
          user_id: nonExistentUserId,
          notification_type: 'badge_earned',
          title: 'Test',
          message: 'Test message',
          metadata: {}
        })
      ).rejects.toThrow();
    });
  });

  describe('NotificationService - Graceful Error Handling', () => {
    it('should handle missing parent gracefully when notifying parents', async () => {
      // Setup: Create student with no parent
      const studentId = 40003;
      await dbTestHelper.createTestUser(studentId, 'Student');
      await NotificationPreferencesService.createDefaultPreferences(studentId);

      // Test: Should not throw error when student has no parents
      await expect(
        NotificationService.notifyParentsQuizComplete(
          studentId,
          'Test Student',
          'Test Quiz',
          85
        )
      ).resolves.not.toThrow();

      // Verify: No parent notifications created
      const notifications = await dbTestHelper.getNotificationsByUser(studentId);
      expect(notifications.length).toBe(0);
    });

    it('should handle missing preferences gracefully by creating defaults', async () => {
      // Setup: Create user without preferences
      const userId = 40004;
      await dbTestHelper.createTestUser(userId, 'Student');
      // Don't create preferences

      const badge = {
        name: 'Test Badge',
        icon_url: '/test.png'
      };

      // Test: Should create notification even without existing preferences
      await NotificationService.notifyBadgeEarned(userId, badge);

      // Verify: Notification was created (preferences were auto-created)
      const notifications = await dbTestHelper.getNotificationsByUser(userId);
      expect(notifications.length).toBe(1);
    });

    it('should handle invalid badge data gracefully', async () => {
      const studentId = 40005;
      await dbTestHelper.createTestUser(studentId, 'Student');
      await NotificationPreferencesService.createDefaultPreferences(studentId);

      // Test: Badge with missing fields
      const incompleteBadge = {
        name: 'Test Badge'
        // Missing icon_url
      };

      // Should not throw error
      await expect(
        NotificationService.notifyBadgeEarned(studentId, incompleteBadge)
      ).resolves.not.toThrow();

      // Verify: Notification was created with available data
      const notifications = await dbTestHelper.getNotificationsByUser(studentId);
      expect(notifications.length).toBe(1);
      expect(notifications[0].metadata.badge.name).toBe('Test Badge');
    });

    it('should handle empty unlocked modules array in level up', async () => {
      const studentId = 40006;
      await dbTestHelper.createTestUser(studentId, 'Student');
      await NotificationPreferencesService.createDefaultPreferences(studentId);

      // Test: Level up with no unlocked modules
      await NotificationService.notifyLevelUp(studentId, 5, []);

      // Verify: Notification created without module list
      const notifications = await dbTestHelper.getNotificationsByUser(studentId);
      expect(notifications.length).toBe(1);
      expect(notifications[0].message).not.toContain('unlocked');
    });
  });

  describe('NotificationRepository - Edge Cases', () => {
    it('should handle pagination with no notifications', async () => {
      const userId = 40007;
      await dbTestHelper.createTestUser(userId, 'Student');

      const result = await NotificationRepository.getByUser(userId, 1, 20);

      expect(result.notifications).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should return true when marking notification as read even if already read', async () => {
      const userId = 40008;
      await dbTestHelper.createTestUser(userId, 'Student');

      const notificationId = await NotificationRepository.create({
        user_id: userId,
        notification_type: 'badge_earned',
        title: 'Test',
        message: 'Test message',
        metadata: {}
      });

      // Mark as read first time
      const firstResult = await NotificationRepository.markAsRead(notificationId, userId);
      expect(firstResult).toBe(true);

      // Mark as read second time (already read)
      // MySQL UPDATE still returns affectedRows > 0 even if value doesn't change
      const secondResult = await NotificationRepository.markAsRead(notificationId, userId);
      expect(secondResult).toBe(true);
    });

    it('should handle marking all as read when no unread notifications', async () => {
      const userId = 40009;
      await dbTestHelper.createTestUser(userId, 'Student');

      // Create notification and mark it as read
      const notificationId = await NotificationRepository.create({
        user_id: userId,
        notification_type: 'badge_earned',
        title: 'Test',
        message: 'Test message',
        metadata: {}
      });
      await NotificationRepository.markAsRead(notificationId, userId);

      // Try to mark all as read when all are already read
      const updated = await NotificationRepository.markAllAsRead(userId);
      expect(updated).toBe(0);
    });

    it('should handle getUnreadCount for user with no notifications', async () => {
      const userId = 40010;
      await dbTestHelper.createTestUser(userId, 'Student');

      const count = await NotificationRepository.getUnreadCount(userId);
      expect(count).toBe(0);
    });

    it('should handle deleteOldNotifications when no old notifications exist', async () => {
      const deleted = await NotificationRepository.deleteOldNotifications(90);
      expect(deleted).toBeGreaterThanOrEqual(0);
    });
  });

  describe('NotificationPreferencesService - Error Handling', () => {
    it('should handle getPreferences for user without preferences', async () => {
      const userId = 40011;
      await dbTestHelper.createTestUser(userId, 'Student');

      // Get preferences without creating them first
      const preferences = await NotificationPreferencesService.getPreferences(userId);

      // Should return default preferences
      expect(preferences).toBeDefined();
      expect(preferences.badge_earned).toBe(true);
      expect(preferences.level_up).toBe(true);
    });

    it('should throw error when updatePreferences called with empty updates object', async () => {
      const userId = 40012;
      await dbTestHelper.createTestUser(userId, 'Student');
      await NotificationPreferencesService.createDefaultPreferences(userId);

      // Update with empty object should throw error
      await expect(
        NotificationPreferencesService.updatePreferences(userId, {})
      ).rejects.toThrow('No valid preference fields to update');
    });

    it('should handle isNotificationEnabled for user without preferences', async () => {
      const userId = 40013;
      await dbTestHelper.createTestUser(userId, 'Student');

      // Check if notification is enabled without creating preferences first
      const isEnabled = await NotificationPreferencesService.isNotificationEnabled(
        userId,
        'badge_earned'
      );

      // Should return true (default)
      expect(isEnabled).toBe(true);
    });

    it('should handle createDefaultPreferences idempotently for user that already has preferences', async () => {
      const userId = 40014;
      await dbTestHelper.createTestUser(userId, 'Student');
      await NotificationPreferencesService.createDefaultPreferences(userId);

      // Try to create defaults again - should handle gracefully
      await NotificationPreferencesService.createDefaultPreferences(userId);

      // Verify preferences still exist
      const preferences = await NotificationPreferencesService.getPreferences(userId);
      expect(preferences).toBeDefined();
      expect(preferences.badge_earned).toBe(true);
    });
  });

  describe('Database Connection Errors', () => {
    it('should propagate database errors when connection fails', async () => {
      // Mock database execute to simulate connection failure
      const originalExecute = db.execute;
      db.execute = jest.fn().mockRejectedValue(new Error('Connection lost'));

      const userId = 40015;

      await expect(
        NotificationRepository.create({
          user_id: userId,
          notification_type: 'badge_earned',
          title: 'Test',
          message: 'Test message',
          metadata: {}
        })
      ).rejects.toThrow('Connection lost');

      // Restore original function
      db.execute = originalExecute;
    });
  });

  describe('Metadata Handling', () => {
    it('should handle null metadata gracefully', async () => {
      const userId = 40016;
      await dbTestHelper.createTestUser(userId, 'Student');

      const notificationId = await NotificationRepository.create({
        user_id: userId,
        notification_type: 'badge_earned',
        title: 'Test',
        message: 'Test message',
        metadata: null
      });

      const result = await NotificationRepository.getByUser(userId, 1, 20);
      expect(result.notifications[0].metadata).toBeNull();
    });

    it('should handle complex nested metadata', async () => {
      const userId = 40017;
      await dbTestHelper.createTestUser(userId, 'Student');

      const complexMetadata = {
        badge: {
          name: 'Test Badge',
          icon_url: '/test.png',
          nested: {
            level: 5,
            details: {
              earned_at: new Date().toISOString()
            }
          }
        }
      };

      const notificationId = await NotificationRepository.create({
        user_id: userId,
        notification_type: 'badge_earned',
        title: 'Test',
        message: 'Test message',
        metadata: complexMetadata
      });

      const result = await NotificationRepository.getByUser(userId, 1, 20);
      expect(result.notifications[0].metadata).toEqual(complexMetadata);
    });
  });
});
