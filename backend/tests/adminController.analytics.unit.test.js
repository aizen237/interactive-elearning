const adminController = require('../src/controllers/adminController');
const db = require('../src/config/db');

/**
 * Unit Tests for Admin Controller - Analytics Endpoints
 * Tests controller logic for analytics, activity timeline, and export with mocked database calls
 * 
 * **Validates: Requirements 12.4, 12.5, 12.6, 14.1, 14.6, 19.7**
 */

// Mock dependencies
jest.mock('../src/config/db');

describe('Admin Controller - Analytics Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Setup mock request and response objects
    req = {
      params: {},
      query: {},
      body: {},
      user: { id: 1, role: 'Admin' }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };

    // Mock console.error to avoid cluttering test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('getAnalytics', () => {
    it('should return complete analytics data with all statistics', async () => {
      // Setup: Mock all database queries
      db.execute
        // User counts by role
        .mockResolvedValueOnce([[
          { role: 'Student', count: 100 },
          { role: 'Parent', count: 50 },
          { role: 'Admin', count: 5 },
          { role: 'Teacher', count: 3 }
        ]])
        // Quiz statistics
        .mockResolvedValueOnce([[{
          total_attempts: 500,
          average_score: 75.5,
          passed_attempts: 400
        }]])
        // Badge statistics
        .mockResolvedValueOnce([[{ total_badges_earned: 250 }]])
        // Activity statistics
        .mockResolvedValueOnce([[{
          active_users: 80,
          new_registrations: 20
        }]])
        // Student statistics (average XP)
        .mockResolvedValueOnce([[{ average_xp: 1500.75 }]])
        // Level distribution
        .mockResolvedValueOnce([[
          { level: 1, count: 30 },
          { level: 2, count: 40 },
          { level: 3, count: 30 }
        ]])
        // Module completion rates
        .mockResolvedValueOnce([[
          { module_id: 1, module_name: 'Module 1', completed_students: 80, total_students: 100 },
          { module_id: 2, module_name: 'Module 2', completed_students: 60, total_students: 100 }
        ]]);

      // Test: Call getAnalytics
      await adminController.getAnalytics(req, res);

      // Verify: Response contains all analytics sections
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Analytics retrieved successfully',
        data: {
          userCounts: {
            students: 100,
            parents: 50,
            admins: 8, // 5 Admin + 3 Teacher
            total: 158
          },
          quizStats: {
            totalAttempts: 500,
            averageScore: 75.5,
            passRate: 80 // 400/500 * 100
          },
          badgeStats: {
            totalBadgesEarned: 250
          },
          activityStats: {
            activeUsers: 80,
            newRegistrations: 20
          },
          studentStats: {
            averageXP: 1500.75,
            levelDistribution: [
              { level: 1, count: 30 },
              { level: 2, count: 40 },
              { level: 3, count: 30 }
            ],
            moduleCompletionRates: [
              { moduleId: 1, moduleName: 'Module 1', completionRate: 80 },
              { moduleId: 2, moduleName: 'Module 2', completionRate: 60 }
            ]
          }
        }
      });
    });

    it('should handle zero quiz attempts correctly', async () => {
      // Setup: No quiz attempts
      db.execute
        .mockResolvedValueOnce([[{ role: 'Student', count: 10 }]])
        .mockResolvedValueOnce([[{
          total_attempts: 0,
          average_score: null,
          passed_attempts: 0
        }]])
        .mockResolvedValueOnce([[{ total_badges_earned: 0 }]])
        .mockResolvedValueOnce([[{ active_users: 5, new_registrations: 2 }]])
        .mockResolvedValueOnce([[{ average_xp: 0 }]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]]);

      // Test: Call getAnalytics
      await adminController.getAnalytics(req, res);

      // Verify: Quiz stats show zeros and pass rate is 0
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            quizStats: {
              totalAttempts: 0,
              averageScore: 0,
              passRate: 0
            }
          })
        })
      );
    });

    it('should handle empty database (no users, no data)', async () => {
      // Setup: Empty database
      db.execute
        .mockResolvedValueOnce([[]])  // No users
        .mockResolvedValueOnce([[{ total_attempts: 0, average_score: null, passed_attempts: 0 }]])
        .mockResolvedValueOnce([[{ total_badges_earned: 0 }]])
        .mockResolvedValueOnce([[{ active_users: 0, new_registrations: 0 }]])
        .mockResolvedValueOnce([[{ average_xp: null }]])
        .mockResolvedValueOnce([[]])  // No level distribution
        .mockResolvedValueOnce([[]]);  // No modules

      // Test: Call getAnalytics
      await adminController.getAnalytics(req, res);

      // Verify: All counts are zero
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            userCounts: {
              students: 0,
              parents: 0,
              admins: 0,
              total: 0
            },
            studentStats: expect.objectContaining({
              averageXP: 0,
              levelDistribution: [],
              moduleCompletionRates: []
            })
          })
        })
      );
    });

    it('should calculate module completion rates correctly with zero students', async () => {
      // Setup: Modules exist but no students
      db.execute
        .mockResolvedValueOnce([[{ role: 'Parent', count: 5 }]])
        .mockResolvedValueOnce([[{ total_attempts: 0, average_score: null, passed_attempts: 0 }]])
        .mockResolvedValueOnce([[{ total_badges_earned: 0 }]])
        .mockResolvedValueOnce([[{ active_users: 0, new_registrations: 0 }]])
        .mockResolvedValueOnce([[{ average_xp: null }]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[
          { module_id: 1, module_name: 'Module 1', completed_students: 0, total_students: 0 }
        ]]);

      // Test: Call getAnalytics
      await adminController.getAnalytics(req, res);

      // Verify: Completion rate is 0 when no students
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            studentStats: expect.objectContaining({
              moduleCompletionRates: [
                { moduleId: 1, moduleName: 'Module 1', completionRate: 0 }
              ]
            })
          })
        })
      );
    });

    it('should handle database errors gracefully', async () => {
      // Setup: Database error
      const dbError = new Error('Database connection failed');
      db.execute.mockRejectedValue(dbError);

      // Test: Call getAnalytics
      await adminController.getAnalytics(req, res);

      // Verify: Error response returned
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error fetching analytics',
        error: 'Database connection failed'
      });
    });
  });

  describe('getActivity', () => {
    it('should return activity timeline with all activity types', async () => {
      // Setup: Mock all activity queries
      const now = new Date();
      
      db.execute
        // Quiz completions
        .mockResolvedValueOnce([[
          {
            id: 1,
            user_id: 10,
            user_name: 'John Doe',
            content_id: 5,
            quiz_name: 'Math Quiz',
            score: 85,
            timestamp: new Date(now - 1000),
            type: 'quiz_completion'
          }
        ]])
        // Badge achievements
        .mockResolvedValueOnce([[
          {
            id: 2,
            user_id: 11,
            user_name: 'Jane Smith',
            badge_name: 'First Steps',
            timestamp: new Date(now - 2000),
            type: 'badge_earned'
          }
        ]])
        // Registrations
        .mockResolvedValueOnce([[
          {
            id: 12,
            user_id: 12,
            user_name: 'Bob Johnson',
            role: 'Student',
            timestamp: new Date(now - 3000),
            type: 'registration'
          }
        ]])
        // Level ups
        .mockResolvedValueOnce([[
          {
            user_id: 10,
            user_name: 'John Doe',
            level: 5,
            timestamp: new Date(now - 4000),
            type: 'level_up'
          }
        ]]);

      // Test: Call getActivity
      await adminController.getActivity(req, res);

      // Verify: Response contains all activity types sorted by timestamp
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Activity timeline retrieved successfully',
        data: {
          activities: expect.arrayContaining([
            expect.objectContaining({
              type: 'quiz_completion',
              userId: 10,
              userName: 'John Doe',
              description: 'John Doe completed quiz "Math Quiz" with score 85%'
            }),
            expect.objectContaining({
              type: 'badge_earned',
              userId: 11,
              userName: 'Jane Smith',
              description: 'Jane Smith earned badge "First Steps"'
            }),
            expect.objectContaining({
              type: 'registration',
              userId: 12,
              userName: 'Bob Johnson',
              description: 'Bob Johnson registered as Student'
            }),
            expect.objectContaining({
              type: 'level_up',
              userId: 10,
              userName: 'John Doe',
              description: 'John Doe reached level 5'
            })
          ])
        }
      });
    });

    it('should limit activities to 20 most recent', async () => {
      // Setup: Mock more than 20 activities
      const quizActivities = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        user_id: 10,
        user_name: 'User ' + i,
        content_id: 5,
        quiz_name: 'Quiz ' + i,
        score: 80,
        timestamp: new Date(Date.now() - i * 1000),
        type: 'quiz_completion'
      }));

      const badgeActivities = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        user_id: 10,
        user_name: 'User ' + i,
        badge_name: 'Badge ' + i,
        timestamp: new Date(Date.now() - (i + 15) * 1000),
        type: 'badge_earned'
      }));

      db.execute
        .mockResolvedValueOnce([quizActivities])
        .mockResolvedValueOnce([badgeActivities])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]]);

      // Test: Call getActivity
      await adminController.getActivity(req, res);

      // Verify: Only 20 activities returned
      const response = res.json.mock.calls[0][0];
      expect(response.data.activities).toHaveLength(20);
    });

    it('should handle empty activity timeline', async () => {
      // Setup: No activities
      db.execute
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]]);

      // Test: Call getActivity
      await adminController.getActivity(req, res);

      // Verify: Empty activities array returned
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Activity timeline retrieved successfully',
        data: {
          activities: []
        }
      });
    });

    it('should handle quiz with null quiz name', async () => {
      // Setup: Quiz completion with null quiz name
      db.execute
        .mockResolvedValueOnce([[
          {
            id: 1,
            user_id: 10,
            user_name: 'John Doe',
            content_id: 5,
            quiz_name: null,
            score: 85,
            timestamp: new Date(),
            type: 'quiz_completion'
          }
        ]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]]);

      // Test: Call getActivity
      await adminController.getActivity(req, res);

      // Verify: Uses "Unknown Quiz" as fallback
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            activities: expect.arrayContaining([
              expect.objectContaining({
                description: 'John Doe completed quiz "Unknown Quiz" with score 85%'
              })
            ])
          }
        })
      );
    });

    it('should sort activities by timestamp descending', async () => {
      // Setup: Activities with different timestamps
      const now = Date.now();
      
      db.execute
        .mockResolvedValueOnce([[
          {
            id: 1,
            user_id: 10,
            user_name: 'User 1',
            content_id: 5,
            quiz_name: 'Quiz 1',
            score: 80,
            timestamp: new Date(now - 5000), // Older
            type: 'quiz_completion'
          }
        ]])
        .mockResolvedValueOnce([[
          {
            id: 2,
            user_id: 11,
            user_name: 'User 2',
            badge_name: 'Badge 1',
            timestamp: new Date(now - 1000), // Newer
            type: 'badge_earned'
          }
        ]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]]);

      // Test: Call getActivity
      await adminController.getActivity(req, res);

      // Verify: Newer activity comes first
      const response = res.json.mock.calls[0][0];
      expect(response.data.activities[0].type).toBe('badge_earned');
      expect(response.data.activities[1].type).toBe('quiz_completion');
    });

    it('should handle database errors gracefully', async () => {
      // Setup: Database error
      const dbError = new Error('Database query failed');
      db.execute.mockRejectedValue(dbError);

      // Test: Call getActivity
      await adminController.getActivity(req, res);

      // Verify: Error response returned
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error fetching activity timeline',
        error: 'Database query failed'
      });
    });
  });

  describe('exportAnalytics', () => {
    it('should export analytics data as CSV with correct format', async () => {
      // Setup: Mock analytics data
      db.execute
        .mockResolvedValueOnce([[
          { role: 'Student', count: 100 },
          { role: 'Parent', count: 50 },
          { role: 'Admin', count: 5 }
        ]])
        .mockResolvedValueOnce([[{
          total_attempts: 500,
          average_score: 75.5,
          passed_attempts: 400
        }]])
        .mockResolvedValueOnce([[{ total_badges_earned: 250 }]])
        .mockResolvedValueOnce([[{
          active_users: 80,
          new_registrations: 20
        }]])
        .mockResolvedValueOnce([[{ average_xp: 1500.75 }]]);

      // Test: Call exportAnalytics
      await adminController.exportAnalytics(req, res);

      // Verify: CSV headers set correctly
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="analytics-export.csv"');

      // Verify: Response status
      expect(res.status).toHaveBeenCalledWith(200);

      // Verify: CSV content includes all metrics
      const csvContent = res.send.mock.calls[0][0];
      expect(csvContent).toContain('metric,value');
      expect(csvContent).toContain('Total Students,100');
      expect(csvContent).toContain('Total Parents,50');
      expect(csvContent).toContain('Total Admins,5');
      expect(csvContent).toContain('Total Users,155');
      expect(csvContent).toContain('Total Quiz Attempts,500');
      expect(csvContent).toContain('Average Quiz Score,75.50%');
      expect(csvContent).toContain('Quiz Pass Rate,80.00%');
      expect(csvContent).toContain('Total Badges Earned,250');
      expect(csvContent).toContain('Active Users (Last 7 Days),80');
      expect(csvContent).toContain('New Registrations (Last 30 Days),20');
      expect(csvContent).toContain('Average Student XP,1500.75');
    });

    it('should handle zero values in export', async () => {
      // Setup: All zeros
      db.execute
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[{
          total_attempts: 0,
          average_score: null,
          passed_attempts: 0
        }]])
        .mockResolvedValueOnce([[{ total_badges_earned: 0 }]])
        .mockResolvedValueOnce([[{
          active_users: 0,
          new_registrations: 0
        }]])
        .mockResolvedValueOnce([[{ average_xp: null }]]);

      // Test: Call exportAnalytics
      await adminController.exportAnalytics(req, res);

      // Verify: CSV contains zeros
      const csvContent = res.send.mock.calls[0][0];
      expect(csvContent).toContain('Total Students,0');
      expect(csvContent).toContain('Total Quiz Attempts,0');
      expect(csvContent).toContain('Average Student XP,0.00');
    });

    it('should format percentages with 2 decimal places', async () => {
      // Setup: Data that results in decimal percentages
      db.execute
        .mockResolvedValueOnce([[{ role: 'Student', count: 10 }]])
        .mockResolvedValueOnce([[{
          total_attempts: 3,
          average_score: 66.666666,
          passed_attempts: 2
        }]])
        .mockResolvedValueOnce([[{ total_badges_earned: 0 }]])
        .mockResolvedValueOnce([[{ active_users: 0, new_registrations: 0 }]])
        .mockResolvedValueOnce([[{ average_xp: 123.456789 }]]);

      // Test: Call exportAnalytics
      await adminController.exportAnalytics(req, res);

      // Verify: Percentages formatted to 2 decimal places
      const csvContent = res.send.mock.calls[0][0];
      expect(csvContent).toContain('Average Quiz Score,66.67%');
      expect(csvContent).toContain('Quiz Pass Rate,66.67%');
      expect(csvContent).toContain('Average Student XP,123.46');
    });

    it('should handle database errors gracefully', async () => {
      // Setup: Database error
      const dbError = new Error('Database connection failed');
      db.execute.mockRejectedValue(dbError);

      // Test: Call exportAnalytics
      await adminController.exportAnalytics(req, res);

      // Verify: Error response returned (JSON, not CSV)
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error exporting analytics',
        error: 'Database connection failed'
      });
      expect(res.send).not.toHaveBeenCalled();
    });
  });
});
