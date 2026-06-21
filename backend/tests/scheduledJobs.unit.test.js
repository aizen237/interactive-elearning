// backend/tests/scheduledJobs.unit.test.js
const NotificationService = require('../src/services/NotificationService');
const StreakService = require('../src/services/StreakService');
const NotificationRepository = require('../src/repositories/NotificationRepository');
const NotificationPreferencesService = require('../src/services/NotificationPreferencesService');
const db = require('../src/config/db');
const dbTestHelper = require('./helpers/dbTestHelper');

describe('Scheduled Jobs', () => {
  afterAll(async () => {
    await dbTestHelper.cleanup();
    await db.end();
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await dbTestHelper.cleanup();
  });

  describe('Streak Reminder', () => {
    describe('processDailyStreakReminders', () => {
      it('should send reminders to students with 3+ day streaks who have not practiced today', async () => {
        // Create test students using helper
        const student1Id = await dbTestHelper.createTestUser(10001, 'Student');
        const student2Id = await dbTestHelper.createTestUser(10002, 'Student');

        // Create streaks - student1 has 5-day streak (eligible), student2 has 2-day streak (not eligible)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        await db.query(
          `INSERT INTO student_streaks (student_id, current_streak, last_activity_date, longest_streak)
           VALUES (?, ?, ?, ?)`,
          [student1Id, 5, yesterdayStr, 5]
        );

        await db.query(
          `INSERT INTO student_streaks (student_id, current_streak, last_activity_date, longest_streak)
           VALUES (?, ?, ?, ?)`,
          [student2Id, 2, yesterdayStr, 2]
        );

        // Create default preferences for both students
        await NotificationPreferencesService.createDefaultPreferences(student1Id);
        await NotificationPreferencesService.createDefaultPreferences(student2Id);

        // Process streak reminders
        const reminderCount = await NotificationService.processDailyStreakReminders();

        // Should send 1 reminder (only student1 is eligible)
        expect(reminderCount).toBe(1);

        // Verify notification was created for student1
        const [student1Notifications] = await db.query(
          'SELECT * FROM notifications WHERE user_id = ? AND notification_type = ?',
          [student1Id, 'streak_reminder']
        );
        expect(student1Notifications).toHaveLength(1);
        expect(student1Notifications[0].title).toContain('Keep Your Streak Alive');
        expect(student1Notifications[0].message).toContain('5-day streak');

        // Verify no notification for student2
        const [student2Notifications] = await db.query(
          'SELECT * FROM notifications WHERE user_id = ? AND notification_type = ?',
          [student2Id, 'streak_reminder']
        );
        expect(student2Notifications).toHaveLength(0);
      });

      it('should suppress reminders for students who completed a quiz today', async () => {
        // Create test student
        const studentId = await dbTestHelper.createTestUser(10003, 'Student');

        // Create streak with activity today
        const today = new Date().toISOString().split('T')[0];

        await db.query(
          `INSERT INTO student_streaks (student_id, current_streak, last_activity_date, longest_streak)
           VALUES (?, ?, ?, ?)`,
          [studentId, 5, today, 5]
        );

        // Create default preferences
        await NotificationPreferencesService.createDefaultPreferences(studentId);

        // Process streak reminders
        const reminderCount = await NotificationService.processDailyStreakReminders();

        // Should send 0 reminders (student practiced today)
        expect(reminderCount).toBe(0);

        // Verify no notification was created
        const [notifications] = await db.query(
          'SELECT * FROM notifications WHERE user_id = ? AND notification_type = ?',
          [studentId, 'streak_reminder']
        );
        expect(notifications).toHaveLength(0);
      });

      it('should respect user notification preferences', async () => {
        // Create test student
        const studentId = await dbTestHelper.createTestUser(10004, 'Student');

        // Create streak (eligible)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        await db.query(
          `INSERT INTO student_streaks (student_id, current_streak, last_activity_date, longest_streak)
           VALUES (?, ?, ?, ?)`,
          [studentId, 5, yesterdayStr, 5]
        );

        // Create preferences with streak_reminder disabled
        await NotificationPreferencesService.createDefaultPreferences(studentId);
        await NotificationPreferencesService.updatePreferences(studentId, {
          streak_reminder: false
        });

        // Process streak reminders
        const reminderCount = await NotificationService.processDailyStreakReminders();

        // Should send 0 reminders (preference disabled)
        expect(reminderCount).toBe(0);

        // Verify no notification was created
        const [notifications] = await db.query(
          'SELECT * FROM notifications WHERE user_id = ? AND notification_type = ?',
          [studentId, 'streak_reminder']
        );
        expect(notifications).toHaveLength(0);
      });

      it('should return count of reminders sent', async () => {
        // Create multiple eligible students
        const studentIds = await dbTestHelper.createTestUsers(3, 10005, 'Student');

        // Create streaks for all students
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        for (const studentId of studentIds) {
          await db.query(
            `INSERT INTO student_streaks (student_id, current_streak, last_activity_date, longest_streak)
             VALUES (?, ?, ?, ?)`,
            [studentId, 5, yesterdayStr, 5]
          );
          await NotificationPreferencesService.createDefaultPreferences(studentId);
        }

        // Process streak reminders
        const reminderCount = await NotificationService.processDailyStreakReminders();

        // Should return count of 3
        expect(reminderCount).toBe(3);
      });
    });
  });

  describe('Notification Cleanup', () => {
    describe('deleteOldNotifications', () => {
      it('should delete notifications older than 90 days', async () => {
        // Create test user
        const userId = await dbTestHelper.createTestUser(10100, 'Student');

        // Create recent notification
        await NotificationRepository.create({
          user_id: userId,
          notification_type: 'badge_earned',
          title: 'Recent Badge',
          message: 'You earned a badge!'
        });

        // Create old notification (91 days old)
        await db.execute(
          `INSERT INTO notifications (user_id, notification_type, title, message, is_read, created_at)
           VALUES (?, 'level_up', 'Old Level', 'Old notification', FALSE, DATE_SUB(NOW(), INTERVAL 91 DAY))`,
          [userId]
        );

        // Verify both notifications exist
        const beforeCleanup = await dbTestHelper.getNotificationsByUser(userId);
        expect(beforeCleanup.length).toBe(2);

        // Run cleanup
        const deletedCount = await NotificationRepository.deleteOldNotifications(90);
        expect(deletedCount).toBeGreaterThanOrEqual(1);

        // Verify only recent notification remains
        const afterCleanup = await dbTestHelper.getNotificationsByUser(userId);
        expect(afterCleanup.length).toBe(1);
        expect(afterCleanup[0].title).toBe('Recent Badge');
      });

      it('should return count of deleted notifications', async () => {
        // Create test user
        const userId = await dbTestHelper.createTestUser(10101, 'Student');

        // Create multiple old notifications
        for (let i = 0; i < 5; i++) {
          await db.execute(
            `INSERT INTO notifications (user_id, notification_type, title, message, is_read, created_at)
             VALUES (?, 'badge_earned', ?, 'Old notification', FALSE, DATE_SUB(NOW(), INTERVAL 91 DAY))`,
            [userId, `Old Badge ${i}`]
          );
        }

        // Run cleanup
        const deletedCount = await NotificationRepository.deleteOldNotifications(90);
        expect(deletedCount).toBeGreaterThanOrEqual(5);
      });

      it('should not delete recent notifications', async () => {
        // Create test user
        const userId = await dbTestHelper.createTestUser(10102, 'Student');

        // Create only recent notifications
        for (let i = 0; i < 3; i++) {
          await NotificationRepository.create({
            user_id: userId,
            notification_type: 'streak_reminder',
            title: `Streak ${i}`,
            message: 'Keep your streak going!'
          });
        }

        // Run cleanup
        await NotificationRepository.deleteOldNotifications(90);

        // Verify all notifications remain
        const notifications = await dbTestHelper.getNotificationsByUser(userId);
        expect(notifications.length).toBe(3);
      });
    });
  });
});
