import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserManagementPanel from './UserManagementPanel';
import adminAPI from '../../services/adminAPI';

// Mock the adminAPI module
vi.mock('../../services/adminAPI');

// Mock child components
vi.mock('../LoadingSpinner', () => ({
  default: () => <div>Loading...</div>
}));

vi.mock('../ErrorMessage', () => ({
  default: ({ message, onRetry }) => (
    <div>
      <div>{message}</div>
      {onRetry && <button onClick={onRetry}>Retry</button>}
    </div>
  )
}));

describe('UserManagementPanel', () => {
  const mockUsers = [
    {
      id: 1,
      full_name: 'John Doe',
      username: 'john@example.com',
      role: 'Student',
      created_at: '2024-01-15T10:00:00Z',
      is_active: true
    },
    {
      id: 2,
      full_name: 'Jane Smith',
      username: 'jane@example.com',
      role: 'Parent',
      created_at: '2024-01-16T10:00:00Z',
      is_active: true
    },
    {
      id: 3,
      full_name: 'Bob Admin',
      username: 'bob@example.com',
      role: 'Admin',
      created_at: '2024-01-17T10:00:00Z',
      is_active: false
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test: Component renders loading state initially
   * Requirements: 2.2
   */
  it('should display loading spinner while fetching users', () => {
    adminAPI.getUsers.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<UserManagementPanel />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  /**
   * Test: Component displays error message on API failure
   * Requirements: 2.3
   */
  it('should display error message when API fails', async () => {
    const errorMessage = 'Failed to load users';
    adminAPI.getUsers.mockRejectedValue({
      response: { data: { message: errorMessage } }
    });

    render(<UserManagementPanel />);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  /**
   * Test: Component displays user list successfully
   * Requirements: 2.1, 2.4
   */
  it('should display user list with correct data', async () => {
    adminAPI.getUsers.mockResolvedValue({
      data: {
        success: true,
        data: {
          users: mockUsers,
          totalPages: 1,
          total: 3
        }
      }
    });

    render(<UserManagementPanel />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
      expect(screen.getByText('Bob Admin')).toBeInTheDocument();
    });

    // Check that all columns are displayed
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Role')).toBeInTheDocument();
    expect(screen.getByText('Registration Date')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  /**
   * Test: Role filter functionality
   * Requirements: 2.5
   */
  it('should filter users by role', async () => {
    const user = userEvent.setup();
    
    adminAPI.getUsers.mockResolvedValue({
      data: {
        success: true,
        data: {
          users: mockUsers,
          totalPages: 1,
          total: 3
        }
      }
    });

    render(<UserManagementPanel />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Change role filter
    const roleFilter = screen.getByLabelText('Filter by Role');
    await user.selectOptions(roleFilter, 'Student');

    await waitFor(() => {
      expect(adminAPI.getUsers).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'Student' })
      );
    });
  });

  /**
   * Test: Search functionality with debouncing
   * Requirements: 2.6
   */
  it('should search users with debouncing', async () => {
    const user = userEvent.setup({ delay: null });
    
    adminAPI.getUsers.mockResolvedValue({
      data: {
        success: true,
        data: {
          users: mockUsers,
          totalPages: 1,
          total: 3
        }
      }
    });

    render(<UserManagementPanel />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Type in search box
    const searchInput = screen.getByPlaceholderText('Search by name or email...');
    await user.type(searchInput, 'John');

    // Wait for debounce to complete
    await waitFor(() => {
      expect(adminAPI.getUsers).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'John' })
      );
    }, { timeout: 1000 });
  });

  /**
   * Test: Pagination functionality
   * Requirements: 2.7
   */
  it('should handle pagination correctly', async () => {
    const user = userEvent.setup({ delay: null });
    
    adminAPI.getUsers.mockResolvedValue({
      data: {
        success: true,
        data: {
          users: mockUsers,
          totalPages: 3,
          total: 60
        }
      }
    });

    render(<UserManagementPanel />);

    await waitFor(() => {
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    });

    // Reset mock to track next call
    adminAPI.getUsers.mockClear();

    // Click next button
    const nextButton = screen.getByText('Next');
    await user.click(nextButton);

    await waitFor(() => {
      expect(adminAPI.getUsers).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 })
      );
    });
  });

  /**
   * Test: User deactivation
   * Requirements: 6.1
   */
  it('should deactivate user with confirmation', async () => {
    const user = userEvent.setup({ delay: null });
    
    adminAPI.getUsers.mockResolvedValue({
      data: {
        success: true,
        data: {
          users: mockUsers,
          totalPages: 1,
          total: 3
        }
      }
    });

    adminAPI.deactivateUser.mockResolvedValue({
      data: { success: true }
    });

    // Mock window.confirm
    global.confirm = vi.fn(() => true);

    render(<UserManagementPanel />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click deactivate button for first user
    const deactivateButtons = screen.getAllByText('Deactivate');
    await user.click(deactivateButtons[0]);

    expect(global.confirm).toHaveBeenCalledWith(
      expect.stringContaining('John Doe')
    );

    await waitFor(() => {
      expect(adminAPI.deactivateUser).toHaveBeenCalledWith(1);
    });
  });

  /**
   * Test: User activation
   * Requirements: 6.5
   */
  it('should activate inactive user', async () => {
    const user = userEvent.setup({ delay: null });
    
    adminAPI.getUsers.mockResolvedValue({
      data: {
        success: true,
        data: {
          users: mockUsers,
          totalPages: 1,
          total: 3
        }
      }
    });

    adminAPI.activateUser.mockResolvedValue({
      data: { success: true }
    });

    render(<UserManagementPanel />);

    await waitFor(() => {
      expect(screen.getByText('Bob Admin')).toBeInTheDocument();
    });

    // Reset mock to track next call
    adminAPI.getUsers.mockClear();

    // Click activate button for inactive user
    const activateButton = screen.getByText('Activate');
    await user.click(activateButton);

    await waitFor(() => {
      expect(adminAPI.activateUser).toHaveBeenCalledWith(3);
    });
  });

  /**
   * Test: Export users functionality
   * Requirements: 19.1
   */
  it('should export users as CSV', async () => {
    const user = userEvent.setup({ delay: null });
    
    adminAPI.getUsers.mockResolvedValue({
      data: {
        success: true,
        data: {
          users: mockUsers,
          totalPages: 1,
          total: 3
        }
      }
    });

    const mockBlob = new Blob(['csv data'], { type: 'text/csv' });
    adminAPI.exportUsers.mockResolvedValue({
      data: mockBlob
    });

    render(<UserManagementPanel />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click export button
    const exportButton = screen.getByText('Export Users');
    await user.click(exportButton);

    await waitFor(() => {
      expect(adminAPI.exportUsers).toHaveBeenCalled();
    });
  });

  /**
   * Test: Empty state display
   * Requirements: 2.1
   */
  it('should display empty state when no users found', async () => {
    adminAPI.getUsers.mockResolvedValue({
      data: {
        success: true,
        data: {
          users: [],
          totalPages: 0,
          total: 0
        }
      }
    });

    render(<UserManagementPanel />);

    await waitFor(() => {
      expect(screen.getByText('No users found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument();
    });
  });

  /**
   * Test: Display action buttons
   * Requirements: 4.1, 7.1, 19.1
   */
  it('should display Create User, Bulk Upload, and Export buttons', async () => {
    adminAPI.getUsers.mockResolvedValue({
      data: {
        success: true,
        data: {
          users: mockUsers,
          totalPages: 1,
          total: 3
        }
      }
    });

    render(<UserManagementPanel />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Check for action buttons
    expect(screen.getByText('Create User')).toBeInTheDocument();
    expect(screen.getByText('Bulk Upload')).toBeInTheDocument();
    expect(screen.getByText('Export Users')).toBeInTheDocument();
  });
});
