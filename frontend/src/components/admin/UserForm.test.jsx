import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserForm from './UserForm';

/**
 * Unit tests for UserForm component
 * Tests form rendering, validation, submission, and error handling
 * Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
 */
describe('UserForm', () => {
  let mockOnSubmit;
  let mockOnCancel;

  beforeEach(() => {
    mockOnSubmit = vi.fn();
    mockOnCancel = vi.fn();
  });

  describe('Create Mode', () => {
    /**
     * Test: Form displays all required fields in create mode
     * Requirements: 4.2
     */
    it('should display all form fields in create mode', () => {
      render(
        <UserForm
          mode="create"
          initialData={null}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create user/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    /**
     * Test: Email validation
     * Requirements: 4.3
     */
    it('should validate email format', async () => {
      render(
        <UserForm
          mode="create"
          initialData={null}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /create user/i });

      // Enter invalid email
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    /**
     * Test: Password length validation
     * Requirements: 4.4
     */
    it('should validate password length (minimum 8 characters)', async () => {
      render(
        <UserForm
          mode="create"
          initialData={null}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /create user/i });

      // Enter short password
      fireEvent.change(passwordInput, { target: { value: 'short' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    /**
     * Test: Required field validation
     * Requirements: 4.3, 4.4
     */
    it('should show validation errors for empty required fields', async () => {
      render(
        <UserForm
          mode="create"
          initialData={null}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const submitButton = screen.getByRole('button', { name: /create user/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/full name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    /**
     * Test: Successful form submission
     * Requirements: 4.5, 4.6
     */
    it('should submit form with valid data', async () => {
      mockOnSubmit.mockResolvedValue();

      render(
        <UserForm
          mode="create"
          initialData={null}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Fill in valid data
      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: 'John Doe' }
      });
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'john@example.com' }
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' }
      });
      fireEvent.change(screen.getByLabelText(/role/i), {
        target: { value: 'Student' }
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /create user/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          full_name: 'John Doe',
          username: 'john@example.com',
          password: 'password123',
          role: 'Student'
        });
      });

      // Success message should appear
      await waitFor(() => {
        expect(screen.getByText(/user created successfully/i)).toBeInTheDocument();
      });
    });

    /**
     * Test: Error handling on submission failure
     * Requirements: 4.7
     */
    it('should display error message on submission failure', async () => {
      const errorMessage = 'Email already exists';
      mockOnSubmit.mockRejectedValue({
        response: { data: { message: errorMessage } }
      });

      render(
        <UserForm
          mode="create"
          initialData={null}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Fill in valid data
      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: 'John Doe' }
      });
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'john@example.com' }
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' }
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /create user/i }));

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    /**
     * Test: Submit button disabled during submission
     * Requirements: 4.7
     */
    it('should disable submit button during submission', async () => {
      mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(
        <UserForm
          mode="create"
          initialData={null}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Fill in valid data
      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: 'John Doe' }
      });
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'john@example.com' }
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' }
      });

      const submitButton = screen.getByRole('button', { name: /create user/i });
      fireEvent.click(submitButton);

      // Button should be disabled during submission
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });
  });

  describe('Edit Mode', () => {
    const initialData = {
      full_name: 'Jane Smith',
      username: 'jane@example.com',
      role: 'Teacher'
    };

    /**
     * Test: Form pre-populated with initial data
     * Requirements: 5.2
     */
    it('should pre-populate form with initial data in edit mode', () => {
      render(
        <UserForm
          mode="edit"
          initialData={initialData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByLabelText(/full name/i)).toHaveValue('Jane Smith');
      expect(screen.getByLabelText(/email/i)).toHaveValue('jane@example.com');
      expect(screen.getByLabelText(/role/i)).toHaveValue('Teacher');
      expect(screen.getByLabelText(/password/i)).toHaveValue(''); // Password not pre-populated
    });

    /**
     * Test: Password is optional in edit mode
     * Requirements: 5.3
     */
    it('should allow submission without password in edit mode', async () => {
      mockOnSubmit.mockResolvedValue();

      render(
        <UserForm
          mode="edit"
          initialData={initialData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Submit without changing password
      fireEvent.click(screen.getByRole('button', { name: /update user/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          full_name: 'Jane Smith',
          username: 'jane@example.com',
          role: 'Teacher'
          // Note: password should not be included
        });
      });
    });

    /**
     * Test: Email validation in edit mode
     * Requirements: 5.4
     */
    it('should validate email format in edit mode', async () => {
      render(
        <UserForm
          mode="edit"
          initialData={initialData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /update user/i });

      // Enter invalid email
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    /**
     * Test: Successful update submission
     * Requirements: 5.5, 5.6
     */
    it('should submit updated data successfully', async () => {
      mockOnSubmit.mockResolvedValue();

      render(
        <UserForm
          mode="edit"
          initialData={initialData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Update fields
      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: 'Jane Doe' }
      });
      fireEvent.change(screen.getByLabelText(/role/i), {
        target: { value: 'Admin' }
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /update user/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          full_name: 'Jane Doe',
          username: 'jane@example.com',
          role: 'Admin'
        });
      });

      // Success message should appear
      await waitFor(() => {
        expect(screen.getByText(/user updated successfully/i)).toBeInTheDocument();
      });
    });

    /**
     * Test: Error handling in edit mode
     * Requirements: 5.7
     */
    it('should display error message on update failure', async () => {
      const errorMessage = 'Failed to update user';
      mockOnSubmit.mockRejectedValue({
        response: { data: { message: errorMessage } }
      });

      render(
        <UserForm
          mode="edit"
          initialData={initialData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /update user/i }));

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    /**
     * Test: Password validation when provided in edit mode
     * Requirements: 5.4
     */
    it('should validate password length when provided in edit mode', async () => {
      render(
        <UserForm
          mode="edit"
          initialData={initialData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /update user/i });

      // Enter short password
      fireEvent.change(passwordInput, { target: { value: 'short' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Common Functionality', () => {
    /**
     * Test: Cancel button functionality
     */
    it('should call onCancel when cancel button is clicked', () => {
      render(
        <UserForm
          mode="create"
          initialData={null}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(mockOnCancel).toHaveBeenCalled();
    });

    /**
     * Test: Inline error clearing
     * Requirements: 4.7
     */
    it('should clear inline errors when user starts typing', async () => {
      render(
        <UserForm
          mode="create"
          initialData={null}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /create user/i });

      // Trigger validation error
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });

      // Start typing - error should clear
      fireEvent.change(emailInput, { target: { value: 'j' } });

      await waitFor(() => {
        expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument();
      });
    });

    /**
     * Test: All role options available
     * Requirements: 4.2, 5.3
     */
    it('should display all role options', () => {
      render(
        <UserForm
          mode="create"
          initialData={null}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const roleSelect = screen.getByLabelText(/role/i);
      const options = Array.from(roleSelect.options).map(opt => opt.value);

      expect(options).toContain('Student');
      expect(options).toContain('Parent');
      expect(options).toContain('Teacher');
      expect(options).toContain('Admin');
    });
  });
});
