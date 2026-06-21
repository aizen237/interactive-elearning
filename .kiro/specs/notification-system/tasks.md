# Implementation Plan: Notification System

## Overview

This plan implements a comprehensive notification system for the educational platform, supporting real-time feedback for Students (gamification), Parents (child progress monitoring), and Admins (system operations and security). The implementation follows a layered architecture: database schema → repository layer → service layer → controller/API layer → integration with existing controllers.

## Tasks

- [x] 1. Set up database schema and migrations
  - Create migration file for notifications table with proper indexes
  - Create migration file for notification_preferences table
  - Create migration file for student_streaks table
  - Run migrations and verify schema creation
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 2. Implement Notification Repository layer
  - [x] 2.1 Create NotificationRepository class with CRUD operations
    - Implement `create(notificationData)` method
    - Implement `getByUser(userId, page, limit)` with pagination
    - Implement `getUnreadCount(userId)` method
    - Implement `markAsRead(notificationId, userId)` with authorization check
    - Implement `markAllAsRead(userId)` method
    - Implement `deleteOldNotifications(retentionDays)` method
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 9.1, 9.2, 9.3, 9.4, 11.2, 12.1, 12.2, 12.3, 12.4_
  
  - [x] 2.2 Write property test for notification retrieval
    - **Property 5: Notification Retrieval**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**
  
  - [x] 2.3 Write property test for mark as read operations
    - **Property 6: Mark as Read Operations**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4**
  
  - [x] 2.4 Write property test for unread count accuracy
    - **Property 8: Unread Count Accuracy**
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4**

- [x] 3. Implement Notification Preferences Service
  - [x] 3.1 Create NotificationPreferencesService class
    - Implement `getPreferences(userId)` method
    - Implement `updatePreferences(userId, updates)` method
    - Implement `isNotificationEnabled(userId, notificationType)` method
    - Implement `createDefaultPreferences(userId)` method
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [x] 3.2 Write property test for preference enforcement
    - **Property 7: Preference Enforcement**
    - **Validates: Requirements 10.3, 10.4**
  
  - [x] 3.3 Write property test for preference updates
    - **Property 11: Preference Updates**
    - **Validates: Requirements 10.2**
  
  - [x] 3.4 Write property test for default preferences
    - **Property 12: Default Preferences**
    - **Validates: Requirements 10.5**

- [x] 4. Implement Streak Service
  - [x] 4.1 Create StreakService class
    - Implement `updateStreak(studentId)` method to update streak after activity
    - Implement `getStreakReminderEligible()` method to find students with 3+ day streaks who haven't practiced today
    - _Requirements: 3.1, 3.4_
  
  - [x] 4.2 Write property test for streak reminder eligibility
    - **Property 9: Streak Reminder Eligibility**
    - **Validates: Requirements 3.1, 3.4**

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement Notification Service core methods
  - [x] 6.1 Create NotificationService class with student notification methods
    - Implement `notifyBadgeEarned(studentId, badge)` method
    - Implement `notifyLevelUp(studentId, newLevel, unlockedModules)` method
    - Integrate preference checking before creating notifications
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 10.3, 10.4_
  
  - [x] 6.2 Write property test for notification delivery
    - **Property 1: Notification Delivery**
    - **Validates: Requirements 1.2, 2.4, 4.4, 11.1, 11.4**
  
  - [x] 6.3 Write property test for notification content correctness
    - **Property 4: Notification Content Correctness**
    - **Validates: Requirements 1.3, 1.4, 2.2, 2.3, 4.2, 4.3, 5.4, 6.2, 6.3, 7.3**
  
  - [x] 6.4 Write property test for notification creation timing
    - **Property 2: Notification Creation Timing**
    - **Validates: Requirements 1.1, 2.1, 4.1, 5.5, 6.4, 7.4**

- [x] 7. Implement parent notification methods
  - [x] 7.1 Add parent notification methods to NotificationService
    - Implement `notifyParentsQuizComplete(studentId, studentName, quizName, scorePercentage)` method
    - Implement `notifyParentsModuleMilestone(studentId, studentName, moduleName, completionPercentage)` method
    - Add helper method to get linked parents for a student
    - Implement fan-out logic to create one notification per parent
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [x] 7.2 Write property test for parent notification fan-out
    - **Property 3: Parent Notification Fan-out**
    - **Validates: Requirements 4.1, 5.1, 5.2, 5.3**
  
  - [x] 7.3 Write property test for module milestone threshold
    - **Property 15: Module Milestone Threshold**
    - **Validates: Requirements 5.3**

- [x] 8. Implement admin notification methods
  - [x] 8.1 Add admin notification methods to NotificationService
    - Implement `notifyAdminOperation(adminId, operationType, recordCount, errorCount)` method
    - Implement `notifyAdminSecurity(adminId, eventType, timestamp)` method
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4_
  
  - [x] 8.2 Write unit tests for admin notification methods
    - Test operation notifications with and without errors
    - Test security notification content
    - _Requirements: 6.1, 6.2, 6.3, 7.1, 7.2, 7.3_

- [x] 9. Implement streak reminder processing
  - [x] 9.1 Add streak reminder method to NotificationService
    - Implement `processDailyStreakReminders()` method
    - Use StreakService to get eligible students
    - Create reminder notifications with streak count in metadata
    - Return count of reminders sent
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [x] 9.2 Write property test for streak reminder content
    - **Property 10: Streak Reminder Content**
    - **Validates: Requirements 3.2**

