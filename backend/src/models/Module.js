// src/models/Module.js
const db = require('../config/db');

class Module {
  /**
   * Get all modules
   */
  static async getAll() {
    try {
      const [rows] = await db.execute(
        'SELECT id as module_id, module_name as title, description, is_locked, created_at FROM modules ORDER BY id ASC'
      );
      return rows;
    } catch (error) {
      throw new Error(`Database error in getAll: ${error.message}`);
    }
  }

  /**
   * Get module by ID
   */
  static async findById(id) {
    try {
      const [rows] = await db.execute(
        'SELECT id as module_id, module_name as title, description, is_locked, created_at FROM modules WHERE id = ?',
        [id]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw new Error(`Database error in findById: ${error.message}`);
    }
  }

  /**
   * Create new module
   */
  static async create(moduleData) {
    const { title, description } = moduleData;
    
    try {
      const [result] = await db.execute(
        `INSERT INTO modules (module_name, description, is_locked) 
         VALUES (?, ?, 0)`,
        [title, description || null]
      );
      
      return {
        module_id: result.insertId,
        title,
        description,
        is_locked: 0
      };
    } catch (error) {
      throw new Error(`Database error in create: ${error.message}`);
    }
  }

  /**
   * Update module
   */
  static async update(id, updates) {
    try {
      const fields = [];
      const values = [];

      if (updates.title) {
        fields.push('module_name = ?');
        values.push(updates.title);
      }
      if (updates.description !== undefined) {
        fields.push('description = ?');
        values.push(updates.description);
      }
      if (updates.is_locked !== undefined) {
        fields.push('is_locked = ?');
        values.push(updates.is_locked);
      }

      if (fields.length === 0) {
        throw new Error('No valid fields to update');
      }

      values.push(id);

      const [result] = await db.execute(
        `UPDATE modules SET ${fields.join(', ')} WHERE id = ?`,
        values
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Database error in update: ${error.message}`);
    }
  }

  /**
   * Delete module
   */
  static async delete(id) {
    try {
      const [result] = await db.execute(
        'DELETE FROM modules WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Database error in delete: ${error.message}`);
    }
  }
}

module.exports = Module;