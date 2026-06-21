# Implementation Plan: Admin Dashboard

## Overview

This implementation plan breaks down the Admin Dashboard feature into discrete coding tasks. The dashboard provides comprehensive administrative capabilities including user management, content management, and analytics. The implementation follows the existing architecture patterns (React frontend, Express backend, MySQL database) and builds incrementally to ensure each component is functional before moving to the next.

## Tasks

- [ ] 1. Set up backend foundation and authentication
  - [x] 1.1 Create admin middleware for role verification
    - Create `backend/src/middleware/adminMiddleware.js` with `requireAdmin` function
    - Verify JWT token exists and user role is "Admin" or "Teacher"
    - Return 401 for missing authentication, 403 for insufficient permissions
    - _Requirements: 16.1, 16.2, 16.3, 16.4_

  - [x] 1.2 Create admin routes file
    - Create `backend/src/routes/adminRoutes.js`
    - Set up Express router with authentication and admin middleware
    - Define route structure for user management, content management, and analytics endpoints
    - _Requirements: 16.1, 16.2_

  - [x] 1.3 Integrate admin routes into server
    - Import adminRoutes in `backend/server.js`
    - Mount routes at `/api/admin` prefix
    - _Requirements: 16.5_

- [ ] 2. Implement user management backend endpoints
  - [x] 2.1 Extend User model with admin methods
    - Add `findAll(filters, pagination)` method to `backend/src/models/User.js`
    - Add `search(query, pagination)` method for name/email search
    - Add `deactivate(userId)` and `activate(userId)` methods
    - Add `getDetailedInfo(userId)` method with related data joins
    - Add `bulkCreate(usersArray)` method for CSV upload
    - _Requirements: 2.1, 2.5, 2.6, 3.1, 3.2, 4.5, 5.5, 6.3, 6.6, 7.5_

  - [x] 2.2 Create admin controller for user management
    - Create `backend/src/controllers/adminController.js`
    - Implement `getUsers` handler with pagination, filtering, and search
    - Implement `getUserById` handler for detailed user information
    - Implement `createUser` handler with validation
    - Implement `updateUser` handler with validation
    - Implement `deactivateUser` and `activateUser` handlers
    - _Requirements: 2.1, 3.1, 4.5, 5.5, 6.3, 6.6_

  - [x] 2.3 Write unit tests for user management endpoints
    - Test request validation logic
    - Test response formatting
    - Test error handling for various failure scenarios
    - Mock database calls
    - _Requirements: 2.1, 3.1, 4.5, 5.5, 6.3, 6.6_

- [ ] 3. Implement bulk user operations backend
  - [x] 3.1 Add CSV parsing and bulk upload endpoint
    - Install and configure `multer` for file uploads
    - Install and configure `csv-parser` for CSV parsing
    - Implement `bulkCreateUsers` handler in adminController
    - Validate CSV format and required columns
    - Return success/failure summary with detailed error messages
    - _Requirements: 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

  - [x] 3.2 Add user export endpoint
    - Implement `exportUsers` handler in adminController
    - Query all users with filters
    - Format data as CSV
    - Set appropriate response headers for file download
    - _Requirements: 19.1, 19.2, 19.3, 19.4_

  - [x] 3.3 Write integration tests for bulk operations
    - Test CSV upload with valid data
    - Test CSV upload with invalid rows
    - Test user export functionality
    - _Requirements: 7.5, 7.8, 19.3_

- [ ] 4. Implement content management backend endpoints
  - [x] 4.1 Create content management handlers in admin controller
    - Implement `getModules` handler with search support
    - Implement `createModule` handler with validation
    - Implement `updateModule` handler with validation
    - Implement `deleteModule` handler with constraint checking
    - _Requirements: 8.1, 9.5, 10.4, 11.3_

  - [x] 4.2 Write unit tests for content management endpoints
    - Test module CRUD operations
    - Test validation logic
    - Test foreign key constraint handling
    - _Requirements: 8.1, 9.5, 10.4, 11.3, 11.5_

