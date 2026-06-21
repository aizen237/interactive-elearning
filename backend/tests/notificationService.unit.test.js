const NotificationService = require('../src/services/NotificationService');
const NotificationRepository = require('../src/repositories/NotificationRepository');
const NotificationPreferencesService = require('../src/services/NotificationPreferencesService');
const dbTestHelper = require('./helpers/dbTestHelper');

/**
 * Unit Tests for NotificationService
 * Tests the core notification creation methods for students
 */

describe('NotificationService Unit Tests', () => {
  beforeEach(async () => {
    await dbTestHelper.cleanup();
  });

  afterEach(async () => {
    await dbTestHelper.cleanup();
  });

  afterAll(async () => {
    await dbTestHelper.cleanup();
  });

  describe('notifyBadgeEarned', () => {
    it('should create badge earned notification when preference is enabled', async () => {
      // Setup: Create test student
      const studentId = 10000;
      await dbTestHelper.createTestUser(studentId, 'Student');
      await NotificationPreferencesService.createDefaultPreferences(studentId);

      const badge = {
        name: 'First Steps',
        icon_url: '/badges/first-steps.png'
      };

      // Test: Create badge notification
      await NotificationService.notifyBadgeEarned(studentId, badge);

      // Verify: Notification was created
      const notifications = await dbTestHelper.getNotificationsByUser(studentId);
      expect(notifications.length).toBe(1);
      expect(notifications[0].notification_type).toBe('badge_earned');
      expect(notifications[0].title).toContain('Badge Earned');
      expect(notifications[0].message).toContain(badge.name);
      expect(notifications[0].metadata.badge.name).toBe(badge.name);
      expect(notifications[0].metadata.badge.icon_url).toBe(badge.icon_url);
      expect(notifications[0].is_read).toBe(0); // Unread by default
    });

    it('should not create notification when preference is disabled', async () => {
      // Setup: Create test student with badge notifications disabled
      const studentId = 10001;
      await dbTestHelper.createTestUser(studentId, 'Student');
      await NotificationPreferencesService.createDefaultPreferences(studentId);
      await NotificationPreferencesService.updatePreferences(studentId, {
        badge_earned: false
      });

      const badge = {
        name: 'Quiz Master',
        icon_url: '/badges/quiz-master.png'
      };

      // Test: Attempt to create badge notification
      await NotificationService.notifyBadgeEarned(studentId, badge);

      // Verify: No notification was created
      const notifications = await dbTestHelper.getNotificationsByUser(studentId);
      expect(notifications.length).toBe(0);
    });

    it('should include congratulatory messaging', async () => {
      // Setup
      const studentId = 10002;
      await dbTestHelper.createTestUser(studentId, 'Student');
      await NotificationPreferencesService.createDefaultPreferences(studentId);

      const badge = {
        name: 'Speed Demon',
        icon_url: '/badges/speed-demon.png'
      };

      // Test
      await NotificationService.notifyBadgeEarned(studentId, badge);

      // Verify: Message contains congratulatory text
      const notifications = await dbTestHelper.getNotificationsByUser(studentId);
      expect(notifications[0].message).toMatch(/congratulations/i);
    });
  });

  describe('notifyLevelUp', () => {
    it('should create level up notification when preference is enabled', async () => {
      // Setup: Create test student
      const studentId = 10100;
      await dbTestHelper.createTestUser(studentId, 'Student');
      await NotificationPreferencesService.createDefaultPreferences(studentId);

      const newLevel = 5;
      const unlockedModules = ['Advanced Math', 'Science Basics'];

      // Test: Create level up notification
      await NotificationService.notifyLevelUp(studentId, newLevel, unlockedModules);

      // Verify: Notification was created
      const notifications = await dbTestHelper.getNotificationsByUser(studentId);
      expect(notifications.length).toBe(1);
      expect(notifications[0].notification_type).toBe('level_up');
      expect(notifications[0].title).toContain(`Level ${newLevel}`);
      expect(notifications[0].message).toContain(`Level ${newLevel}`);
      expect(notifications[0].metadata.level.new_level).toBe(newLevel);
      expect(notifications[0].metadata.level.unlocked_modules).toEqual(unlockedModules);
      expect(notifications[0].is_read).toBe(0);
    });

    it('should include unlocked modules in message when provided', async () => {
      // Setup
      const studentId = 10101;
      await dbTestHelper.createTestUser(studentId, 'Student');
      await NotificationPreferencesService.createDefaultPreferences(studentId);

      const newLevel = 3;
      const unlockedModules = ['Module A', 'Module B'];

      // Test
      await NotificationService.notifyLevelUp(studentId, newLevel, unlockedModules);

      // Verify: Message includes unlocked modules
      const notifications = await dbTestHelper.getNotificationsByUser(studentId);
      expect(notifications[0].message).toContain('Module A');
      expect(notifications[0].message).toContain('Module B');
      expect(notifications[0].message).toContain('unlocked');
    });

    it('should work with empty unlocked modules array', async () => {
      // Setup
      const studentId = 10102;
      await dbTestHelper.createTestUser(studentId, 'Student');
      await NotificationPreferencesService.createDefaultPreferences(studentId);

      const newLevel = 2;
      const unlockedModules = [];

      // Test
      await NotificationService.notifyLevelUp(studentId, newLevel, unlockedModules);

      // Verify: Notification created without unlocked modules
      const notifications = await dbTestHelper.getNotificationsByUser(studentId);
      expect(notifications.length).toBe(1);
      expect(notifications[0].metadata.level.new_level).toBe(newLevel);
      expect(notifications[0].metadata.level.unlocked_modules).toEqual([]);
      expect(notifications[0].message).not.toContain('unlocked');
    });

    it('should not create notification when preference is disabled', async () => {
      // Setup: Create test student with level_up notifications disabled
      const studentId = 10103;
      await dbTestHelper.createTestUser(studentId, 'Student');
      await NotificationPreferencesService.createDefaultPreferences(studentId);
      await NotificationPreferencesService.updatePreferences(studentId, {
        level_up: false
      });

      // Test: Attempt to create level up notification
      await NotificationService.notifyLevelUp(studentId, 10, ['Module X']);

      // Verify: No notification was created
      const notifications = await dbTestHelper.getNotificationsByUser(studentId);
      expect(notifications.length).toBe(0);
    });
  });

  describe('notifyParentsQuizComplete', () => {
    it('should create notifications for all linked parents when student completes quiz', async () => {
      // Setup: Create student and two parents
      const studentId = 10200;
      const parent1Id = 10201;
      const parent2Id = 10202;
      
      await dbTestHelper.createTestUser(studentId, 'Student');
      await dbTestHelper.createTestUser(parent1Id, 'Parent');
      await dbTestHelper.createTestUser(parent2Id, 'Parent');
      
      // Link student to both parents (note: schema only supports one parent_id)
      // For this test, we'll link to parent1
      await dbTestHelper.linkStudentToParent(studentId, parent1Id);
      
      // Create default preferences for parents
      await NotificationPreferencesService.createDefaultPreferences(parent1Id);
      await NotificationPreferencesService.createDefaultPreferences(parent2Id);

      // Test: Create quiz completion notification
      await NotificationService.notifyParentsQuizComplete(
        studentId,
        'Test Student',
        'Math Quiz 1',
        85
      );

      // Verify: Parent received notification
      const parent1Notifications = await dbTestHelper.getNotificationsByUser(parent1Id);
      expect(parent1Notifications.length).toBe(1);
      expect(parent1Notifications[0].notification_type).toBe('child_quiz_complete');
      expect(parent1Notifications[0].title).toContain('Child Quiz Completed');
      expect(parent1Notifications[0].message).toContain('Test Student');
      expect(parent1Notifications[0].message).toContain('Math Quiz 1');
      expect(parent1Notifications[0].message).toContain('85%');
      expect(parent1Notifications[0].metadata.child.student_id).toBe(studentId);
      expect(parent1Notifications[0].metadata.quiz.score_percentage).toBe(85);
    });

    it('should include positive indicator when score >= 80%', async () => {
      // Setup
      const studentId = 10203;
      const parentId = 10204;
      
      await dbTestHelper.createTestUser(studentId, 'Student');
      await dbTestHelper.createTestUser(parentId, 'Parent');
      await dbTestHelper.linkStudentToParent(studentId, parentId);
      await NotificationPreferencesService.createDefaultPreferences(parentId);

      // Test: High score (>= 80%)
      await NotificationService.notifyParentsQuizComplete(
        studentId,
        'Test Student',
        'Science Quiz',
        90
      );

      // Verify: Message includes positive indicator
      const notifications = await dbTestHelper.getNotificationsByUser(parentId);
      expect(notifications[0].message).toContain('🌟');
    });

    it('should not include positive indicator when score < 80%', async () => {
      // Setup
      const studentId = 10205;
      const parentId = 10206;
      
      await dbTestHelper.createTestUser(studentId, 'Student');
      await dbTestHelper.createTestUser(parentId, 'Parent');
      await dbTestHelper.linkStudentToParent(studentId, parentId);
      await NotificationPreferencesService.createDefaultPreferences(parentId);

      // Test: Lower score (< 80%)
      await NotificationService.notifyParentsQuizComplete(
        studentId,
        'Test Student',
        'History Quiz',
        75
      );

      // Verify: Message does not include positive indicator
      const notifications = await dbTestHelper.getNotificationsByUser(parentId);
      expect(notifications[0].message).not.toContain('🌟');
    });

    it('should not create notification when parent preference is disabled', async () => {
      // Setup
      const studentId = 10207;
      const parentId = 10208;
      
      await dbTestHelper.createTestUser(studentId, 'Student');
      await dbTestHelper.createTestUser(parentId, 'Parent');
      await dbTestHelper.linkStudentToParent(studentId, parentId);
      await NotificationPreferencesService.createDefaultPreferences(parentId);
      
      // Disable child_quiz_complete preference
      await NotificationPreferencesService.updatePreferences(parentId, {
        child_quiz_complete: false
      });

      // Test: Attempt to create notification
      await NotificationService.notifyParentsQuizComplete(
        studentId,
        'Test Student',
        'English Quiz',
        88
      );

      // Verify: No notification created
      const notifications = await dbTestHelper.getNotificationsByUser(parentId);
      expect(notifications.length).toBe(0);
    });

    it('should handle student with no linked parents gracefully', async () => {
      // Setup: Student with no parent
      const studentId = 10209;
      await dbTestHelper.createTestUser(studentId, 'Student');

      // Test: Should not throw error
      await expect(
        NotificationService.notifyParentsQuizComplete(
          studentId,
          'Test Student',
          'Quiz',
          80
        )
      ).resolves.not.toThrow();
    });
  });

  describe('notifyParentsModuleMilestone', () => {
    it('should create notifications for parents when student reaches 50% module completion', async () => {
      // Setup: Create student and parent
      const studentId = 10300;
      const parentId = 10301;
      
      await dbTestHelper.createTestUser(studentId, 'Student');
      await dbTestHelper.createTestUser(parentId, 'Parent');
      await dbTestHelper.linkStudentToParent(studentId, parentId);
      await NotificationPreferencesService.createDefaultPreferences(parentId);

      // Test: Create milestone notification at 50%
      await NotificationService.notifyParentsModuleMilestone(
        studentId,
        'Test Student',
        'Algebra Basics',
        50
      );

      // Verify: Parent received notification
      const notifications = await dbTestHelper.getNotificationsByUser(parentId);
      expect(notifications.length).toBe(1);
      expect(notifications[0].notification_type).toBe('child_milestone');
      expect(notifications[0].title).toContain('Child Milestone Reached');
      expect(notifications[0].message).toContain('Test Student');
      expect(notifications[0].message).toContain('50% completion');
      expect(notifications[0].message).toContain('Algebra Basics');
      expect(notifications[0].metadata.child.student_id).toBe(studentId);
      expect(notifications[0].metadata.milestone.milestone_type).toBe('module_completion');
    });

    it('should not create notification when completion is not 50%', async () => {
      // Setup
      const studentId = 10302;
      const parentId = 10303;
      
      await dbTestHelper.createTestUser(studentId, 'Student');
      await dbTestHelper.createTestUser(parentId, 'Parent');
      await dbTestHelper.linkStudentToParent(studentId, parentId);
      await NotificationPreferencesService.createDefaultPreferences(parentId);

      // Test: Try with 25% completion
      await NotificationService.notifyParentsModuleMilestone(
        studentId,
        'Test Student',
        'Geometry',
        25
      );

      // Verify: No notification created
      let notifications = await dbTestHelper.getNotificationsByUser(parentId);
      expect(notifications.length).toBe(0);

      // Test: Try with 75% completion
      await NotificationService.notifyParentsModuleMilestone(
        studentId,
        'Test Student',
        'Geometry',
        75
      );

      // Verify: Still no notification
      notifications = await dbTestHelper.getNotificationsByUser(parentId);
      expect(notifications.length).toBe(0);
    });

    it('should not create notification when parent preference is disabled', async () => {
      // Setup
      const studentId = 10304;
      const parentId = 10305;
      
      await dbTestHelper.createTestUser(studentId, 'Student');
      await dbTestHelper.createTestUser(parentId, 'Parent');
      await dbTestHelper.linkStudentToParent(studentId, parentId);
      await NotificationPreferencesService.createDefaultPreferences(parentId);
      
      // Disable child_milestone preference
      await NotificationPreferencesService.updatePreferences(parentId, {
        child_milestone: false
      });

      // Test: Attempt to create notification at 50%
      await NotificationService.notifyParentsModuleMilestone(
        studentId,
        'Test Student',
        'Physics',
        50
      );

      // Verify: No notification created
      const notifications = await dbTestHelper.getNotificationsByUser(parentId);
      expect(notifications.length).toBe(0);
    });

    it('should handle student with no linked parents gracefully', async () => {
      // Setup: Student with no parent
      const studentId = 10306;
      await dbTestHelper.createTestUser(studentId, 'Student');

      // Test: Should not throw error
      await expect(
        NotificationService.notifyParentsModuleMilestone(
          studentId,
          'Test Student',
          'Chemistry',
          50
        )
      ).resolves.not.toThrow();
    });
  });

  describe('notifyAdminOperation', () => {
    it('should create admin operation notification when preference is enabled', async () => {
      // Setup: Create test admin
      const adminId = 10400;
      await dbTestHelper.createTestUser(adminId, 'Admin');
      await NotificationPreferencesService.createDefaultPreferences(adminId);

      // Test: Create operation notification without errors
      await NotificationService.notifyAdminOperation(
        adminId,
        'bulk_user_upload',
        150,
        0
      );

      // Verify: Notification was created
      const notifications = await dbTestHelper.getNotificationsByUser(adminId);
      expect(notifications.length).toBe(1);
      expect(notifications[0].notification_type).toBe('admin_operation');
      expect(notifications[0].title).toContain('System Operation Completed');
      expect(notifications[0].message).toContain('bulk_user_upload');
      expect(notifications[0].message).toContain('150 records processed');
      expect(notifications[0].metadata.operation.operation_type).toBe('bulk_user_upload');
      expect(notifications[0].metadata.operation.record_count).toBe(150);
      expect(notifications[0].metadata.operation.error_count).toBe(0);
      expect(notifications[0].is_read).toBe(0);
    });

    it('should include error count in message when errors > 0', async () => {
      // Setup: Create test admin
      const adminId = 10401;
      await dbTestHelper.createTestUser(adminId, 'Admin');
      await NotificationPreferencesService.createDefaultPreferences(adminId);

      // Test: Create operation notification with errors
      await NotificationService.notifyAdminOperation(
        adminId,
        'data_import',
        200,
        15
      );

      // Verify: Message includes error count
      const notifications = await dbTestHelper.getNotificationsByUser(adminId);
      expect(notifications.length).toBe(1);
      expect(notifications[0].message).toContain('15 errors encountered');
      expect(notifications[0].metadata.operation.error_count).toBe(15);
    });

    it('should not include error count in message when errors = 0', async () => {
      // Setup: Create test admin
      const adminId = 10402;
      await dbTestHelper.createTestUser(adminId, 'Admin');
      await NotificationPreferencesService.createDefaultPreferences(adminId);

      // Test: Create operation notification without errors
      await NotificationService.notifyAdminOperation(
        adminId,
        'batch_update',
        100,
        0
      );

      // Verify: Message does not include error text
      const notifications = await dbTestHelper.getNotificationsByUser(adminId);
      expect(notifications[0].message).not.toContain('errors encountered');
    });

    it('should not create notification when preference is disabled', async () => {
      // Setup: Create test admin with admin_operation notifications disabled
      const adminId = 10403;
      await dbTestHelper.createTestUser(adminId, 'Admin');
      await NotificationPreferencesService.createDefaultPreferences(adminId);
      await NotificationPreferencesService.updatePreferences(adminId, {
        admin_operation: false
      });

      // Test: Attempt to create operation notification
      await NotificationService.notifyAdminOperation(
        adminId,
        'cleanup_job',
        50,
        0
      );

      // Verify: No notification was created
      const notifications = await dbTestHelper.getNotificationsByUser(adminId);
      expect(notifications.length).toBe(0);
    });

    it('should handle errorCount parameter defaulting to 0', async () => {
      // Setup: Create test admin
      const adminId = 10404;
      await dbTestHelper.createTestUser(adminId, 'Admin');
      await NotificationPreferencesService.createDefaultPreferences(adminId);

      // Test: Create operation notification without errorCount parameter
      await NotificationService.notifyAdminOperation(
        adminId,
        'export_data',
        75
      );

      // Verify: Error count defaults to 0
      const notifications = await dbTestHelper.getNotificationsByUser(adminId);
      expect(notifications[0].metadata.operation.error_count).toBe(0);
      expect(notifications[0].message).not.toContain('errors encountered');
    });
  });

  describe('notifyAdminSecurity', () => {
    it('should create admin security notification when preference is enabled', async () => {
      // Setup: Create test admin
      const adminId = 10500;
      await dbTestHelper.createTestUser(adminId, 'Admin');
      await NotificationPreferencesService.createDefaultPreferences(adminId);

      const timestamp = '2024-01-15T10:30:00Z';

      // Test: Create security notification
      await NotificationService.notifyAdminSecurity(
        adminId,
        'password_reset',
        timestamp
      );

      // Verify: Notification was created
      const notifications = await dbTestHelper.getNotificationsByUser(adminId);
      expect(notifications.length).toBe(1);
      expect(notifications[0].notification_type).toBe('admin_security');
      expect(notifications[0].title).toContain('Security Alert');
      expect(notifications[0].message).toContain('password_reset');
      expect(notifications[0].message).toContain(timestamp);
      expect(notifications[0].metadata.security.event_type).toBe('password_reset');
      expect(notifications[0].metadata.security.timestamp).toBe(timestamp);
      expect(notifications[0].is_read).toBe(0);
    });

    it('should create notification for new device login event', async () => {
      // Setup: Create test admin
      const adminId = 10501;
      await dbTestHelper.createTestUser(adminId, 'Admin');
      await NotificationPreferencesService.createDefaultPreferences(adminId);

      const timestamp = '2024-01-15T14:45:30Z';

      // Test: Create security notification for new device login
      await NotificationService.notifyAdminSecurity(
        adminId,
        'new_device_login',
        timestamp
      );

      // Verify: Notification was created with correct event type
      const notifications = await dbTestHelper.getNotificationsByUser(adminId);
      expect(notifications.length).toBe(1);
      expect(notifications[0].message).toContain('new_device_login');
      expect(notifications[0].metadata.security.event_type).toBe('new_device_login');
    });

    it('should not create notification when preference is disabled', async () => {
      // Setup: Create test admin with admin_security notifications disabled
      const adminId = 10502;
      await dbTestHelper.createTestUser(adminId, 'Admin');
      await NotificationPreferencesService.createDefaultPreferences(adminId);
      await NotificationPreferencesService.updatePreferences(adminId, {
        admin_security: false
      });

      // Test: Attempt to create security notification
      await NotificationService.notifyAdminSecurity(
        adminId,
        'password_reset',
        '2024-01-15T10:00:00Z'
      );

      // Verify: No notification was created
      const notifications = await dbTestHelper.getNotificationsByUser(adminId);
      expect(notifications.length).toBe(0);
    });

    it('should include event type and timestamp in notification content', async () => {
      // Setup: Create test admin
      const adminId = 10503;
      await dbTestHelper.createTestUser(adminId, 'Admin');
      await NotificationPreferencesService.createDefaultPreferences(adminId);

      const eventType = 'suspicious_login_attempt';
      const timestamp = '2024-01-15T22:15:45Z';

      // Test: Create security notification
      await NotificationService.notifyAdminSecurity(
        adminId,
        eventType,
        timestamp
      );

      // Verify: Both event type and timestamp are in message and metadata
      const notifications = await dbTestHelper.getNotificationsByUser(adminId);
      expect(notifications[0].message).toContain(eventType);
      expect(notifications[0].message).toContain(timestamp);
      expect(notifications[0].metadata.security.event_type).toBe(eventType);
      expect(notifications[0].metadata.security.timestamp).toBe(timestamp);
    });
  });
});
