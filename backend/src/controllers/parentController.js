// src/controllers/parentController.js
const db = require('../config/db');

/**
 * Get all children linked to the logged-in parent
 * @route GET /api/parent/children
 * @access Private (Parent only)
 */
exports.getChildren = async (req, res) => {
  try {
    const parentId = req.user.id;

    // Get all students linked to this parent
    const [children] = await db.execute(
      `SELECT 
        id, 
        username, 
        full_name, 
        phone_number, 
        created_at
      FROM users 
      WHERE parent_id = ? AND role = 'Student'
      ORDER BY full_name ASC`,
      [parentId]
    );

    res.json({
      success: true,
      data: {
        children,
        count: children.length
      }
    });

  } catch (error) {
    console.error('Error in getChildren:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch children',
      error: error.message
    });
  }
};

/**
 * Get detailed stats for a specific child
 * @route GET /api/parent/child/:studentId/stats
 * @access Private (Parent only - must be linked to the student)
 */
exports.getChildStats = async (req, res) => {
  try {
    const parentId = req.user.id;
    const { studentId } = req.params;

    // Verify that this student belongs to the logged-in parent
    const [studentCheck] = await db.execute(
      'SELECT id, full_name FROM users WHERE id = ? AND parent_id = ? AND role = "Student"',
      [studentId, parentId]
    );

    if (studentCheck.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This student is not linked to your account.'
      });
    }

    const student = studentCheck[0];

    // Get student's XP and level
    const [xpData] = await db.execute(
      `SELECT 
        total_xp,
        current_level
      FROM student_profiles 
      WHERE student_id = ?`,
      [studentId]
    );

    // Get student's badges
    const [badges] = await db.execute(
      `SELECT 
        b.id,
        b.name,
        b.description,
        b.icon_url,
        sb.awarded_at as earned_at
      FROM student_badges sb
      JOIN badges b ON sb.badge_id = b.id
      WHERE sb.student_id = ?
      ORDER BY sb.awarded_at DESC`,
      [studentId]
    );

    // Get last 5 quiz attempts with scores
    const [quizAttempts] = await db.execute(
      `SELECT 
        sl.id,
        sl.content_id,
        c.question_text,
        m.module_name,
        sl.score_obtained,
        sl.attempted_at
      FROM score_logs sl
      JOIN content_items c ON sl.content_id = c.id
      JOIN modules m ON c.module_id = m.id
      WHERE sl.student_id = ?
      ORDER BY sl.attempted_at DESC
      LIMIT 5`,
      [studentId]
    );

    // Calculate quiz statistics
    const [quizStats] = await db.execute(
      `SELECT 
        COUNT(*) as total_attempts,
        SUM(CASE WHEN score_obtained > 0 THEN 1 ELSE 0 END) as correct_answers,
        ROUND(AVG(score_obtained), 2) as success_rate
      FROM score_logs
      WHERE student_id = ?`,
      [studentId]
    );

    // Get module completion progress
    const [moduleProgress] = await db.execute(
      `SELECT 
        m.id,
        m.module_name,
        m.description,
        COUNT(DISTINCT c.id) as total_items,
        COUNT(DISTINCT sl.content_id) as completed_items,
        ROUND((COUNT(DISTINCT sl.content_id) / COUNT(DISTINCT c.id)) * 100, 2) as completion_percentage
      FROM modules m
      LEFT JOIN content_items c ON m.id = c.module_id
      LEFT JOIN score_logs sl ON c.id = sl.content_id AND sl.student_id = ? AND sl.score_obtained > 0
      GROUP BY m.id, m.module_name, m.description
      ORDER BY m.id ASC`,
      [studentId]
    );

    res.json({
      success: true,
      data: {
        student: {
          id: student.id,
          full_name: student.full_name
        },
        xp: xpData.length > 0 ? xpData[0] : { total_xp: 0, current_level: 1 },
        badges: {
          earned: badges,
          count: badges.length
        },
        quizzes: {
          recent_attempts: quizAttempts,
          statistics: quizStats[0] || { total_attempts: 0, correct_answers: 0, success_rate: 0 }
        },
        modules: moduleProgress
      }
    });

  } catch (error) {
    console.error('Error in getChildStats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch child statistics',
      error: error.message
    });
  }
};

/**
 * Get overview of all children's progress
 * @route GET /api/parent/overview
 * @access Private (Parent only)
 */
exports.getChildrenOverview = async (req, res) => {
  try {
    const parentId = req.user.id;

    // Get summary stats for all children
    const [childrenStats] = await db.execute(
      `SELECT 
        u.id,
        u.full_name,
        u.username,
        COALESCE(sp.total_xp, 0) as total_xp,
        COALESCE(sp.current_level, 1) as current_level,
        COUNT(DISTINCT sb.badge_id) as badges_earned,
        COUNT(DISTINCT sl.id) as quizzes_attempted,
        SUM(CASE WHEN sl.score_obtained > 0 THEN 1 ELSE 0 END) as quizzes_passed
      FROM users u
      LEFT JOIN student_profiles sp ON u.id = sp.student_id
      LEFT JOIN student_badges sb ON u.id = sb.student_id
      LEFT JOIN score_logs sl ON u.id = sl.student_id
      WHERE u.parent_id = ? AND u.role = 'Student'
      GROUP BY u.id, u.full_name, u.username, sp.total_xp, sp.current_level
      ORDER BY u.full_name ASC`,
      [parentId]
    );

    res.json({
      success: true,
      data: {
        children: childrenStats,
        total_children: childrenStats.length
      }
    });

  } catch (error) {
    console.error('Error in getChildrenOverview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch children overview',
      error: error.message
    });
  }
};