- [ ] 5. Implement analytics backend endpoints
  - [x] 5.1 Create analytics calculation handlers
    - Implement `getAnalytics` handler in adminController
    - Query user counts by role
    - Calculate quiz statistics (attempts, average score, pass rate)
    - Calculate badge statistics
    - Calculate activity statistics (active users, new registrations)
    - Calculate student statistics (average XP, level distribution, module completion rates)
    - _Requirements: 12.4, 12.5, 12.6, 12.7, 12.8, 13.1, 13.2, 13.3, 13.4, 13.5_

  - [x] 5.2 Create activity timeline handler
    - Implement `getActivity` handler in adminController
    - Query recent quiz completions, badge achievements, registrations, and level ups
    - Format activity data with type, user info, description, and timestamp
    - Return 20 most recent activities ordered by timestamp descending
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

  - [x] 5.3 Add analytics export endpoint
    - Implement `exportAnalytics` handler in adminController
    - Format analytics data as CSV
    - Set appropriate response headers for file download
    - _Requirements: 19.5, 19.6, 19.7_

  - [x] 5.4 Write unit tests for analytics endpoints
    - Test analytics calculations with various data scenarios
    - Test activity timeline query and formatting
    - Test analytics export functionality
    - _Requirements: 12.4, 12.5, 12.6, 14.1, 14.6, 19.7_

- [ ] 6. Wire up all backend routes
  - [x] 6.1 Connect all handlers to routes in adminRoutes.js
    - Map GET /api/admin/users to getUsers
    - Map GET /api/admin/users/:userId to getUserById
    - Map POST /api/admin/users to createUser
    - Map PUT /api/admin/users/:userId to updateUser
    - Map POST /api/admin/users/:userId/deactivate to deactivateUser
    - Map POST /api/admin/users/:userId/activate to activateUser
    - Map POST /api/admin/users/bulk to bulkCreateUsers
    - Map GET /api/admin/users/export to exportUsers
    - Map GET /api/admin/modules to getModules
    - Map POST /api/admin/modules to createModule
    - Map PUT /api/admin/modules/:moduleId to updateModule
    - Map DELETE /api/admin/modules/:moduleId to deleteModule
    - Map GET /api/admin/analytics to getAnalytics
    - Map GET /api/admin/analytics/export to exportAnalytics
    - Map GET /api/admin/activity to getActivity
    - _Requirements: 2.1, 3.1, 4.5, 5.5, 6.3, 6.6, 7.5, 8.1, 9.5, 10.4, 11.3, 12.1, 14.1, 19.2, 19.6_

  - [x] 6.2 Write integration tests for complete API flows
    - Test authentication and authorization for all endpoints
    - Test complete user management flows
    - Test complete content management flows
    - Test analytics and activity endpoints
    - _Requirements: 16.1, 16.2, 16.3, 16.4_

- [x] 7. Checkpoint - Ensure backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Create frontend API service layer
  - [x] 8.1 Create admin API service
    - Create `frontend/src/services/adminAPI.js`
    - Implement `getAuthHeader()` helper to read token from localStorage
    - Implement all user management API methods (getUsers, getUserById, createUser, updateUser, deactivateUser, activateUser, bulkCreateUsers, exportUsers)
    - Implement all content management API methods (getModules, createModule, updateModule, deleteModule)
    - Implement all analytics API methods (getAnalytics, exportAnalytics, getActivity)
    - Use axios for all HTTP requests
    - _Requirements: 16.1, 16.2, 16.5_

  - [x] 8.2 Write unit tests for API service
    - Test API method calls with correct parameters
    - Test authorization header inclusion
    - Mock axios responses
    - _Requirements: 16.1, 16.2_

- [ ] 9. Create main admin dashboard container
  - [x] 9.1 Create AdminDashboard component
    - Create `frontend/src/pages/AdminDashboard.jsx`
    - Implement role verification on mount (check user role from localStorage)
    - Redirect non-admin users to appropriate dashboard
    - Implement tab navigation state (users, content, analytics)
    - Display admin user name in header
    - Implement logout functionality
    - Persist active tab to sessionStorage
    - Restore active tab from sessionStorage on mount
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 15.1, 15.2, 15.3, 15.4_

  - [x] 9.2 Add admin dashboard route to App.jsx
    - Import AdminDashboard component
    - Add route for "/admin-dashboard"
    - _Requirements: 15.5_

  - [-] 9.3 Write unit tests for AdminDashboard component
    - Test role verification and redirect logic
    - Test tab navigation
    - Test logout functionality
    - Test sessionStorage persistence
    - _Requirements: 1.2, 1.3, 15.2, 15.3, 15.4_

