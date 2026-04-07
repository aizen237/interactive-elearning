import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FidelChart from './FidelChart';

describe('FidelChart Component - Task 4.2: Character Cells', () => {
  it('renders character cells for each family by mapping the characters array', () => {
    render(<FidelChart />);
    
    // Ha family characters
    const haCharacters = ['ሀ', 'ሁ', 'ሂ', 'ሃ', 'ሄ', 'ህ', 'ሆ'];
    haCharacters.forEach((char) => {
      expect(screen.getByText(char)).toBeInTheDocument();
    });
    
    // Le family characters
    const leCharacters = ['ለ', 'ሉ', 'ሊ', 'ላ', 'ሌ', 'ል', 'ሎ'];
    leCharacters.forEach((char) => {
      expect(screen.getByText(char)).toBeInTheDocument();
    });
  });

  it('applies correct data cell styling (text-2xl, p-4, text-center)', () => {
    render(<FidelChart />);
    
    const dataCells = screen.getAllByRole('cell');
    
    // Should have 14 data cells (2 families × 7 characters)
    expect(dataCells).toHaveLength(14);
    
    dataCells.forEach((cell) => {
      expect(cell).toHaveClass('text-2xl');
      expect(cell).toHaveClass('p-4');
      expect(cell).toHaveClass('text-center');
    });
  });

  it('applies borders and spacing classes to data cells', () => {
    render(<FidelChart />);
    
    const dataCells = screen.getAllByRole('cell');
    
    dataCells.forEach((cell) => {
      expect(cell).toHaveClass('border');
      expect(cell).toHaveClass('border-gray-300');
    });
  });

  it('adds ARIA role="cell" to each data cell', () => {
    render(<FidelChart />);
    
    const dataCells = screen.getAllByRole('cell');
    
    // Should have 14 data cells (2 families × 7 characters)
    expect(dataCells).toHaveLength(14);
    
    dataCells.forEach((cell) => {
      expect(cell).toHaveAttribute('role', 'cell');
    });
  });

  it('renders exactly 7 character cells for each consonant family (Req 3.4)', () => {
    render(<FidelChart />);
    
    const dataCells = screen.getAllByRole('cell');
    
    // 2 families × 7 vowel columns = 14 cells
    expect(dataCells).toHaveLength(14);
  });

  it('displays characters in the correct grid structure (Req 3.5)', () => {
    render(<FidelChart />);
    
    // Verify Ha family characters appear in order
    const haCharacters = ['ሀ', 'ሁ', 'ሂ', 'ሃ', 'ሄ', 'ህ', 'ሆ'];
    const dataCells = screen.getAllByRole('cell');
    
    // First 7 cells should be Ha family
    haCharacters.forEach((char, index) => {
      expect(dataCells[index]).toHaveTextContent(char);
    });
    
    // Next 7 cells should be Le family
    const leCharacters = ['ለ', 'ሉ', 'ሊ', 'ላ', 'ሌ', 'ል', 'ሎ'];
    leCharacters.forEach((char, index) => {
      expect(dataCells[index + 7]).toHaveTextContent(char);
    });
  });

  it('applies Tailwind CSS classes for styling (Req 2.1)', () => {
    render(<FidelChart />);
    
    const dataCells = screen.getAllByRole('cell');
    
    dataCells.forEach((cell) => {
      // Verify Tailwind classes are used
      expect(cell.className).toMatch(/border|p-4|text-center|text-2xl|text-gray-900/);
    });
  });

  it('displays borders around grid cells (Req 2.2)', () => {
    render(<FidelChart />);
    
    const dataCells = screen.getAllByRole('cell');
    
    dataCells.forEach((cell) => {
      expect(cell).toHaveClass('border');
      expect(cell).toHaveClass('border-gray-300');
    });
  });

  it('provides adequate spacing between cells (Req 2.4)', () => {
    render(<FidelChart />);
    
    const dataCells = screen.getAllByRole('cell');
    
    dataCells.forEach((cell) => {
      // p-4 provides adequate padding/spacing
      expect(cell).toHaveClass('p-4');
    });
  });
});
