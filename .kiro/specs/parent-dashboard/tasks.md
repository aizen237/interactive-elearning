# Implementation Plan: Parent Dashboard

## Overview

This implementation plan breaks down the Parent Dashboard feature into discrete coding tasks. The feature enables parents to monitor their children's learning progress through an overview display and detailed statistics view. The implementation uses React, React Router, axios for API communication, and Tailwind CSS for styling, following patterns established in the StudentDashboard component.

## Tasks

- [ ] 1. Set up API service layer and routing configuration
  - [x] 1.1 Create parentAPI service module
    - Create `frontend/src/services/parentAPI.js` with functions for `getChildrenOverview()`, `getChildren()`, and `getChildStats(studentId)`
    - Import and use the existing `api` instance from `frontend/src/services/api.js`
    - Ensure all functions return promises that resolve to API response data
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 1.2 Add Parent Dashboard route to App.jsx
    - Import ParentDashboard component in `frontend/src/App.jsx`
    - Add route definition for `/parent-dashboard` path
    - _Requirements: 6.1_

  - [x] 1.3 Update Login component to redirect parents
    - Modify `frontend/src/pages/Login.jsx` to include Parent role in dashboard redirect logic
    - Add mapping for Parent role to `/parent-dashboard` route
    - _Requirements: 6.2, 6.3_

- [ ] 2. Create reusable UI components
  - [x] 2.1 Create LoadingSpinner component
    - Create `frontend/src/components/LoadingSpinner.jsx` with centered spinner and "Loading dashboard..." text
    - Use Tailwind CSS for styling
    - _Requirements: 2.2_

  - [x] 2.2 Create ErrorMessage component
    - Create `frontend/src/components/ErrorMessage.jsx` with props for message and optional onRetry callback
    - Display error message with red styling and optional retry button
    - _Requirements: 2.3, 4.5_

  - [x] 2.3 Create EmptyState component
    - Create `frontend/src/components/EmptyState.jsx` with props for message and optional icon
    - Display centered message with emoji icon
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 2.4 Create DashboardHeader component
    - Create `frontend/src/components/DashboardHeader.jsx` with props for parentName and onLogout callback
    - Display welcome message and logout button with red styling
    - _Requirements: 1.2, 1.3, 1.4_

  - [x] 2.5 Write unit tests for reusable components
    - Test LoadingSpinner renders correctly
    - Test ErrorMessage displays message and calls onRetry
    - Test EmptyState displays message and icon
    - Test DashboardHeader displays name and calls onLogout
    - _Requirements: 1.2, 1.3, 2.2, 2.3, 4.5, 7.1, 7.2, 7.3_

- [ ] 3. Implement ChildOverviewCard component
  - [x] 3.1 Create ChildOverviewCard component
    - Create `frontend/src/components/parent/ChildOverviewCard.jsx` with props for child data and onClick handler
    - Display child's full name, level, total XP, badges earned, quizzes attempted, and quizzes passed
    - Use white background with rounded corners, shadows, and gradient accent for level/XP section
    - Add emoji icons (🎯, ✅, 🏆) for visual appeal
    - Implement hover effect with scale transform
    - _Requirements: 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12, 5.3, 5.4, 5.5_

  - [x] 3.2 Write unit tests for ChildOverviewCard
    - Test component renders child data correctly
    - Test onClick handler is called with correct childId
    - Test hover styles are applied
    - _Requirements: 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.12_

- [ ] 4. Implement Child Detail View components
  - [x] 4.1 Create XPLevelDisplay component
    - Create `frontend/src/components/parent/XPLevelDisplay.jsx` with props for level and totalXP
    - Display level and XP in gradient card similar to StudentDashboard
    - Use purple-to-blue gradient background
    - _Requirements: 3.4, 3.11_

  - [x] 4.2 Create BadgesSection component
    - Create `frontend/src/components/parent/BadgesSection.jsx` with props for badges array
    - Display badges in grid layout with icon, name, and description
    - Show empty state when no badges earned
    - _Requirements: 3.5, 3.6, 3.11_

  - [x] 4.3 Create QuizStatistics component
    - Create `frontend/src/components/parent/QuizStatistics.jsx` with props for quiz statistics
    - Display total attempts, correct answers, and success rate with emoji icons
    - Use colorful card styling
    - _Requirements: 3.7, 3.11_

  - [x] 4.4 Create RecentQuizAttempts component
    - Create `frontend/src/components/parent/RecentQuizAttempts.jsx` with props for recent attempts array
    - Display list of last 5 quiz attempts with question text, module name, correctness indicator, and formatted timestamp
    - Show empty state when no quiz attempts
    - _Requirements: 3.8, 7.2_

  - [x] 4.5 Create ModuleProgress component
    - Create `frontend/src/components/parent/ModuleProgress.jsx` with props for modules array
    - Display progress bars for each module with name, completion percentage, and item counts
    - Show empty state when no modules started
    - _Requirements: 3.9, 7.3_

  - [x] 4.6 Create ChildDetailView component
    - Create `frontend/src/components/parent/ChildDetailView.jsx` with props for childData and onBack callback
    - Compose all detail sub-components (XPLevelDisplay, BadgesSection, QuizStatistics, RecentQuizAttempts, ModuleProgress)
    - Display child's name as header and back button
    - Use responsive layout with appropriate spacing
    - _Requirements: 3.2, 3.3, 3.10, 3.11_

  - [x] 4.7 Write unit tests for detail view components
    - Test XPLevelDisplay renders level and XP correctly
    - Test BadgesSection displays badges and empty state
    - Test QuizStatistics displays stats correctly
    - Test RecentQuizAttempts displays attempts and empty state
    - Test ModuleProgress displays progress bars and empty state
    - Test ChildDetailView composes all sub-components and calls onBack
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_

