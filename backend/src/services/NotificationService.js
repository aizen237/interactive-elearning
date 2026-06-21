const NotificationRepository = require('../repositories/NotificationRepository');
const NotificationPreferencesService = require('./NotificationPreferencesService');
const db = require('../config/db');

/**
 * NotificationService - Core notification creation and management
 * Handles notification creation with preference checking and parent fan-out
 */
class NotificationService {
  /**
   * Create a badge earned notification for a student
   * @param {number} studentId - Student user ID
   * @param {Object} badge - Badge object with name, icon_url
   * @returns {Promise<void>}
   */
  async notifyBadgeEarned(studentId, badge) {
    // Check if student has badge_earned notifications enabled
    const isEnabled = await NotificationPreferencesService.isNotificationEnabled(
      studentId,
      'badge_earned'
    );

    if (!isEnabled) {
      return; // Skip notification if preference is disabled
    }

    // Create notification with congratulatory message
    await NotificationRepository.create({
      user_id: studentId,
      notification_type: 'badge_earned',
      title: '🎉 New Badge Earned!',
      message: `Congratulations! You've earned the "${badge.name}" badge!`,
      metadata: {
        badge: {
          name: badge.name,
          icon_url: badge.icon_url
        }
      }
    });
  }

  /**
   * Create level up notification for student and milestone for parents
   * @param {number} studentId - Student user ID
   * @param {number} newLevel - New level reached
   * @param {string[]} unlockedModules - Names of newly unlocked modules
   * @returns {Promise<void>}
   */
  async notifyLevelUp(studentId, newLevel, unlockedModules = []) {
    // Check if student has level_up notifications enabled
    const isEnabled = await NotificationPreferencesService.isNotificationEnabled(
      studentId,
      'level_up'
    );

    if (!isEnabled) {
      return; // Skip notification if preference is disabled
    }

    // Build message with unlocked modules if any
    let message = `Congratulations! You've reached Level ${newLevel}!`;
    if (unlockedModules.length > 0) {
      message += ` You've unlocked: ${unlockedModules.join(', ')}`;
    }

    // Create notification for student
    await NotificationRepository.create({
      user_id: studentId,
      notification_type: 'level_up',
      title: `🎊 Level ${newLevel} Reached!`,
      message: message,
      metadata: {
        level: {
          new_level: newLevel,
          unlocked_modules: unlockedModules
        }
      }
    });
  }

  /**
   * Get linked parents for a student
   * @param {number} studentId - Student user ID
   * @returns {Promise<Array>} Array of parent user objects
   * @private
   */
  async _getLinkedParents(studentId) {
    const [parents] = await db.execute(
      `SELECT id, full_name FROM users WHERE id IN (
        SELECT parent_id FROM users WHERE id = ? AND parent_id IS NOT NULL
      )`,
      [studentId]
    );
    return parents;
  }

  /**
   * Create quiz completion notification for parents
   * @param {number} studentId - Student user ID
   * @param {string} studentName - Student's full name
   * @param {string} quizName - Quiz/content title
   * @param {number} scorePercentage - Score as percentage (0-100)
   * @returns {Promise<void>}
   */
  async notifyParentsQuizComplete(studentId, studentName, quizName, scorePercentage) {
    // Get linked parents for this student
    const parents = await this._getLinkedParents(studentId);

    // If no parents linked, skip notification creation
    if (parents.length === 0) {
      return;
    }

    // Fan-out: Create one notification per parent
    for (const parent of parents) {
      // Check if parent has child_quiz_complete notifications enabled
      const isEnabled = await NotificationPreferencesService.isNotificationEnabled(
        parent.id,
        'child_quiz_complete'
      );

      if (!isEnabled) {
        continue; // Skip this parent if preference is disabled
      }

      // Build message with positive indicator if score >= 80%
      let message = `${studentName} completed "${quizName}" with a score of ${scorePercentage}%`;
      if (scorePercentage >= 80) {
        message += ' 🌟';
      }

      // Create notification for parent
      await NotificationRepository.create({
        user_id: parent.id,
        notification_type: 'child_quiz_complete',
        title: '📝 Child Quiz Completed',
        message: message,
        metadata: {
          child: {
            student_id: studentId,
            student_name: studentName
          },
          quiz: {
            quiz_name: quizName,
            score_percentage: scorePercentage
          }
        }
      });
    }
  }

