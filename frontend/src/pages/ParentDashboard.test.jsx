import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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

describe('ParentDashboard - Role-Based Access Control', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('redirects to login when no user data in localStorage', async () => {
    render(
      <BrowserRouter>
        <ParentDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('redirects to login when user has no role', async () => {
    localStorage.setItem('user', JSON.stringify({ full_name: 'Test User' }));

    render(
      <BrowserRouter>
        <ParentDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('redirects to student-dashboard when user is a Student', async () => {
    localStorage.setItem('user', JSON.stringify({ 
      full_name: 'Test Student',
      role: 'Student'
    }));

    render(
      <BrowserRouter>
        <ParentDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/student-dashboard');
    });
  });

  it('redirects to teacher-dashboard when user is a Teacher', async () => {
    localStorage.setItem('user', JSON.stringify({ 
      full_name: 'Test Teacher',
      role: 'Teacher'
    }));

    render(
      <BrowserRouter>
        <ParentDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/teacher-dashboard');
    });
  });

  it('fetches overview data when user is a Parent', async () => {
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
              full_name: 'Child One',
              username: 'child1',
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

    render(
      <BrowserRouter>
        <ParentDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(parentAPI.getChildrenOverview).toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    // Verify the child card is rendered
    await waitFor(() => {
      expect(screen.getByText('Child One')).toBeInTheDocument();
    });
  });

  it('redirects to login on 401 error during data fetch', async () => {
    localStorage.setItem('user', JSON.stringify({ 
      full_name: 'Test Parent',
      role: 'Parent'
    }));

    parentAPI.getChildrenOverview.mockRejectedValue({
      response: { status: 401 }
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

  it('redirects to login on 403 error during data fetch', async () => {
    localStorage.setItem('user', JSON.stringify({ 
      full_name: 'Test Parent',
      role: 'Parent'
    }));

    parentAPI.getChildrenOverview.mockRejectedValue({
      response: { status: 403 }
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
});
