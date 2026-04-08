import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ModuleProgress from './ModuleProgress';

describe('ModuleProgress', () => {
  it('renders empty state when no modules provided', () => {
    render(<ModuleProgress modules={[]} />);
    
    expect(screen.getByText('Module Progress')).toBeInTheDocument();
    expect(screen.getByText('No modules started yet.')).toBeInTheDocument();
  });

  it('renders empty state when modules is null', () => {
    render(<ModuleProgress modules={null} />);
    
    expect(screen.getByText('Module Progress')).toBeInTheDocument();
    expect(screen.getByText('No modules started yet.')).toBeInTheDocument();
  });

  it('renders module progress bars with correct data', () => {
    const modules = [
      {
        id: 1,
        module_name: 'Amharic Alphabet',
        description: 'Learn the basics',
        total_items: 10,
        completed_items: 7,
        completion_percentage: 70
      },
      {
        id: 2,
        module_name: 'Numbers',
        description: 'Learn numbers',
        total_items: 5,
        completed_items: 2,
        completion_percentage: 40
      }
    ];

    render(<ModuleProgress modules={modules} />);
    
    // Check module names are displayed
    expect(screen.getByText('Amharic Alphabet')).toBeInTheDocument();
    expect(screen.getByText('Numbers')).toBeInTheDocument();
    
    // Check completion percentages are displayed
    expect(screen.getByText('70%')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
    
    // Check item counts are displayed
    expect(screen.getByText('7 of 10 items completed')).toBeInTheDocument();
    expect(screen.getByText('2 of 5 items completed')).toBeInTheDocument();
  });

  it('renders progress bars with correct width', () => {
    const modules = [
      {
        id: 1,
        module_name: 'Test Module',
        description: 'Test',
        total_items: 10,
        completed_items: 5,
        completion_percentage: 50
      }
    ];

    const { container } = render(<ModuleProgress modules={modules} />);
    
    // Find the progress bar element
    const progressBar = container.querySelector('.bg-gradient-to-r');
    expect(progressBar).toHaveStyle({ width: '50%' });
  });

  it('handles 0% completion correctly', () => {
    const modules = [
      {
        id: 1,
        module_name: 'New Module',
        description: 'Just started',
        total_items: 10,
        completed_items: 0,
        completion_percentage: 0
      }
    ];

    render(<ModuleProgress modules={modules} />);
    
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('0 of 10 items completed')).toBeInTheDocument();
  });

  it('handles 100% completion correctly', () => {
    const modules = [
      {
        id: 1,
        module_name: 'Completed Module',
        description: 'All done',
        total_items: 5,
        completed_items: 5,
        completion_percentage: 100
      }
    ];

    render(<ModuleProgress modules={modules} />);
    
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('5 of 5 items completed')).toBeInTheDocument();
  });

  it('rounds completion percentage to nearest integer', () => {
    const modules = [
      {
        id: 1,
        module_name: 'Test Module',
        description: 'Test',
        total_items: 3,
        completed_items: 1,
        completion_percentage: 33.333333
      }
    ];

    render(<ModuleProgress modules={modules} />);
    
    // Should round to 33%
    expect(screen.getByText('33%')).toBeInTheDocument();
  });
});
