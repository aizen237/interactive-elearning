// src/models/User.js
const db = require('../config/db');

class User {
  /**
   * Find user by username
   * @param {string} username 
   * @returns {Promise<Object|null>} User object or null
   */
  static async findByUsername(username) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM users WHERE username = ?',
        [username]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw new Error(`Database error in findByUsername: ${error.message}`);
    }
  }

  /**
   * Find user by ID
   * @param {number} id 
   * @returns {Promise<Object|null>} User object or null
   */
  static async findById(id) {
    try {
      const [rows] = await db.execute(
        'SELECT id, username, full_name, role, phone_number, created_at FROM users WHERE id = ?',
        [id]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw new Error(`Database error in findById: ${error.message}`);
    }
  }

  /**
   * Create new user
   * @param {Object} userData - {username, password, full_name, role, phone_number}
   * @returns {Promise<Object>} Created user object with ID
   */
  static async create(userData) {
    const { username, password, full_name, role, phone_number } = userData;
    
    try {
      const [result] = await db.execute(
        `INSERT INTO users (username, password, full_name, role, phone_number) 
         VALUES (?, ?, ?, ?, ?)`,
        [username, password, full_name, role, phone_number]
      );
      
      // Return the created user (without password)
      return {
        id: result.insertId,
        username,
        full_name,
        role,
        phone_number
      };
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Username already exists');
      }
      throw new Error(`Database error in create: ${error.message}`);
    }
  }

  /**
   * Update user information
   * @param {number} id - User ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<boolean>} Success status
   */
  static async update(id, updates) {
    try {
      // Build dynamic UPDATE query based on provided fields
      const allowedFields = ['full_name', 'phone_number', 'password'];
      const fields = Object.keys(updates).filter(key => allowedFields.includes(key));
      
      if (fields.length === 0) {
        throw new Error('No valid fields to update');
      }

      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const values = fields.map(field => updates[field]);
      values.push(id);

      const [result] = await db.execute(
        `UPDATE users SET ${setClause} WHERE id = ?`,
        values
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Database error in update: ${error.message}`);
    }
  }

  /**
   * Find users by role (for role-based filtering)
   * @param {string} role 
   * @returns {Promise<Array>} Array of user objects
   */
  static async findByRole(role) {
    try {
      const [rows] = await db.execute(
        'SELECT id, username, full_name, role, phone_number, created_at FROM users WHERE role = ?',
        [role]
      );
      return rows;
    } catch (error) {
      throw new Error(`Database error in findByRole: ${error.message}`);
    }
  }

  /**
   * Check if username exists (for registration validation)
   * @param {string} username 
   * @returns {Promise<boolean>}
   */
  static async usernameExists(username) {
    try {
      const [rows] = await db.execute(
        'SELECT id FROM users WHERE username = ?',
        [username]
      );
      return rows.length > 0;
    } catch (error) {
      throw new Error(`Database error in usernameExists: ${error.message}`);
    }
  }

  /**
   * Find all users with optional filters and pagination
   * @param {Object} filters - { role, status, search }
   * @param {Object} pagination - { page, limit }
   * @returns {Promise<Object>} { users: Array, total: number, page: number, totalPages: number }
   */
  static async findAll(filters = {}, pagination = {}) {
    try {
      const { role, status, search } = filters;
      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      // Build WHERE clause dynamically
      const conditions = [];
      const params = [];

      if (role) {
        conditions.push('role = ?');
        params.push(role);
      }

      if (status) {
        conditions.push('status = ?');
        params.push(status);
      }

      if (search) {
        conditions.push('(full_name LIKE ? OR username LIKE ?)');
        params.push(`%${search}%`, `%${search}%`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Get total count
      const [countResult] = await db.execute(
        `SELECT COUNT(*) as total FROM users ${whereClause}`,
        params
      );
      const total = countResult[0].total;

      // Get paginated users
      const [rows] = await db.execute(
        `SELECT id, username, full_name, role, phone_number, created_at, status, parent_id 
         FROM users 
         ${whereClause}
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      return {
        users: rows,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      throw new Error(`Database error in findAll: ${error.message}`);
    }
  }

  /**
   * Search users by name or email with pagination
   * @param {string} query - Search query
   * @param {Object} pagination - { page, limit }
   * @returns {Promise<Object>} { users: Array, total: number, page: number, totalPages: number }
   */
  static async search(query, pagination = {}) {
    try {
      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      // Get total count
      const [countResult] = await db.execute(
        `SELECT COUNT(*) as total FROM users 
         WHERE full_name LIKE ? OR username LIKE ?`,
        [`%${query}%`, `%${query}%`]
      );
      const total = countResult[0].total;

      // Get paginated results
      const [rows] = await db.execute(
        `SELECT id, username, full_name, role, phone_number, created_at, status, parent_id 
         FROM users 
         WHERE full_name LIKE ? OR username LIKE ?
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [`%${query}%`, `%${query}%`, limit, offset]
      );

      return {
        users: rows,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      throw new Error(`Database error in search: ${error.message}`);
    }
  }

  /**
   * Deactivate a user account
   * @param {number} userId - User ID to deactivate
   * @returns {Promise<boolean>} Success status
   */
  static async deactivate(userId) {
    try {
      const [result] = await db.execute(
        'UPDATE users SET status = ? WHERE id = ?',
        ['inactive', userId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Database error in deactivate: ${error.message}`);
    }
  }

  /**
   * Activate a user account
   * @param {number} userId - User ID to activate
   * @returns {Promise<boolean>} Success status
   */
  static async activate(userId) {
    try {
      const [result] = await db.execute(
        'UPDATE users SET status = ? WHERE id = ?',
        ['active', userId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Database error in activate: ${error.message}`);
    }
  }

  /**
   * Get detailed user information with related data
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} Detailed user object with related data
   */
  static async getDetailedInfo(userId) {
    try {
      // Get basic user info
      const [userRows] = await db.execute(
        `SELECT id, username, full_name, role, phone_number, created_at, status, parent_id 
         FROM users WHERE id = ?`,
        [userId]
      );

      if (userRows.length === 0) {
        return null;
      }

      const user = userRows[0];

      // If student, get additional student data
      if (user.role === 'Student') {
        // Get student profile (XP, level)
        const [profile] = await db.execute(
          'SELECT total_xp, current_level FROM student_profiles WHERE student_id = ?',
          [userId]
        );

        // Get badges
        const [badges] = await db.execute(
          `SELECT b.id, b.name, b.description, b.icon_url, sb.awarded_at 
           FROM student_badges sb
           JOIN badges b ON sb.badge_id = b.id
           WHERE sb.student_id = ?
           ORDER BY sb.awarded_at DESC`,
          [userId]
        );

        // Get quiz attempts count
        const [quizAttempts] = await db.execute(
          'SELECT COUNT(DISTINCT content_id) as total FROM score_logs WHERE student_id = ?',
          [userId]
        );

        // Get module progress
        const [moduleProgress] = await db.execute(
          `SELECT m.id, m.name, sp.completed, sp.completed_at
           FROM student_progress sp
           JOIN modules m ON sp.module_id = m.id
           WHERE sp.student_id = ?`,
          [userId]
        );

        user.studentData = {
          totalXP: profile[0]?.total_xp || 0,
          currentLevel: profile[0]?.current_level || 1,
          badges: badges,
          quizAttempts: quizAttempts[0].total,
          moduleProgress: moduleProgress
        };
      }

      // If parent, get linked children
      if (user.role === 'Parent') {
        const [children] = await db.execute(
          `SELECT id, username, full_name, created_at 
           FROM users 
           WHERE parent_id = ? AND role = 'Student'
           ORDER BY full_name ASC`,
          [userId]
        );

        user.children = children;
      }

      return user;
    } catch (error) {
      throw new Error(`Database error in getDetailedInfo: ${error.message}`);
    }
  }

  /**
   * Bulk create users from array
   * @param {Array} usersArray - Array of user objects
   * @returns {Promise<Object>} { successful: Array, failed: Array }
   */
  static async bulkCreate(usersArray) {
    const results = {
      successful: [],
      failed: []
    };

    for (let i = 0; i < usersArray.length; i++) {
      const userData = usersArray[i];
      try {
        // Validate required fields
        if (!userData.username || !userData.password || !userData.full_name || !userData.role) {
          results.failed.push({
            row: i + 1,
            data: userData,
            error: 'Missing required fields (username, password, full_name, role)'
          });
          continue;
        }

        // Check if username already exists
        const exists = await this.usernameExists(userData.username);
        if (exists) {
          results.failed.push({
            row: i + 1,
            data: userData,
            error: `Username '${userData.username}' already exists`
          });
          continue;
        }

        // Create user
        const createdUser = await this.create(userData);
        results.successful.push({
          row: i + 1,
          user: createdUser
        });

      } catch (error) {
        results.failed.push({
          row: i + 1,
          data: userData,
          error: error.message
        });
      }
    }

    return results;
  }
}

module.exports = User;