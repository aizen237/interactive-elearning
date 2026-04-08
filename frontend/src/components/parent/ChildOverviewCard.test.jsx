import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChildOverviewCard from './ChildOverviewCard';

describe('ChildOverviewCard Component', () => {
  const mockChild = {
    id: 1,
    full_name: 'John Doe',
    username: 'johndoe',
    total_xp: 1500,
    current_level: 5,
    badges_earned: 3,
    quizzes_attempted: 10,
    quizzes_passed: 8
  };

  it('renders child full name correctly', () => {
    render(<ChildOverviewCard child={mockChild} onClick={vi.fn()} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('renders level and total XP correctly', () => {
    render(<ChildOverviewCard child={mockChild} onClick={vi.fn()} />);
    
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('1500')).toBeInTheDocument();
    expect(screen.getByText('Level')).toBeInTheDocument();
    expect(screen.getByText('Total XP')).toBeInTheDocument();
  });

  it('renders badges earned count', () => {
    render(<ChildOverviewCard child={mockChild} onClick={vi.fn()} />);
    
    expect(screen.getByText('Badges Earned')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders quizzes attempted count', () => {
    render(<ChildOverviewCard child={mockChild} onClick={vi.fn()} />);
    
    expect(screen.getByText('Quizzes Attempted')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('renders quizzes passed count', () => {
    render(<ChildOverviewCard child={mockChild} onClick={vi.fn()} />);
    
    expect(screen.getByText('Quizzes Passed')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('calls onClick handler with correct childId when clicked', async () => {
    const user = userEvent.setup();
    const mockOnClick = vi.fn();
    render(<ChildOverviewCard child={mockChild} onClick={mockOnClick} />);
    
    const card = screen.getByText('John Doe').closest('div').parentElement;
    await user.click(card);
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
    expect(mockOnClick).toHaveBeenCalledWith(1);
  });

  it('applies gradient styling to level/XP section', () => {
    render(<ChildOverviewCard child={mockChild} onClick={vi.fn()} />);
    
    const gradientSection = screen.getByText('John Doe').closest('div');
    expect(gradientSection).toHaveClass('bg-gradient-to-r', 'from-purple-600', 'to-blue-600');
  });

  it('applies hover styles to card', () => {
    render(<ChildOverviewCard child={mockChild} onClick={vi.fn()} />);
    
    const card = screen.getByText('John Doe').closest('div').parentElement;
    expect(card).toHaveClass('hover:shadow-xl', 'hover:scale-105', 'transition', 'transform');
  });

  it('renders with zero values correctly', () => {
    const childWithZeros = {
      ...mockChild,
      total_xp: 0,
      current_level: 1,
      badges_earned: 0,
      quizzes_attempted: 0,
      quizzes_passed: 0
    };
    
    render(<ChildOverviewCard child={childWithZeros} onClick={vi.fn()} />);
    
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getAllByText('0')).toHaveLength(4); // XP, badges, attempted, passed
  });

  it('displays emoji icons for visual appeal', () => {
    const { container } = render(<ChildOverviewCard child={mockChild} onClick={vi.fn()} />);
    
    expect(container.textContent).toContain('🏆');
    expect(container.textContent).toContain('🎯');
    expect(container.textContent).toContain('✅');
  });
});
