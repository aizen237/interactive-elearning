// src/controllers/studentController.js
const db = require('../config/db');

/**
 * Get available content for student
 * GET /api/student/content
 * Returns only unlocked content
 */
exports.getAvailableContent = async (req, res) => {
  try {
    // Get all modules
    const [modules] = await db.execute(
      'SELECT * FROM modules ORDER BY id ASC'
    );

    // Get unlocked content items
    const [content] = await db.execute(
      `SELECT c.*, m.module_name 
       FROM content_items c
       JOIN modules m ON c.module_id = m.id
       WHERE c.is_locked = 0
       ORDER BY c.module_id, c.id ASC`
    );

    // Group content by module
    const modulesWithContent = modules.map(module => ({
      ...module,
      content: content.filter(item => item.module_id === module.id)
    }));

    res.status(200).json({
      success: true,
      data: modulesWithContent
    });
  } catch (error) {
    console.error('Get available content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching content',
      error: error.message
    });
  }
};

/**
 * Get single content item for student
 * GET /api/student/content/:id
 */
exports.getContentItem = async (req, res) => {
  try {
    const [content] = await db.execute(
      `SELECT c.*, m.module_name 
       FROM content_items c
       JOIN modules m ON c.module_id = m.id
       WHERE c.id = ? AND c.is_locked = 0`,
      [req.params.id]
    );

    if (content.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Content not found or locked'
      });
    }

    res.status(200).json({
      success: true,
      data: content[0]
    });
  } catch (error) {
    console.error('Get content item error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching content',
      error: error.message
    });
  }
};

/**
 * Submit quiz answer
 * POST /api/student/submit
 * Protected: Student only
 */
exports.submitAnswer = async (req, res) => {
  try {
    const { content_id, selected_answer } = req.body;
    const student_id = req.user.id; // From auth middleware

    // Validation
    if (!content_id || !selected_answer) {
      return res.status(400).json({
        success: false,
        message: 'Content ID and selected answer are required'
      });
    }

    // Get the content item
    const [content] = await db.execute(
      'SELECT * FROM content_items WHERE id = ? AND is_locked = 0',
      [content_id]
    );

    if (content.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Content not found or locked'
      });
    }

    const question = content[0];
    const isCorrect = selected_answer.trim() === question.correct_answer.trim();

    // Calculate score (simple: 100 if correct, 0 if wrong)
    const score = isCorrect ? 100 : 0;

    // Save to score_logs
    await db.execute(
      `INSERT INTO score_logs (student_id, content_id, score_obtained, is_synced) 
       VALUES (?, ?, ?, 1)`,
      [student_id, content_id, score]
    );

    // Return result
    res.status(200).json({
      success: true,
      data: {
        isCorrect: isCorrect,
        score: score,
        correctAnswer: question.correct_answer,
        explanation: question.explanation,
        selectedAnswer: selected_answer
      }
    });

  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting answer',
      error: error.message
    });
  }
};