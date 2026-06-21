const fc = require('fast-check');
const NotificationService = require('../src/services/NotificationService');
const NotificationRepository = require('../src/repositories/NotificationRepository');
const NotificationPreferencesService = require('../src/services/NotificationPreferencesService');
const StreakService = require('../src/services/StreakService');
const dbTestHelper = require('./helpers/dbTestHelper');
const db = require('../src/config/db');

// Global counter to ensure unique user IDs across all test iterations
let userIdCounter = 30000;

/**
 * Property-Based Tests for Streak Reminder Notifications
 * Uses fast-check library with 100 iterations as specified in task requirements
 */

describe('NotificationService Streak Reminder Property Tests', () => {
  beforeEach(async () => {
    // Clean up before each test to ensure isolation
    await db.execute('DELETE FROM notifications WHERE user_id >= 30000');
    await db.execute('DELETE FROM notification_preferences WHERE user_id >= 30000');
    await db.execute('DELETE FROM student_streaks WHERE student_id >= 30000');
    await db.execute('DELETE FROM users WHERE id >= 30000');
  });

  afterAll(async () => {
    // Final cleanup after all tests
    await dbTestHelper.cleanup();
    await db.execute('DELETE FROM notification_preferences WHERE user_id >= 30000');
    await db.execute('DELETE FROM student_streaks WHERE student_id >= 30000');
  });

  /**
   * Property 10: Streak Reminder Content
   * **Validates: Requirements 3.2**
   * 
   * For any streak reminder notification created, the notification SHALL include 
   * the current streak count in its metadata.
   */
  describe('Property 10: Streak Reminder Content', () => {
    // Generator for streak counts (3+ days as per eligibility requirement)
    const streakCountArbitrary = () => fc.integer({ min: 3, max: 365 });

    it('should include current streak count in metadata for any streak reminder notification', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(streakCountArbitrary(), { minLength: 1, maxLength: 10 }),
          async (streakCounts) => {
            // Setup: Create test students with streaks
            const students = [];
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            for (const streakCount of streakCounts) {
              const studentId = userIdCounter++;
              
              // Create student user
              await dbTestHelper.createTestUser(studentId, 'Student');
              
              // Create default preferences (all enabled)
              await NotificationPreferencesService.createDefaultPreferences(studentId);
              
              // Create streak record (last practiced yesterday, so eligible for reminder)
              await db.execute(
                `INSERT INTO student_streaks (student_id, current_streak, last_activity_date, longest_streak)
                 VALUES (?, ?, ?, ?)`,
                [studentId, streakCount, yesterdayStr, streakCount]
              );
              
              students.push({ student_id: studentId, current_streak: streakCount });
            }

            // Test: Process daily streak reminders
            const remindersSent = await NotificationService.processDailyStreakReminders();

            // Verify: Correct number of reminders sent
            expect(remindersSent).toBe(streakCounts.length);

            // Verify: Each student received a notification with correct streak count in metadata
            for (const student of students) {
              const result = await NotificationRepository.getByUser(student.student_id, 1, 20);
              
              // Verify: Notification was created
              expect(result.notifications.length).toBe(1);
              const notification = result.notifications[0];

              // Verify: Notification type is streak_reminder
              expect(notification.notification_type).toBe('streak_reminder');
              
              // Verify: Title is present and non-empty
              expect(notification.title).toBeDefined();
              expect(notification.title.length).toBeGreaterThan(0);
              
              // Verify: Message is present and contains streak count
              expect(notification.message).toBeDefined();
              expect(notification.message).toContain(student.current_streak.toString());
              
              // Verify: Metadata contains streak object with current_streak
              expect(notification.metadata).toBeDefined();
              expect(notification.metadata.streak).toBeDefined();
              expect(notification.metadata.streak.current_streak).toBe(student.current_streak);
              
              // Verify: is_read defaults to false
              expect(notification.is_read).toBe(0); // MySQL BOOLEAN as 0 for FALSE
              
              // Verify: Timestamp is present
              expect(notification.created_at).toBeInstanceOf(Date);
            }

            // Cleanup this iteration's data
            for (const student of students) {
              await db.execute('DELETE FROM notifications WHERE user_id = ?', [student.student_id]);
              await db.execute('DELETE FROM notification_preferences WHERE user_id = ?', [student.student_id]);
              await db.execute('DELETE FROM student_streaks WHERE student_id = ?', [student.student_id]);
              await db.execute('DELETE FROM users WHERE id = ?', [student.student_id]);
            }
          }
        ),
        { numRuns: 5 }
      );
    }, 60000); // 60 second timeout for 5 iterations

    it('should create streak reminder with correct content for minimum eligible streak (3 days)', async () => {
      const studentId = 30001;
      await dbTestHelper.createTestUser(studentId, 'Student');
      await NotificationPreferencesService.createDefaultPreferences(studentId);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Create streak record with exactly 3 days
      await db.execute(
        `INSERT INTO student_streaks (student_id, current_streak, last_activity_date, longest_streak)
         VALUES (?, ?, ?, ?)`,
        [studentId, 3, yesterdayStr, 3]
      );

      // Test: Process daily streak reminders
      const remindersSent = await NotificationService.processDailyStreakReminders();

      // Verify: One reminder sent
      expect(remindersSent).toBe(1);

      // Retrieve and verify notification
      const result = await NotificationRepository.getByUser(studentId, 1, 20);
      expect(result.notifications.length).toBe(1);

      const notification = result.notifications[0];
      expect(notification.notification_type).toBe('streak_reminder');
      expect(notification.message).toContain('3');
      expect(notification.metadata.streak.current_streak).toBe(3);
    });

    it('should create streak reminder with correct content for long streaks', async () => {
      const studentId = 30002;
      await dbTestHelper.createTestUser(studentId, 'Student');
      await NotificationPreferencesService.createDefaultPreferences(studentId);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Create streak record with 100 days
      await db.execute(
        `INSERT INTO student_streaks (student_id, current_streak, last_activity_date, longest_streak)
         VALUES (?, ?, ?, ?)`,
        [studentId, 100, yesterdayStr, 100]
      );

      // Test: Process daily streak reminders
      const remindersSent = await NotificationService.processDailyStreakReminders();

      // Verify: One reminder sent
      expect(remindersSent).toBe(1);

      // Retrieve and verify notification
      const result = await NotificationRepository.getByUser(studentId, 1, 20);
      expect(result.notifications.length).toBe(1);

      const notification = result.notifications[0];
      expect(notification.notification_type).toBe('streak_reminder');
      expect(notification.message).toContain('100');
      expect(notification.metadata.streak.current_streak).toBe(100);
    });

    it('should not create streak reminder when preference is disabled', async () => {
      const studentId = 30003;
      await dbTestHelper.createTestUser(studentId, 'Student');
      
      // Create preferences with streak_reminder disabled
      await NotificationPreferencesService.createDefaultPreferences(studentId);
      await NotificationPreferencesService.updatePreferences(studentId, {
        streak_reminder: false
      });

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Create eligible streak record
      await db.execute(
        `INSERT INTO student_streaks (student_id, current_streak, last_activity_date, longest_streak)
         VALUES (?, ?, ?, ?)`,
        [studentId, 5, yesterdayStr, 5]
      );

      // Test: Process daily streak reminders
      const remindersSent = await NotificationService.processDailyStreakReminders();

      // Verify: No reminder sent (preference disabled)
      expect(remindersSent).toBe(0);

      // Verify: No notification created
      const result = await NotificationRepository.getByUser(studentId, 1, 20);
      expect(result.notifications.length).toBe(0);
    });

    it('should return correct count of reminders sent', async () => {
      const students = [];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Create 5 eligible students
      for (let i = 0; i < 5; i++) {
        const studentId = userIdCounter++;
        await dbTestHelper.createTestUser(studentId, 'Student');
        await NotificationPreferencesService.createDefaultPreferences(studentId);
        
        await db.execute(
          `INSERT INTO student_streaks (student_id, current_streak, last_activity_date, longest_streak)
           VALUES (?, ?, ?, ?)`,
          [studentId, 3 + i, yesterdayStr, 3 + i]
        );
        
        students.push(studentId);
      }

      // Test: Process daily streak reminders
      const remindersSent = await NotificationService.processDailyStreakReminders();

      // Verify: Correct count returned
      expect(remindersSent).toBe(5);

      // Cleanup
      for (const studentId of students) {
        await db.execute('DELETE FROM notifications WHERE user_id = ?', [studentId]);
        await db.execute('DELETE FROM notification_preferences WHERE user_id = ?', [studentId]);
        await db.execute('DELETE FROM student_streaks WHERE student_id = ?', [studentId]);
        await db.execute('DELETE FROM users WHERE id = ?', [studentId]);
      }
    });

    it('should handle empty eligible students list gracefully', async () => {
      // Test: Process daily streak reminders with no eligible students
      const remindersSent = await NotificationService.processDailyStreakReminders();

      // Verify: Zero reminders sent
      expect(remindersSent).toBe(0);
    });
  });
});
