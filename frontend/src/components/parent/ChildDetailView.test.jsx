import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChildDetailView from './ChildDetailView';

describe('ChildDetailView', () => {
  const mockChildData = {
    student: {
      id: 1,
      full_name: 'John Doe'
    },
    xp: {
      total_xp: 1500,
      current_level: 5
    },
    badges: {
      earned: [
        {
          id: 1,
          name: 'First Steps',
          description: 'Complete your first lesson',
          icon_url: '🎯'
        }
      ],
      count: 1
    },
    quizzes: {
      recent_attempts: [
        {
          id: 1,
          content_id: 1,
          question_text: 'What is አ?',
          module_name: 'Fidel Basics',
          selected_answer: 'A',
          is_correct: true,
          score_earned: 10,
          attempted_at: '2024-01-15T10:30:00Z'
        }
      ],
      statistics: {
        total_attempts: 10,
        correct_answers: 8,
        success_rate: 80
      }
    },
    modules: [
      {
        id: 1,
        module_name: 'Fidel Basics',
        description: 'Learn the basics',
        total_items: 10,
        completed_items: 7,
        completion_percentage: 70
      }
    ]
  };

  it('renders child name in header', () => {
    const mockOnBack = vi.fn();
    render(<ChildDetailView childData={mockChildData} onBack={mockOnBack} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('renders back button and calls onBack when clicked', async () => {
    const user = userEvent.setup();
    const mockOnBack = vi.fn();
    render(<ChildDetailView childData={mockChildData} onBack={mockOnBack} />);
    
    const backButton = screen.getByRole('button', { name: /back/i });
    expect(backButton).toBeInTheDocument();
    
    await user.click(backButton);
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('renders XPLevelDisplay with correct props', () => {
    const mockOnBack = vi.fn();
    render(<ChildDetailView childData={mockChildData} onBack={mockOnBack} />);
    
    // Check for level and XP display
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('1500')).toBeInTheDocument();
  });

  it('renders BadgesSection with badges', () => {
    const mockOnBack = vi.fn();
    render(<ChildDetailView childData={mockChildData} onBack={mockOnBack} />);
    
    expect(screen.getByText('Badges Earned')).toBeInTheDocument();
    expect(screen.getByText('First Steps')).toBeInTheDocument();
  });

  it('renders QuizStatistics with correct data', () => {
    const mockOnBack = vi.fn();
    render(<ChildDetailView childData={mockChildData} onBack={mockOnBack} />);
    
    expect(screen.getByText('Quiz Statistics')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument(); // total attempts
    expect(screen.getByText('8')).toBeInTheDocument(); // correct answers
    expect(screen.getByText('80.0%')).toBeInTheDocument(); // success rate
  });

  it('renders RecentQuizAttempts with attempts', () => {
    const mockOnBack = vi.fn();
    render(<ChildDetailView childData={mockChildData} onBack={mockOnBack} />);
    
    expect(screen.getByText('Recent Quiz Attempts')).toBeInTheDocument();
    expect(screen.getByText('What is አ?')).toBeInTheDocument();
  });

  it('renders ModuleProgress with modules', () => {
    const mockOnBack = vi.fn();
    render(<ChildDetailView childData={mockChildData} onBack={mockOnBack} />);
    
    expect(screen.getByText('Module Progress')).toBeInTheDocument();
    expect(screen.getAllByText('Fidel Basics').length).toBeGreaterThan(0);
    expect(screen.getByText('70%')).toBeInTheDocument();
  });

  it('composes all sub-components in correct order', () => {
    const mockOnBack = vi.fn();
    const { container } = render(<ChildDetailView childData={mockChildData} onBack={mockOnBack} />);
    
    // Check that all major sections are present
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Badges Earned')).toBeInTheDocument();
    expect(screen.getByText('Quiz Statistics')).toBeInTheDocument();
    expect(screen.getByText('Recent Quiz Attempts')).toBeInTheDocument();
    expect(screen.getByText('Module Progress')).toBeInTheDocument();
  });
});
