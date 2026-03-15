// src/models/ContentItem.js
const db = require('../config/db');

class ContentItem {
  /**
   * Get all content items for a module
   */
  static async getByModule(moduleId) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM content_items WHERE module_id = ? ORDER BY id ASC',
        [moduleId]
      );
      return rows;
    } catch (error) {
      throw new Error(`Database error in getByModule: ${error.message}`);
    }
  }

  /**
   * Get single content item
   */
  static async findById(id) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM content_items WHERE id = ?',
        [id]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw new Error(`Database error in findById: ${error.message}`);
    }
  }

  /**
   * Create new content item
   */
  static async create(contentData) {
    const {
      module_id,
      item_type,
      title,
      question_text,
      correct_answer,
      difficulty,
      options,
      explanation,
      file_path
    } = contentData;

    try {
      const [result] = await db.execute(
        `INSERT INTO content_items 
        (module_id, item_type, title, question_text, correct_answer, 
         difficulty, options, explanation, file_path, is_locked) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [
          module_id,
          item_type || 'Quiz',
          title || question_text,
          question_text,
          correct_answer,
          difficulty || 'Easy',
          options ? JSON.stringify(options) : null,
          explanation || null,
          file_path || null
        ]
      );

      return {
        id: result.insertId,
        ...contentData
      };
    } catch (error) {
      throw new Error(`Database error in create: ${error.message}`);
    }
  }

  /**
   * Update content item
   */
  static async update(id, updates) {
    try {
      const allowedFields = [
        'title', 'question_text', 'correct_answer', 'difficulty',
        'options', 'explanation', 'file_path', 'is_locked'
      ];
      
      const fields = Object.keys(updates).filter(key => allowedFields.includes(key));
      
      if (fields.length === 0) {
        throw new Error('No valid fields to update');
      }

      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const values = fields.map(field => {
        if (field === 'options' && typeof updates[field] === 'object') {
          return JSON.stringify(updates[field]);
        }
        return updates[field];
      });
      values.push(id);

      const [result] = await db.execute(
        `UPDATE content_items SET ${setClause} WHERE id = ?`,
        values
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Database error in update: ${error.message}`);
    }
  }

  /**
   * Delete content item
   */
  static async delete(id) {
    try {
      const [result] = await db.execute(
        'DELETE FROM content_items WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Database error in delete: ${error.message}`);
    }
  }
}

module.exports = ContentItem;