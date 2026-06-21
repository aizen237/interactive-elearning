const fc = require('fast-check');
const StreakService = require('../src/services/StreakService');
const dbTestHelper = require('./helpers/dbTestHelper');
const db = require('../src/config/db');

/**
 * Property-Based Tests for StreakService
 * Uses fast-check library with 15 iterations for faster execution
 * Optimized with reduced data sizes and per-iteration cleanup
 */

describe('StreakService Property Tests', () => {
  // Note: Property tests handle their own cleanup within each iteration
  // beforeEach cleanup is disabled to avoid race conditions
  
  afterAll(async () => {
    // Final cleanup after all tests
    await dbTestHelper.cleanup();
    await db.execute('DELETE FROM student_streaks WHERE student_id >= 10000');
  });

  /**
   * Property 9: Streak Reminder Eligibility
   * **Validates: Requirements 3.1, 3.4**
   * 
   * For any student, a streak reminder notification SHALL be created if and only if 
   * the student has a current streak of 3 or more days AND has not completed any 
   * quiz on the current day
   */
  describe('Property 9: Streak Reminder Eligibility', () => {
    it('should return students with 3+ day streaks who have not practiced today', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 15 }), // Number of students (reduced for performance)
          async (studentCount) => {
            // Setup: Create test students with unique IDs
            const baseId = 10700 + Math.floor(Math.random() * 100000);
            const students = [];
            
            for (let i = 0; i < studentCount; i++) {
              const studentId = baseId + i;
              
              // Create user first and verify it was created
              await dbTestHelper.createTestUser(studentId, 'Student');
              
              // Generate random streak data
              const currentStreak = Math.floor(Math.random() * 10); // 0-9 days
              const practicedToday = Math.random() < 0.5; // 50% chance
              
              // Calculate last activity date
              let lastActivityDate;
              if (practicedToday) {
                // Practiced today
                lastActivityDate = new Date().toISOString().split('T')[0];
              } else {
                // Last practiced yesterday or earlier
                const daysAgo = Math.floor(Math.random() * 3) + 1; // 1-3 days ago
                const date = new Date();
                date.setDate(date.getDate() - daysAgo);
                lastActivityDate = date.toISOString().split('T')[0];
              }
              
              // Create streak record
              await db.execute(
                `INSERT INTO student_streaks (student_id, current_streak, last_activity_date, longest_streak)
                 VALUES (?, ?, ?, ?)`,
                [studentId, currentStreak, lastActivityDate, currentStreak]
              );
              
              students.push({
                student_id: studentId,
                current_streak: currentStreak,
                practiced_today: practicedToday
              });
            }
            
            // Test: Get streak reminder eligible students
            const eligibleStudents = await StreakService.getStreakReminderEligible();
            const eligibleIds = eligibleStudents.map(s => s.student_id);
            
            // Verify: Only students with 3+ day streaks who haven't practiced today are eligible
            for (const student of students) {
              const shouldBeEligible = student.current_streak >= 3 && !student.practiced_today;
              const isEligible = eligibleIds.includes(student.student_id);
              
              expect(isEligible).toBe(shouldBeEligible);
              
              // If eligible, verify streak count is included
              if (isEligible) {
                const eligibleStudent = eligibleStudents.find(s => s.student_id === student.student_id);
                expect(eligibleStudent.current_streak).toBe(student.current_streak);
                expect(eligibleStudent.current_streak).toBeGreaterThanOrEqual(3);
              }
            }
            
            // Cleanup this iteration's data
            await db.execute('DELETE FROM student_streaks WHERE student_id >= ? AND student_id < ?', 
              [baseId, baseId + studentCount]);
            await db.execute('DELETE FROM users WHERE id >= ? AND id < ?', 
              [baseId, baseId + studentCount]);
          }
        ),
        { numRuns: 5 }
      );
    }, 30000); // 30 second timeout for property test

    it('should return empty array when no students are eligible', async () => {
      const studentId = 10701;
      await dbTestHelper.createTestUser(studentId, 'Student');
      
      // Create student with streak < 3
      await db.execute(
        `INSERT INTO student_streaks (student_id, current_streak, last_activity_date, longest_streak)
         VALUES (?, ?, ?, ?)`,
        [studentId, 2, '2024-01-01', 2]
      );
      
      // Test: Get eligible students
      const eligible = await StreakService.getStreakReminderEligible();
      
      // Verify: No students eligible
      expect(eligible).toEqual([]);
    });

    it('should exclude students who practiced today even with 3+ day streaks', async () => {
      const studentId = 10702;
      await dbTestHelper.createTestUser(studentId, 'Student');
      
      const today = new Date().toISOString().split('T')[0];
      
      // Create student with 5-day streak who practiced today
      await db.execute(
        `INSERT INTO student_streaks (student_id, current_streak, last_activity_date, longest_streak)
         VALUES (?, ?, ?, ?)`,
        [studentId, 5, today, 5]
      );
      
      // Test: Get eligible students
      const eligible = await StreakService.getStreakReminderEligible();
      
      // Verify: Student not eligible because they practiced today
      const eligibleIds = eligible.map(s => s.student_id);
      expect(eligibleIds).not.toContain(studentId);
    });

    it('should include students with exactly 3-day streaks who have not practiced today', async () => {
      const studentId = 10703;
      await dbTestHelper.createTestUser(studentId, 'Student');
      
      // Calculate yesterday's date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      // Create student with exactly 3-day streak, last practiced yesterday
      await db.execute(
        `INSERT INTO student_streaks (student_id, current_streak, last_activity_date, longest_streak)
         VALUES (?, ?, ?, ?)`,
        [studentId, 3, yesterdayStr, 3]
      );
      
      // Test: Get eligible students
      const eligible = await StreakService.getStreakReminderEligible();
      
      // Verify: Student is eligible
      const eligibleIds = eligible.map(s => s.student_id);
      expect(eligibleIds).toContain(studentId);
      
      const eligibleStudent = eligible.find(s => s.student_id === studentId);
      expect(eligibleStudent.current_streak).toBe(3);
    });
  });

  /**
   * Additional tests for updateStreak method
   */
  describe('Streak Update Functionality', () => {
    it('should create new streak record for first activity', async () => {
      const studentId = 10704;
      await dbTestHelper.createTestUser(studentId, 'Student');
      
      // Test: Update streak for student with no existing record
      const result = await StreakService.updateStreak(studentId);
      
      // Verify: New streak created with 1 day
      expect(result.current_streak).toBe(1);
      expect(result.longest_streak).toBe(1);
      
      // Verify: Record exists in database
      const [rows] = await db.execute(
        'SELECT * FROM student_streaks WHERE student_id = ?',
        [studentId]
      );
      expect(rows.length).toBe(1);
      expect(rows[0].current_streak).toBe(1);
    });

    it('should increment streak when practicing on consecutive days', async () => {
      const studentId = 10705;
      await dbTestHelper.createTestUser(studentId, 'Student');
      
      // Setup: Create streak with yesterday's date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      await db.execute(
        `INSERT INTO student_streaks (student_id, current_streak, last_activity_date, longest_streak)
         VALUES (?, ?, ?, ?)`,
        [studentId, 2, yesterdayStr, 2]
      );
      
      // Test: Update streak (practicing today)
      const result = await StreakService.updateStreak(studentId);
      
      // Verify: Streak incremented to 3
      expect(result.current_streak).toBe(3);
      expect(result.longest_streak).toBe(3);
    });

    it('should reset streak when gap in practice days', async () => {
      const studentId = 10706;
      await dbTestHelper.createTestUser(studentId, 'Student');
      
      // Setup: Create streak with date 3 days ago (gap of 2 days)
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];
      
      await db.execute(
        `INSERT INTO student_streaks (student_id, current_streak, last_activity_date, longest_streak)
         VALUES (?, ?, ?, ?)`,
        [studentId, 5, threeDaysAgoStr, 5]
      );
      
      // Test: Update streak (practicing today after gap)
      const result = await StreakService.updateStreak(studentId);
      
      // Verify: Streak reset to 1, longest streak preserved
      expect(result.current_streak).toBe(1);
      expect(result.longest_streak).toBe(5);
    });

    it('should not update streak when already practiced today', async () => {
      const studentId = 10707;
      await dbTestHelper.createTestUser(studentId, 'Student');
      
      const today = new Date().toISOString().split('T')[0];
      
      // Setup: Create streak with today's date
      await db.execute(
        `INSERT INTO student_streaks (student_id, current_streak, last_activity_date, longest_streak)
         VALUES (?, ?, ?, ?)`,
        [studentId, 4, today, 4]
      );
      
      // Test: Update streak again today
      const result = await StreakService.updateStreak(studentId);
      
      // Verify: Streak unchanged
      expect(result.current_streak).toBe(4);
      expect(result.longest_streak).toBe(4);
    });

    it('should update longest streak when current exceeds it', async () => {
      const studentId = 10708;
      await dbTestHelper.createTestUser(studentId, 'Student');
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      // Setup: Create streak where current is about to exceed longest
      await db.execute(
        `INSERT INTO student_streaks (student_id, current_streak, last_activity_date, longest_streak)
         VALUES (?, ?, ?, ?)`,
        [studentId, 7, yesterdayStr, 7]
      );
      
      // Test: Update streak (will become 8)
      const result = await StreakService.updateStreak(studentId);
      
      // Verify: Both current and longest updated
      expect(result.current_streak).toBe(8);
      expect(result.longest_streak).toBe(8);
    });
  });
});
