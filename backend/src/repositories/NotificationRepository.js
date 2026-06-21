const db = require('../config/db');

/**
 * NotificationRepository - Data access layer for notifications
 * Handles all database operations for the notifications table
 */
class NotificationRepository {
  /**
   * Create a new notification
   * @param {Object} notificationData - Notification data
   * @param {number} notificationData.user_id - User ID
   * @param {string} notificationData.notification_type - Type of notification
   * @param {string} notificationData.title - Notification title
   * @param {string} notificationData.message - Notification message
   * @param {Object} [notificationData.metadata] - Optional metadata
   * @returns {Promise<number>} Notification ID
   */
  async create(notificationData) {
    const { user_id, notification_type, title, message, metadata } = notificationData;
    
    const [result] = await db.execute(
      `INSERT INTO notifications (user_id, notification_type, title, message, metadata, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, FALSE, CURRENT_TIMESTAMP(3))`,
      [user_id, notification_type, title, message, metadata ? JSON.stringify(metadata) : null]
    );
    
    return result.insertId;
  }

  /**
   * Get notifications for a user with pagination
   * @param {number} userId - User ID
   * @param {number} page - Page number (1-indexed)
   * @param {number} limit - Number of notifications per page
   * @returns {Promise<Object>} { notifications: Array, total: number }
   */
  async getByUser(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    
    // Get paginated notifications
    const [notifications] = await db.execute(
      `SELECT id, user_id, notification_type, title, message, metadata, is_read, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );
    
    // Get total count
    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total FROM notifications WHERE user_id = ?`,
      [userId]
    );
    
    // Parse metadata JSON strings back to objects
    const parsedNotifications = notifications.map(n => ({
      ...n,
      metadata: n.metadata ? JSON.parse(n.metadata) : null
    }));
    
    return {
      notifications: parsedNotifications,
      total: countResult[0].total
    };
  }

  /**
   * Get unread notification count for a user
   * @param {number} userId - User ID
   * @returns {Promise<number>} Count of unread notifications
   */
  async getUnreadCount(userId) {
    const [result] = await db.execute(
      `SELECT COUNT(*) as count
       FROM notifications
       WHERE user_id = ? 
         AND is_read = FALSE
         AND created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)`,
      [userId]
    );
    
    return result[0].count;
  }

  /**
   * Mark a notification as read
   * @param {number} notificationId - Notification ID
   * @param {number} userId - User ID (for authorization check)
   * @returns {Promise<boolean>} True if updated, false if not found or unauthorized
   */
  async markAsRead(notificationId, userId) {
    const [result] = await db.execute(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE id = ? AND user_id = ?`,
      [notificationId, userId]
    );
    
    return result.affectedRows > 0;
  }

  /**
   * Mark all notifications as read for a user
   * @param {number} userId - User ID
   * @returns {Promise<number>} Number of notifications updated
   */
  async markAllAsRead(userId) {
    const [result] = await db.execute(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE user_id = ? AND is_read = FALSE`,
      [userId]
    );
    
    return result.affectedRows;
  }

  /**
   * Delete notifications older than retention period
   * @param {number} retentionDays - Number of days to retain notifications
   * @returns {Promise<number>} Number of notifications deleted
   */
  async deleteOldNotifications(retentionDays) {
    const [result] = await db.execute(
      `DELETE FROM notifications
       WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [retentionDays]
    );
    
    return result.affectedRows;
  }
}

module.exports = new NotificationRepository();
