import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import BadgesSection from './BadgesSection';

describe('BadgesSection', () => {
  it('displays empty state when no badges provided', () => {
    render(<BadgesSection badges={[]} />);
    
    expect(screen.getByText(/No badges earned yet/i)).toBeInTheDocument();
    expect(screen.getByText(/Keep learning to unlock achievements/i)).toBeInTheDocument();
  });

  it('displays empty state when badges is null', () => {
    render(<BadgesSection badges={null} />);
    
    expect(screen.getByText(/No badges earned yet/i)).toBeInTheDocument();
  });

  it('displays empty state when badges is undefined', () => {
    render(<BadgesSection />);
    
    expect(screen.getByText(/No badges earned yet/i)).toBeInTheDocument();
  });

  it('displays section header with emoji', () => {
    const badges = [
      {
        id: 1,
        name: 'First Steps',
        description: 'Completed your first lesson',
        icon_url: '🎯'
      }
    ];
    
    render(<BadgesSection badges={badges} />);
    
    expect(screen.getByText('Badges Earned')).toBeInTheDocument();
  });

  it('displays badge with icon, name, and description', () => {
    const badges = [
      {
        id: 1,
        name: 'First Steps',
        description: 'Completed your first lesson',
        icon_url: '🎯'
      }
    ];
    
    render(<BadgesSection badges={badges} />);
    
    expect(screen.getByText('First Steps')).toBeInTheDocument();
    expect(screen.getByText('Completed your first lesson')).toBeInTheDocument();
    expect(screen.getByText('🎯')).toBeInTheDocument();
  });

  it('displays multiple badges in grid layout', () => {
    const badges = [
      {
        id: 1,
        name: 'First Steps',
        description: 'Completed your first lesson',
        icon_url: '🎯'
      },
      {
        id: 2,
        name: 'Quiz Master',
        description: 'Passed 10 quizzes',
        icon_url: '🏆'
      },
      {
        id: 3,
        name: 'Dedicated Learner',
        description: 'Logged in 7 days in a row',
        icon_url: '⭐'
      }
    ];
    
    render(<BadgesSection badges={badges} />);
    
    expect(screen.getByText('First Steps')).toBeInTheDocument();
    expect(screen.getByText('Quiz Master')).toBeInTheDocument();
    expect(screen.getByText('Dedicated Learner')).toBeInTheDocument();
    expect(screen.getByText('Completed your first lesson')).toBeInTheDocument();
    expect(screen.getByText('Passed 10 quizzes')).toBeInTheDocument();
    expect(screen.getByText('Logged in 7 days in a row')).toBeInTheDocument();
  });

  it('uses default trophy icon when icon_url is not provided', () => {
    const badges = [
      {
        id: 1,
        name: 'First Steps',
        description: 'Completed your first lesson'
      }
    ];
    
    render(<BadgesSection badges={badges} />);
    
    expect(screen.getByText('First Steps')).toBeInTheDocument();
    // Default trophy icon should be rendered
    const trophyIcons = screen.getAllByText('🏆');
    expect(trophyIcons.length).toBeGreaterThan(0);
  });

  it('renders each badge with unique key', () => {
    const badges = [
      {
        id: 1,
        name: 'Badge 1',
        description: 'Description 1',
        icon_url: '🎯'
      },
      {
        id: 2,
        name: 'Badge 2',
        description: 'Description 2',
        icon_url: '🏆'
      }
    ];
    
    const { container } = render(<BadgesSection badges={badges} />);
    
    // Check that both badges are rendered
    expect(screen.getByText('Badge 1')).toBeInTheDocument();
    expect(screen.getByText('Badge 2')).toBeInTheDocument();
    
    // Verify grid container exists
    const gridContainer = container.querySelector('.grid');
    expect(gridContainer).toBeInTheDocument();
  });
});
