import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EmptyState from './EmptyState';

describe('EmptyState', () => {
  it('renders message correctly', () => {
    render(<EmptyState message="No data available" />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('renders default icon when no icon prop provided', () => {
    render(<EmptyState message="No data available" />);
    expect(screen.getByText('📭')).toBeInTheDocument();
  });

  it('renders custom icon when icon prop provided', () => {
    render(<EmptyState message="No children linked" icon="👨‍👩‍👧‍👦" />);
    expect(screen.getByText('👨‍👩‍👧‍👦')).toBeInTheDocument();
  });

  it('applies correct styling classes', () => {
    const { container } = render(<EmptyState message="Test message" />);
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('text-center', 'p-8');
  });
});
