import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RecentQuizAttempts from './RecentQuizAttempts';

describe('RecentQuizAttempts', () => {
  it('renders empty state when no attempts provided', () => {
    render(<RecentQuizAttempts attempts={[]} />);
    
    expect(screen.getByText('Recent Quiz Attempts')).toBeInTheDocument();
    expect(screen.getByText('No quiz attempts yet.')).toBeInTheDocument();
  });

  it('renders empty state when attempts is null', () => {
    render(<RecentQuizAttempts attempts={null} />);
    
    expect(screen.getByText('No quiz attempts yet.')).toBeInTheDocument();
  });

  it('renders list of quiz attempts with question text', () => {
    const attempts = [
      {
        id: 1,
        question_text: 'What is the Amharic word for hello?',
        module_name: 'Greetings',
        is_correct: true,
        attempted_at: '2024-01-15T10:30:00Z'
      },
      {
        id: 2,
        question_text: 'How do you say goodbye?',
        module_name: 'Greetings',
        is_correct: false,
        attempted_at: '2024-01-15T11:00:00Z'
      }
    ];

    render(<RecentQuizAttempts attempts={attempts} />);
    
    expect(screen.getByText('What is the Amharic word for hello?')).toBeInTheDocument();
    expect(screen.getByText('How do you say goodbye?')).toBeInTheDocument();
  });

  it('displays module name for each attempt', () => {
    const attempts = [
      {
        id: 1,
        question_text: 'Test question',
        module_name: 'Greetings',
        is_correct: true,
        attempted_at: '2024-01-15T10:30:00Z'
      },
      {
        id: 2,
        question_text: 'Another question',
        module_name: 'Numbers',
        is_correct: false,
        attempted_at: '2024-01-15T11:00:00Z'
      }
    ];

    render(<RecentQuizAttempts attempts={attempts} />);
    
    expect(screen.getByText('Greetings')).toBeInTheDocument();
    expect(screen.getByText('Numbers')).toBeInTheDocument();
  });

  it('displays correctness indicator for correct answers', () => {
    const attempts = [
      {
        id: 1,
        question_text: 'Test question',
        module_name: 'Greetings',
        is_correct: true,
        attempted_at: '2024-01-15T10:30:00Z'
      }
    ];

    render(<RecentQuizAttempts attempts={attempts} />);
    
    // Check for checkmark emoji (✅)
    expect(screen.getByText('✅')).toBeInTheDocument();
  });

  it('displays correctness indicator for incorrect answers', () => {
    const attempts = [
      {
        id: 1,
        question_text: 'Test question',
        module_name: 'Greetings',
        is_correct: false,
        attempted_at: '2024-01-15T10:30:00Z'
      }
    ];

    render(<RecentQuizAttempts attempts={attempts} />);
    
    // Check for X emoji (❌)
    expect(screen.getByText('❌')).toBeInTheDocument();
  });

  it('formats timestamp correctly', () => {
    const attempts = [
      {
        id: 1,
        question_text: 'Test question',
        module_name: 'Greetings',
        is_correct: true,
        attempted_at: '2024-01-15T10:30:00Z'
      }
    ];

    render(<RecentQuizAttempts attempts={attempts} />);
    
    // Check that some date text is rendered (exact format may vary by locale)
    const dateElements = screen.getAllByText(/Jan|15|2024|10|30|AM/i);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it('limits display to 5 most recent attempts', () => {
    const attempts = [
      { id: 1, question_text: 'Question 1', module_name: 'Module 1', is_correct: true, attempted_at: '2024-01-15T10:30:00Z' },
      { id: 2, question_text: 'Question 2', module_name: 'Module 2', is_correct: true, attempted_at: '2024-01-15T10:31:00Z' },
      { id: 3, question_text: 'Question 3', module_name: 'Module 3', is_correct: true, attempted_at: '2024-01-15T10:32:00Z' },
      { id: 4, question_text: 'Question 4', module_name: 'Module 4', is_correct: true, attempted_at: '2024-01-15T10:33:00Z' },
      { id: 5, question_text: 'Question 5', module_name: 'Module 5', is_correct: true, attempted_at: '2024-01-15T10:34:00Z' },
      { id: 6, question_text: 'Question 6', module_name: 'Module 6', is_correct: true, attempted_at: '2024-01-15T10:35:00Z' },
      { id: 7, question_text: 'Question 7', module_name: 'Module 7', is_correct: true, attempted_at: '2024-01-15T10:36:00Z' }
    ];

    render(<RecentQuizAttempts attempts={attempts} />);
    
    // Should display first 5 questions
    expect(screen.getByText('Question 1')).toBeInTheDocument();
    expect(screen.getByText('Question 2')).toBeInTheDocument();
    expect(screen.getByText('Question 3')).toBeInTheDocument();
    expect(screen.getByText('Question 4')).toBeInTheDocument();
    expect(screen.getByText('Question 5')).toBeInTheDocument();
    
    // Should NOT display 6th and 7th questions
    expect(screen.queryByText('Question 6')).not.toBeInTheDocument();
    expect(screen.queryByText('Question 7')).not.toBeInTheDocument();
  });

  it('renders section header with emoji icon', () => {
    const attempts = [
      {
        id: 1,
        question_text: 'Test question',
        module_name: 'Greetings',
        is_correct: true,
        attempted_at: '2024-01-15T10:30:00Z'
      }
    ];

    render(<RecentQuizAttempts attempts={attempts} />);
    
    expect(screen.getByText('Recent Quiz Attempts')).toBeInTheDocument();
    // Header should have emoji icon
    const header = screen.getByText('Recent Quiz Attempts').closest('h3');
    expect(header).toHaveTextContent('🎯');
  });
});
