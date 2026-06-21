const db = require('../config/db');

/**
 * NotificationPreferencesService - Manages user notification preferences
 * Handles preference retrieval, updates, and enforcement
 */
class NotificationPreferencesService {
  /**
   * Get user's notification preferences
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Preferences object
   */
  async getPreferences(userId) {
    const [rows] = await db.execute(
      `SELECT id, user_id, badge_earned, level_up, streak_reminder,
              child_quiz_complete, child_milestone, admin_operation, 
              admin_security, updated_at
       FROM notification_preferences
       WHERE user_id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      // If preferences don't exist, create default preferences
      await this.createDefaultPreferences(userId);
      return await this.getPreferences(userId);
    }

    // Convert MySQL BOOLEAN (0/1) to JavaScript boolean
    const prefs = rows[0];
    return {
      ...prefs,
      badge_earned: Boolean(prefs.badge_earned),
      level_up: Boolean(prefs.level_up),
      streak_reminder: Boolean(prefs.streak_reminder),
      child_quiz_complete: Boolean(prefs.child_quiz_complete),
      child_milestone: Boolean(prefs.child_milestone),
      admin_operation: Boolean(prefs.admin_operation),
      admin_security: Boolean(prefs.admin_security)
    };
  }

  /**
   * Update user's notification preferences
   * @param {number} userId - User ID
   * @param {Object} updates - Partial preferences object
   * @returns {Promise<Object>} Updated preferences
   */
  async updatePreferences(userId, updates) {
    // Validate that updates only contain valid preference fields
    const validFields = [
      'badge_earned',
      'level_up',
      'streak_reminder',
      'child_quiz_complete',
      'child_milestone',
      'admin_operation',
      'admin_security'
    ];

    const updateFields = Object.keys(updates).filter(key => validFields.includes(key));
    
    if (updateFields.length === 0) {
      throw new Error('No valid preference fields to update');
    }

    // Build dynamic UPDATE query
    const setClause = updateFields.map(field => `${field} = ?`).join(', ');
    const values = updateFields.map(field => updates[field]);
    values.push(userId);

    await db.execute(
      `UPDATE notification_preferences
       SET ${setClause}
       WHERE user_id = ?`,
      values
    );

    return await this.getPreferences(userId);
  }

  /**
   * Check if notification type is enabled for user
   * @param {number} userId - User ID
   * @param {string} notificationType - Notification type
   * @returns {Promise<boolean>}
   */
  async isNotificationEnabled(userId, notificationType) {
    const preferences = await this.getPreferences(userId);
    
    // Map notification types to preference fields
    const typeToField = {
      'badge_earned': 'badge_earned',
      'level_up': 'level_up',
      'streak_reminder': 'streak_reminder',
      'child_quiz_complete': 'child_quiz_complete',
      'child_milestone': 'child_milestone',
      'admin_operation': 'admin_operation',
      'admin_security': 'admin_security'
    };

    const field = typeToField[notificationType];
    if (!field) {
      throw new Error(`Invalid notification type: ${notificationType}`);
    }

    // MySQL returns BOOLEAN as 0/1, convert to boolean
    return preferences[field] === 1 || preferences[field] === true;
  }

  /**
   * Create default preferences for new user
   * @param {number} userId - User ID
   * @returns {Promise<void>}
   */
  async createDefaultPreferences(userId) {
    await db.execute(
      `INSERT INTO notification_preferences 
       (user_id, badge_earned, level_up, streak_reminder, 
        child_quiz_complete, child_milestone, admin_operation, admin_security)
       VALUES (?, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE)
       ON DUPLICATE KEY UPDATE user_id = user_id`,
      [userId]
    );
  }
}

module.exports = new NotificationPreferencesService();
