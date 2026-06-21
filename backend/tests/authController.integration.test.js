const request = require('supertest');
const express = require('express');
const authRoutes = require('../src/routes/authRoutes');
const NotificationPreferencesService = require('../src/services/NotificationPreferencesService');
const dbTestHelper = require('./helpers/dbTestHelper');
const db = require('../src/config/db');

/**
 * Integration Tests for Auth Controller - New User Preference Creation
 * Tests that new users get default notification preferences
 * 
 * **Validates: Requirements 10.5**
 */

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Controller - New User Preference Creation', () => {
  beforeEach(async () => {
    await dbTestHelper.cleanup();
  });

  afterEach(async () => {
    await dbTestHelper.cleanup();
  });

  afterAll(async () => {
    await dbTestHelper.cleanup();
  });

  describe('POST /api/auth/register', () => {
    it('should create default notification preferences for new users with all types enabled', async () => {
      // Test: Register a new user
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newstudent123',
          password: 'password123',
          full_name: 'New Student',
          role: 'student'
        })
        .expect(201);

      // Verify: Registration successful
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('registered successfully');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.username).toBe('newstudent123');

      const userId = response.body.data.id;

      // Verify: Default notification preferences were created
      const preferences = await NotificationPreferencesService.getPreferences(userId);
      
      expect(preferences).toBeDefined();
      expect(preferences.user_id).toBe(userId);
      
      // Verify: All notification types are enabled by default
      expect(preferences.badge_earned).toBe(true);
      expect(preferences.level_up).toBe(true);
      expect(preferences.streak_reminder).toBe(true);
      expect(preferences.child_quiz_complete).toBe(true);
      expect(preferences.child_milestone).toBe(true);
      expect(preferences.admin_operation).toBe(true);
      expect(preferences.admin_security).toBe(true);
    });

    it('should create default preferences for parent users', async () => {
      // Test: Register a parent user
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newparent456',
          password: 'password123',
          full_name: 'New Parent',
          role: 'parent',
          phone_number: '1234567890'
        })
        .expect(201);

      // Verify: Registration successful
      expect(response.body.success).toBe(true);
      const userId = response.body.data.id;

      // Verify: Default notification preferences were created
      const preferences = await NotificationPreferencesService.getPreferences(userId);
      
      expect(preferences).toBeDefined();
      expect(preferences.user_id).toBe(userId);
      expect(preferences.child_quiz_complete).toBe(true);
      expect(preferences.child_milestone).toBe(true);
    });

    it('should create default preferences for admin users', async () => {
      // Test: Register an admin user
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newadmin789',
          password: 'password123',
          full_name: 'New Admin',
          role: 'admin'
        })
        .expect(201);

      // Verify: Registration successful
      expect(response.body.success).toBe(true);
      const userId = response.body.data.id;

      // Verify: Default notification preferences were created
      const preferences = await NotificationPreferencesService.getPreferences(userId);
      
      expect(preferences).toBeDefined();
      expect(preferences.user_id).toBe(userId);
      expect(preferences.admin_operation).toBe(true);
      expect(preferences.admin_security).toBe(true);
    });

    it('should still register user successfully even if preference creation fails', async () => {
      // Setup: Temporarily break the preferences table by dropping it
      // (This simulates a database error during preference creation)
      await db.execute('RENAME TABLE notification_preferences TO notification_preferences_backup');

      try {
        // Test: Register a new user
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            username: 'resilientuser',
            password: 'password123',
            full_name: 'Resilient User',
            role: 'student'
          })
          .expect(201);

        // Verify: Registration still succeeds
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.username).toBe('resilientuser');

        // Verify: User was created in database
        const [users] = await db.execute(
          'SELECT * FROM users WHERE username = ?',
          ['resilientuser']
        );
        expect(users.length).toBe(1);
      } finally {
        // Cleanup: Restore the preferences table
        await db.execute('RENAME TABLE notification_preferences_backup TO notification_preferences');
      }
    });

    it('should not create duplicate preferences if user already has them', async () => {
      // Test: Register a new user
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'uniqueuser',
          password: 'password123',
          full_name: 'Unique User',
          role: 'student'
        })
        .expect(201);

      const userId = response.body.data.id;

      // Verify: Only one preference record exists
      const [prefs] = await db.execute(
        'SELECT COUNT(*) as count FROM notification_preferences WHERE user_id = ?',
        [userId]
      );
      expect(prefs[0].count).toBe(1);

      // Test: Try to create preferences again (simulating duplicate call)
      await NotificationPreferencesService.createDefaultPreferences(userId);

      // Verify: Still only one preference record exists (no duplicate)
      const [prefsAfter] = await db.execute(
        'SELECT COUNT(*) as count FROM notification_preferences WHERE user_id = ?',
        [userId]
      );
      expect(prefsAfter[0].count).toBe(1);
    });
  });
});
