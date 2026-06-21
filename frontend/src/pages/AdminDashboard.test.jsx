import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

describe('AdminDashboard', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('Role Verification', () => {
    it('should redirect to login if no user in localStorage', async () => {
      render(
        <BrowserRouter>
          <AdminDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    it('should redirect to login if no token in localStorage', async () => {
      localStorage.setItem('user', JSON.stringify({ role: 'Admin', full_name: 'Admin User' }));

      render(
        <BrowserRouter>
          <AdminDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    it('should redirect Student users to student-dashboard', async () => {
      localStorage.setItem('user', JSON.stringify({ role: 'Student', full_name: 'Student User' }));
      localStorage.setItem('token', 'fake-token');

      render(
        <BrowserRouter>
          <AdminDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/student-dashboard');
      });
    });

    it('should redirect Parent users to parent-dashboard', async () => {
      localStorage.setItem('user', JSON.stringify({ role: 'Parent', full_name: 'Parent User' }));
      localStorage.setItem('token', 'fake-token');

      render(
        <BrowserRouter>
          <AdminDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/parent-dashboard');
      });
    });

    it('should allow Admin users to access dashboard', async () => {
      localStorage.setItem('user', JSON.stringify({ role: 'Admin', full_name: 'Admin User' }));
      localStorage.setItem('token', 'fake-token');

      render(
        <BrowserRouter>
          <AdminDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Welcome back, Admin User!')).toBeInTheDocument();
      });
    });

    it('should allow Teacher users to access dashboard', async () => {
      localStorage.setItem('user', JSON.stringify({ role: 'Teacher', full_name: 'Teacher User' }));
      localStorage.setItem('token', 'fake-token');

      render(
        <BrowserRouter>
          <AdminDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Welcome back, Teacher User!')).toBeInTheDocument();
      });
    });
  });

  describe('Header Display', () => {
    beforeEach(() => {
      localStorage.setItem('user', JSON.stringify({ role: 'Admin', full_name: 'John Admin' }));
      localStorage.setItem('token', 'fake-token');
    });

    it('should display admin user name in header', async () => {
      render(
        <BrowserRouter>
          <AdminDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Welcome back, John Admin!')).toBeInTheDocument();
      });
    });

    it('should display logout button', async () => {
      render(
        <BrowserRouter>
          <AdminDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
      });
    });
  });

  describe('Logout Functionality', () => {
    beforeEach(() => {
      localStorage.setItem('user', JSON.stringify({ role: 'Admin', full_name: 'Admin User' }));
      localStorage.setItem('token', 'fake-token');
      sessionStorage.setItem('adminActiveTab', 'content');
      sessionStorage.setItem('adminUserFilters', JSON.stringify({ role: 'Student' }));
      sessionStorage.setItem('adminSearchQuery', 'test');
    });

    it('should clear localStorage and sessionStorage on logout', async () => {
      render(
        <BrowserRouter>
          <AdminDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
      });

      const logoutButton = screen.getByRole('button', { name: /logout/i });
      fireEvent.click(logoutButton);

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(sessionStorage.getItem('adminActiveTab')).toBeNull();
      expect(sessionStorage.getItem('adminUserFilters')).toBeNull();
      expect(sessionStorage.getItem('adminSearchQuery')).toBeNull();
    });

    it('should redirect to login on logout', async () => {
      render(
        <BrowserRouter>
          <AdminDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
      });

      const logoutButton = screen.getByRole('button', { name: /logout/i });
      fireEvent.click(logoutButton);

      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('Tab Navigation', () => {
    beforeEach(() => {
      localStorage.setItem('user', JSON.stringify({ role: 'Admin', full_name: 'Admin User' }));
      localStorage.setItem('token', 'fake-token');
    });

    it('should display all three tabs', async () => {
      render(
        <BrowserRouter>
          <AdminDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /👥 Users/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /📚 Content/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /📊 Analytics/i })).toBeInTheDocument();
      });
    });

    it('should default to users tab', async () => {
      render(
        <BrowserRouter>
          <AdminDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
      });
    });

    it('should switch to content tab when clicked', async () => {
      render(
        <BrowserRouter>
          <AdminDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /📚 Content/i })).toBeInTheDocument();
      });

      const contentTab = screen.getByRole('button', { name: /📚 Content/i });
      fireEvent.click(contentTab);

      await waitFor(() => {
        expect(screen.getByText('Content Management')).toBeInTheDocument();
      });
    });

    it('should switch to analytics tab when clicked', async () => {
      render(
        <BrowserRouter>
          <AdminDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /📊 Analytics/i })).toBeInTheDocument();
      });

      const analyticsTab = screen.getByRole('button', { name: /📊 Analytics/i });
      fireEvent.click(analyticsTab);

      await waitFor(() => {
        expect(screen.getByText('Analytics')).toBeInTheDocument();
      });
    });

    it('should highlight active tab', async () => {
      render(
        <BrowserRouter>
          <AdminDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        const usersTab = screen.getByRole('button', { name: /👥 Users/i });
        expect(usersTab).toHaveClass('text-blue-600');
      });
    });
  });

  describe('Tab Persistence', () => {
    beforeEach(() => {
      localStorage.setItem('user', JSON.stringify({ role: 'Admin', full_name: 'Admin User' }));
      localStorage.setItem('token', 'fake-token');
    });

    it('should persist active tab to sessionStorage', async () => {
      render(
        <BrowserRouter>
          <AdminDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /📚 Content/i })).toBeInTheDocument();
      });

      const contentTab = screen.getByRole('button', { name: /📚 Content/i });
      fireEvent.click(contentTab);

      await waitFor(() => {
        expect(sessionStorage.getItem('adminActiveTab')).toBe('content');
      });
    });

    it('should restore active tab from sessionStorage on mount', async () => {
      sessionStorage.setItem('adminActiveTab', 'analytics');

      render(
        <BrowserRouter>
          <AdminDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Analytics')).toBeInTheDocument();
      });
    });

    it('should ignore invalid tab values from sessionStorage', async () => {
      sessionStorage.setItem('adminActiveTab', 'invalid-tab');

      render(
        <BrowserRouter>
          <AdminDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Should default to users tab
        expect(screen.getByText('User Management')).toBeInTheDocument();
      });
    });
  });
});
