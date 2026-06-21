# Requirements Document

## Introduction

The Admin Dashboard is a comprehensive administrative interface that enables platform administrators to manage users, monitor system activity, oversee content, and analyze platform usage. Administrators can view and manage students, parents, and other admins, track quiz performance and module completion, manage learning content, and access analytics about platform engagement.

## Glossary

- **Admin_Dashboard**: The main React component that displays the administrative interface
- **Admin_User**: A user with role "Admin" or "Teacher" who has administrative privileges
- **Student_User**: A user with role "Student" enrolled in the platform
- **Parent_User**: A user with role "Parent" linked to one or more students
- **User_Management_Panel**: UI component for viewing and managing platform users
- **Content_Management_Panel**: UI component for managing modules, quizzes, and learning content
- **Analytics_Panel**: UI component displaying platform usage statistics and trends
- **API_Service**: The axios-based service layer that communicates with backend endpoints
- **Auth_Token**: JWT token stored in localStorage for authenticated API requests
- **Module**: A learning unit containing lessons and quizzes
- **Quiz**: An assessment within a module
- **Badge**: An achievement award earned by students for completing milestones
- **Bulk_Operation**: An administrative action affecting multiple records simultaneously

## Requirements

### Requirement 1: Admin Dashboard Access Control

**User Story:** As an Admin, I want to access the admin dashboard after logging in, so that I can manage the platform

#### Acceptance Criteria

1. WHEN an Admin_User successfully authenticates, THE Admin_Dashboard SHALL display the main administrative interface
2. THE Admin_Dashboard SHALL verify the user has role "Admin" or "Teacher" before rendering
3. IF the user does not have admin privileges, THEN THE Admin_Dashboard SHALL redirect to the appropriate dashboard for their role
4. THE Admin_Dashboard SHALL display the Admin_User's full name in the header
5. THE Admin_Dashboard SHALL display a logout button that clears the Auth_Token and redirects to login

### Requirement 2: User List Display

**User Story:** As an Admin, I want to view a list of all platform users, so that I can see who is using the system

#### Acceptance Criteria

1. WHEN the Admin_Dashboard loads, THE API_Service SHALL fetch user data from GET /api/admin/users endpoint
2. THE User_Management_Panel SHALL display a loading indicator while fetching data
3. IF the API request fails, THEN THE User_Management_Panel SHALL display an error message
4. FOR EACH user in the system, THE User_Management_Panel SHALL display the user's full name, email, role, and registration date
5. THE User_Management_Panel SHALL support filtering users by role (Student, Parent, Admin)
6. THE User_Management_Panel SHALL support searching users by name or email
7. THE User_Management_Panel SHALL display users in a paginated table with 20 users per page

### Requirement 3: User Detail View

**User Story:** As an Admin, I want to view detailed information about a specific user, so that I can understand their activity and status

#### Acceptance Criteria

1. WHEN an Admin clicks on a user in the list, THE API_Service SHALL fetch detailed user data from GET /api/admin/users/:userId endpoint
2. THE User_Management_Panel SHALL display the user's complete profile including name, email, role, registration date, and last login
3. WHERE the user is a Student_User, THE User_Management_Panel SHALL display XP, level, badges earned, quiz attempts, and module progress
4. WHERE the user is a Parent_User, THE User_Management_Panel SHALL display the list of linked children
5. THE User_Management_Panel SHALL include a back button to return to the user list

### Requirement 4: User Creation

**User Story:** As an Admin, I want to create new user accounts, so that I can onboard students, parents, and other admins

#### Acceptance Criteria

1. THE User_Management_Panel SHALL display a "Create User" button
2. WHEN the "Create User" button is clicked, THE User_Management_Panel SHALL display a form with fields for full name, email, password, and role
3. THE User_Management_Panel SHALL validate that email is in valid format before submission
4. THE User_Management_Panel SHALL validate that password is at least 8 characters before submission
5. WHEN the form is submitted, THE API_Service SHALL send a POST request to /api/admin/users with the user data
6. IF the user creation succeeds, THEN THE User_Management_Panel SHALL display a success message and refresh the user list
7. IF the user creation fails, THEN THE User_Management_Panel SHALL display the error message returned by the API

