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
 * Submit quiz answer with XP calculation
 * POST /api/student/submit
 * Protected: Student only
 */
exports.submitAnswer = async (req, res) => {
  try {
    const { content_id, selected_answer } = req.body;
    const student_id = req.user.id;

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

    // Calculate score and XP based on difficulty
    let baseXP = 0;
    let difficultyMultiplier = 1;

    if (question.difficulty === 'Easy') {
      baseXP = 10;
      difficultyMultiplier = 1;
    } else if (question.difficulty === 'Medium') {
      baseXP = 20;
      difficultyMultiplier = 1.5;
    } else if (question.difficulty === 'Hard') {
      baseXP = 30;
      difficultyMultiplier = 2;
    }

    // Award XP only if correct
    const xpEarned = isCorrect ? Math.round(baseXP * difficultyMultiplier) : 0;
    const score = isCorrect ? 100 : 0;

    // Save to score_logs
    await db.execute(
      `INSERT INTO score_logs (student_id, content_id, score_obtained, is_synced) 
       VALUES (?, ?, ?, 1)`,
      [student_id, content_id, score]
    );

    // Update student XP and check for level up
    if (isCorrect && xpEarned > 0) {
      // Check if student already passed this question before
      const [previousAttempts] = await db.execute(
        'SELECT score_obtained FROM score_logs WHERE student_id = ? AND content_id = ? AND score_obtained = 100',
        [student_id, content_id]
      );

      // Only award XP if this is their first correct answer
      const isFirstCorrect = previousAttempts.length === 1;

      if (isFirstCorrect) {
        // Get or create student profile
        const [profile] = await db.execute(
          'SELECT * FROM student_profiles WHERE student_id = ?',
          [student_id]
        );

        let currentXP = 0;
        let currentLevel = 1;

        if (profile.length > 0) {
          currentXP = profile[0].total_xp;
          currentLevel = profile[0].current_level;
        } else {
          // Create profile if doesn't exist
          await db.execute(
            'INSERT INTO student_profiles (student_id, total_xp, current_level) VALUES (?, 0, 1)',
            [student_id]
          );
        }

        // Add new XP
        const newTotalXP = currentXP + xpEarned;

        // Calculate new level (every 100 XP = 1 level)
        const newLevel = Math.floor(newTotalXP / 100) + 1;
        const leveledUp = newLevel > currentLevel;

        // Update profile
        await db.execute(
          'UPDATE student_profiles SET total_xp = ?, current_level = ? WHERE student_id = ?',
          [newTotalXP, newLevel, student_id]
        );

        // Check for new badges earned
        const [allBadges] = await db.execute(
          'SELECT * FROM badges WHERE xp_threshold <= ? ORDER BY xp_threshold ASC',
          [newTotalXP]
        );

        // Get badges student already has
        const [earnedBadges] = await db.execute(
          'SELECT badge_id FROM student_badges WHERE student_id = ?',
          [student_id]
        );

        const earnedBadgeIds = earnedBadges.map(b => b.badge_id);
        const newBadges = [];

        // Award any new badges
        for (const badge of allBadges) {
          if (!earnedBadgeIds.includes(badge.id)) {
            await db.execute(
              'INSERT INTO student_badges (student_id, badge_id) VALUES (?, ?)',
              [student_id, badge.id]
            );
            newBadges.push({
              id: badge.id,
              name: badge.name,
              description: badge.description,
              icon_url: badge.icon_url
            });
          }
        }

        // Return result with XP, level, and badge info
        return res.status(200).json({
          success: true,
          data: {
            isCorrect: true,
            score: score,
            xpEarned: xpEarned,
            totalXP: newTotalXP,
            currentLevel: newLevel,
            leveledUp: leveledUp,
            newBadges: newBadges,
            alreadyCompleted: false,
            correctAnswer: question.correct_answer,
            explanation: question.explanation,
            selectedAnswer: selected_answer
          }
        });
      } else {
        // Already completed - no XP awarded
        const [profile] = await db.execute(
          'SELECT * FROM student_profiles WHERE student_id = ?',
          [student_id]
        );

        return res.status(200).json({
          success: true,
          data: {
            isCorrect: true,
            score: score,
            xpEarned: 0,
            totalXP: profile[0]?.total_xp || 0,
            currentLevel: profile[0]?.current_level || 1,
            leveledUp: false,
            newBadges: [],
            alreadyCompleted: true,
            correctAnswer: question.correct_answer,
            explanation: question.explanation,
            selectedAnswer: selected_answer
          }
        });
      }
    }

    // Return result for incorrect answer (no XP)
    res.status(200).json({
      success: true,
      data: {
        isCorrect: false,
        score: 0,
        xpEarned: 0,
        newBadges: [],
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

/**
 * Get student dashboard stats
 * GET /api/student/stats
 * Protected: Student only
 */
exports.getStudentStats = async (req, res) => {
  try {
    const student_id = req.user.id;

    // Get student profile
    const [profile] = await db.execute(
      'SELECT * FROM student_profiles WHERE student_id = ?',
      [student_id]
    );

    // Get student badges
    const [studentBadges] = await db.execute(
      `SELECT b.* FROM badges b
       JOIN student_badges sb ON b.id = sb.badge_id
       WHERE sb.student_id = ?
       ORDER BY b.xp_threshold ASC`,
      [student_id]
    );

    // Get total quizzes attempted
    const [quizAttempts] = await db.execute(
      'SELECT COUNT(DISTINCT content_id) as total FROM score_logs WHERE student_id = ?',
      [student_id]
    );

    // Get quizzes passed (score 100)
    const [quizzesPassed] = await db.execute(
      'SELECT COUNT(DISTINCT content_id) as total FROM score_logs WHERE student_id = ? AND score_obtained = 100',
      [student_id]
    );

    // Get total available content
    const [availableContent] = await db.execute(
      'SELECT COUNT(*) as total FROM content_items WHERE is_locked = 0'
    );

    // Calculate XP to next level
    const currentXP = profile[0]?.total_xp || 0;
    const currentLevel = profile[0]?.current_level || 1;
    const xpForCurrentLevel = (currentLevel - 1) * 100;
    const xpForNextLevel = currentLevel * 100;
    const xpProgress = currentXP - xpForCurrentLevel;
    const xpNeeded = xpForNextLevel - currentXP;

    res.status(200).json({
      success: true,
      data: {
        profile: {
          totalXP: currentXP,
          currentLevel: currentLevel,
          xpProgress: xpProgress,
          xpNeeded: xpNeeded,
          xpForNextLevel: 100
        },
        badges: studentBadges,
        stats: {
          quizzesAttempted: quizAttempts[0].total,
          quizzesPassed: quizzesPassed[0].total,
          totalAvailable: availableContent[0].total,
          completionRate: availableContent[0].total > 0 
            ? Math.round((quizzesPassed[0].total / availableContent[0].total) * 100) 
            : 0
        }
      }
    });

  } catch (error) {
    console.error('Get student stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student stats',
      error: error.message
    });
  }
};
/**
 * Get leaderboard
 * GET /api/student/leaderboard
 * Protected: Student only
 */
exports.getLeaderboard = async (req, res) => {
  try {
    const student_id = req.user.id;

    // Get top students by XP
    const [leaderboard] = await db.execute(
      `SELECT 
        u.id,
        u.full_name,
        sp.total_xp,
        sp.current_level,
        COUNT(DISTINCT sb.badge_id) as badge_count
       FROM users u
       JOIN student_profiles sp ON u.id = sp.student_id
       LEFT JOIN student_badges sb ON u.id = sb.student_id
       WHERE u.role = 'Student'
       GROUP BY u.id, u.full_name, sp.total_xp, sp.current_level
       ORDER BY sp.total_xp DESC, sp.current_level DESC
       LIMIT 20`
    );

    // Find current student's rank
    const [allStudents] = await db.execute(
      `SELECT 
        u.id,
        sp.total_xp
       FROM users u
       JOIN student_profiles sp ON u.id = sp.student_id
       WHERE u.role = 'Student'
       ORDER BY sp.total_xp DESC, sp.current_level DESC`
    );

    let currentStudentRank = null;
    let currentStudentData = null;

    allStudents.forEach((student, index) => {
      if (student.id === student_id) {
        currentStudentRank = index + 1;
        currentStudentData = leaderboard.find(s => s.id === student_id);
      }
    });

    res.status(200).json({
      success: true,
      data: {
        leaderboard: leaderboard,
        currentStudent: {
          rank: currentStudentRank,
          data: currentStudentData
        }
      }
    });

  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leaderboard',
      error: error.message
    });
  }
};