const request = require('supertest');
const express = require('express');
const notificationRoutes = require('../src/routes/notificationRoutes');
const NotificationRepository = require('../src/repositories/NotificationRepository');
const NotificationPreferencesService = require('../src/services/NotificationPreferencesService');
const dbTestHelper = require('./helpers/dbTestHelper');
const jwt = require('jsonwebtoken');

/**
 * Error Handling Tests for Notification Controller
 * Tests validation, authorization, and error scenarios
 * **Validates: Requirements 9.4**
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

describe('Notification Controller Error Handling Tests', () => {
  beforeEach(async () => {
    await dbTestHelper.cleanup();
  });

  afterEach(async () => {
    await dbTestHelper.cleanup();
  });

  afterAll(async () => {
    await dbTestHelper.cleanup();
  });

  describe('GET /api/notifications - Validation Errors', () => {
    it('should return 400 for invalid page parameter (page < 1)', async () => {
      const userId = 30000;
      await dbTestHelper.createTestUser(userId, 'Student');
      const token = generateToken(userId);

      const response = await request(app)
        .get('/api/notifications?page=0')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid pagination parameters');
    });

    it('should return 400 for invalid limit parameter (limit < 1)', async () => {
      const userId = 30001;
      await dbTestHelper.createTestUser(userId, 'Student');
      const token = generateToken(userId);

      const response = await request(app)
        .get('/api/notifications?limit=0')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid pagination parameters');
    });

    it('should return 400 for limit exceeding maximum (limit > 100)', async () => {
      const userId = 30002;
      await dbTestHelper.createTestUser(userId, 'Student');
      const token = generateToken(userId);

      const response = await request(app)
        .get('/api/notifications?limit=101')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid pagination parameters');
    });
  });

  describe('PUT /api/notifications/:id/read - Validation Errors', () => {
    it('should return 400 for invalid notification ID (non-numeric)', async () => {
      const userId = 30003;
      await dbTestHelper.createTestUser(userId, 'Student');
      const token = generateToken(userId);

      const response = await request(app)
        .put('/api/notifications/invalid/read')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid notification ID');
    });

    it('should return 400 for invalid notification ID (negative)', async () => {
      const userId = 30004;
      await dbTestHelper.createTestUser(userId, 'Student');
      const token = generateToken(userId);

      const response = await request(app)
        .put('/api/notifications/-1/read')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid notification ID');
    });

    it('should return 400 for invalid notification ID (zero)', async () => {
      const userId = 30005;
      await dbTestHelper.createTestUser(userId, 'Student');
      const token = generateToken(userId);

      const response = await request(app)
        .put('/api/notifications/0/read')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid notification ID');
    });
  });

  describe('PUT /api/notifications/:id/read - Authorization Errors', () => {
    it('should return 403 when user attempts to mark another user\'s notification as read', async () => {
      // Setup: Create two users
      const user1Id = 30006;
      const user2Id = 30007;
      await dbTestHelper.createTestUser(user1Id, 'Student');
      await dbTestHelper.createTestUser(user2Id, 'Student');
      await NotificationPreferencesService.createDefaultPreferences(user1Id);

      // Create notification for user1
      const notificationId = await NotificationRepository.create({
        user_id: user1Id,
        notification_type: 'badge_earned',
        title: 'Test Notification',
        message: 'Test message',
        metadata: {}
      });

      // Test: user2 attempts to mark user1's notification as read
      const token = generateToken(user2Id);
      const response = await request(app)
        .put(`/api/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Not authorized to modify this notification');

      // Verify: Notification remains unread
      const notifications = await dbTestHelper.getNotificationsByUser(user1Id);
      expect(notifications[0].is_read).toBe(0);
    });

    it('should return 403 when marking non-existent notification as read', async () => {
      const userId = 30008;
      await dbTestHelper.createTestUser(userId, 'Student');
      const token = generateToken(userId);

      const nonExistentId = 999999;
      const response = await request(app)
        .put(`/api/notifications/${nonExistentId}/read`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Not authorized to modify this notification');
    });
  });

  describe('PUT /api/notifications/preferences - Validation Errors', () => {
    it('should return 400 when no valid preference fields provided', async () => {
      const userId = 30009;
      await dbTestHelper.createTestUser(userId, 'Student');
      await NotificationPreferencesService.createDefaultPreferences(userId);
      const token = generateToken(userId);

      const response = await request(app)
        .put('/api/notifications/preferences')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No valid preference fields provided');
    });

    it('should return 400 when preference field has non-boolean value', async () => {
      const userId = 30010;
      await dbTestHelper.createTestUser(userId, 'Student');
      await NotificationPreferencesService.createDefaultPreferences(userId);
      const token = generateToken(userId);

      const response = await request(app)
        .put('/api/notifications/preferences')
        .set('Authorization', `Bearer ${token}`)
        .send({ badge_earned: 'yes' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid value for badge_earned');
      expect(response.body.message).toContain('Must be a boolean');
    });

    it('should return 400 when preference field has numeric value', async () => {
      const userId = 30011;
      await dbTestHelper.createTestUser(userId, 'Student');
      await NotificationPreferencesService.createDefaultPreferences(userId);
      const token = generateToken(userId);

      const response = await request(app)
        .put('/api/notifications/preferences')
        .set('Authorization', `Bearer ${token}`)
        .send({ level_up: 1 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid value for level_up');
      expect(response.body.message).toContain('Must be a boolean');
    });

    it('should return 400 when preference field has null value', async () => {
      const userId = 30012;
      await dbTestHelper.createTestUser(userId, 'Student');
      await NotificationPreferencesService.createDefaultPreferences(userId);
      const token = generateToken(userId);

      const response = await request(app)
        .put('/api/notifications/preferences')
        .set('Authorization', `Bearer ${token}`)
        .send({ streak_reminder: null })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid value for streak_reminder');
      expect(response.body.message).toContain('Must be a boolean');
    });

    it('should ignore invalid field names and process valid ones', async () => {
      const userId = 30013;
      await dbTestHelper.createTestUser(userId, 'Student');
      await NotificationPreferencesService.createDefaultPreferences(userId);
      const token = generateToken(userId);

      const response = await request(app)
        .put('/api/notifications/preferences')
        .set('Authorization', `Bearer ${token}`)
        .send({
          badge_earned: false,
          invalid_field: true
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.preferences.badge_earned).toBe(false);
    });
  });

  describe('Authentication Errors', () => {
    it('should return 401 when no token provided', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 when invalid token provided', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Error Logging', () => {
    it('should log errors with context when database operations fail', async () => {
      const userId = 30014;
      await dbTestHelper.createTestUser(userId, 'Student');
      const token = generateToken(userId);

      // Spy on console.error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Force an error by using an invalid user ID in the repository
      // This test verifies error logging happens
      const originalGetByUser = NotificationRepository.getByUser;
      NotificationRepository.getByUser = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${token}`)
        .expect(500);

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('Error in getNotifications');

      // Restore original function
      NotificationRepository.getByUser = originalGetByUser;
      consoleErrorSpy.mockRestore();
    });
  });
});
