const request = require('supertest');
const express = require('express');
const studentRoutes = require('../src/routes/studentRoutes');
const NotificationRepository = require('../src/repositories/NotificationRepository');
const NotificationPreferencesService = require('../src/services/NotificationPreferencesService');
const StreakService = require('../src/services/StreakService');
const dbTestHelper = require('./helpers/dbTestHelper');
const db = require('../src/config/db');
const jwt = require('jsonwebtoken');

/**
 * Integration Tests for Student Quiz Completion Flow with Notifications
 * Tests the complete flow: quiz submission → badge/level notifications → parent notifications → streak updates
 */

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/student', studentRoutes);

// Helper function to generate JWT token for testing
function generateToken(userId, role = 'Student') {
  return jwt.sign(
    { id: userId, role: role },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
}

describe('Student Quiz Completion Integration Tests', () => {
  beforeEach(async () => {
    await dbTestHelper.cleanup();
    // Clean up test content and profiles
    await db.execute('DELETE FROM score_logs WHERE student_id >= 10000');
    await db.execute('DELETE FROM student_badges WHERE student_id >= 10000');
    await db.execute('DELETE FROM student_profiles WHERE student_id >= 10000');
    await db.execute('DELETE FROM content_items WHERE id >= 90000');
    await db.execute('DELETE FROM badges WHERE id >= 90000');
  });

  afterEach(async () => {
    await dbTestHelper.cleanup();
    await db.execute('DELETE FROM score_logs WHERE student_id >= 10000');
    await db.execute('DELETE FROM student_badges WHERE student_id >= 10000');
    await db.execute('DELETE FROM student_profiles WHERE student_id >= 10000');
    await db.execute('DELETE FROM content_items WHERE id >= 90000');
    await db.execute('DELETE FROM badges WHERE id >= 90000');
  });

  afterAll(async () => {
    await dbTestHelper.cleanup();
    await db.execute('DELETE FROM score_logs WHERE student_id >= 10000');
    await db.execute('DELETE FROM student_badges WHERE student_id >= 10000');
    await db.execute('DELETE FROM student_profiles WHERE student_id >= 10000');
    await db.execute('DELETE FROM content_items WHERE id >= 90000');
    await db.execute('DELETE FROM badges WHERE id >= 90000');
  });

  describe('Badge Notification on Badge Earn', () => {
    it('should create badge notification when student earns a badge', async () => {
      // Setup: Create student, parent, content, and badge
      const studentId = 30000;
      const parentId = 30001;
      
      await dbTestHelper.createTestUser(studentId, 'Student');
      await dbTestHelper.createTestUser(parentId, 'Parent');
      await dbTestHelper.linkStudentToParent(studentId, parentId);
      await NotificationPreferencesService.createDefaultPreferences(studentId);
      await NotificationPreferencesService.createDefaultPreferences(parentId);

      // Create student profile
      await db.execute(
        'INSERT INTO student_profiles (student_id, total_xp, current_level) VALUES (?, 0, 1)',
        [studentId]
      );

      // Create a badge at 10 XP threshold
      await db.execute(
        `INSERT INTO badges (id, name, description, icon_url, xp_threshold)
         VALUES (90000, 'First Steps', 'Complete your first quiz', '/icons/first.png', 10)`,
        []
      );

      // Create an easy quiz (10 XP)
      await db.execute(
        `INSERT INTO content_items (id, module_id, title, item_type, difficulty, correct_answer, is_locked)
         VALUES (90000, 1, 'Test Quiz', 'Quiz', 'Easy', 'A', 0)`,
        []
      );

      const token = generateToken(studentId);

      // Test: Submit correct answer
      const response = await request(app)
        .post('/api/student/submit')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content_id: 90000,
          selected_answer: 'A'
        })
        .expect(200);

      // Verify: Response includes badge earned
      expect(response.body.success).toBe(true);
      expect(response.body.data.isCorrect).toBe(true);
      expect(response.body.data.xpEarned).toBe(10);
      expect(response.body.data.newBadges.length).toBeGreaterThanOrEqual(1);
      
      // Find the "First Steps" badge in the earned badges
      const firstStepsBadge = response.body.data.newBadges.find(b => b.name === 'First Steps');
      expect(firstStepsBadge).toBeDefined();
      expect(firstStepsBadge.name).toBe('First Steps');

      // Verify: Badge notification created for student
      const studentNotifications = await dbTestHelper.getNotificationsByUser(studentId);
      const badgeNotif = studentNotifications.find(n => n.notification_type === 'badge_earned');
      
      expect(badgeNotif).toBeDefined();
      expect(badgeNotif.title).toContain('Badge Earned');
      expect(badgeNotif.message).toContain('First Steps');
      expect(badgeNotif.metadata.badge.name).toBe('First Steps');
      expect(badgeNotif.metadata.badge.icon_url).toBe('/icons/first.png');
      expect(badgeNotif.is_read).toBe(0);
    });

    it('should not create badge notification when preference is disabled', async () => {
      // Setup: Create student with badge_earned preference disabled
      const studentId = 30002;
      
      await dbTestHelper.createTestUser(studentId, 'Student');
      await NotificationPreferencesService.createDefaultPreferences(studentId);
      await NotificationPreferencesService.updatePreferences(studentId, { badge_earned: false });

      // Create student profile
      await db.execute(
        'INSERT INTO student_profiles (student_id, total_xp, current_level) VALUES (?, 0, 1)',
        [studentId]
      );

      // Create badge and quiz
      await db.execute(
        `INSERT INTO badges (id, name, description, icon_url, xp_threshold)
         VALUES (90001, 'Test Badge', 'Test', '/icons/test.png', 10)`,
        []
      );

      await db.execute(
        `INSERT INTO content_items (id, module_id, title, item_type, difficulty, correct_answer, is_locked)
         VALUES (90001, 1, 'Test Quiz', 'Quiz', 'Easy', 'A', 0)`,
        []
      );

      const token = generateToken(studentId);

      // Test: Submit correct answer
      await request(app)
        .post('/api/student/submit')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content_id: 90001,
          selected_answer: 'A'
        })
        .expect(200);

      // Verify: No badge notification created
      const studentNotifications = await dbTestHelper.getNotificationsByUser(studentId);
      const badgeNotif = studentNotifications.find(n => n.notification_type === 'badge_earned');
      
      expect(badgeNotif).toBeUndefined();
    });
  });

  describe('Level Up Notification on Level Up', () => {
    it('should create level up notification when student levels up', async () => {
      // Setup: Create student at 95 XP (close to level 2)
      const studentId = 30100;
      
      await dbTestHelper.createTestUser(studentId, 'Student');
      await NotificationPreferencesService.createDefaultPreferences(studentId);

      // Create student profile at 95 XP (level 1)
      await db.execute(
        'INSERT INTO student_profiles (student_id, total_xp, current_level) VALUES (?, 95, 1)',
        [studentId]
      );

      // Create an easy quiz (10 XP) - will push to 105 XP (level 2)
      await db.execute(
        `INSERT INTO content_items (id, module_id, title, item_type, difficulty, correct_answer, is_locked)
         VALUES (90100, 1, 'Level Up Quiz', 'Quiz', 'Easy', 'B', 0)`,
        []
      );

      const token = generateToken(studentId);

      // Test: Submit correct answer
      const response = await request(app)
        .post('/api/student/submit')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content_id: 90100,
          selected_answer: 'B'
        })
        .expect(200);

      // Verify: Response indicates level up
      expect(response.body.data.leveledUp).toBe(true);
      expect(response.body.data.currentLevel).toBe(2);
      expect(response.body.data.totalXP).toBe(105);

      // Verify: Level up notification created
      const studentNotifications = await dbTestHelper.getNotificationsByUser(studentId);
      const levelUpNotif = studentNotifications.find(n => n.notification_type === 'level_up');
      
      expect(levelUpNotif).toBeDefined();
      expect(levelUpNotif.title).toContain('Level 2');
      expect(levelUpNotif.message).toContain('Level 2');
      expect(levelUpNotif.metadata.level.new_level).toBe(2);
      expect(levelUpNotif.is_read).toBe(0);
    });

    it('should not create level up notification when preference is disabled', async () => {
      // Setup: Create student with level_up preference disabled
      const studentId = 30101;
      
      await dbTestHelper.createTestUser(studentId, 'Student');
      await NotificationPreferencesService.createDefaultPreferences(studentId);
      await NotificationPreferencesService.updatePreferences(studentId, { level_up: false });

      // Create student profile at 95 XP
      await db.execute(
        'INSERT INTO student_profiles (student_id, total_xp, current_level) VALUES (?, 95, 1)',
        [studentId]
      );

      // Create quiz
      await db.execute(
        `INSERT INTO content_items (id, module_id, title, item_type, difficulty, correct_answer, is_locked)
         VALUES (90101, 1, 'Test Quiz', 'Quiz', 'Easy', 'B', 0)`,
        []
      );

      const token = generateToken(studentId);

      // Test: Submit correct answer
      await request(app)
        .post('/api/student/submit')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content_id: 90101,
          selected_answer: 'B'
        })
        .expect(200);

      // Verify: No level up notification created
      const studentNotifications = await dbTestHelper.getNotificationsByUser(studentId);
      const levelUpNotif = studentNotifications.find(n => n.notification_type === 'level_up');
      
      expect(levelUpNotif).toBeUndefined();
    });
  });

  describe('Parent Notification on Quiz Complete', () => {
    it('should create parent notification when student completes quiz', async () => {
      // Setup: Create student and parent
      const studentId = 30200;
      const parentId = 30201;
      
      await dbTestHelper.createTestUser(studentId, 'Student');
      await dbTestHelper.createTestUser(parentId, 'Parent');
      await dbTestHelper.linkStudentToParent(studentId, parentId);
      await NotificationPreferencesService.createDefaultPreferences(studentId);
      await NotificationPreferencesService.createDefaultPreferences(parentId);

      // Create student profile
      await db.execute(
        'INSERT INTO student_profiles (student_id, total_xp, current_level) VALUES (?, 0, 1)',
        [studentId]
      );

      // Create quiz
      await db.execute(
        `INSERT INTO content_items (id, module_id, title, item_type, difficulty, correct_answer, is_locked)
         VALUES (90200, 1, 'Math Quiz', 'Quiz', 'Easy', 'C', 0)`,
        []
      );

      const token = generateToken(studentId);

      // Test: Submit correct answer
      await request(app)
        .post('/api/student/submit')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content_id: 90200,
          selected_answer: 'C'
        })
        .expect(200);

      // Verify: Parent notification created
      const parentNotifications = await dbTestHelper.getNotificationsByUser(parentId);
      const quizNotif = parentNotifications.find(n => n.notification_type === 'child_quiz_complete');
      
      expect(quizNotif).toBeDefined();
      expect(quizNotif.title).toContain('Child Quiz Completed');
      expect(quizNotif.message).toContain('Test User 30200'); // Actual student name
      expect(quizNotif.message).toContain('Math Quiz');
      expect(quizNotif.message).toContain('100%');
      expect(quizNotif.message).toContain('🌟'); // Positive indicator for 100%
      expect(quizNotif.metadata.child.student_id).toBe(studentId);
      expect(quizNotif.metadata.quiz.score_percentage).toBe(100);
    });

    it('should create parent notification with positive indicator for score >= 80%', async () => {
      // Setup: Create student and parent
      const studentId = 30202;
      const parentId = 30203;
      
      await dbTestHelper.createTestUser(studentId, 'Student');
      await dbTestHelper.createTestUser(parentId, 'Parent');
      await dbTestHelper.linkStudentToParent(studentId, parentId);
      await NotificationPreferencesService.createDefaultPreferences(studentId);
      await NotificationPreferencesService.createDefaultPreferences(parentId);

      // Create student profile
      await db.execute(
        'INSERT INTO student_profiles (student_id, total_xp, current_level) VALUES (?, 0, 1)',
        [studentId]
      );

      // Create quiz
      await db.execute(
        `INSERT INTO content_items (id, module_id, title, item_type, difficulty, correct_answer, is_locked)
         VALUES (90201, 1, 'Science Quiz', 'Quiz', 'Easy', 'D', 0)`,
        []
      );

      const token = generateToken(studentId);

      // Test: Submit correct answer (100% score)
      await request(app)
        .post('/api/student/submit')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content_id: 90201,
          selected_answer: 'D'
        })
        .expect(200);

      // Verify: Parent notification has positive indicator
      const parentNotifications = await dbTestHelper.getNotificationsByUser(parentId);
      const quizNotif = parentNotifications.find(n => n.notification_type === 'child_quiz_complete');
      
      expect(quizNotif.message).toContain('🌟');
    });

    it('should create parent notification for multiple parents', async () => {
      // Setup: Create student with two parents
      const studentId = 30204;
      const parent1Id = 30205;
      const parent2Id = 30206;
      
      await dbTestHelper.createTestUser(studentId, 'Student');
      await dbTestHelper.createTestUser(parent1Id, 'Parent');
      await dbTestHelper.createTestUser(parent2Id, 'Parent');
      
      // Link student to first parent (only one parent can be linked via parent_id)
      await dbTestHelper.linkStudentToParent(studentId, parent1Id);
      
      await NotificationPreferencesService.createDefaultPreferences(studentId);
      await NotificationPreferencesService.createDefaultPreferences(parent1Id);
      await NotificationPreferencesService.createDefaultPreferences(parent2Id);

      // Create student profile
      await db.execute(
        'INSERT INTO student_profiles (student_id, total_xp, current_level) VALUES (?, 0, 1)',
        [studentId]
      );

      // Create quiz
      await db.execute(
        `INSERT INTO content_items (id, module_id, title, item_type, difficulty, correct_answer, is_locked)
         VALUES (90202, 1, 'History Quiz', 'Quiz', 'Easy', 'A', 0)`,
        []
      );

      const token = generateToken(studentId);

      // Test: Submit correct answer
      await request(app)
        .post('/api/student/submit')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content_id: 90202,
          selected_answer: 'A'
        })
        .expect(200);

      // Verify: Parent1 notification created
      const parent1Notifications = await dbTestHelper.getNotificationsByUser(parent1Id);
      const parent1Notif = parent1Notifications.find(n => n.notification_type === 'child_quiz_complete');
      expect(parent1Notif).toBeDefined();

      // Verify: Parent2 has no notification (not linked)
      const parent2Notifications = await dbTestHelper.getNotificationsByUser(parent2Id);
      const parent2Notif = parent2Notifications.find(n => n.notification_type === 'child_quiz_complete');
      expect(parent2Notif).toBeUndefined();
    });

    it('should not create parent notification when preference is disabled', async () => {
      // Setup: Create student and parent with child_quiz_complete disabled
      const studentId = 30207;
      const parentId = 30208;
      
      await dbTestHelper.createTestUser(studentId, 'Student');
      await dbTestHelper.createTestUser(parentId, 'Parent');
      await dbTestHelper.linkStudentToParent(studentId, parentId);
      await NotificationPreferencesService.createDefaultPreferences(studentId);
      await NotificationPreferencesService.createDefaultPreferences(parentId);
      await NotificationPreferencesService.updatePreferences(parentId, { child_quiz_complete: false });

      // Create student profile
      await db.execute(
        'INSERT INTO student_profiles (student_id, total_xp, current_level) VALUES (?, 0, 1)',
        [studentId]
      );

      // Create quiz
      await db.execute(
        `INSERT INTO content_items (id, module_id, title, item_type, difficulty, correct_answer, is_locked)
         VALUES (90203, 1, 'Test Quiz', 'Quiz', 'Easy', 'B', 0)`,
        []
      );

      const token = generateToken(studentId);

      // Test: Submit correct answer
      await request(app)
        .post('/api/student/submit')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content_id: 90203,
          selected_answer: 'B'
        })
        .expect(200);

      // Verify: No parent notification created
      const parentNotifications = await dbTestHelper.getNotificationsByUser(parentId);
      const quizNotif = parentNotifications.find(n => n.notification_type === 'child_quiz_complete');
      
      expect(quizNotif).toBeUndefined();
    });
  });

  describe('Streak Update on Quiz Complete', () => {
    it('should update student streak when quiz is completed', async () => {
      // Setup: Create student
      const studentId = 30300;
      
      await dbTestHelper.createTestUser(studentId, 'Student');
      await NotificationPreferencesService.createDefaultPreferences(studentId);

      // Create student profile
      await db.execute(
        'INSERT INTO student_profiles (student_id, total_xp, current_level) VALUES (?, 0, 1)',
        [studentId]
      );

      // Create quiz
      await db.execute(
        `INSERT INTO content_items (id, module_id, title, item_type, difficulty, correct_answer, is_locked)
         VALUES (90300, 1, 'Streak Quiz', 'Quiz', 'Easy', 'A', 0)`,
        []
      );

      const token = generateToken(studentId);

      // Test: Submit correct answer
      await request(app)
        .post('/api/student/submit')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content_id: 90300,
          selected_answer: 'A'
        })
        .expect(200);

      // Verify: Streak record created
      const [streaks] = await db.execute(
        'SELECT * FROM student_streaks WHERE student_id = ?',
        [studentId]
      );
      
      expect(streaks).toHaveLength(1);
      expect(streaks[0].current_streak).toBe(1);
      expect(streaks[0].longest_streak).toBe(1);
      
      const today = new Date().toISOString().split('T')[0];
      const lastActivityDate = new Date(streaks[0].last_activity_date).toISOString().split('T')[0];
      expect(lastActivityDate).toBe(today);
    });

    it('should not update streak on incorrect answer', async () => {
      // Setup: Create student
      const studentId = 30301;
      
      await dbTestHelper.createTestUser(studentId, 'Student');
      await NotificationPreferencesService.createDefaultPreferences(studentId);

      // Create student profile
      await db.execute(
        'INSERT INTO student_profiles (student_id, total_xp, current_level) VALUES (?, 0, 1)',
        [studentId]
      );

      // Create quiz
      await db.execute(
        `INSERT INTO content_items (id, module_id, title, item_type, difficulty, correct_answer, is_locked)
         VALUES (90301, 1, 'Test Quiz', 'Quiz', 'Easy', 'A', 0)`,
        []
      );

      const token = generateToken(studentId);

      // Test: Submit incorrect answer
      await request(app)
        .post('/api/student/submit')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content_id: 90301,
          selected_answer: 'B' // Wrong answer
        })
        .expect(200);

      // Verify: No streak record created (incorrect answer doesn't update streak)
      const [streaks] = await db.execute(
        'SELECT * FROM student_streaks WHERE student_id = ?',
        [studentId]
      );
      
      expect(streaks).toHaveLength(0);
    });
  });

  describe('Complete Quiz Flow Integration', () => {
    it('should trigger all notifications and updates in correct order', async () => {
      // Setup: Create student and parent, badge at 10 XP
      const studentId = 30400;
      const parentId = 30401;
      
      await dbTestHelper.createTestUser(studentId, 'Student');
      await dbTestHelper.createTestUser(parentId, 'Parent');
      await dbTestHelper.linkStudentToParent(studentId, parentId);
      await NotificationPreferencesService.createDefaultPreferences(studentId);
      await NotificationPreferencesService.createDefaultPreferences(parentId);

      // Create student profile
      await db.execute(
        'INSERT INTO student_profiles (student_id, total_xp, current_level) VALUES (?, 0, 1)',
        [studentId]
      );

      // Create badge
      await db.execute(
        `INSERT INTO badges (id, name, description, icon_url, xp_threshold)
         VALUES (90400, 'Complete Badge', 'Test', '/icons/complete.png', 10)`,
        []
      );

      // Create quiz
      await db.execute(
        `INSERT INTO content_items (id, module_id, title, item_type, difficulty, correct_answer, is_locked)
         VALUES (90400, 1, 'Complete Quiz', 'Quiz', 'Easy', 'A', 0)`,
        []
      );

      const token = generateToken(studentId);

      // Test: Submit correct answer
      const response = await request(app)
        .post('/api/student/submit')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content_id: 90400,
          selected_answer: 'A'
        })
        .expect(200);

      // Verify: Response is correct
      expect(response.body.success).toBe(true);
      expect(response.body.data.isCorrect).toBe(true);
      expect(response.body.data.xpEarned).toBe(10);
      expect(response.body.data.newBadges.length).toBeGreaterThanOrEqual(1);
      
      // Find the "Complete Badge" in the earned badges
      const completeBadge = response.body.data.newBadges.find(b => b.name === 'Complete Badge');
      expect(completeBadge).toBeDefined();

      // Verify: Student badge notification created
      const studentNotifications = await dbTestHelper.getNotificationsByUser(studentId);
      const badgeNotif = studentNotifications.find(n => n.notification_type === 'badge_earned');
      expect(badgeNotif).toBeDefined();

      // Verify: Parent quiz completion notification created
      const parentNotifications = await dbTestHelper.getNotificationsByUser(parentId);
      const quizNotif = parentNotifications.find(n => n.notification_type === 'child_quiz_complete');
      expect(quizNotif).toBeDefined();

      // Verify: Streak updated
      const [streaks] = await db.execute(
        'SELECT * FROM student_streaks WHERE student_id = ?',
        [studentId]
      );
      expect(streaks).toHaveLength(1);
      expect(streaks[0].current_streak).toBe(1);
    });
  });
});
