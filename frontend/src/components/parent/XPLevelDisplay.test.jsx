import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import XPLevelDisplay from './XPLevelDisplay';

describe('XPLevelDisplay', () => {
  it('renders level correctly', () => {
    render(<XPLevelDisplay level={5} totalXP={1250} />);
    
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Current Level')).toBeInTheDocument();
  });

  it('renders total XP correctly', () => {
    render(<XPLevelDisplay level={3} totalXP={750} />);
    
    expect(screen.getByText('750')).toBeInTheDocument();
    expect(screen.getByText('Total XP')).toBeInTheDocument();
  });

  it('handles level 1 with 0 XP', () => {
    render(<XPLevelDisplay level={1} totalXP={0} />);
    
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('applies purple-to-blue gradient styling', () => {
    const { container } = render(<XPLevelDisplay level={5} totalXP={1250} />);
    
    const gradientDiv = container.querySelector('.bg-gradient-to-r.from-purple-600.to-blue-600');
    expect(gradientDiv).toBeInTheDocument();
  });

  it('displays level and XP in correct layout', () => {
    render(<XPLevelDisplay level={7} totalXP={2100} />);
    
    const levelText = screen.getByText('7');
    const xpText = screen.getByText('2100');
    
    expect(levelText).toBeInTheDocument();
    expect(xpText).toBeInTheDocument();
  });
});
