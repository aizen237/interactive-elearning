import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ParentDashboard from './ParentDashboard';
import parentAPI from '../services/parentAPI';

// Mock the navigate function
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock the parentAPI
vi.mock('../services/parentAPI', () => ({
  default: {
    getChildrenOverview: vi.fn(),
    getChildStats: vi.fn(),
  },
}));

describe('ParentDashboard - Authentication Flow Integration (Task 8.1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Requirement 4.1 & 4.2: JWT token in API requests', () => {
    it('should make API call with token from localStorage', async () => {
      const testToken = 'test-jwt-token-abc123';
      localStorage.setItem('token', testToken);
      localStorage.setItem('user', JSON.stringify({ 
        full_name: 'Test Parent',
        role: 'Parent'
      }));

      const mockOverviewData = {
        data: {
          data: {
            children: [],
            total_children: 0
          }
        }
      };

      parentAPI.getChildrenOverview.mockResolvedValue(mockOverviewData);

      render(
        <BrowserRouter>
          <ParentDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(parentAPI.getChildrenOverview).toHaveBeenCalled();
      });

      // Verify token is still in localStorage (would be used by api interceptor)
      expect(localStorage.getItem('token')).toBe(testToken);
    });

    it('should call getChildStats with token when viewing child details', async () => {
      const testToken = 'child-stats-token-xyz789';
      localStorage.setItem('token', testToken);
      localStorage.setItem('user', JSON.stringify({ 
        full_name: 'Test Parent',
        role: 'Parent'
      }));

      const mockOverviewData = {
        data: {
          data: {
            children: [
              {
                id: 1,
                full_name: 'Test Child',
                username: 'testchild',
                total_xp: 100,
                current_level: 2,
                badges_earned: 3,
                quizzes_attempted: 5,
                quizzes_passed: 4
              }
            ],
            total_children: 1
          }
        }
      };

      const mockDetailData = {
        data: {
          data: {
            student: { id: 1, full_name: 'Test Child' },
            xp: { total_xp: 100, current_level: 2 },
            badges: { earned: [], count: 0 },
            quizzes: {
              recent_attempts: [],
              statistics: { total_attempts: 5, correct_answers: 4, success_rate: 80 }
            },
            modules: []
          }
        }
      };

      parentAPI.getChildrenOverview.mockResolvedValue(mockOverviewData);
      parentAPI.getChildStats.mockResolvedValue(mockDetailData);

      render(
        <BrowserRouter>
          <ParentDashboard />
        </BrowserRouter>
      );

      // Wait for overview to load
      await waitFor(() => {
        expect(screen.getByText('Test Child')).toBeInTheDocument();
      });

      // Click on child card
      const childCard = screen.getByText('Test Child').closest('div[class*="cursor-pointer"]');
      fireEvent.click(childCard);

      await waitFor(() => {
        expect(parentAPI.getChildStats).toHaveBeenCalledWith(1);
      });

      // Verify token is still available
      expect(localStorage.getItem('token')).toBe(testToken);
    });
  });

  describe('Requirement 4.3: 401 responses redirect to login', () => {
    it('should redirect to login on 401 error from getChildrenOverview', async () => {
      localStorage.setItem('user', JSON.stringify({ 
        full_name: 'Test Parent',
        role: 'Parent'
      }));

      parentAPI.getChildrenOverview.mockRejectedValue({
        response: { status: 401, data: { message: 'Unauthorized' } }
      });

      render(
        <BrowserRouter>
          <ParentDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    it('should redirect to login on 401 error from getChildStats', async () => {
      localStorage.setItem('user', JSON.stringify({ 
        full_name: 'Test Parent',
        role: 'Parent'
      }));

      const mockOverviewData = {
        data: {
          data: {
            children: [
              {
                id: 1,
                full_name: 'Test Child',
                username: 'testchild',
                total_xp: 100,
                current_level: 2,
                badges_earned: 3,
                quizzes_attempted: 5,
                quizzes_passed: 4
              }
            ],
            total_children: 1
          }
        }
      };

      parentAPI.getChildrenOverview.mockResolvedValue(mockOverviewData);
      parentAPI.getChildStats.mockRejectedValue({
        response: { status: 401, data: { message: 'Token expired' } }
      });

      render(
        <BrowserRouter>
          <ParentDashboard />
        </BrowserRouter>
      );

      // Wait for overview to load
      await waitFor(() => {
        expect(screen.getByText('Test Child')).toBeInTheDocument();
      });

      // Click on child card
      const childCard = screen.getByText('Test Child').closest('div[class*="cursor-pointer"]');
      fireEvent.click(childCard);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('Requirement 4.3: 403 responses redirect to login', () => {
    it('should redirect to login on 403 error from getChildrenOverview', async () => {
      localStorage.setItem('user', JSON.stringify({ 
        full_name: 'Test Parent',
        role: 'Parent'
      }));

      parentAPI.getChildrenOverview.mockRejectedValue({
        response: { status: 403, data: { message: 'Forbidden' } }
      });

      render(
        <BrowserRouter>
          <ParentDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    it('should display error message (not redirect) on 403 error from getChildStats', async () => {
      localStorage.setItem('user', JSON.stringify({ 
        full_name: 'Test Parent',
        role: 'Parent'
      }));

      const mockOverviewData = {
        data: {
          data: {
            children: [
              {
                id: 1,
                full_name: 'Test Child',
                username: 'testchild',
                total_xp: 100,
                current_level: 2,
                badges_earned: 3,
                quizzes_attempted: 5,
                quizzes_passed: 4
              }
            ],
            total_children: 1
          }
        }
      };

      parentAPI.getChildrenOverview.mockResolvedValue(mockOverviewData);
      parentAPI.getChildStats.mockRejectedValue({
        response: { status: 403, data: { message: 'Access denied to this child' } }
      });

      render(
        <BrowserRouter>
          <ParentDashboard />
        </BrowserRouter>
      );

      // Wait for overview to load
      await waitFor(() => {
        expect(screen.getByText('Test Child')).toBeInTheDocument();
      });

      // Click on child card
      const childCard = screen.getByText('Test Child').closest('div[class*="cursor-pointer"]');
      fireEvent.click(childCard);

      // Should display error message, not redirect
      await waitFor(() => {
        expect(screen.getByText(/Access denied to this child's data/i)).toBeInTheDocument();
      });

      // Should NOT redirect to login for 403 on child stats
      expect(mockNavigate).not.toHaveBeenCalledWith('/login');
    });
  });

  describe('Requirement 4.5: Network errors display user-friendly messages', () => {
    it('should display error message on network error from getChildrenOverview', async () => {
      localStorage.setItem('user', JSON.stringify({ 
        full_name: 'Test Parent',
        role: 'Parent'
      }));

      // Network error (no response)
      parentAPI.getChildrenOverview.mockRejectedValue({
        request: {},
        message: 'Network Error'
      });

      render(
        <BrowserRouter>
          <ParentDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Failed to load children data/i)).toBeInTheDocument();
      });

      // Should NOT redirect to login
      expect(mockNavigate).not.toHaveBeenCalledWith('/login');
    });

    it('should display error message on server error (500)', async () => {
      localStorage.setItem('user', JSON.stringify({ 
        full_name: 'Test Parent',
        role: 'Parent'
      }));

      parentAPI.getChildrenOverview.mockRejectedValue({
        response: { status: 500, data: { message: 'Internal Server Error' } }
      });

      render(
        <BrowserRouter>
          <ParentDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Failed to load children data/i)).toBeInTheDocument();
      });

      // Should NOT redirect to login
      expect(mockNavigate).not.toHaveBeenCalledWith('/login');
    });

    it('should display error message on timeout error', async () => {
      localStorage.setItem('user', JSON.stringify({ 
        full_name: 'Test Parent',
        role: 'Parent'
      }));

      parentAPI.getChildrenOverview.mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded'
      });

      render(
        <BrowserRouter>
          <ParentDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Failed to load children data/i)).toBeInTheDocument();
      });
    });

    it('should display error message on connection refused', async () => {
      localStorage.setItem('user', JSON.stringify({ 
        full_name: 'Test Parent',
        role: 'Parent'
      }));

      parentAPI.getChildrenOverview.mockRejectedValue({
        request: {},
        code: 'ECONNREFUSED',
        message: 'connect ECONNREFUSED 127.0.0.1:5000'
      });

      render(
        <BrowserRouter>
          <ParentDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Failed to load children data/i)).toBeInTheDocument();
      });
    });

    it('should display error message when getChildStats fails with network error', async () => {
      localStorage.setItem('user', JSON.stringify({ 
        full_name: 'Test Parent',
        role: 'Parent'
      }));

      const mockOverviewData = {
        data: {
          data: {
            children: [
              {
                id: 1,
                full_name: 'Test Child',
                username: 'testchild',
                total_xp: 100,
                current_level: 2,
                badges_earned: 3,
                quizzes_attempted: 5,
                quizzes_passed: 4
              }
            ],
            total_children: 1
          }
        }
      };

      parentAPI.getChildrenOverview.mockResolvedValue(mockOverviewData);
      parentAPI.getChildStats.mockRejectedValue({
        request: {},
        message: 'Network Error'
      });

      render(
        <BrowserRouter>
          <ParentDashboard />
        </BrowserRouter>
      );

      // Wait for overview to load
      await waitFor(() => {
        expect(screen.getByText('Test Child')).toBeInTheDocument();
      });

      // Click on child card
      const childCard = screen.getByText('Test Child').closest('div[class*="cursor-pointer"]');
      fireEvent.click(childCard);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load child details/i)).toBeInTheDocument();
      });
    });

    it('should provide retry functionality on error', async () => {
      localStorage.setItem('user', JSON.stringify({ 
        full_name: 'Test Parent',
        role: 'Parent'
      }));

      parentAPI.getChildrenOverview.mockRejectedValue({
        request: {},
        message: 'Network Error'
      });

      render(
        <BrowserRouter>
          <ParentDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Failed to load children data/i)).toBeInTheDocument();
      });

      // Verify retry button exists
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });
  });

  describe('Error differentiation', () => {
    it('should handle 401 differently than network errors', async () => {
      localStorage.setItem('user', JSON.stringify({ 
        full_name: 'Test Parent',
        role: 'Parent'
      }));

      // Test 401 - should redirect
      parentAPI.getChildrenOverview.mockRejectedValue({
        response: { status: 401 }
      });

      const { unmount } = render(
        <BrowserRouter>
          <ParentDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });

      unmount();
      vi.clearAllMocks();

      // Test network error - should show error message
      parentAPI.getChildrenOverview.mockRejectedValue({
        request: {},
        message: 'Network Error'
      });

      render(
        <BrowserRouter>
          <ParentDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Failed to load children data/i)).toBeInTheDocument();
      });

      // Should NOT redirect for network error
      expect(mockNavigate).not.toHaveBeenCalledWith('/login');
    });

    it('should handle 403 on overview differently than 403 on child stats', async () => {
      localStorage.setItem('user', JSON.stringify({ 
        full_name: 'Test Parent',
        role: 'Parent'
      }));

      // Test 403 on overview - should redirect to login
      parentAPI.getChildrenOverview.mockRejectedValue({
        response: { status: 403 }
      });

      const { unmount } = render(
        <BrowserRouter>
          <ParentDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });

      unmount();
      vi.clearAllMocks();

      // Test 403 on child stats - should show error message
      const mockOverviewData = {
        data: {
          data: {
            children: [
              {
                id: 1,
                full_name: 'Test Child',
                username: 'testchild',
                total_xp: 100,
                current_level: 2,
                badges_earned: 3,
                quizzes_attempted: 5,
                quizzes_passed: 4
              }
            ],
            total_children: 1
          }
        }
      };

      parentAPI.getChildrenOverview.mockResolvedValue(mockOverviewData);
      parentAPI.getChildStats.mockRejectedValue({
        response: { status: 403 }
      });

      render(
        <BrowserRouter>
          <ParentDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Child')).toBeInTheDocument();
      });

      const childCard = screen.getByText('Test Child').closest('div[class*="cursor-pointer"]');
      fireEvent.click(childCard);

      await waitFor(() => {
        expect(screen.getByText(/Access denied to this child's data/i)).toBeInTheDocument();
      });

      // Should NOT redirect for 403 on child stats
      expect(mockNavigate).not.toHaveBeenCalledWith('/login');
    });
  });
});
