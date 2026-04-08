import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import QuizStatistics from './QuizStatistics';

describe('QuizStatistics', () => {
  it('displays section header with emoji', () => {
    const statistics = {
      total_attempts: 10,
      correct_answers: 8,
      success_rate: 80.0
    };
    
    render(<QuizStatistics statistics={statistics} />);
    
    expect(screen.getByText('Quiz Statistics')).toBeInTheDocument();
    expect(screen.getByText('📊')).toBeInTheDocument();
  });

  it('displays total attempts correctly', () => {
    const statistics = {
      total_attempts: 15,
      correct_answers: 12,
      success_rate: 80.0
    };
    
    render(<QuizStatistics statistics={statistics} />);
    
    expect(screen.getByText('Total Attempts')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('🎯')).toBeInTheDocument();
  });

  it('displays correct answers correctly', () => {
    const statistics = {
      total_attempts: 20,
      correct_answers: 18,
      success_rate: 90.0
    };
    
    render(<QuizStatistics statistics={statistics} />);
    
    expect(screen.getByText('Correct Answers')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByText('✅')).toBeInTheDocument();
  });

  it('displays success rate with one decimal place', () => {
    const statistics = {
      total_attempts: 10,
      correct_answers: 7,
      success_rate: 70.5
    };
    
    render(<QuizStatistics statistics={statistics} />);
    
    expect(screen.getByText('Success Rate')).toBeInTheDocument();
    expect(screen.getByText('70.5%')).toBeInTheDocument();
    expect(screen.getByText('🏆')).toBeInTheDocument();
  });

  it('handles zero values gracefully', () => {
    const statistics = {
      total_attempts: 0,
      correct_answers: 0,
      success_rate: 0
    };
    
    render(<QuizStatistics statistics={statistics} />);
    
    expect(screen.getByText('Total Attempts')).toBeInTheDocument();
    expect(screen.getByText('Correct Answers')).toBeInTheDocument();
    expect(screen.getByText('Success Rate')).toBeInTheDocument();
    expect(screen.getAllByText('0')).toHaveLength(2); // total_attempts and correct_answers
    expect(screen.getByText('0.0%')).toBeInTheDocument();
  });

  it('handles missing statistics object', () => {
    render(<QuizStatistics />);
    
    expect(screen.getByText('Total Attempts')).toBeInTheDocument();
    expect(screen.getByText('Correct Answers')).toBeInTheDocument();
    expect(screen.getByText('Success Rate')).toBeInTheDocument();
    expect(screen.getAllByText('0')).toHaveLength(2);
    expect(screen.getByText('0.0%')).toBeInTheDocument();
  });

  it('handles null statistics object', () => {
    render(<QuizStatistics statistics={null} />);
    
    expect(screen.getByText('Total Attempts')).toBeInTheDocument();
    expect(screen.getByText('Correct Answers')).toBeInTheDocument();
    expect(screen.getByText('Success Rate')).toBeInTheDocument();
    expect(screen.getAllByText('0')).toHaveLength(2);
    expect(screen.getByText('0.0%')).toBeInTheDocument();
  });

  it('handles partial statistics data', () => {
    const statistics = {
      total_attempts: 5
      // missing correct_answers and success_rate
    };
    
    render(<QuizStatistics statistics={statistics} />);
    
    expect(screen.getByText('5')).toBeInTheDocument(); // total_attempts
    expect(screen.getByText('0')).toBeInTheDocument(); // correct_answers defaults to 0
    expect(screen.getByText('0.0%')).toBeInTheDocument(); // success_rate defaults to 0
  });

  it('displays all three statistics cards in grid layout', () => {
    const statistics = {
      total_attempts: 25,
      correct_answers: 20,
      success_rate: 80.0
    };
    
    const { container } = render(<QuizStatistics statistics={statistics} />);
    
    // Verify grid container exists
    const gridContainer = container.querySelector('.grid');
    expect(gridContainer).toBeInTheDocument();
    
    // Verify all three cards are present
    expect(screen.getByText('Total Attempts')).toBeInTheDocument();
    expect(screen.getByText('Correct Answers')).toBeInTheDocument();
    expect(screen.getByText('Success Rate')).toBeInTheDocument();
  });

  it('formats success rate with decimal precision', () => {
    const statistics = {
      total_attempts: 7,
      correct_answers: 5,
      success_rate: 71.42857
    };
    
    render(<QuizStatistics statistics={statistics} />);
    
    // Should display with one decimal place
    expect(screen.getByText('71.4%')).toBeInTheDocument();
  });

  it('displays 100% success rate correctly', () => {
    const statistics = {
      total_attempts: 10,
      correct_answers: 10,
      success_rate: 100.0
    };
    
    render(<QuizStatistics statistics={statistics} />);
    
    expect(screen.getByText('100.0%')).toBeInTheDocument();
  });

  it('uses colorful gradient styling for each card', () => {
    const statistics = {
      total_attempts: 10,
      correct_answers: 8,
      success_rate: 80.0
    };
    
    const { container } = render(<QuizStatistics statistics={statistics} />);
    
    // Check for gradient classes (blue, green, purple)
    const blueCard = container.querySelector('.from-blue-50');
    const greenCard = container.querySelector('.from-green-50');
    const purpleCard = container.querySelector('.from-purple-50');
    
    expect(blueCard).toBeInTheDocument();
    expect(greenCard).toBeInTheDocument();
    expect(purpleCard).toBeInTheDocument();
  });
});
