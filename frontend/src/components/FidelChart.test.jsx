import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FidelChart from './FidelChart';

describe('FidelChart Component - Task 3.3: Header Row', () => {
  it('renders the header row with "Label" as the first cell', () => {
    render(<FidelChart />);
    
    const labelCell = screen.getByRole('columnheader', { name: 'Label' });
    expect(labelCell).toBeInTheDocument();
  });

  it('renders all 7 vowel labels in the correct order', () => {
    render(<FidelChart />);
    
    const vowels = ['ä', 'u', 'i', 'a', 'e', 'ə', 'o'];
    const columnHeaders = screen.getAllByRole('columnheader');
    
    // Should have 8 column headers total (1 Label + 7 vowels)
    expect(columnHeaders).toHaveLength(8);
    
    // Verify each vowel is present in order (starting from index 1, after "Label")
    vowels.forEach((vowel, index) => {
      expect(columnHeaders[index + 1]).toHaveTextContent(vowel);
    });
  });

  it('applies correct styling to header cells', () => {
    render(<FidelChart />);
    
    const columnHeaders = screen.getAllByRole('columnheader');
    
    columnHeaders.forEach((header) => {
      expect(header).toHaveClass('bg-blue-100');
      expect(header).toHaveClass('font-semibold');
      expect(header).toHaveClass('text-center');
      expect(header).toHaveClass('border');
      expect(header).toHaveClass('border-gray-300');
      expect(header).toHaveClass('p-3');
    });
  });

  it('applies sticky classes to the first header cell (Label)', () => {
    render(<FidelChart />);
    
    const labelCell = screen.getByRole('columnheader', { name: 'Label' });
    
    expect(labelCell).toHaveClass('sticky');
    expect(labelCell).toHaveClass('left-0');
    expect(labelCell).toHaveClass('z-10');
  });

  it('applies ARIA role="columnheader" to all header cells', () => {
    render(<FidelChart />);
    
    const columnHeaders = screen.getAllByRole('columnheader');
    
    // Should have 8 column headers (1 Label + 7 vowels)
    expect(columnHeaders).toHaveLength(8);
    
    columnHeaders.forEach((header) => {
      expect(header).toHaveAttribute('role', 'columnheader');
    });
  });
});