  /**
   * Create module completion milestone for parents
   * @param {number} studentId - Student user ID
   * @param {string} studentName - Student's full name
   * @param {string} moduleName - Module name
   * @param {number} completionPercentage - Completion percentage
   * @returns {Promise<void>}
   */
  async notifyParentsModuleMilestone(studentId, studentName, moduleName, completionPercentage) {
    // Only create notification if completion is exactly 50%
    if (completionPercentage !== 50) {
      return;
    }

    // Get linked parents for this student
    const parents = await this._getLinkedParents(studentId);

    // If no parents linked, skip notification creation
    if (parents.length === 0) {
      return;
    }

    // Fan-out: Create one notification per parent
    for (const parent of parents) {
      // Check if parent has child_milestone notifications enabled
      const isEnabled = await NotificationPreferencesService.isNotificationEnabled(
        parent.id,
        'child_milestone'
      );

      if (!isEnabled) {
        continue; // Skip this parent if preference is disabled
      }

      // Create notification for parent
      await NotificationRepository.create({
        user_id: parent.id,
        notification_type: 'child_milestone',
        title: '🎯 Child Milestone Reached',
        message: `${studentName} has reached 50% completion in "${moduleName}"`,
        metadata: {
          child: {
            student_id: studentId,
            student_name: studentName
          },
          milestone: {
            milestone_type: 'module_completion',
            details: `50% completion in ${moduleName}`
          }
        }
      });
    }
  }

  /**
   * Create admin operation notification
   * @param {number} adminId - Admin user ID
   * @param {string} operationType - Type of operation (e.g., 'bulk_user_upload')
   * @param {number} recordCount - Number of records processed
   * @param {number} errorCount - Number of errors encountered (default: 0)
   * @returns {Promise<void>}
   */
  async notifyAdminOperation(adminId, operationType, recordCount, errorCount = 0) {
    // Check if admin has admin_operation notifications enabled
    const isEnabled = await NotificationPreferencesService.isNotificationEnabled(
      adminId,
      'admin_operation'
    );

    if (!isEnabled) {
      return; // Skip notification if preference is disabled
    }

    // Build message with operation details
    let message = `Operation "${operationType}" completed: ${recordCount} records processed`;
    if (errorCount > 0) {
      message += `, ${errorCount} errors encountered`;
    }

    // Create notification for admin
    await NotificationRepository.create({
      user_id: adminId,
      notification_type: 'admin_operation',
      title: '⚙️ System Operation Completed',
      message: message,
      metadata: {
        operation: {
          operation_type: operationType,
          record_count: recordCount,
          error_count: errorCount
        }
      }
    });
  }

  /**
   * Create admin security notification
   * @param {number} adminId - Admin user ID
   * @param {string} eventType - Security event type (e.g., 'password_reset', 'new_device_login')
   * @param {string} timestamp - Event timestamp
   * @returns {Promise<void>}
   */
  async notifyAdminSecurity(adminId, eventType, timestamp) {
    // Check if admin has admin_security notifications enabled
    const isEnabled = await NotificationPreferencesService.isNotificationEnabled(
      adminId,
      'admin_security'
    );

    if (!isEnabled) {
      return; // Skip notification if preference is disabled
    }

    // Build message based on event type
    let message = `Security event: ${eventType} at ${timestamp}`;

    // Create notification for admin
    await NotificationRepository.create({
      user_id: adminId,
      notification_type: 'admin_security',
      title: '🔒 Security Alert',
      message: message,
      metadata: {
        security: {
          event_type: eventType,
          timestamp: timestamp
        }
      }
    });
  }

  /**
   * Process daily streak reminders for eligible students
   * Creates reminder notifications for students with 3+ day streaks who haven't practiced today
   * @returns {Promise<number>} Number of reminders sent
   */
  async processDailyStreakReminders() {
    const StreakService = require('./StreakService');
    
    // Get students eligible for streak reminders (3+ day streaks, no activity today)
    const eligibleStudents = await StreakService.getStreakReminderEligible();
    
    let remindersSent = 0;
    
    // Create reminder notification for each eligible student
    for (const student of eligibleStudents) {
      // Check if student has streak_reminder notifications enabled
      const isEnabled = await NotificationPreferencesService.isNotificationEnabled(
        student.student_id,
        'streak_reminder'
      );
      
      if (!isEnabled) {
        continue; // Skip this student if preference is disabled
      }
      
      // Create streak reminder notification
      await NotificationRepository.create({
        user_id: student.student_id,
        notification_type: 'streak_reminder',
        title: '🔥 Keep Your Streak Alive!',
        message: `You have a ${student.current_streak}-day streak! Don't break it - practice today!`,
        metadata: {
          streak: {
            current_streak: student.current_streak
          }
        }
      });
      
      remindersSent++;
    }
    
    return remindersSent;
  }
}

module.exports = new NotificationService();
