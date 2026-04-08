import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorMessage from './ErrorMessage';

describe('ErrorMessage Component', () => {
  it('renders error message correctly', () => {
    const testMessage = 'Failed to load data';
    render(<ErrorMessage message={testMessage} />);
    
    expect(screen.getByText(testMessage)).toBeInTheDocument();
    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });

  it('displays retry button when onRetry is provided', () => {
    const mockRetry = vi.fn();
    render(<ErrorMessage message="Error occurred" onRetry={mockRetry} />);
    
    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();
  });

  it('does not display retry button when onRetry is not provided', () => {
    render(<ErrorMessage message="Error occurred" />);
    
    const retryButton = screen.queryByRole('button', { name: /retry/i });
    expect(retryButton).not.toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', async () => {
    const user = userEvent.setup();
    const mockRetry = vi.fn();
    render(<ErrorMessage message="Error occurred" onRetry={mockRetry} />);
    
    const retryButton = screen.getByRole('button', { name: /retry/i });
    await user.click(retryButton);
    
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it('applies red styling to error message', () => {
    render(<ErrorMessage message="Error occurred" />);
    
    const errorText = screen.getByText('Error occurred');
    expect(errorText).toHaveClass('text-red-600');
  });
});
