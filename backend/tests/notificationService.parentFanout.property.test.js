const fc = require('fast-check');
const NotificationService = require('../src/services/NotificationService');
const NotificationRepository = require('../src/repositories/NotificationRepository');
const NotificationPreferencesService = require('../src/services/NotificationPreferencesService');
const dbTestHelper = require('./helpers/dbTestHelper');
const db = require('../src/config/db');

// Global counter to ensure unique user IDs across all test iterations
let userIdCounter = 30000;

/**
 * Property-Based Test for Parent Notification Fan-out
 * **Property 3: Parent Notification Fan-out**
 * **Validates: Requirements 4.1, 5.1, 5.2, 5.3**
 * 
 * For any student event that triggers parent notifications (quiz completion, 
 * badge earned, level up, module milestone), if the student has N linked parents, 
 * exactly N parent notifications SHALL be created, one for each parent.
 * 
 * NOTE: Current database schema supports only 1 parent per student (parent_id column).
 * Tests verify fan-out logic with 0-1 parents. Future enhancement could add a 
 * parent_children junction table to support multiple parents per student.
 */

describe('Property 3: Parent Notification Fan-out', () => {
  afterAll(async () => {
    // Final cleanup after all tests
    await dbTestHelper.cleanup();
    await db.execute('DELETE FROM notification_preferences WHERE user_id >= 10000');
  });

  /**
   * Generator for student with N linked parents (0-1 parents due to schema constraint)
   */
  const studentWithParentsArbitrary = () => fc.record({
    numParents: fc.integer({ min: 0, max: 1 }), // Schema supports only 1 parent per student
    studentName: fc.string({ minLength: 3, maxLength: 30 }),
    quizName: fc.string({ minLength: 3, maxLength: 50 }),
    scorePercentage: fc.integer({ min: 0, max: 100 }),
    moduleName: fc.string({ minLength: 3, maxLength: 50 })
  });

  it('should create exactly N parent notifications for quiz completion when student has N parents', async () => {
    await fc.assert(
      fc.asyncProperty(
        studentWithParentsArbitrary(),
        async (testData) => {
          // Setup: Create student with unique ID
          const studentId = userIdCounter++;
          await dbTestHelper.createTestUser(studentId, 'Student');
          
          // Setup: Create N parents and link them to the student
          // Note: Current schema only supports 1 parent per student
          const parentIds = [];
          for (let i = 0; i < testData.numParents; i++) {
            const parentId = userIdCounter++;
            await dbTestHelper.createTestUser(parentId, 'Parent');
            await dbTestHelper.linkStudentToParent(studentId, parentId);
            parentIds.push(parentId);
            
            // Create default preferences for parent (all enabled)
            await NotificationPreferencesService.createDefaultPreferences(parentId);
          }

          // Test: Trigger quiz completion notification
          await NotificationService.notifyParentsQuizComplete(
            studentId,
            testData.studentName,
            testData.quizName,
            testData.scorePercentage
          );

          // Verify: Exactly N parent notifications were created
          let totalNotifications = 0;
          for (const parentId of parentIds) {
            const notifications = await dbTestHelper.getNotificationsByUser(parentId);
            
            // Each parent should have exactly 1 notification
            expect(notifications.length).toBe(1);
            totalNotifications += notifications.length;
            
            // Verify notification type
            expect(notifications[0].notification_type).toBe('child_quiz_complete');
            
            // Verify notification contains student info
            expect(notifications[0].metadata.child.student_name).toBe(testData.studentName);
            expect(notifications[0].metadata.quiz.quiz_name).toBe(testData.quizName);
            expect(notifications[0].metadata.quiz.score_percentage).toBe(testData.scorePercentage);
          }

          // Verify: Total number of notifications equals number of parents
          expect(totalNotifications).toBe(testData.numParents);

          // Cleanup
          for (const parentId of parentIds) {
            await db.execute('DELETE FROM notifications WHERE user_id = ?', [parentId]);
            await db.execute('DELETE FROM notification_preferences WHERE user_id = ?', [parentId]);
            await db.execute('DELETE FROM users WHERE id = ?', [parentId]);
          }
          await db.execute('DELETE FROM users WHERE id = ?', [studentId]);
        }
      ),
      { numRuns: 5 }
    );
  }, 30000); // 30 second timeout

  it('should create exactly N parent notifications for module milestone when student has N parents', async () => {
    await fc.assert(
      fc.asyncProperty(
        studentWithParentsArbitrary(),
        async (testData) => {
          // Setup: Create student with unique ID
          const studentId = userIdCounter++;
          await dbTestHelper.createTestUser(studentId, 'Student');
          
          // Setup: Create N parents and link them to the student
          // Note: Current schema only supports 1 parent per student
          const parentIds = [];
          for (let i = 0; i < testData.numParents; i++) {
            const parentId = userIdCounter++;
            await dbTestHelper.createTestUser(parentId, 'Parent');
            await dbTestHelper.linkStudentToParent(studentId, parentId);
            parentIds.push(parentId);
            
            // Create default preferences for parent (all enabled)
            await NotificationPreferencesService.createDefaultPreferences(parentId);
          }

          // Test: Trigger module milestone notification (50% completion)
          await NotificationService.notifyParentsModuleMilestone(
            studentId,
            testData.studentName,
            testData.moduleName,
            50 // Must be exactly 50% per requirements
          );

          // Verify: Exactly N parent notifications were created
          let totalNotifications = 0;
          for (const parentId of parentIds) {
            const notifications = await dbTestHelper.getNotificationsByUser(parentId);
            
            // Each parent should have exactly 1 notification
            expect(notifications.length).toBe(1);
            totalNotifications += notifications.length;
            
            // Verify notification type
            expect(notifications[0].notification_type).toBe('child_milestone');
            
            // Verify notification contains student info
            expect(notifications[0].metadata.child.student_name).toBe(testData.studentName);
            expect(notifications[0].metadata.milestone.details).toContain(testData.moduleName);
            expect(notifications[0].metadata.milestone.details).toContain('50%');
          }

          // Verify: Total number of notifications equals number of parents
          expect(totalNotifications).toBe(testData.numParents);

          // Cleanup
          for (const parentId of parentIds) {
            await db.execute('DELETE FROM notifications WHERE user_id = ?', [parentId]);
            await db.execute('DELETE FROM notification_preferences WHERE user_id = ?', [parentId]);
            await db.execute('DELETE FROM users WHERE id = ?', [parentId]);
          }
          await db.execute('DELETE FROM users WHERE id = ?', [studentId]);
        }
      ),
      { numRuns: 5 }
    );
  }, 30000); // 30 second timeout

  it('should not create milestone notifications when completion is not exactly 50%', async () => {
    const studentId = userIdCounter++;
    const parentId = userIdCounter++;
    
    await dbTestHelper.createTestUser(studentId, 'Student');
    await dbTestHelper.createTestUser(parentId, 'Parent');
    await dbTestHelper.linkStudentToParent(studentId, parentId);
    await NotificationPreferencesService.createDefaultPreferences(parentId);

    // Test: Try to create milestone with 49% (should not create)
    await NotificationService.notifyParentsModuleMilestone(
      studentId,
      'Test Student',
      'Test Module',
      49
    );

    let notifications = await dbTestHelper.getNotificationsByUser(parentId);
    expect(notifications.length).toBe(0);

    // Test: Try to create milestone with 51% (should not create)
    await NotificationService.notifyParentsModuleMilestone(
      studentId,
      'Test Student',
      'Test Module',
      51
    );

    notifications = await dbTestHelper.getNotificationsByUser(parentId);
    expect(notifications.length).toBe(0);

    // Test: Create milestone with exactly 50% (should create)
    await NotificationService.notifyParentsModuleMilestone(
      studentId,
      'Test Student',
      'Test Module',
      50
    );

    notifications = await dbTestHelper.getNotificationsByUser(parentId);
    expect(notifications.length).toBe(1);
    expect(notifications[0].notification_type).toBe('child_milestone');

    // Cleanup
    await db.execute('DELETE FROM notifications WHERE user_id = ?', [parentId]);
    await db.execute('DELETE FROM notification_preferences WHERE user_id = ?', [parentId]);
    await db.execute('DELETE FROM users WHERE id IN (?, ?)', [studentId, parentId]);
  });

  /**
   * Property 15: Module Milestone Threshold
   * **Validates: Requirements 5.3**
   * 
   * For any module completion event, a parent milestone notification SHALL be 
   * created if and only if the completion percentage is exactly 50%.
   */
  it('Property 15: should create milestone notification if and only if completion is exactly 50%', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          completionPercentage: fc.integer({ min: 0, max: 100 }),
          studentName: fc.string({ minLength: 3, maxLength: 30 }),
          moduleName: fc.string({ minLength: 3, maxLength: 50 })
        }),
        async (testData) => {
          // Setup: Create student and parent
          const studentId = userIdCounter++;
          const parentId = userIdCounter++;
          
          await dbTestHelper.createTestUser(studentId, 'Student');
          await dbTestHelper.createTestUser(parentId, 'Parent');
          await dbTestHelper.linkStudentToParent(studentId, parentId);
          await NotificationPreferencesService.createDefaultPreferences(parentId);

          // Test: Trigger module milestone with random completion percentage
          await NotificationService.notifyParentsModuleMilestone(
            studentId,
            testData.studentName,
            testData.moduleName,
            testData.completionPercentage
          );

          // Verify: Notification created if and only if completion is exactly 50%
          const notifications = await dbTestHelper.getNotificationsByUser(parentId);
          
          if (testData.completionPercentage === 50) {
            // Should create notification at exactly 50%
            expect(notifications.length).toBe(1);
            expect(notifications[0].notification_type).toBe('child_milestone');
            expect(notifications[0].metadata.child.student_name).toBe(testData.studentName);
            expect(notifications[0].metadata.milestone.details).toContain(testData.moduleName);
            expect(notifications[0].metadata.milestone.details).toContain('50%');
          } else {
            // Should NOT create notification at any other percentage
            expect(notifications.length).toBe(0);
          }

          // Cleanup
          await db.execute('DELETE FROM notifications WHERE user_id = ?', [parentId]);
          await db.execute('DELETE FROM notification_preferences WHERE user_id = ?', [parentId]);
          await db.execute('DELETE FROM users WHERE id IN (?, ?)', [studentId, parentId]);
        }
      ),
      { numRuns: 5 }
    );
  }, 30000); // 30 second timeout

  it('should respect parent notification preferences when creating fan-out notifications', async () => {
    // Test 1: Parent with preferences enabled
    const studentId1 = userIdCounter++;
    const parent1Id = userIdCounter++;
    
    await dbTestHelper.createTestUser(studentId1, 'Student');
    await dbTestHelper.createTestUser(parent1Id, 'Parent');
    await dbTestHelper.linkStudentToParent(studentId1, parent1Id);
    
    // Parent 1: Enable quiz notifications (default)
    await NotificationPreferencesService.createDefaultPreferences(parent1Id);

    // Test: Trigger quiz completion
    await NotificationService.notifyParentsQuizComplete(
      studentId1,
      'Test Student 1',
      'Test Quiz',
      85
    );

    // Verify: Parent 1 receives notification
    const parent1Notifications = await dbTestHelper.getNotificationsByUser(parent1Id);
    expect(parent1Notifications.length).toBe(1);
    expect(parent1Notifications[0].notification_type).toBe('child_quiz_complete');

    // Cleanup test 1
    await db.execute('DELETE FROM notifications WHERE user_id = ?', [parent1Id]);
    await db.execute('DELETE FROM notification_preferences WHERE user_id = ?', [parent1Id]);
    await db.execute('DELETE FROM users WHERE id IN (?, ?)', [studentId1, parent1Id]);

    // Test 2: Parent with preferences disabled
    const studentId2 = userIdCounter++;
    const parent2Id = userIdCounter++;
    
    await dbTestHelper.createTestUser(studentId2, 'Student');
    await dbTestHelper.createTestUser(parent2Id, 'Parent');
    await dbTestHelper.linkStudentToParent(studentId2, parent2Id);
    
    // Parent 2: Disable quiz notifications
    await NotificationPreferencesService.createDefaultPreferences(parent2Id);
    await NotificationPreferencesService.updatePreferences(parent2Id, {
      child_quiz_complete: false
    });

    // Test: Trigger quiz completion
    await NotificationService.notifyParentsQuizComplete(
      studentId2,
      'Test Student 2',
      'Test Quiz',
      85
    );

    // Verify: Parent 2 does NOT receive notification
    const parent2Notifications = await dbTestHelper.getNotificationsByUser(parent2Id);
    expect(parent2Notifications.length).toBe(0);

    // Cleanup test 2
    await db.execute('DELETE FROM notification_preferences WHERE user_id = ?', [parent2Id]);
    await db.execute('DELETE FROM users WHERE id IN (?, ?)', [studentId2, parent2Id]);
  });

  it('should handle edge case of student with no linked parents', async () => {
    const studentId = userIdCounter++;
    await dbTestHelper.createTestUser(studentId, 'Student');

    // Test: Trigger quiz completion for student with no parents
    await NotificationService.notifyParentsQuizComplete(
      studentId,
      'Test Student',
      'Test Quiz',
      75
    );

    // Verify: No notifications created for this student's quiz
    // Check by querying notifications created in the last second
    const recentNotifications = await db.execute(
      `SELECT COUNT(*) as count FROM notifications 
       WHERE notification_type = 'child_quiz_complete' 
       AND created_at >= DATE_SUB(NOW(), INTERVAL 1 SECOND)`,
      []
    );
    expect(recentNotifications[0][0].count).toBe(0);

    // Cleanup
    await db.execute('DELETE FROM users WHERE id = ?', [studentId]);
  });
});