### Requirement 5: User Modification

**User Story:** As an Admin, I want to edit existing user accounts, so that I can update user information and fix errors

#### Acceptance Criteria

1. THE User_Management_Panel SHALL display an "Edit" button for each user in the list
2. WHEN the "Edit" button is clicked, THE User_Management_Panel SHALL display a form pre-populated with the user's current data
3. THE User_Management_Panel SHALL allow editing of full name, email, and role
4. THE User_Management_Panel SHALL validate email format before submission
5. WHEN the form is submitted, THE API_Service SHALL send a PUT request to /api/admin/users/:userId with the updated data
6. IF the update succeeds, THEN THE User_Management_Panel SHALL display a success message and refresh the user list
7. IF the update fails, THEN THE User_Management_Panel SHALL display the error message returned by the API

### Requirement 6: User Deactivation

**User Story:** As an Admin, I want to deactivate user accounts, so that I can prevent access without deleting historical data

#### Acceptance Criteria

1. THE User_Management_Panel SHALL display a "Deactivate" button for each active user
2. WHEN the "Deactivate" button is clicked, THE User_Management_Panel SHALL display a confirmation dialog
3. WHEN deactivation is confirmed, THE API_Service SHALL send a POST request to /api/admin/users/:userId/deactivate
4. IF the deactivation succeeds, THEN THE User_Management_Panel SHALL update the user's status to "Inactive" and refresh the list
5. THE User_Management_Panel SHALL display an "Activate" button for deactivated users
6. WHEN the "Activate" button is clicked, THE API_Service SHALL send a POST request to /api/admin/users/:userId/activate

### Requirement 7: Bulk User Upload

**User Story:** As an Admin, I want to upload multiple users from a CSV file, so that I can efficiently onboard entire classes

#### Acceptance Criteria

1. THE User_Management_Panel SHALL display a "Bulk Upload" button
2. WHEN the "Bulk Upload" button is clicked, THE User_Management_Panel SHALL display a file upload interface
3. THE User_Management_Panel SHALL accept CSV files with columns: full_name, email, password, role
4. THE User_Management_Panel SHALL validate the CSV format before upload
5. WHEN a valid CSV is uploaded, THE API_Service SHALL send a POST request to /api/admin/users/bulk with the file data
6. THE User_Management_Panel SHALL display a progress indicator during bulk upload
7. WHEN the bulk upload completes, THE User_Management_Panel SHALL display a summary showing successful and failed user creations
8. IF any users fail to create, THEN THE User_Management_Panel SHALL display the specific errors for each failed user

### Requirement 8: Module Management Display

**User Story:** As an Admin, I want to view all learning modules, so that I can see what content is available

#### Acceptance Criteria

1. WHEN the Admin_Dashboard content tab is selected, THE API_Service SHALL fetch module data from GET /api/admin/modules endpoint
2. THE Content_Management_Panel SHALL display a loading indicator while fetching data
3. IF the API request fails, THEN THE Content_Management_Panel SHALL display an error message
4. FOR EACH module, THE Content_Management_Panel SHALL display the module name, description, level requirement, and item count
5. THE Content_Management_Panel SHALL display modules in a card-based layout
6. THE Content_Management_Panel SHALL support searching modules by name

### Requirement 9: Module Creation

**User Story:** As an Admin, I want to create new learning modules, so that I can add content to the platform

#### Acceptance Criteria

1. THE Content_Management_Panel SHALL display a "Create Module" button
2. WHEN the "Create Module" button is clicked, THE Content_Management_Panel SHALL display a form with fields for name, description, and level requirement
3. THE Content_Management_Panel SHALL validate that name is not empty before submission
4. THE Content_Management_Panel SHALL validate that level requirement is a positive integer before submission
5. WHEN the form is submitted, THE API_Service SHALL send a POST request to /api/admin/modules with the module data
6. IF the module creation succeeds, THEN THE Content_Management_Panel SHALL display a success message and refresh the module list
7. IF the module creation fails, THEN THE Content_Management_Panel SHALL display the error message returned by the API

