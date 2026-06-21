const db = require('../config/db');

/**
 * StreakService - Manages student practice streaks
 * Handles streak updates and streak reminder eligibility
 */
class StreakService {
  /**
   * Update student's streak after activity
   * @param {number} studentId - Student user ID
   * @returns {Promise<Object>} Updated streak data { current_streak, longest_streak }
   */
  async updateStreak(studentId) {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Get current streak data
    const [rows] = await db.execute(
      'SELECT current_streak, last_activity_date, longest_streak FROM student_streaks WHERE student_id = ?',
      [studentId]
    );
    
    let currentStreak = 0;
    let longestStreak = 0;
    
    if (rows.length === 0) {
      // First activity - create new streak record
      currentStreak = 1;
      longestStreak = 1;
      
      await db.execute(
        `INSERT INTO student_streaks (student_id, current_streak, last_activity_date, longest_streak)
         VALUES (?, ?, ?, ?)`,
        [studentId, currentStreak, today, longestStreak]
      );
    } else {
      const streakData = rows[0];
      const lastActivityDate = streakData.last_activity_date 
        ? new Date(streakData.last_activity_date).toISOString().split('T')[0]
        : null;
      
      // Check if already practiced today
      if (lastActivityDate === today) {
        // Already practiced today, no update needed
        return {
          current_streak: streakData.current_streak,
          longest_streak: streakData.longest_streak
        };
      }
      
      // Calculate yesterday's date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      // Check if last activity was yesterday (streak continues)
      if (lastActivityDate === yesterdayStr) {
        currentStreak = streakData.current_streak + 1;
      } else {
        // Streak broken, start new streak
        currentStreak = 1;
      }
      
      // Update longest streak if current exceeds it
      longestStreak = Math.max(currentStreak, streakData.longest_streak);
      
      // Update streak record
      await db.execute(
        `UPDATE student_streaks
         SET current_streak = ?, last_activity_date = ?, longest_streak = ?
         WHERE student_id = ?`,
        [currentStreak, today, longestStreak, studentId]
      );
    }
    
    return {
      current_streak: currentStreak,
      longest_streak: longestStreak
    };
  }

  /**
   * Get students eligible for streak reminders
   * Returns students with 3+ day streaks who haven't practiced today
   * @returns {Promise<Array>} Array of { student_id, current_streak }
   */
  async getStreakReminderEligible() {
    const today = new Date().toISOString().split('T')[0];
    
    const [students] = await db.execute(
      `SELECT student_id, current_streak
       FROM student_streaks
       WHERE current_streak >= 3
         AND (last_activity_date IS NULL OR last_activity_date < ?)`,
      [today]
    );
    
    return students;
  }
}

module.exports = new StreakService();