- [ ] 10. Implement user management panel
  - [x] 10.1 Create UserManagementPanel component
    - Create `frontend/src/components/admin/UserManagementPanel.jsx`
    - Implement user list fetching on mount
    - Display loading spinner during data fetch
    - Display error message on API failure
    - Implement user table with columns: name, email, role, registration date
    - Implement pagination (20 users per page)
    - Implement role filter dropdown
    - Implement search input with debouncing
    - Display "Create User" button
    - Display "Edit" and "Deactivate/Activate" buttons for each user
    - Display "Bulk Upload" and "Export Users" buttons
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 4.1, 5.1, 6.1, 6.5, 7.1, 19.1_

  - [x] 10.2 Create UserForm component
    - Create `frontend/src/components/admin/UserForm.jsx`
    - Display form fields: full_name, email, password (create only), role
    - Implement form validation (email format, password length)
    - Display inline validation errors
    - Handle form submission (call createUser or updateUser API)
    - Display success/error messages
    - Disable submit button during submission
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [x] 10.3 Create UserDetailView component
    - Create `frontend/src/components/admin/UserDetailView.jsx`
    - Fetch detailed user data on mount
    - Display user profile information
    - For students: display XP, level, badges, quiz attempts, module progress
    - For parents: display linked children
    - Display back button to return to list
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 10.4 Create BulkUploadModal component
    - Create `frontend/src/components/admin/BulkUploadModal.jsx`
    - Display file input for CSV upload
    - Display format instructions (columns: full_name, email, password, role)
    - Validate CSV format before upload
    - Display upload progress indicator
    - Display results summary (success/failure counts)
    - Display detailed error list for failed users
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

  - [x] 10.5 Write unit tests for user management components
    - Test UserManagementPanel rendering and interactions
    - Test UserForm validation and submission
    - Test UserDetailView data display
    - Test BulkUploadModal file handling
    - Mock API calls
    - _Requirements: 2.1, 4.5, 5.5, 7.5_

- [ ] 11. Implement content management panel
  - [ ] 11.1 Create ContentManagementPanel component
    - Create `frontend/src/components/admin/ContentManagementPanel.jsx`
    - Implement module list fetching on mount
    - Display loading spinner during data fetch
    - Display error message on API failure
    - Display modules in card-based grid layout
    - Show module name, description, level requirement, and item count for each module
    - Implement search input for filtering by name
    - Display "Create Module" button
    - Display "Edit" and "Delete" buttons for each module
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 9.1, 10.1, 11.1_

  - [ ] 11.2 Create ModuleForm component
    - Create `frontend/src/components/admin/ModuleForm.jsx`
    - Display form fields: name, description, level_requirement
    - Implement form validation (name not empty, level_requirement positive integer)
    - Display inline validation errors
    - Handle form submission (call createModule or updateModule API)
    - Display success/error messages
    - Disable submit button during submission
    - _Requirements: 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [ ] 11.3 Write unit tests for content management components
    - Test ContentManagementPanel rendering and interactions
    - Test ModuleForm validation and submission
    - Test delete confirmation dialog
    - Mock API calls
    - _Requirements: 8.1, 9.5, 10.4, 11.3_

- [ ] 12. Implement analytics panel
  - [ ] 12.1 Create AnalyticsPanel component
    - Create `frontend/src/components/admin/AnalyticsPanel.jsx`
    - Fetch analytics data on mount
    - Display loading spinner during data fetch
    - Display error message on API failure
    - Display user count statistics by role (students, parents, admins, total)
    - Display quiz statistics (total attempts, average score, pass rate)
    - Display badge statistics (total badges earned)
    - Display activity statistics (active users, new registrations)
    - Display student statistics (average XP, level distribution chart, module completion rates)
    - Display "Export Analytics" button
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 19.5_

  - [ ] 12.2 Create ActivityTimeline component
    - Create `frontend/src/components/admin/ActivityTimeline.jsx`
    - Fetch activity data on mount
    - Display timeline of recent activities with icons, descriptions, and timestamps
    - Include quiz completions, badge achievements, registrations, and level ups
    - Implement auto-refresh every 60 seconds using setInterval
    - Clean up interval on component unmount
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7_

  - [ ] 12.3 Write unit tests for analytics components
    - Test AnalyticsPanel data display
    - Test ActivityTimeline rendering and auto-refresh
    - Mock API calls
    - Test cleanup of intervals
    - _Requirements: 12.1, 14.1, 14.7_

- [ ] 13. Implement data export functionality
  - [ ] 13.1 Add export handlers to UserManagementPanel
    - Implement handleExport function to call exportUsers API
    - Create blob from response data
    - Trigger browser download with filename "users.csv"
    - Display success/error messages
    - _Requirements: 19.1, 19.2, 19.3, 19.4_

  - [ ] 13.2 Add export handler to AnalyticsPanel
    - Implement handleExport function to call exportAnalytics API
    - Create blob from response data
    - Trigger browser download with filename "analytics.csv"
    - Display success/error messages
    - _Requirements: 19.5, 19.6, 19.7_

  - [ ] 13.3 Write integration tests for export functionality
    - Test user export download
    - Test analytics export download
    - Mock blob creation and download trigger
    - _Requirements: 19.3, 19.7_

