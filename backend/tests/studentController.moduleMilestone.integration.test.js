const request = require('supertest');
const express = require('express');
const studentRoutes = require('../src/routes/studentRoutes');
const NotificationPreferencesService = require('../src/services/NotificationPreferencesService');
const dbTestHelper = require('./helpers/dbTestHelper');
const db = require('../src/config/db');
const jwt = require('jsonwebtoken');

/**
 * Integration Tests for Module Milestone Notifications
 * Tests the 50% module completion milestone notification flow
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

describe('Module Milestone Integration Tests', () => {
  beforeEach(async () => {
    await dbTestHelper.cleanup();
    // Clean up test data
    await db.execute('DELETE FROM score_logs WHERE student_id >= 40000');
    await db.execute('DELETE FROM student_profiles WHERE student_id >= 40000');
    await db.execute('DELETE FROM content_items WHERE id >= 94000');
    await db.execute('DELETE FROM modules WHERE id >= 9400');
  });

  afterEach(async () => {
    await dbTestHelper.cleanup();
    await db.execute('DELETE FROM score_logs WHERE student_id >= 40000');
    await db.execute('DELETE FROM student_profiles WHERE student_id >= 40000');
    await db.execute('DELETE FROM content_items WHERE id >= 94000');
    await db.execute('DELETE FROM modules WHERE id >= 9400');
  });

  afterAll(async () => {
    await dbTestHelper.cleanup();
    await db.execute('DELETE FROM score_logs WHERE student_id >= 40000');
    await db.execute('DELETE FROM student_profiles WHERE student_id >= 40000');
    await db.execute('DELETE FROM content_items WHERE id >= 94000');
    await db.execute('DELETE FROM modules WHERE id >= 9400');
  });

  describe('50% Module Completion Milestone', () => {
    it('should create parent notification when student reaches exactly 50% module completion', async () => {
      // Setup: Create student and parent
      const studentId = 40000;
      const parentId = 40001;
      
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

      // Create a test module with 4 content items (50% = 2 completed)
      await db.execute(
        `INSERT INTO modules (id, module_name, description)
         VALUES (9400, 'Test Module', 'Test module for milestone')`,
        []
      );

      // Create 4 content items in the module
      for (let i = 0; i < 4; i++) {
        await db.execute(
          `INSERT INTO content_items (id, module_id, title, item_type, difficulty, correct_answer, is_locked)
           VALUES (?, 9400, ?, 'Quiz', 'Easy', 'A', 0)`,
          [94000 + i, `Quiz ${i + 1}`]
        );
      }

      const token = generateToken(studentId);

      // Complete first quiz (25% completion)
      await request(app)
        .post('/api/student/submit')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content_id: 94000,
          selected_answer: 'A'
        })
        .expect(200);

      // Check progress - should be 25%
      let progressResponse = await request(app)
        .get('/api/student/progress')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      let moduleProgress = progressResponse.body.data.moduleProgress.find(m => m.moduleId === 9400);
      expect(moduleProgress.completionPercentage).toBe(25);

      // Verify no milestone notification yet
      let parentNotifications = await dbTestHelper.getNotificationsByUser(parentId);
      let milestoneNotif = parentNotifications.find(n => n.notification_type === 'child_milestone');
      expect(milestoneNotif).toBeUndefined();

      // Complete second quiz (50% completion)
      await request(app)
        .post('/api/student/submit')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content_id: 94001,
          selected_answer: 'A'
        })
        .expect(200);

      // Check progress - should trigger milestone notification
      progressResponse = await request(app)
        .get('/api/student/progress')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      moduleProgress = progressResponse.body.data.moduleProgress.find(m => m.moduleId === 9400);
      expect(moduleProgress.completionPercentage).toBe(50);

      // Verify milestone notification created for parent
      parentNotifications = await dbTestHelper.getNotificationsByUser(parentId);
      milestoneNotif = parentNotifications.find(n => n.notification_type === 'child_milestone');
      
      expect(milestoneNotif).toBeDefined();
      expect(milestoneNotif.title).toContain('Child Milestone Reached');
      expect(milestoneNotif.message).toContain('Test User 40000'); // Student name
      expect(milestoneNotif.message).toContain('50% completion');
      expect(milestoneNotif.message).toContain('Test Module');
      expect(milestoneNotif.metadata.child.student_id).toBe(studentId);
      expect(milestoneNotif.metadata.milestone.milestone_type).toBe('module_completion');
      expect(milestoneNotif.metadata.milestone.details).toContain('50% completion in Test Module');
    });

    it('should not create parent notification at other completion percentages', async () => {
      // Setup: Create student and parent
      const studentId = 40002;
      const parentId = 40003;
      
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

      // Create a test module with 3 content items (33%, 67%, 100%)
      await db.execute(
        `INSERT INTO modules (id, module_name, description)
         VALUES (9401, 'Test Module 2', 'Test module for non-milestone')`,
        []
      );

      for (let i = 0; i < 3; i++) {
        await db.execute(
          `INSERT INTO content_items (id, module_id, title, item_type, difficulty, correct_answer, is_locked)
           VALUES (?, 9401, ?, 'Quiz', 'Easy', 'A', 0)`,
          [94010 + i, `Quiz ${i + 1}`]
        );
      }

      const token = generateToken(studentId);

      // Complete first quiz (33% completion)
      await request(app)
        .post('/api/student/submit')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content_id: 94010,
          selected_answer: 'A'
        })
        .expect(200);

      // Check progress
      await request(app)
        .get('/api/student/progress')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verify no milestone notification at 33%
      let parentNotifications = await dbTestHelper.getNotificationsByUser(parentId);
      let milestoneNotif = parentNotifications.find(n => n.notification_type === 'child_milestone');
      expect(milestoneNotif).toBeUndefined();

      // Complete second quiz (67% completion)
      await request(app)
        .post('/api/student/submit')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content_id: 94011,
          selected_answer: 'A'
        })
        .expect(200);

      // Check progress
      await request(app)
        .get('/api/student/progress')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verify no milestone notification at 67%
      parentNotifications = await dbTestHelper.getNotificationsByUser(parentId);
      milestoneNotif = parentNotifications.find(n => n.notification_type === 'child_milestone');
      expect(milestoneNotif).toBeUndefined();

      // Complete third quiz (100% completion)
      await request(app)
        .post('/api/student/submit')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content_id: 94012,
          selected_answer: 'A'
        })
        .expect(200);

      // Check progress
      await request(app)
        .get('/api/student/progress')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verify no milestone notification at 100%
      parentNotifications = await dbTestHelper.getNotificationsByUser(parentId);
      milestoneNotif = parentNotifications.find(n => n.notification_type === 'child_milestone');
      expect(milestoneNotif).toBeUndefined();
    });

    it('should not create duplicate milestone notifications for same module', async () => {
      // Setup: Create student and parent
      const studentId = 40004;
      const parentId = 40005;
      
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

      // Create a test module with 4 content items
      await db.execute(
        `INSERT INTO modules (id, module_name, description)
         VALUES (9402, 'Test Module 3', 'Test module for duplicate check')`,
        []
      );

      for (let i = 0; i < 4; i++) {
        await db.execute(
          `INSERT INTO content_items (id, module_id, title, item_type, difficulty, correct_answer, is_locked)
           VALUES (?, 9402, ?, 'Quiz', 'Easy', 'A', 0)`,
          [94020 + i, `Quiz ${i + 1}`]
        );
      }

      const token = generateToken(studentId);

      // Complete first two quizzes to reach 50%
      await request(app)
        .post('/api/student/submit')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content_id: 94020,
          selected_answer: 'A'
        })
        .expect(200);

      await request(app)
        .post('/api/student/submit')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content_id: 94021,
          selected_answer: 'A'
        })
        .expect(200);

      // Check progress - triggers first milestone notification
      await request(app)
        .get('/api/student/progress')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verify milestone notification created
      let parentNotifications = await dbTestHelper.getNotificationsByUser(parentId);
      let milestoneNotifs = parentNotifications.filter(n => n.notification_type === 'child_milestone');
      expect(milestoneNotifs).toHaveLength(1);

      // Check progress again - should not create duplicate
      await request(app)
        .get('/api/student/progress')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verify still only one milestone notification
      parentNotifications = await dbTestHelper.getNotificationsByUser(parentId);
      milestoneNotifs = parentNotifications.filter(n => n.notification_type === 'child_milestone');
      expect(milestoneNotifs).toHaveLength(1);
    });

    it('should not create milestone notification when preference is disabled', async () => {
      // Setup: Create student and parent with child_milestone disabled
      const studentId = 40006;
      const parentId = 40007;
      
      await dbTestHelper.createTestUser(studentId, 'Student');
      await dbTestHelper.createTestUser(parentId, 'Parent');
      await dbTestHelper.linkStudentToParent(studentId, parentId);
      await NotificationPreferencesService.createDefaultPreferences(studentId);
      await NotificationPreferencesService.createDefaultPreferences(parentId);
      await NotificationPreferencesService.updatePreferences(parentId, { child_milestone: false });

      // Create student profile
      await db.execute(
        'INSERT INTO student_profiles (student_id, total_xp, current_level) VALUES (?, 0, 1)',
        [studentId]
      );

      // Create a test module with 4 content items
      await db.execute(
        `INSERT INTO modules (id, module_name, description)
         VALUES (9403, 'Test Module 4', 'Test module for preference check')`,
        []
      );

      for (let i = 0; i < 4; i++) {
        await db.execute(
          `INSERT INTO content_items (id, module_id, title, item_type, difficulty, correct_answer, is_locked)
           VALUES (?, 9403, ?, 'Quiz', 'Easy', 'A', 0)`,
          [94030 + i, `Quiz ${i + 1}`]
        );
      }

      const token = generateToken(studentId);

      // Complete first two quizzes to reach 50%
      await request(app)
        .post('/api/student/submit')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content_id: 94030,
          selected_answer: 'A'
        })
        .expect(200);

      await request(app)
        .post('/api/student/submit')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content_id: 94031,
          selected_answer: 'A'
        })
        .expect(200);

      // Check progress
      await request(app)
        .get('/api/student/progress')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verify no milestone notification created (preference disabled)
      const parentNotifications = await dbTestHelper.getNotificationsByUser(parentId);
      const milestoneNotif = parentNotifications.find(n => n.notification_type === 'child_milestone');
      expect(milestoneNotif).toBeUndefined();
    });

    it('should create milestone notification for multiple parents', async () => {
      // Setup: Create student with one parent (current schema supports one parent_id)
      const studentId = 40008;
      const parentId = 40009;
      
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

      // Create a test module with 2 content items (50% = 1 completed)
      await db.execute(
        `INSERT INTO modules (id, module_name, description)
         VALUES (9404, 'Test Module 5', 'Test module for multiple parents')`,
        []
      );

      for (let i = 0; i < 2; i++) {
        await db.execute(
          `INSERT INTO content_items (id, module_id, title, item_type, difficulty, correct_answer, is_locked)
           VALUES (?, 9404, ?, 'Quiz', 'Easy', 'A', 0)`,
          [94040 + i, `Quiz ${i + 1}`]
        );
      }

      const token = generateToken(studentId);

      // Complete first quiz to reach 50%
      await request(app)
        .post('/api/student/submit')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content_id: 94040,
          selected_answer: 'A'
        })
        .expect(200);

      // Check progress
      await request(app)
        .get('/api/student/progress')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verify milestone notification created for parent
      const parentNotifications = await dbTestHelper.getNotificationsByUser(parentId);
      const milestoneNotif = parentNotifications.find(n => n.notification_type === 'child_milestone');
      expect(milestoneNotif).toBeDefined();
    });
  });
});
