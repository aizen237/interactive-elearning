import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardHeader from './DashboardHeader';

describe('DashboardHeader Component', () => {
  it('renders welcome message with parent name', () => {
    render(<DashboardHeader parentName="John Doe" onLogout={vi.fn()} />);
    
    expect(screen.getByText('Parent Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Welcome back, John Doe!')).toBeInTheDocument();
  });

  it('renders logout button', () => {
    render(<DashboardHeader parentName="Jane Smith" onLogout={vi.fn()} />);
    
    const logoutButton = screen.getByRole('button', { name: /logout/i });
    expect(logoutButton).toBeInTheDocument();
  });

  it('calls onLogout when logout button is clicked', async () => {
    const user = userEvent.setup();
    const mockLogout = vi.fn();
    render(<DashboardHeader parentName="John Doe" onLogout={mockLogout} />);
    
    const logoutButton = screen.getByRole('button', { name: /logout/i });
    await user.click(logoutButton);
    
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('applies red styling to logout button', () => {
    render(<DashboardHeader parentName="John Doe" onLogout={vi.fn()} />);
    
    const logoutButton = screen.getByRole('button', { name: /logout/i });
    expect(logoutButton).toHaveClass('bg-red-600', 'hover:bg-red-700');
  });

  it('displays parent name correctly in welcome message', () => {
    const parentName = 'Alice Johnson';
    render(<DashboardHeader parentName={parentName} onLogout={vi.fn()} />);
    
    expect(screen.getByText(`Welcome back, ${parentName}!`)).toBeInTheDocument();
  });
});