- [x] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implement Notification Controller and API endpoints
  - [x] 11.1 Create NotificationController with GET endpoints
    - Implement `GET /api/notifications` with pagination
    - Implement `GET /api/notifications/unread-count`
    - Implement `GET /api/notifications/preferences`
    - Add authentication middleware to all endpoints
    - Add input validation for query parameters
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 10.1, 12.1, 12.2, 12.3_
  
  - [x] 11.2 Add PUT endpoints to NotificationController
    - Implement `PUT /api/notifications/:id/read`
    - Implement `PUT /api/notifications/mark-all-read`
    - Implement `PUT /api/notifications/preferences`
    - Add authorization checks for notification ownership
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 10.2_
  
  - [x] 11.3 Write integration tests for notification API endpoints
    - Test GET /api/notifications with pagination
    - Test GET /api/notifications/unread-count
    - Test PUT /api/notifications/:id/read with authorization
    - Test PUT /api/notifications/mark-all-read
    - Test GET/PUT /api/notifications/preferences
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 9.1, 9.2, 9.3, 9.4, 10.1, 10.2, 12.1, 12.2_

- [x] 12. Create notification routes and wire to Express app
  - [x] 12.1 Create notification routes file
    - Create `backend/src/routes/notificationRoutes.js`
    - Define all notification endpoints with proper HTTP methods
    - Apply authentication middleware
    - Wire routes to NotificationController methods
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 9.1, 9.2, 9.3, 9.4, 10.1, 10.2, 12.1, 12.2_
  
  - [x] 12.2 Register notification routes in server.js
    - Import notification routes
    - Mount routes at `/api/notifications`
    - _Requirements: 8.1, 9.1, 10.1, 12.1_

- [x] 13. Integrate notification triggers into Student Controller
  - [x] 13.1 Add notification calls to submitAnswer method
    - Import NotificationService
    - Call `notifyBadgeEarned()` when new badges are earned
    - Call `notifyLevelUp()` when student levels up
    - Call `notifyParentsQuizComplete()` after quiz submission
    - Call StreakService.updateStreak() after quiz completion
    - _Requirements: 1.1, 1.2, 2.1, 2.4, 4.1, 4.4_
  
  - [x] 13.2 Write integration test for student quiz completion flow
    - Test badge notification creation on badge earn
    - Test level up notification creation on level up
    - Test parent notification creation on quiz complete
    - Test streak update on quiz complete
    - _Requirements: 1.1, 1.2, 2.1, 2.4, 4.1, 4.4_

- [x] 14. Integrate notification triggers for module milestones
  - [x] 14.1 Add module milestone tracking
    - Identify where module progress is calculated
    - Call `notifyParentsModuleMilestone()` when student reaches 50% completion
    - _Requirements: 5.3, 5.4, 5.5_
  
  - [x] 14.2 Write integration test for module milestone notifications
    - Test parent notification at 50% module completion
    - Test no notification at other completion percentages
    - _Requirements: 5.3, 5.4, 5.5_

- [x] 15. Implement scheduled job for streak reminders
  - [x] 15.1 Create scheduled job for daily streak reminders
    - Install node-cron package if not present
    - Create cron job that runs daily at 19:00
    - Call NotificationService.processDailyStreakReminders()
    - Add logging for reminder count
    - Register cron job in server.js startup
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [x] 15.2 Write unit test for streak reminder scheduling
    - Test reminder job execution
    - Test reminder suppression for students who practiced today
    - _Requirements: 3.1, 3.4_

- [x] 16. Implement notification cleanup job
  - [x] 16.1 Create scheduled job for notification cleanup
    - Create cron job that runs daily to delete notifications older than 90 days
    - Call NotificationRepository.deleteOldNotifications(90)
    - Add logging for deleted notification count
    - _Requirements: 11.2_
  
  - [x] 16.2 Write property test for notification retention
    - **Property 13: Notification Retention**
    - **Validates: Requirements 11.2**

- [x] 17. Add error handling and validation
  - [x] 17.1 Implement error handling across all layers
    - Add try-catch blocks in controller methods
    - Implement validation for notification creation inputs
    - Add authorization checks for notification access
    - Implement proper error responses (400, 401, 403, 404, 500)
    - Add error logging with context
    - _Requirements: 9.4_
  
  - [x] 17.2 Write unit tests for error scenarios
    - Test invalid notification type
    - Test missing required fields
    - Test unauthorized notification access
    - Test database connection failures
    - _Requirements: 9.4_

- [x] 18. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 19. Add default preferences creation for new users
  - [x] 19.1 Integrate default preferences into user registration
    - Modify user registration flow to call NotificationPreferencesService.createDefaultPreferences()
    - Add error handling for preference creation failures
    - _Requirements: 10.5_
  
  - [x] 19.2 Write integration test for new user preference creation
    - Test that new users get default preferences with all types enabled
    - _Requirements: 10.5_

- [x] 20. Performance optimization and indexing verification
  - [x] 20.1 Verify database indexes and query performance
    - Test notification retrieval with large datasets (1000+ notifications per user)
    - Verify idx_user_created and idx_user_unread indexes are used
    - Test unread count query performance
    - Add query logging for slow queries (>100ms)
    - _Requirements: 8.3, 12.1_
  
  - [x] 20.2 Write performance tests
    - Test notification retrieval under load (1000 concurrent users)
    - Test notification creation throughput (100 notifications/second)
    - Verify p95 response times meet requirements
    - _Requirements: 8.3, 12.1_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties using fast-check library
- Integration tests verify end-to-end flows with real database
- The implementation follows a bottom-up approach: database → repository → service → controller → integration
- All notification creation methods check user preferences before creating notifications
- Parent notifications use fan-out pattern to create one notification per linked parent
- Scheduled jobs handle streak reminders and notification cleanup
- Error handling includes validation, authorization, and database error scenarios
