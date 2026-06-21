import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserDetailView from './UserDetailView';
import adminAPI from '../../services/adminAPI';

// Mock the adminAPI module
vi.mock('../../services/adminAPI');

// Mock child components
vi.mock('../LoadingSpinner', () => ({
  default: () => <div data-testid="loading-spinner">Loading...</div>
}));

vi.mock('../ErrorMessage', () => ({
  default: ({ message, onRetry }) => (
    <div data-testid="error-message">
      <div>{message}</div>
      <button onClick={onRetry}>Retry</button>
    </div>
  )
}));

describe('UserDetailView', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Loading and Error States', () => {
    it('should display loading spinner while fetching data', () => {
      // Setup: Mock API to never resolve
      adminAPI.getUserById.mockImplementation(() => new Promise(() => {}));

      // Test: Render component
      render(<UserDetailView userId={1} onBack={mockOnBack} />);

      // Verify: Loading spinner is displayed
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should display error message when API call fails', async () => {
      // Setup: Mock API to reject
      const errorMessage = 'Failed to load user details';
      adminAPI.getUserById.mockRejectedValue({
        response: { data: { message: errorMessage } }
      });

      // Test: Render component
      render(<UserDetailView userId={1} onBack={mockOnBack} />);

      // Verify: Error message is displayed
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should retry fetching data when retry button is clicked', async () => {
      // Setup: Mock API to fail first, then succeed
      const mockUser = {
        id: 1,
        full_name: 'John Doe',
        username: 'john@example.com',
        role: 'Student',
        phone_number: '123-456-7890',
        status: 'active',
        created_at: '2024-01-15T00:00:00.000Z',
        studentData: {
          totalXP: 100,
          currentLevel: 5,
          badges: [],
          quizAttempts: 10,
          moduleProgress: []
        }
      };

      adminAPI.getUserById
        .mockRejectedValueOnce({ response: { data: { message: 'Network error' } } })
        .mockResolvedValueOnce({ data: { success: true, data: mockUser } });

      // Test: Render component
      render(<UserDetailView userId={1} onBack={mockOnBack} />);

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });

      // Click retry button
      const retryButton = screen.getByText('Retry');
      await userEvent.click(retryButton);

      // Verify: User details are displayed after retry
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('should display user not found message when user is null', async () => {
      // Setup: Mock API to return null user
      adminAPI.getUserById.mockResolvedValue({
        data: { success: true, data: null }
      });

      // Test: Render component
      render(<UserDetailView userId={999} onBack={mockOnBack} />);

      // Verify: User not found message is displayed
      await waitFor(() => {
        expect(screen.getByText('User Not Found')).toBeInTheDocument();
        expect(screen.getByText('The requested user could not be found.')).toBeInTheDocument();
      });
    });
  });

  describe('User Profile Display - Requirement 3.2', () => {
    it('should display basic user profile information', async () => {
      // Setup: Mock API response with basic user data
      const mockUser = {
        id: 1,
        full_name: 'John Doe',
        username: 'john@example.com',
        role: 'Student',
        phone_number: '123-456-7890',
        status: 'active',
        created_at: '2024-01-15T00:00:00.000Z',
        studentData: {
          totalXP: 100,
          currentLevel: 5,
          badges: [],
          quizAttempts: 10,
          moduleProgress: []
        }
      };

      adminAPI.getUserById.mockResolvedValue({
        data: { success: true, data: mockUser }
      });

      // Test: Render component
      render(<UserDetailView userId={1} onBack={mockOnBack} />);

      // Verify: User profile information is displayed
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        expect(screen.getByText('Student')).toBeInTheDocument();
        expect(screen.getByText('123-456-7890')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
        expect(screen.getByText('#1')).toBeInTheDocument();
      });
    });

    it('should display "Not provided" for missing phone number', async () => {
      // Setup: Mock user without phone number
      const mockUser = {
        id: 1,
        full_name: 'Jane Smith',
        username: 'jane@example.com',
        role: 'Parent',
        phone_number: null,
        status: 'active',
        created_at: '2024-01-15T00:00:00.000Z',
        children: []
      };

      adminAPI.getUserById.mockResolvedValue({
        data: { success: true, data: mockUser }
      });

      // Test: Render component
      render(<UserDetailView userId={1} onBack={mockOnBack} />);

      // Verify: "Not provided" is displayed for phone number
      await waitFor(() => {
        expect(screen.getByText('Not provided')).toBeInTheDocument();
      });
    });

    it('should display correct role badge colors', async () => {
      // Test different roles
      const roles = ['Student', 'Parent', 'Admin', 'Teacher'];

      for (const role of roles) {
        const mockUser = {
          id: 1,
          full_name: 'Test User',
          username: 'test@example.com',
          role: role,
          phone_number: null,
          status: 'active',
          created_at: '2024-01-15T00:00:00.000Z'
        };

        if (role === 'Student') {
          mockUser.studentData = {
            totalXP: 0,
            currentLevel: 1,
            badges: [],
            quizAttempts: 0,
            moduleProgress: []
          };
        } else if (role === 'Parent') {
          mockUser.children = [];
        }

        adminAPI.getUserById.mockResolvedValue({
          data: { success: true, data: mockUser }
        });

        const { unmount } = render(<UserDetailView userId={1} onBack={mockOnBack} />);

        await waitFor(() => {
          expect(screen.getByText(role)).toBeInTheDocument();
        });

        unmount();
      }
    });
  });

  describe('Student Data Display - Requirement 3.3', () => {
    it('should display student XP and level', async () => {
      // Setup: Mock student user with XP and level
      const mockStudent = {
        id: 1,
        full_name: 'Student User',
        username: 'student@example.com',
        role: 'Student',
        phone_number: null,
        status: 'active',
        created_at: '2024-01-15T00:00:00.000Z',
        studentData: {
          totalXP: 1500,
          currentLevel: 8,
          badges: [],
          quizAttempts: 25,
          moduleProgress: []
        }
      };

      adminAPI.getUserById.mockResolvedValue({
        data: { success: true, data: mockStudent }
      });

      // Test: Render component
      render(<UserDetailView userId={1} onBack={mockOnBack} />);

      // Verify: XP and level are displayed
      await waitFor(() => {
        expect(screen.getByText('Progress Overview')).toBeInTheDocument();
        expect(screen.getByText('8')).toBeInTheDocument(); // Level
        expect(screen.getByText('1500')).toBeInTheDocument(); // XP
      });
    });

    it('should display student quiz attempts', async () => {
      // Setup: Mock student with quiz attempts
      const mockStudent = {
        id: 1,
        full_name: 'Student User',
        username: 'student@example.com',
        role: 'Student',
        phone_number: null,
        status: 'active',
        created_at: '2024-01-15T00:00:00.000Z',
        studentData: {
          totalXP: 100,
          currentLevel: 5,
          badges: [],
          quizAttempts: 42,
          moduleProgress: []
        }
      };

      adminAPI.getUserById.mockResolvedValue({
        data: { success: true, data: mockStudent }
      });

      // Test: Render component
      render(<UserDetailView userId={1} onBack={mockOnBack} />);

      // Verify: Quiz attempts are displayed
      await waitFor(() => {
        expect(screen.getByText('Quiz Activity')).toBeInTheDocument();
        expect(screen.getByText('42')).toBeInTheDocument();
      });
    });

    it('should display student badges', async () => {
      // Setup: Mock student with badges
      const mockStudent = {
        id: 1,
        full_name: 'Student User',
        username: 'student@example.com',
        role: 'Student',
        phone_number: null,
        status: 'active',
        created_at: '2024-01-15T00:00:00.000Z',
        studentData: {
          totalXP: 100,
          currentLevel: 5,
          badges: [
            {
              id: 1,
              name: 'First Steps',
              description: 'Complete your first lesson',
              icon_url: '🎯',
              awarded_at: '2024-01-20T00:00:00.000Z'
            },
            {
              id: 2,
              name: 'Quiz Master',
              description: 'Score 100% on a quiz',
              icon_url: '🏆',
              awarded_at: '2024-01-25T00:00:00.000Z'
            }
          ],
          quizAttempts: 10,
          moduleProgress: []
        }
      };

      adminAPI.getUserById.mockResolvedValue({
        data: { success: true, data: mockStudent }
      });

      // Test: Render component
      render(<UserDetailView userId={1} onBack={mockOnBack} />);

      // Verify: Badges are displayed
      await waitFor(() => {
        expect(screen.getByText('Badges Earned (2)')).toBeInTheDocument();
        expect(screen.getByText('First Steps')).toBeInTheDocument();
        expect(screen.getByText('Complete your first lesson')).toBeInTheDocument();
        expect(screen.getByText('Quiz Master')).toBeInTheDocument();
        expect(screen.getByText('Score 100% on a quiz')).toBeInTheDocument();
      });
    });

    it('should display "No badges earned yet" when student has no badges', async () => {
      // Setup: Mock student with no badges
      const mockStudent = {
        id: 1,
        full_name: 'Student User',
        username: 'student@example.com',
        role: 'Student',
        phone_number: null,
        status: 'active',
        created_at: '2024-01-15T00:00:00.000Z',
        studentData: {
          totalXP: 100,
          currentLevel: 5,
          badges: [],
          quizAttempts: 10,
          moduleProgress: []
        }
      };

      adminAPI.getUserById.mockResolvedValue({
        data: { success: true, data: mockStudent }
      });

      // Test: Render component
      render(<UserDetailView userId={1} onBack={mockOnBack} />);

      // Verify: Empty state message is displayed
      await waitFor(() => {
        expect(screen.getByText('No badges earned yet')).toBeInTheDocument();
      });
    });

    it('should display student module progress', async () => {
      // Setup: Mock student with module progress
      const mockStudent = {
        id: 1,
        full_name: 'Student User',
        username: 'student@example.com',
        role: 'Student',
        phone_number: null,
        status: 'active',
        created_at: '2024-01-15T00:00:00.000Z',
        studentData: {
          totalXP: 100,
          currentLevel: 5,
          badges: [],
          quizAttempts: 10,
          moduleProgress: [
            {
              id: 1,
              name: 'Introduction to Programming',
              completed: 1,
              completed_at: '2024-01-20T00:00:00.000Z'
            },
            {
              id: 2,
              name: 'Advanced JavaScript',
              completed: 0,
              completed_at: null
            }
          ]
        }
      };

      adminAPI.getUserById.mockResolvedValue({
        data: { success: true, data: mockStudent }
      });

      // Test: Render component
      render(<UserDetailView userId={1} onBack={mockOnBack} />);

      // Verify: Module progress is displayed
      await waitFor(() => {
        expect(screen.getByText('Module Progress')).toBeInTheDocument();
        expect(screen.getByText('Introduction to Programming')).toBeInTheDocument();
        expect(screen.getByText('Advanced JavaScript')).toBeInTheDocument();
        expect(screen.getByText('✓ Completed')).toBeInTheDocument();
        expect(screen.getByText('In Progress')).toBeInTheDocument();
      });
    });

    it('should display "No module progress yet" when student has no progress', async () => {
      // Setup: Mock student with no module progress
      const mockStudent = {
        id: 1,
        full_name: 'Student User',
        username: 'student@example.com',
        role: 'Student',
        phone_number: null,
        status: 'active',
        created_at: '2024-01-15T00:00:00.000Z',
        studentData: {
          totalXP: 0,
          currentLevel: 1,
          badges: [],
          quizAttempts: 0,
          moduleProgress: []
        }
      };

      adminAPI.getUserById.mockResolvedValue({
        data: { success: true, data: mockStudent }
      });

      // Test: Render component
      render(<UserDetailView userId={1} onBack={mockOnBack} />);

      // Verify: Empty state message is displayed
      await waitFor(() => {
        expect(screen.getByText('No module progress yet')).toBeInTheDocument();
      });
    });
  });

  describe('Parent Data Display - Requirement 3.4', () => {
    it('should display linked children for parent users', async () => {
      // Setup: Mock parent user with children
      const mockParent = {
        id: 1,
        full_name: 'Parent User',
        username: 'parent@example.com',
        role: 'Parent',
        phone_number: null,
        status: 'active',
        created_at: '2024-01-15T00:00:00.000Z',
        children: [
          {
            id: 10,
            full_name: 'Child One',
            username: 'child1@example.com',
            created_at: '2024-01-16T00:00:00.000Z'
          },
          {
            id: 11,
            full_name: 'Child Two',
            username: 'child2@example.com',
            created_at: '2024-01-17T00:00:00.000Z'
          }
        ]
      };

      adminAPI.getUserById.mockResolvedValue({
        data: { success: true, data: mockParent }
      });

      // Test: Render component
      render(<UserDetailView userId={1} onBack={mockOnBack} />);

      // Verify: Children are displayed
      await waitFor(() => {
        expect(screen.getByText('Linked Children (2)')).toBeInTheDocument();
        expect(screen.getByText('Child One')).toBeInTheDocument();
        expect(screen.getByText('child1@example.com')).toBeInTheDocument();
        expect(screen.getByText('Child Two')).toBeInTheDocument();
        expect(screen.getByText('child2@example.com')).toBeInTheDocument();
      });
    });

    it('should display "No children linked" when parent has no children', async () => {
      // Setup: Mock parent with no children
      const mockParent = {
        id: 1,
        full_name: 'Parent User',
        username: 'parent@example.com',
        role: 'Parent',
        phone_number: null,
        status: 'active',
        created_at: '2024-01-15T00:00:00.000Z',
        children: []
      };

      adminAPI.getUserById.mockResolvedValue({
        data: { success: true, data: mockParent }
      });

      // Test: Render component
      render(<UserDetailView userId={1} onBack={mockOnBack} />);

      // Verify: Empty state message is displayed
      await waitFor(() => {
        expect(screen.getByText('No children linked to this account')).toBeInTheDocument();
      });
    });
  });

  describe('Admin/Teacher Display', () => {
    it('should display no additional information for Admin users', async () => {
      // Setup: Mock admin user
      const mockAdmin = {
        id: 1,
        full_name: 'Admin User',
        username: 'admin@example.com',
        role: 'Admin',
        phone_number: null,
        status: 'active',
        created_at: '2024-01-15T00:00:00.000Z'
      };

      adminAPI.getUserById.mockResolvedValue({
        data: { success: true, data: mockAdmin }
      });

      // Test: Render component
      render(<UserDetailView userId={1} onBack={mockOnBack} />);

      // Verify: No additional information message is displayed
      await waitFor(() => {
        expect(screen.getByText('No additional information available for Admin users')).toBeInTheDocument();
      });
    });

    it('should display no additional information for Teacher users', async () => {
      // Setup: Mock teacher user
      const mockTeacher = {
        id: 1,
        full_name: 'Teacher User',
        username: 'teacher@example.com',
        role: 'Teacher',
        phone_number: null,
        status: 'active',
        created_at: '2024-01-15T00:00:00.000Z'
      };

      adminAPI.getUserById.mockResolvedValue({
        data: { success: true, data: mockTeacher }
      });

      // Test: Render component
      render(<UserDetailView userId={1} onBack={mockOnBack} />);

      // Verify: No additional information message is displayed
      await waitFor(() => {
        expect(screen.getByText('No additional information available for Teacher users')).toBeInTheDocument();
      });
    });
  });

  describe('Back Button - Requirement 3.5', () => {
    it('should call onBack when back button is clicked', async () => {
      // Setup: Mock user data
      const mockUser = {
        id: 1,
        full_name: 'Test User',
        username: 'test@example.com',
        role: 'Admin',
        phone_number: null,
        status: 'active',
        created_at: '2024-01-15T00:00:00.000Z'
      };

      adminAPI.getUserById.mockResolvedValue({
        data: { success: true, data: mockUser }
      });

      // Test: Render component
      render(<UserDetailView userId={1} onBack={mockOnBack} />);

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });

      // Click back button
      const backButton = screen.getByText('Back to User List');
      await userEvent.click(backButton);

      // Verify: onBack callback was called
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('should display back button in user not found state', async () => {
      // Setup: Mock API to return null user
      adminAPI.getUserById.mockResolvedValue({
        data: { success: true, data: null }
      });

      // Test: Render component
      render(<UserDetailView userId={999} onBack={mockOnBack} />);

      // Wait for not found message
      await waitFor(() => {
        expect(screen.getByText('User Not Found')).toBeInTheDocument();
      });

      // Click back button
      const backButton = screen.getByText('Back to User List');
      await userEvent.click(backButton);

      // Verify: onBack callback was called
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('API Integration - Requirement 3.1', () => {
    it('should fetch user details on mount', async () => {
      // Setup: Mock user data
      const mockUser = {
        id: 123,
        full_name: 'Test User',
        username: 'test@example.com',
        role: 'Student',
        phone_number: null,
        status: 'active',
        created_at: '2024-01-15T00:00:00.000Z',
        studentData: {
          totalXP: 100,
          currentLevel: 5,
          badges: [],
          quizAttempts: 10,
          moduleProgress: []
        }
      };

      adminAPI.getUserById.mockResolvedValue({
        data: { success: true, data: mockUser }
      });

      // Test: Render component
      render(<UserDetailView userId={123} onBack={mockOnBack} />);

      // Verify: API was called with correct userId
      await waitFor(() => {
        expect(adminAPI.getUserById).toHaveBeenCalledWith(123);
        expect(adminAPI.getUserById).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle API response with success: false', async () => {
      // Setup: Mock API to return success: false
      adminAPI.getUserById.mockResolvedValue({
        data: { success: false, message: 'User retrieval failed' }
      });

      // Test: Render component
      render(<UserDetailView userId={1} onBack={mockOnBack} />);

      // Verify: Error message is displayed
      await waitFor(() => {
        expect(screen.getByText('User retrieval failed')).toBeInTheDocument();
      });
    });
  });
});
