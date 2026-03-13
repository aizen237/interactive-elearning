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
}

module.exports = User;