### Requirement 10: Module Modification

**User Story:** As an Admin, I want to edit existing modules, so that I can update content and fix errors

#### Acceptance Criteria

1. THE Content_Management_Panel SHALL display an "Edit" button for each module
2. WHEN the "Edit" button is clicked, THE Content_Management_Panel SHALL display a form pre-populated with the module's current data
3. THE Content_Management_Panel SHALL allow editing of name, description, and level requirement
4. WHEN the form is submitted, THE API_Service SHALL send a PUT request to /api/admin/modules/:moduleId with the updated data
5. IF the update succeeds, THEN THE Content_Management_Panel SHALL display a success message and refresh the module list
6. IF the update fails, THEN THE Content_Management_Panel SHALL display the error message returned by the API

### Requirement 11: Module Deletion

**User Story:** As an Admin, I want to delete modules, so that I can remove outdated or incorrect content

#### Acceptance Criteria

1. THE Content_Management_Panel SHALL display a "Delete" button for each module
2. WHEN the "Delete" button is clicked, THE Content_Management_Panel SHALL display a confirmation dialog warning about data loss
3. WHEN deletion is confirmed, THE API_Service SHALL send a DELETE request to /api/admin/modules/:moduleId
4. IF the deletion succeeds, THEN THE Content_Management_Panel SHALL display a success message and refresh the module list
5. IF the deletion fails due to existing student progress, THEN THE Content_Management_Panel SHALL display an error message explaining the constraint

### Requirement 12: Platform Analytics Overview

**User Story:** As an Admin, I want to view platform usage statistics, so that I can understand engagement and identify trends

#### Acceptance Criteria

1. WHEN the Admin_Dashboard analytics tab is selected, THE API_Service SHALL fetch analytics data from GET /api/admin/analytics endpoint
2. THE Analytics_Panel SHALL display a loading indicator while fetching data
3. IF the API request fails, THEN THE Analytics_Panel SHALL display an error message
4. THE Analytics_Panel SHALL display total user counts by role (Students, Parents, Admins)
5. THE Analytics_Panel SHALL display total quiz attempts and average score percentage
6. THE Analytics_Panel SHALL display total badges earned across all students
7. THE Analytics_Panel SHALL display active user count (users who logged in within the last 7 days)
8. THE Analytics_Panel SHALL display new user registrations in the last 30 days

### Requirement 13: Student Performance Analytics

**User Story:** As an Admin, I want to view aggregated student performance data, so that I can assess learning outcomes

#### Acceptance Criteria

1. THE Analytics_Panel SHALL display average XP per student
2. THE Analytics_Panel SHALL display distribution of students by level
3. THE Analytics_Panel SHALL display quiz pass rate (percentage of quiz attempts scoring 80% or higher)
4. THE Analytics_Panel SHALL display average quiz score across all attempts
5. THE Analytics_Panel SHALL display module completion rates showing percentage of students who completed each module
6. THE Analytics_Panel SHALL display the data using charts and visualizations

### Requirement 14: Activity Timeline

**User Story:** As an Admin, I want to see recent platform activity, so that I can monitor what's happening in real-time

#### Acceptance Criteria

1. THE Analytics_Panel SHALL display a timeline of recent activities
2. THE activity timeline SHALL include quiz completions with student name, quiz name, and score
3. THE activity timeline SHALL include badge achievements with student name and badge name
4. THE activity timeline SHALL include new user registrations with user name and role
5. THE activity timeline SHALL include level ups with student name and new level
6. THE activity timeline SHALL display the 20 most recent activities ordered by timestamp descending
7. THE activity timeline SHALL refresh automatically every 60 seconds

### Requirement 15: Admin Dashboard Navigation

