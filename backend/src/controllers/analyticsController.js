// src/controllers/analyticsController.js
const db = require('../config/db');

/**
 * Get teacher dashboard analytics
 * GET /api/analytics/dashboard
 * Protected: Teacher/Admin only
 */
exports.getDashboardStats = async (req, res) => {
  try {
    // Get total modules
    const [moduleCount] = await db.execute(
      'SELECT COUNT(*) as count FROM modules'
    );

    // Get total content items
    const [contentCount] = await db.execute(
      'SELECT COUNT(*) as count FROM content_items'
    );

    // Get locked vs unlocked content
    const [lockStatus] = await db.execute(
      'SELECT is_locked, COUNT(*) as count FROM content_items GROUP BY is_locked'
    );

    // Get content by difficulty
    const [difficultyBreakdown] = await db.execute(
      'SELECT difficulty, COUNT(*) as count FROM content_items GROUP BY difficulty'
    );

    // Get total students
    const [studentCount] = await db.execute(
      "SELECT COUNT(*) as count FROM users WHERE role = 'Student'"
    );

    // Get total teachers
    const [teacherCount] = await db.execute(
      "SELECT COUNT(*) as count FROM users WHERE role = 'Teacher'"
    );

    // Get recent content items
    const [recentContent] = await db.execute(
      'SELECT id, question_text, difficulty, item_type FROM content_items ORDER BY id DESC LIMIT 5'
    );

    // Get content items with media
    const [mediaCount] = await db.execute(
      'SELECT COUNT(*) as count FROM content_items WHERE file_path IS NOT NULL'
    );

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalModules: moduleCount[0].count,
          totalContent: contentCount[0].count,
          totalStudents: studentCount[0].count,
          totalTeachers: teacherCount[0].count,
          contentWithMedia: mediaCount[0].count
        },
        lockStatus: lockStatus.reduce((acc, item) => {
          acc[item.is_locked ? 'locked' : 'unlocked'] = item.count;
          return acc;
        }, { locked: 0, unlocked: 0 }),
        difficultyBreakdown: difficultyBreakdown.reduce((acc, item) => {
          acc[item.difficulty] = item.count;
          return acc;
        }, { Easy: 0, Medium: 0, Hard: 0 }),
        recentContent: recentContent
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
      error: error.message
    });
  }
};

/**
 * Get module-specific analytics
 * GET /api/analytics/module/:id
 * Protected: Teacher/Admin only
 */
exports.getModuleStats = async (req, res) => {
  try {
    const moduleId = req.params.id;

    // Get module details
    const [module] = await db.execute(
      'SELECT * FROM modules WHERE id = ?',
      [moduleId]
    );

    if (module.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    // Get content count for this module
    const [contentCount] = await db.execute(
      'SELECT COUNT(*) as count FROM content_items WHERE module_id = ?',
      [moduleId]
    );

    // Get difficulty breakdown for this module
    const [difficultyBreakdown] = await db.execute(
      'SELECT difficulty, COUNT(*) as count FROM content_items WHERE module_id = ? GROUP BY difficulty',
      [moduleId]
    );

    res.status(200).json({
      success: true,
      data: {
        module: module[0],
        contentCount: contentCount[0].count,
        difficultyBreakdown: difficultyBreakdown
      }
    });
  } catch (error) {
    console.error('Module analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching module analytics',
      error: error.message
    });
  }
};