const db = require('../../src/config/db');

/**
 * Database test helper utilities
 */
class DbTestHelper {
  /**
   * Clean up test data from notifications table
   */
  async cleanupNotifications() {
    // Clean up all test notifications (user_id >= 10000)
    await db.execute('DELETE FROM notifications WHERE user_id >= 10000');
  }

  /**
   * Clean up test users
   */
  async cleanupTestUsers() {
    // Clean up all test users (id >= 10000)
    await db.execute('DELETE FROM users WHERE id >= 10000');
  }

  /**
   * Clean up test preferences
   */
  async cleanupTestPreferences() {
    // Clean up all test preferences (user_id >= 10000)
    await db.execute('DELETE FROM notification_preferences WHERE user_id >= 10000');
  }

  /**
   * Clean up test streaks
   */
  async cleanupTestStreaks() {
    // Clean up all test streaks (student_id >= 10000)
    await db.execute('DELETE FROM student_streaks WHERE student_id >= 10000');
  }

  /**
   * Create a test user
   * @param {number} userId - User ID
   * @param {string} role - User role
   * @returns {Promise<number>} User ID
   */
  async createTestUser(userId, role = 'Student') {
    try {
      // First, try to delete any existing user with this ID
      await db.execute('DELETE FROM users WHERE id = ?', [userId]);
      
      // Insert the new user
      const [result] = await db.execute(
        `INSERT INTO users (id, username, password, role, full_name)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, `testuser${userId}`, 'hashedpass', role, `Test User ${userId}`]
      );
      
      // Verify insertion succeeded
      if (result.affectedRows === 0) {
        throw new Error(`INSERT returned 0 affected rows for user ${userId}`);
      }
      
      // Verify the user exists before returning
      const [users] = await db.execute('SELECT id FROM users WHERE id = ?', [userId]);
      if (users.length === 0) {
        throw new Error(`User ${userId} was not found after insertion`);
      }
      
      return userId;
    } catch (error) {
      console.error(`Failed to create test user ${userId}:`, error.message);
      throw error;
    }
  }

  /**
   * Create multiple test users
   * @param {number} count - Number of users to create
   * @param {number} startId - Starting user ID
   * @param {string} role - User role
   * @returns {Promise<number[]>} Array of user IDs
   */
  async createTestUsers(count, startId = 10000, role = 'Student') {
    const userIds = [];
    for (let i = 0; i < count; i++) {
      const userId = startId + i;
      await this.createTestUser(userId, role);
      userIds.push(userId);
    }
    return userIds;
  }

  /**
   * Link a student to a parent
   * @param {number} studentId - Student user ID
   * @param {number} parentId - Parent user ID
   * @returns {Promise<void>}
   */
  async linkStudentToParent(studentId, parentId) {
    await db.execute(
      'UPDATE users SET parent_id = ? WHERE id = ?',
      [parentId, studentId]
    );
  }

  /**
   * Get all notifications for a user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Array of notifications
   */
  async getNotificationsByUser(userId) {
    const [notifications] = await db.execute(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return notifications.map(n => ({
      ...n,
      metadata: n.metadata ? JSON.parse(n.metadata) : null
    }));
  }

  /**
   * Clean up all test data
   */
  async cleanup() {
    // Order matters: delete child records first due to foreign keys
    await this.cleanupNotifications();
    await this.cleanupTestPreferences();
    await this.cleanupTestStreaks();
    await this.cleanupTestUsers();
  }

  /**
   * Close database connection (for test cleanup)
   */
  async closeConnection() {
    await db.end();
  }
}

module.exports = new DbTestHelper();
