const request = require('supertest');
const express = require('express');
const notificationRoutes = require('../src/routes/notificationRoutes');
const NotificationRepository = require('../src/repositories/NotificationRepository');
const NotificationPreferencesService = require('../src/services/NotificationPreferencesService');
const dbTestHelper = require('./helpers/dbTestHelper');
const jwt = require('jsonwebtoken');

/**
 * Integration Tests for Notification API Endpoints
 * Tests the complete HTTP request/response cycle for notification endpoints
 */

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/notifications', notificationRoutes);

// Helper function to generate JWT token for testing
function generateToken(userId, role = 'Student') {
  return jwt.sign(
    { id: userId, role: role },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
}

describe('Notification API Integration Tests', () => {
  beforeEach(async () => {
    await dbTestHelper.cleanup();
  });

  afterEach(async () => {
    await dbTestHelper.cleanup();
  });

  afterAll(async () => {
    await dbTestHelper.cleanup();
  });

  describe('GET /api/notifications', () => {
    it('should return user notifications with pagination', async () => {
      // Setup: Create user and notifications
      const userId = 20000;
      await dbTestHelper.createTestUser(userId, 'Student');
      await NotificationPreferencesService.createDefaultPreferences(userId);

      // Create 5 test notifications
      for (let i = 0; i < 5; i++) {
        await NotificationRepository.create({
          user_id: userId,
          notification_type: 'badge_earned',
          title: `Test Notification ${i}`,
          message: `Test message ${i}`,
          metadata: { test: true }
        });
      }

      const token = generateToken(userId);

      // Test: Get notifications
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verify: Response structure and data
      expect(response.body.success).toBe(true);
      expect(response.body.data.notifications).toHaveLength(5);
      expect(response.body.data.total).toBe(5);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.totalPages).toBe(1);
      
      // Verify notifications are ordered by created_at DESC
      const timestamps = response.body.data.notifications.map(n => new Date(n.created_at).getTime());
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i - 1]).toBeGreaterThanOrEqual(timestamps[i]);
      }
    });

    it('should support pagination with custom page and limit', async () => {
      // Setup: Create user and 25 notifications
      const userId = 20001;
      await dbTestHelper.createTestUser(userId, 'Student');
      await NotificationPreferencesService.createDefaultPreferences(userId);

      for (let i = 0; i < 25; i++) {
        await NotificationRepository.create({
          user_id: userId,
          notification_type: 'level_up',
          title: `Notification ${i}`,
          message: `Message ${i}`,
          metadata: {}
        });
      }

      const token = generateToken(userId);

      // Test: Get page 2 with limit 10
      const response = await request(app)
        .get('/api/notifications?page=2&limit=10')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verify: Pagination works correctly
      expect(response.body.data.notifications).toHaveLength(10);
      expect(response.body.data.total).toBe(25);
      expect(response.body.data.page).toBe(2);
      expect(response.body.data.totalPages).toBe(3);
    });

    it('should return 400 for invalid pagination parameters', async () => {
      // Setup
      const userId = 20002;
      await dbTestHelper.createTestUser(userId, 'Student');
      const token = generateToken(userId);

      // Test: Invalid page (negative)
      let response = await request(app)
        .get('/api/notifications?page=-1')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid pagination parameters');

      // Test: Invalid limit (too large)
      response = await request(app)
        .get('/api/notifications?limit=200')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication token', async () => {
      // Test: Request without token
      const response = await request(app)
        .get('/api/notifications')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Not authorized');
    });

    it('should return empty array for user with no notifications', async () => {
      // Setup: User with no notifications
      const userId = 20003;
      await dbTestHelper.createTestUser(userId, 'Student');
      const token = generateToken(userId);

      // Test: Get notifications
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verify: Empty array returned
      expect(response.body.data.notifications).toHaveLength(0);
      expect(response.body.data.total).toBe(0);
    });
  });

  describe('GET /api/notifications/unread-count', () => {
    it('should return unread notification count', async () => {
      // Setup: Create user and notifications (some read, some unread)
      const userId = 20100;
      await dbTestHelper.createTestUser(userId, 'Student');
      await NotificationPreferencesService.createDefaultPreferences(userId);

      // Create 3 unread notifications
      for (let i = 0; i < 3; i++) {
        await NotificationRepository.create({
          user_id: userId,
          notification_type: 'badge_earned',
          title: `Unread ${i}`,
          message: `Message ${i}`,
          metadata: {}
        });
      }

      // Create 2 read notifications
      for (let i = 0; i < 2; i++) {
        const notifId = await NotificationRepository.create({
          user_id: userId,
          notification_type: 'level_up',
          title: `Read ${i}`,
          message: `Message ${i}`,
          metadata: {}
        });
        await NotificationRepository.markAsRead(notifId, userId);
      }

      const token = generateToken(userId);

      // Test: Get unread count
      const response = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verify: Count is correct
      expect(response.body.success).toBe(true);
      expect(response.body.data.count).toBe(3);
    });

    it('should return 0 for user with no unread notifications', async () => {
      // Setup: User with all notifications read
      const userId = 20101;
      await dbTestHelper.createTestUser(userId, 'Student');
      const token = generateToken(userId);

      // Test: Get unread count
      const response = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verify: Count is 0
      expect(response.body.data.count).toBe(0);
    });

    it('should return 401 without authentication token', async () => {
      // Test: Request without token
      const response = await request(app)
        .get('/api/notifications/unread-count')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/notifications/:id/read', () => {
    it('should mark notification as read when user owns it', async () => {
      // Setup: Create user and notification
      const userId = 20200;
      await dbTestHelper.createTestUser(userId, 'Student');
      await NotificationPreferencesService.createDefaultPreferences(userId);

      const notifId = await NotificationRepository.create({
        user_id: userId,
        notification_type: 'badge_earned',
        title: 'Test',
        message: 'Test message',
        metadata: {}
      });

      const token = generateToken(userId);

      // Test: Mark as read
      const response = await request(app)
        .put(`/api/notifications/${notifId}/read`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verify: Response indicates success
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('marked as read');

      // Verify: Notification is actually marked as read in database
      const notifications = await dbTestHelper.getNotificationsByUser(userId);
      expect(notifications[0].is_read).toBe(1);
    });

    it('should return 403 when user tries to mark another users notification as read', async () => {
      // Setup: Create two users and notification for user1
      const user1Id = 20201;
      const user2Id = 20202;
      await dbTestHelper.createTestUser(user1Id, 'Student');
      await dbTestHelper.createTestUser(user2Id, 'Student');
      await NotificationPreferencesService.createDefaultPreferences(user1Id);

      const notifId = await NotificationRepository.create({
        user_id: user1Id,
        notification_type: 'badge_earned',
        title: 'Test',
        message: 'Test message',
        metadata: {}
      });

      // Test: User2 tries to mark user1's notification as read
      const token = generateToken(user2Id);
      const response = await request(app)
        .put(`/api/notifications/${notifId}/read`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      // Verify: Authorization error
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Not authorized');

      // Verify: Notification is still unread
      const notifications = await dbTestHelper.getNotificationsByUser(user1Id);
      expect(notifications[0].is_read).toBe(0);
    });

    it('should return 400 for invalid notification ID', async () => {
      // Setup
      const userId = 20203;
      await dbTestHelper.createTestUser(userId, 'Student');
      const token = generateToken(userId);

      // Test: Invalid ID
      const response = await request(app)
        .put('/api/notifications/invalid/read')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid notification ID');
    });

    it('should return 401 without authentication token', async () => {
      // Test: Request without token
      const response = await request(app)
        .put('/api/notifications/1/read')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/notifications/mark-all-read', () => {
    it('should mark all user notifications as read', async () => {
      // Setup: Create user and multiple unread notifications
      const userId = 20300;
      await dbTestHelper.createTestUser(userId, 'Student');
      await NotificationPreferencesService.createDefaultPreferences(userId);

      // Create 5 unread notifications
      for (let i = 0; i < 5; i++) {
        await NotificationRepository.create({
          user_id: userId,
          notification_type: 'badge_earned',
          title: `Test ${i}`,
          message: `Message ${i}`,
          metadata: {}
        });
      }

      const token = generateToken(userId);

      // Test: Mark all as read
      const response = await request(app)
        .put('/api/notifications/mark-all-read')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verify: Response indicates success
      expect(response.body.success).toBe(true);
      expect(response.body.data.updated).toBe(5);
      expect(response.body.message).toContain('5 notification(s) marked as read');

      // Verify: All notifications are marked as read in database
      const notifications = await dbTestHelper.getNotificationsByUser(userId);
      expect(notifications.every(n => n.is_read === 1)).toBe(true);
    });

    it('should return 0 updated when user has no unread notifications', async () => {
      // Setup: User with no notifications
      const userId = 20301;
      await dbTestHelper.createTestUser(userId, 'Student');
      const token = generateToken(userId);

      // Test: Mark all as read
      const response = await request(app)
        .put('/api/notifications/mark-all-read')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verify: 0 updated
      expect(response.body.data.updated).toBe(0);
    });

    it('should only mark current users notifications as read', async () => {
      // Setup: Create two users with notifications
      const user1Id = 20302;
      const user2Id = 20303;
      await dbTestHelper.createTestUser(user1Id, 'Student');
      await dbTestHelper.createTestUser(user2Id, 'Student');
      await NotificationPreferencesService.createDefaultPreferences(user1Id);
      await NotificationPreferencesService.createDefaultPreferences(user2Id);

      // Create notifications for both users
      await NotificationRepository.create({
        user_id: user1Id,
        notification_type: 'badge_earned',
        title: 'User1 Notif',
        message: 'Message',
        metadata: {}
      });

      await NotificationRepository.create({
        user_id: user2Id,
        notification_type: 'badge_earned',
        title: 'User2 Notif',
        message: 'Message',
        metadata: {}
      });

      // Test: User1 marks all as read
      const token = generateToken(user1Id);
      await request(app)
        .put('/api/notifications/mark-all-read')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verify: Only user1's notifications are marked as read
      const user1Notifs = await dbTestHelper.getNotificationsByUser(user1Id);
      const user2Notifs = await dbTestHelper.getNotificationsByUser(user2Id);
      
      expect(user1Notifs[0].is_read).toBe(1);
      expect(user2Notifs[0].is_read).toBe(0);
    });

    it('should return 401 without authentication token', async () => {
      // Test: Request without token
      const response = await request(app)
        .put('/api/notifications/mark-all-read')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/notifications/preferences', () => {
    it('should return user notification preferences', async () => {
      // Setup: Create user with default preferences
      const userId = 20400;
      await dbTestHelper.createTestUser(userId, 'Student');
      await NotificationPreferencesService.createDefaultPreferences(userId);

      const token = generateToken(userId);

      // Test: Get preferences
      const response = await request(app)
        .get('/api/notifications/preferences')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verify: Preferences returned with all fields
      expect(response.body.success).toBe(true);
      expect(response.body.data.preferences).toHaveProperty('badge_earned');
      expect(response.body.data.preferences).toHaveProperty('level_up');
      expect(response.body.data.preferences).toHaveProperty('streak_reminder');
      expect(response.body.data.preferences).toHaveProperty('child_quiz_complete');
      expect(response.body.data.preferences).toHaveProperty('child_milestone');
      expect(response.body.data.preferences).toHaveProperty('admin_operation');
      expect(response.body.data.preferences).toHaveProperty('admin_security');
      
      // All should be enabled by default
      expect(response.body.data.preferences.badge_earned).toBe(true);
      expect(response.body.data.preferences.level_up).toBe(true);
    });

    it('should return 401 without authentication token', async () => {
      // Test: Request without token
      const response = await request(app)
        .get('/api/notifications/preferences')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/notifications/preferences', () => {
    it('should update user notification preferences', async () => {
      // Setup: Create user with default preferences
      const userId = 20500;
      await dbTestHelper.createTestUser(userId, 'Student');
      await NotificationPreferencesService.createDefaultPreferences(userId);

      const token = generateToken(userId);

      // Test: Update preferences
      const updates = {
        badge_earned: false,
        level_up: false,
        streak_reminder: true
      };

      const response = await request(app)
        .put('/api/notifications/preferences')
        .set('Authorization', `Bearer ${token}`)
        .send(updates)
        .expect(200);

      // Verify: Response indicates success
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('updated');
      expect(response.body.data.preferences.badge_earned).toBe(false);
      expect(response.body.data.preferences.level_up).toBe(false);
      expect(response.body.data.preferences.streak_reminder).toBe(true);

      // Verify: Preferences are actually updated in database
      const prefs = await NotificationPreferencesService.getPreferences(userId);
      expect(prefs.badge_earned).toBe(false);
      expect(prefs.level_up).toBe(false);
    });

    it('should return 400 when no valid preference fields provided', async () => {
      // Setup
      const userId = 20501;
      await dbTestHelper.createTestUser(userId, 'Student');
      await NotificationPreferencesService.createDefaultPreferences(userId);
      const token = generateToken(userId);

      // Test: Send empty object
      let response = await request(app)
        .put('/api/notifications/preferences')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No valid preference fields');

      // Test: Send invalid fields
      response = await request(app)
        .put('/api/notifications/preferences')
        .set('Authorization', `Bearer ${token}`)
        .send({ invalid_field: true })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 when preference value is not boolean', async () => {
      // Setup
      const userId = 20502;
      await dbTestHelper.createTestUser(userId, 'Student');
      await NotificationPreferencesService.createDefaultPreferences(userId);
      const token = generateToken(userId);

      // Test: Send non-boolean value
      const response = await request(app)
        .put('/api/notifications/preferences')
        .set('Authorization', `Bearer ${token}`)
        .send({ badge_earned: 'yes' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Must be a boolean');
    });

    it('should allow partial preference updates', async () => {
      // Setup
      const userId = 20503;
      await dbTestHelper.createTestUser(userId, 'Student');
      await NotificationPreferencesService.createDefaultPreferences(userId);
      const token = generateToken(userId);

      // Test: Update only one preference
      const response = await request(app)
        .put('/api/notifications/preferences')
        .set('Authorization', `Bearer ${token}`)
        .send({ badge_earned: false })
        .expect(200);

      // Verify: Only specified preference is updated
      expect(response.body.data.preferences.badge_earned).toBe(false);
      expect(response.body.data.preferences.level_up).toBe(true); // Still default
    });

    it('should return 401 without authentication token', async () => {
      // Test: Request without token
      const response = await request(app)
        .put('/api/notifications/preferences')
        .send({ badge_earned: false })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