- [x] 5. Checkpoint - Ensure all component tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement ParentDashboard main container
  - [x] 6.1 Create ParentDashboard component with state management
    - Create `frontend/src/pages/ParentDashboard.jsx` as main container component
    - Initialize state variables: viewState, selectedChildId, overviewData, detailData, loading, error
    - Use useState and useEffect hooks for state management
    - _Requirements: 1.1, 2.1_

  - [x] 6.2 Implement role-based access control
    - Add useEffect hook to verify user role on component mount
    - Read user data from localStorage
    - Redirect to login if no user or no role
    - Redirect to appropriate dashboard if user is not a Parent
    - _Requirements: 6.2, 6.3_

  - [x] 6.3 Implement overview data fetching
    - Create fetchOverview function that calls parentAPI.getChildrenOverview()
    - Set loading state before API call
    - Handle successful response by updating overviewData state
    - Handle 401/403 errors by redirecting to login
    - Handle other errors by setting error message
    - Call fetchOverview in useEffect after role verification
    - _Requirements: 2.1, 2.2, 2.3, 4.1, 4.3_

  - [x] 6.4 Implement child detail data fetching
    - Create handleChildClick function that accepts childId parameter
    - Call parentAPI.getChildStats(childId) and update detailData state
    - Transition viewState to 'detail' on successful fetch
    - Handle 403 errors with "Access denied" message
    - Handle 401 errors by redirecting to login
    - Handle other errors with user-friendly message
    - _Requirements: 3.1, 4.3_

  - [x] 6.5 Implement navigation between views
    - Create handleBackClick function that sets viewState to 'overview'
    - Ensure overview data persists when navigating to detail view
    - Do not re-fetch overview data when returning from detail view
    - _Requirements: 3.10, 6.4, 6.5_

  - [x] 6.6 Implement logout functionality
    - Create handleLogout function that clears token and user from localStorage
    - Redirect to login page after clearing auth data
    - _Requirements: 1.4_

  - [x] 6.7 Implement conditional rendering logic
    - Render LoadingSpinner when loading is true
    - Render ErrorMessage when error is not null
    - Render EmptyState when overviewData has no children
    - Render ChildOverviewCard grid when in overview state with data
    - Render ChildDetailView when in detail state with data
    - Handle null/undefined data gracefully
    - _Requirements: 2.2, 2.3, 7.1, 7.4, 7.5_

  - [x] 6.8 Implement responsive layout and styling
    - Apply gradient background (from-purple-50 to-blue-50)
    - Use max-width container with padding
    - Implement responsive grid layout (1 column mobile, 2 columns tablet, 3 columns desktop)
    - Add appropriate spacing between cards
    - _Requirements: 1.5, 5.1, 5.2, 5.5, 5.6, 5.7_

- [x] 7. Checkpoint - Test core functionality
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Integration and polish
  - [x] 8.1 Test authentication flow integration
    - Verify JWT token is included in API requests
    - Verify 401/403 responses redirect to login
    - Verify network errors display user-friendly messages
    - _Requirements: 4.1, 4.2, 4.3, 4.5_

  - [x] 8.2 Test empty state handling
    - Verify empty state displays when parent has no children
    - Verify empty state displays when child has no badges
    - Verify empty state displays when child has no quiz attempts
    - Verify empty state displays when child has no module progress
    - Verify component handles 0 XP gracefully
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 8.3 Verify responsive design across screen sizes
    - Test layout on mobile viewport (< 768px)
    - Test layout on tablet viewport (768px - 1024px)
    - Test layout on desktop viewport (> 1024px)
    - Verify cards stack vertically on mobile
    - Verify multi-column grid on desktop
    - _Requirements: 5.2, 5.6, 5.7_

  - [x] 8.4 Write integration tests for user flows
    - Test full flow: login as parent → view overview → click child → view details → click back → logout
    - Test error scenarios: 401 redirect, 403 error message, network error with retry
    - Test empty states: no children, no badges, no quiz attempts
    - _Requirements: 1.1, 2.1, 3.1, 3.10, 4.3, 6.1, 6.4, 6.5, 7.1, 7.2, 7.3_

- [x] 9. Final checkpoint - Complete testing and validation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The design uses JavaScript/React, so all implementation will be in JSX/JavaScript
- All required dependencies (React, React Router, axios, Tailwind CSS) are already installed
- Backend API endpoints are already implemented and tested
- Follow existing patterns from StudentDashboard for visual consistency
- Use emoji icons throughout for visual appeal (🎯, ✅, 🏆, 📊, 📚, 👨‍👩‍👧‍👦, ⬅️)