**User Story:** As an Admin, I want to navigate between different admin sections, so that I can access all administrative functions

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL display a navigation menu with tabs for Users, Content, and Analytics
2. WHEN a navigation tab is clicked, THE Admin_Dashboard SHALL display the corresponding panel
3. THE Admin_Dashboard SHALL highlight the currently active tab
4. THE Admin_Dashboard SHALL maintain the selected tab when the page is refreshed
5. THE Admin_Dashboard SHALL be accessible via the route "/admin-dashboard"

### Requirement 16: Admin API Authentication

**User Story:** As an Admin, I want all admin operations to be securely authenticated, so that unauthorized users cannot access admin functions

#### Acceptance Criteria

1. THE API_Service SHALL include the Auth_Token in the Authorization header for all admin API requests
2. THE API_Service SHALL use the format "Bearer {token}" for the Authorization header
3. IF an admin API request returns a 401 status, THEN THE Admin_Dashboard SHALL redirect to the login page
4. IF an admin API request returns a 403 status, THEN THE Admin_Dashboard SHALL display an "Access Denied" message
5. THE API_Service SHALL use the base URL "http://localhost:5000/api" for all requests

### Requirement 17: Admin Dashboard Responsive Design

**User Story:** As an Admin, I want the dashboard to work on different screen sizes, so that I can manage the platform from various devices

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL use Tailwind CSS for all styling
2. THE Admin_Dashboard SHALL use a responsive layout that adapts to screen sizes (mobile, tablet, desktop)
3. WHEN viewed on mobile devices, THE Admin_Dashboard SHALL stack panels vertically and use a hamburger menu for navigation
4. WHEN viewed on desktop devices, THE Admin_Dashboard SHALL display panels in a multi-column layout with a horizontal navigation menu
5. THE Admin_Dashboard SHALL use consistent color scheme and typography with existing dashboards

### Requirement 18: Error Handling and User Feedback

**User Story:** As an Admin, I want clear feedback on my actions, so that I know whether operations succeeded or failed

#### Acceptance Criteria

1. WHEN any admin operation succeeds, THE Admin_Dashboard SHALL display a success message for 3 seconds
2. WHEN any admin operation fails, THE Admin_Dashboard SHALL display an error message with details
3. THE Admin_Dashboard SHALL handle network errors gracefully and display user-friendly error messages
4. THE Admin_Dashboard SHALL display validation errors inline on form fields
5. WHEN a long-running operation is in progress, THE Admin_Dashboard SHALL display a loading indicator and disable action buttons

### Requirement 19: Data Export

**User Story:** As an Admin, I want to export user and analytics data, so that I can perform external analysis and reporting

#### Acceptance Criteria

1. THE User_Management_Panel SHALL display an "Export Users" button
2. WHEN the "Export Users" button is clicked, THE API_Service SHALL request data from GET /api/admin/users/export endpoint
3. THE Admin_Dashboard SHALL download the exported data as a CSV file
4. THE exported CSV SHALL include all user fields visible in the user list
5. THE Analytics_Panel SHALL display an "Export Analytics" button
6. WHEN the "Export Analytics" button is clicked, THE API_Service SHALL request data from GET /api/admin/analytics/export endpoint
7. THE Admin_Dashboard SHALL download the exported analytics as a CSV file

### Requirement 20: Search and Filter Persistence

**User Story:** As an Admin, I want my search and filter settings to persist, so that I don't lose my place when navigating

#### Acceptance Criteria

1. WHEN an Admin applies a filter in the User_Management_Panel, THE Admin_Dashboard SHALL store the filter state in browser session storage
2. WHEN an Admin navigates away and returns to the User_Management_Panel, THE Admin_Dashboard SHALL restore the previous filter state
3. WHEN an Admin performs a search, THE Admin_Dashboard SHALL store the search query in browser session storage
4. WHEN an Admin navigates away and returns, THE Admin_Dashboard SHALL restore the previous search query
5. WHEN an Admin logs out, THE Admin_Dashboard SHALL clear all stored filter and search states