- [ ] 14. Implement search and filter persistence
  - [ ] 14.1 Add sessionStorage persistence to UserManagementPanel
    - Store filter state in sessionStorage when filters change
    - Store search query in sessionStorage when search changes
    - Restore filter state from sessionStorage on mount
    - Restore search query from sessionStorage on mount
    - _Requirements: 20.1, 20.2, 20.3, 20.4_

  - [ ] 14.2 Add sessionStorage cleanup on logout
    - Clear filter and search states from sessionStorage in AdminDashboard logout handler
    - _Requirements: 20.5_

  - [ ] 14.3 Write unit tests for persistence functionality
    - Test sessionStorage read/write operations
    - Test state restoration on mount
    - Test cleanup on logout
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

- [ ] 15. Implement responsive design and styling
  - [ ] 15.1 Apply Tailwind CSS styling to all admin components
    - Style AdminDashboard with header, navigation tabs, and panel container
    - Style UserManagementPanel with table, filters, and action buttons
    - Style ContentManagementPanel with card grid layout
    - Style AnalyticsPanel with statistics cards and charts
    - Style all forms with consistent input styling and validation error display
    - Style modals with overlay and centered content
    - _Requirements: 17.1, 17.5_

  - [ ] 15.2 Implement responsive layouts
    - Use Tailwind responsive classes for mobile, tablet, and desktop breakpoints
    - Stack panels vertically on mobile devices
    - Use multi-column layout on desktop devices
    - Implement hamburger menu for mobile navigation
    - Ensure tables are scrollable on small screens
    - _Requirements: 17.2, 17.3, 17.4_

  - [ ] 15.3 Test responsive design on multiple screen sizes
    - Test on mobile viewport (320px-768px)
    - Test on tablet viewport (768px-1024px)
    - Test on desktop viewport (1024px+)
    - _Requirements: 17.2, 17.3, 17.4_

- [ ] 16. Implement error handling and user feedback
  - [ ] 16.1 Add toast notification system
    - Create reusable Toast component for success/error messages
    - Implement auto-dismiss after 3 seconds for success messages
    - Keep error messages visible until manually dismissed
    - _Requirements: 18.1, 18.2_

  - [ ] 16.2 Add error handling to all API calls
    - Wrap all API calls in try-catch blocks
    - Handle 401 responses by redirecting to login
    - Handle 403 responses by displaying "Access Denied" message
    - Handle network errors with user-friendly messages
    - Display validation errors inline on form fields
    - _Requirements: 18.3, 18.4, 16.3, 16.4_

  - [ ] 16.3 Add loading states to all async operations
    - Display loading spinners during data fetches
    - Disable action buttons during operations
    - Show progress indicators for long-running operations (bulk upload)
    - _Requirements: 18.5_

  - [ ] 16.4 Write unit tests for error handling
    - Test error message display
    - Test redirect on 401
    - Test access denied on 403
    - Test loading state management
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

- [ ] 17. Implement confirmation dialogs
  - [ ] 17.1 Create reusable ConfirmDialog component
    - Display modal with message, confirm, and cancel buttons
    - Accept onConfirm and onCancel callbacks
    - _Requirements: 6.2, 11.2_

  - [ ] 17.2 Add confirmation dialogs to destructive actions
    - Add confirmation to user deactivation
    - Add confirmation to module deletion
    - Display appropriate warning messages
    - _Requirements: 6.2, 11.2_

  - [ ] 17.3 Write unit tests for confirmation dialogs
    - Test dialog display and dismissal
    - Test confirm and cancel callbacks
    - _Requirements: 6.2, 11.2_

- [ ] 18. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 19. Integration and final wiring
  - [ ] 19.1 Verify all components are properly integrated
    - Test complete user management flow (create, edit, deactivate, bulk upload, export)
    - Test complete content management flow (create, edit, delete modules)
    - Test analytics display and export
    - Test activity timeline and auto-refresh
    - Test navigation between tabs
    - Test logout and re-login flow
    - _Requirements: All requirements_

  - [ ] 19.2 Write end-to-end integration tests
    - Test complete admin workflows
    - Test authentication and authorization across all features
    - Test error handling and recovery
    - _Requirements: All requirements_

- [ ] 20. Final checkpoint - Complete testing and validation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- The implementation follows the existing codebase patterns (React, Express, MySQL)
- All API endpoints are protected by authentication and admin role middleware
- The frontend uses Tailwind CSS for styling, consistent with existing dashboards
- Testing uses Vitest for frontend and Jest for backend
