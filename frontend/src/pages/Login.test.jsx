import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from './Login';
import { authAPI } from '../services/api';

// Mock the API module
vi.mock('../services/api', () => ({
  authAPI: {
    login: vi.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Login Component - Parent Redirect (Task 1.3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('redirects parent users to /parent-dashboard after successful login', async () => {
    // Mock successful login response for parent user
    const mockParentResponse = {
      data: {
        token: 'mock-token-123',
        data: {
          id: 1,
          username: 'parent1',
          full_name: 'Test Parent',
          role: 'Parent',
        },
      },
    };

    authAPI.login.mockResolvedValueOnce(mockParentResponse);

    const { container } = render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Fill in login form using name attributes
    const usernameInput = container.querySelector('input[name="username"]');
    const passwordInput = container.querySelector('input[name="password"]');
    const loginButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(usernameInput, { target: { value: 'parent1' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    // Wait for navigation
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/parent-dashboard');
    });

    // Verify token and user data were saved
    expect(localStorage.getItem('token')).toBe('mock-token-123');
    expect(JSON.parse(localStorage.getItem('user'))).toEqual(mockParentResponse.data.data);
  });

  it('redirects teacher users to /teacher-dashboard', async () => {
    const mockTeacherResponse = {
      data: {
        token: 'mock-token-456',
        data: {
          id: 2,
          username: 'teacher1',
          full_name: 'Test Teacher',
          role: 'Teacher',
        },
      },
    };

    authAPI.login.mockResolvedValueOnce(mockTeacherResponse);

    const { container } = render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const usernameInput = container.querySelector('input[name="username"]');
    const passwordInput = container.querySelector('input[name="password"]');
    const loginButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(usernameInput, { target: { value: 'teacher1' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/teacher-dashboard');
    });
  });

  it('redirects student users to /student-dashboard', async () => {
    const mockStudentResponse = {
      data: {
        token: 'mock-token-789',
        data: {
          id: 3,
          username: 'student1',
          full_name: 'Test Student',
          role: 'Student',
        },
      },
    };

    authAPI.login.mockResolvedValueOnce(mockStudentResponse);

    const { container } = render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const usernameInput = container.querySelector('input[name="username"]');
    const passwordInput = container.querySelector('input[name="password"]');
    const loginButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(usernameInput, { target: { value: 'student1' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/student-dashboard');
    });
  });

  it('handles case-insensitive role matching', async () => {
    const mockResponse = {
      data: {
        token: 'mock-token-abc',
        data: {
          id: 4,
          username: 'parent2',
          full_name: 'Test Parent 2',
          role: 'PARENT', // Uppercase role
        },
      },
    };

    authAPI.login.mockResolvedValueOnce(mockResponse);

    const { container } = render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const usernameInput = container.querySelector('input[name="username"]');
    const passwordInput = container.querySelector('input[name="password"]');
    const loginButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(usernameInput, { target: { value: 'parent2' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/parent-dashboard');
    });
  });
});
