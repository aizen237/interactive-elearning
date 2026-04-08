# Requirements Document

## Introduction

The Parent Dashboard is a frontend feature that enables parents to monitor their children's learning progress in the Amharic learning platform. Parents can view a list of all linked children, see overview statistics for each child (XP, level, badges, quiz performance), and access detailed statistics for individual children. The backend API endpoints are already implemented and tested.

## Glossary

- **Parent_Dashboard**: The main React component that displays the parent's interface
- **Child_Overview_Card**: A UI component displaying summary statistics for a single child
- **Child_Detail_View**: A UI component displaying comprehensive statistics for a selected child
- **API_Service**: The axios-based service layer that communicates with backend endpoints
- **Auth_Token**: JWT token stored in localStorage for authenticated API requests
- **Parent_User**: A user with role "Parent" who has one or more linked students
- **Student_User**: A user with role "Student" who is linked to a parent via parent_id

## Requirements

### Requirement 1: Parent Dashboard Page Access

**User Story:** As a parent, I want to access my dashboard after logging in, so that I can view my children's learning progress.

#### Acceptance Criteria

1. WHEN a Parent_User successfully authenticates, THE Parent_Dashboard SHALL display the main dashboard interface
2. THE Parent_Dashboard SHALL display a welcome message containing the Parent_User's full name
3. THE Parent_Dashboard SHALL display a logout button in the header
4. WHEN the logout button is clicked, THE Parent_Dashboard SHALL clear the Auth_Token from localStorage and redirect to the login page
5. THE Parent_Dashboard SHALL use a gradient background (from-purple-50 to-blue-50) consistent with StudentDashboard styling

### Requirement 2: Children Overview Display

**User Story:** As a parent, I want to see a list of all my children with their key statistics, so that I can quickly assess their overall progress.

#### Acceptance Criteria

1. WHEN the Parent_Dashboard loads, THE API_Service SHALL fetch children overview data from GET /api/parent/overview endpoint
2. THE Parent_Dashboard SHALL display a loading indicator while fetching data
3. IF the API request fails, THEN THE Parent_Dashboard SHALL display an error message to the user
4. FOR EACH child in the overview data, THE Parent_Dashboard SHALL display a Child_Overview_Card
5. THE Child_Overview_Card SHALL display the child's full name
6. THE Child_Overview_Card SHALL display the child's current level
7. THE Child_Overview_Card SHALL display the child's total XP
8. THE Child_Overview_Card SHALL display the count of badges earned
9. THE Child_Overview_Card SHALL display the count of quizzes attempted
10. THE Child_Overview_Card SHALL display the count of quizzes passed
11. THE Child_Overview_Card SHALL use card-based layout with rounded corners and shadows consistent with existing dashboard patterns
12. THE Child_Overview_Card SHALL be clickable to view detailed statistics

### Requirement 3: Child Detail View

**User Story:** As a parent, I want to view detailed statistics for a specific child, so that I can understand their learning progress in depth.

#### Acceptance Criteria

1. WHEN a Child_Overview_Card is clicked, THE API_Service SHALL fetch detailed stats from GET /api/parent/child/:studentId/stats endpoint
2. THE Parent_Dashboard SHALL display the Child_Detail_View for the selected child
3. THE Child_Detail_View SHALL display the child's full name as a header
4. THE Child_Detail_View SHALL display the child's current level and total XP prominently
5. THE Child_Detail_View SHALL display all earned badges with icon, name, and description
6. IF the child has no badges, THEN THE Child_Detail_View SHALL display a message "No badges earned yet"
7. THE Child_Detail_View SHALL display quiz statistics including total attempts, correct answers, and success rate percentage
8. THE Child_Detail_View SHALL display the 5 most recent quiz attempts with question text, module name, correctness, and timestamp
9. THE Child_Detail_View SHALL display module completion progress showing module name, total items, completed items, and completion percentage
10. THE Child_Detail_View SHALL include a back button to return to the children overview
11. THE Child_Detail_View SHALL use gradient styling and emoji icons consistent with StudentDashboard patterns

### Requirement 4: API Integration and Authentication

**User Story:** As a parent, I want my dashboard to securely access my children's data, so that I can trust the system protects our information.

#### Acceptance Criteria

1. THE API_Service SHALL include the Auth_Token in the Authorization header for all API requests
2. THE API_Service SHALL use the format "Bearer {token}" for the Authorization header
3. IF an API request returns a 401 or 403 status, THEN THE Parent_Dashboard SHALL redirect to the login page
4. THE API_Service SHALL use the base URL "http://localhost:5000/api" for all requests
5. THE API_Service SHALL handle network errors gracefully and display user-friendly error messages

### Requirement 5: Responsive Layout and UI Consistency

**User Story:** As a parent, I want the dashboard to look professional and work on different screen sizes, so that I can access it from various devices.

#### Acceptance Criteria

1. THE Parent_Dashboard SHALL use Tailwind CSS for all styling
2. THE Parent_Dashboard SHALL use a responsive grid layout that adapts to screen sizes (mobile, tablet, desktop)
3. THE Child_Overview_Card SHALL use gradient backgrounds and colorful styling consistent with StudentDashboard
4. THE Parent_Dashboard SHALL use emoji icons for visual elements (🎯, ✅, 📊, 🏆, etc.)
5. THE Parent_Dashboard SHALL display cards in a grid layout with appropriate spacing and shadows
6. WHEN viewed on mobile devices, THE Parent_Dashboard SHALL stack cards vertically
7. WHEN viewed on desktop devices, THE Parent_Dashboard SHALL display cards in a multi-column grid

### Requirement 6: Navigation and Routing

**User Story:** As a parent, I want to navigate between the overview and detail views smoothly, so that I can efficiently review my children's progress.

#### Acceptance Criteria

1. THE Parent_Dashboard SHALL be accessible via the route "/parent-dashboard"
2. WHEN navigating to the Parent_Dashboard route, THE system SHALL verify the user has role "Parent"
3. IF the user does not have role "Parent", THEN THE system SHALL redirect to the appropriate dashboard for their role
4. THE Parent_Dashboard SHALL maintain navigation state when switching between overview and detail views
5. WHEN the back button is clicked in Child_Detail_View, THE Parent_Dashboard SHALL return to the overview without re-fetching data

### Requirement 7: Empty State Handling

**User Story:** As a parent, I want to see helpful messages when there is no data, so that I understand what to expect.

#### Acceptance Criteria

1. IF the parent has no linked children, THEN THE Parent_Dashboard SHALL display a message "No children linked to your account"
2. IF a child has no quiz attempts, THEN THE Child_Detail_View SHALL display "No quiz attempts yet"
3. IF a child has no module progress, THEN THE Child_Detail_View SHALL display "No modules started yet"
4. IF a child has 0 XP, THEN THE Child_Detail_View SHALL display level 1 and 0 XP
5. THE Parent_Dashboard SHALL handle null or undefined data gracefully without crashing
