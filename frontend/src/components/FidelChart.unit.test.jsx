import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FidelChart from './FidelChart';

describe('FidelChart Component - Unit Tests (Task 6)', () => {
  
  // ========================================
  // 6.1 Test component rendering
  // ========================================
  describe('6.1 Component Rendering', () => {
    it('renders without errors', () => {
      expect(() => render(<FidelChart />)).not.toThrow();
    });

    it('renders correct number of rows (1 header + 2 data rows) - Req 5.1', () => {
      render(<FidelChart />);
      
      // Header row: 8 columnheader elements
      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders).toHaveLength(8);
      
      // Data rows: 2 rowheader elements (one per family)
      const rowHeaders = screen.getAllByRole('rowheader');
      expect(rowHeaders).toHaveLength(2);
      
      // Data cells: 2 families × 7 vowels = 14 cells
      const dataCells = screen.getAllByRole('cell');
      expect(dataCells).toHaveLength(14);
    });

    it('renders correct number of columns (8 total) - Req 5.3', () => {
      render(<FidelChart />);
      
      // 8 column headers: 1 Label + 7 vowels
      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders).toHaveLength(8);
      
      // Verify first row has 8 elements (Label + 7 vowels)
      expect(columnHeaders[0]).toHaveTextContent('Label');
      const vowels = ['ä', 'u', 'i', 'a', 'e', 'ə', 'o'];
      vowels.forEach((vowel, index) => {
        expect(columnHeaders[index + 1]).toHaveTextContent(vowel);
      });
    });

    it('renders the grid container with role="table" - Req 5.4', () => {
      render(<FidelChart />);
      
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      expect(table).toHaveAttribute('aria-label', 'Amharic Fidel Chart');
    });
  });

  // ========================================
  // 6.2 Test data display
  // ========================================
  describe('6.2 Data Display', () => {
    it('renders all vowel headers in correct order - Req 1.4', () => {
      render(<FidelChart />);
      
      const vowels = ['ä', 'u', 'i', 'a', 'e', 'ə', 'o'];
      const columnHeaders = screen.getAllByRole('columnheader');
      
      // Verify vowels appear in correct order (after Label)
      vowels.forEach((vowel, index) => {
        expect(columnHeaders[index + 1]).toHaveTextContent(vowel);
      });
    });

    it('renders Ha family characters correctly - Req 3.2', () => {
      render(<FidelChart />);
      
      const haCharacters = ['ሀ', 'ሁ', 'ሂ', 'ሃ', 'ሄ', 'ህ', 'ሆ'];
      
      // Verify all Ha family characters are present
      haCharacters.forEach((char) => {
        expect(screen.getByText(char)).toBeInTheDocument();
      });
      
      // Verify Ha label is present
      const haLabel = screen.getByRole('rowheader', { name: 'Ha' });
      expect(haLabel).toBeInTheDocument();
    });

    it('renders Le family characters correctly - Req 3.3', () => {
      render(<FidelChart />);
      
      const leCharacters = ['ለ', 'ሉ', 'ሊ', 'ላ', 'ሌ', 'ል', 'ሎ'];
      
      // Verify all Le family characters are present
      leCharacters.forEach((char) => {
        expect(screen.getByText(char)).toBeInTheDocument();
      });
      
      // Verify Le label is present
      const leLabel = screen.getByRole('rowheader', { name: 'Le' });
      expect(leLabel).toBeInTheDocument();
    });

    it('renders characters in correct grid order - Req 3.4', () => {
      render(<FidelChart />);
      
      const dataCells = screen.getAllByRole('cell');
      
      // Ha family should be first 7 cells
      const haCharacters = ['ሀ', 'ሁ', 'ሂ', 'ሃ', 'ሄ', 'ህ', 'ሆ'];
      haCharacters.forEach((char, index) => {
        expect(dataCells[index]).toHaveTextContent(char);
      });
      
      // Le family should be next 7 cells
      const leCharacters = ['ለ', 'ሉ', 'ሊ', 'ላ', 'ሌ', 'ል', 'ሎ'];
      leCharacters.forEach((char, index) => {
        expect(dataCells[index + 7]).toHaveTextContent(char);
      });
    });
  });

  // ========================================
  // 6.3 Test styling and layout classes
  // ========================================
  describe('6.3 Styling and Layout Classes', () => {
    it('applies grid layout classes - Req 1.5', () => {
      render(<FidelChart />);
      
      const table = screen.getByRole('table');
      
      // Verify CSS Grid classes
      expect(table).toHaveClass('grid');
      expect(table).toHaveClass('grid-cols-[auto_repeat(7,1fr)]');
      expect(table).toHaveClass('gap-0');
    });

    it('applies sticky column classes on first column - Req 2.1', () => {
      render(<FidelChart />);
      
      // First column header (Label)
      const labelHeader = screen.getByRole('columnheader', { name: 'Label' });
      expect(labelHeader).toHaveClass('sticky');
      expect(labelHeader).toHaveClass('left-0');
      expect(labelHeader).toHaveClass('z-10');
      
      // Row headers (Ha, Le)
      const rowHeaders = screen.getAllByRole('rowheader');
      rowHeaders.forEach((header) => {
        expect(header).toHaveClass('sticky');
        expect(header).toHaveClass('left-0');
        expect(header).toHaveClass('z-10');
      });
    });

    it('applies responsive classes on container - Req 4.2', () => {
      const { container } = render(<FidelChart />);
      
      // Get the outer wrapper div
      const wrapper = container.firstChild;
      
      // Verify responsive classes
      expect(wrapper).toHaveClass('w-full');
      expect(wrapper).toHaveClass('overflow-x-auto');
      expect(wrapper).toHaveClass('md:overflow-x-visible');
    });

    it('applies correct styling to header cells', () => {
      render(<FidelChart />);
      
      const columnHeaders = screen.getAllByRole('columnheader');
      
      columnHeaders.forEach((header) => {
        expect(header).toHaveClass('bg-blue-100');
        expect(header).toHaveClass('border');
        expect(header).toHaveClass('border-gray-300');
        expect(header).toHaveClass('p-3');
        expect(header).toHaveClass('text-center');
        expect(header).toHaveClass('font-semibold');
        expect(header).toHaveClass('text-gray-800');
      });
    });

    it('applies correct styling to row header cells', () => {
      render(<FidelChart />);
      
      const rowHeaders = screen.getAllByRole('rowheader');
      
      rowHeaders.forEach((header) => {
        expect(header).toHaveClass('bg-gray-50');
        expect(header).toHaveClass('border');
        expect(header).toHaveClass('border-gray-300');
        expect(header).toHaveClass('p-3');
        expect(header).toHaveClass('font-semibold');
        expect(header).toHaveClass('text-gray-800');
      });
    });

    it('applies correct styling to data cells', () => {
      render(<FidelChart />);
      
      const dataCells = screen.getAllByRole('cell');
      
      dataCells.forEach((cell) => {
        expect(cell).toHaveClass('border');
        expect(cell).toHaveClass('border-gray-300');
        expect(cell).toHaveClass('p-4');
        expect(cell).toHaveClass('text-center');
        expect(cell).toHaveClass('text-2xl');
        expect(cell).toHaveClass('text-gray-900');
      });
    });

    it('applies minimum width for mobile scrolling', () => {
      render(<FidelChart />);
      
      const table = screen.getByRole('table');
      
      expect(table).toHaveClass('min-w-[640px]');
      expect(table).toHaveClass('md:min-w-0');
    });
  });

  // ========================================
  // 6.4 Test accessibility attributes
  // ========================================
  describe('6.4 Accessibility Attributes', () => {
    it('has ARIA role="table" on grid element - Req 6.1', () => {
      render(<FidelChart />);
      
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      expect(table).toHaveAttribute('role', 'table');
    });

    it('has aria-label on table - Req 6.1', () => {
      render(<FidelChart />);
      
      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-label', 'Amharic Fidel Chart');
    });

    it('has ARIA role="columnheader" on all header cells - Req 6.2', () => {
      render(<FidelChart />);
      
      const columnHeaders = screen.getAllByRole('columnheader');
      
      // Should have 8 column headers
      expect(columnHeaders).toHaveLength(8);
      
      columnHeaders.forEach((header) => {
        expect(header).toHaveAttribute('role', 'columnheader');
      });
    });

    it('has ARIA role="rowheader" on consonant family labels - Req 6.2', () => {
      render(<FidelChart />);
      
      const rowHeaders = screen.getAllByRole('rowheader');
      
      // Should have 2 row headers (Ha, Le)
      expect(rowHeaders).toHaveLength(2);
      
      rowHeaders.forEach((header) => {
        expect(header).toHaveAttribute('role', 'rowheader');
      });
    });

    it('has ARIA role="cell" on all data cells - Req 6.2', () => {
      render(<FidelChart />);
      
      const dataCells = screen.getAllByRole('cell');
      
      // Should have 14 data cells (2 families × 7 vowels)
      expect(dataCells).toHaveLength(14);
      
      dataCells.forEach((cell) => {
        expect(cell).toHaveAttribute('role', 'cell');
      });
    });

    it('maintains semantic structure with proper roles - Req 6.2', () => {
      render(<FidelChart />);
      
      // Verify table structure
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      
      // Verify headers
      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders).toHaveLength(8);
      
      const rowHeaders = screen.getAllByRole('rowheader');
      expect(rowHeaders).toHaveLength(2);
      
      // Verify data cells
      const dataCells = screen.getAllByRole('cell');
      expect(dataCells).toHaveLength(14);
    });

    it('has tabIndex on all interactive elements for keyboard navigation', () => {
      render(<FidelChart />);
      
      // All column headers should be focusable
      const columnHeaders = screen.getAllByRole('columnheader');
      columnHeaders.forEach((header) => {
        expect(header).toHaveAttribute('tabIndex', '0');
      });
      
      // All row headers should be focusable
      const rowHeaders = screen.getAllByRole('rowheader');
      rowHeaders.forEach((header) => {
        expect(header).toHaveAttribute('tabIndex', '0');
      });
      
      // All data cells should be focusable
      const dataCells = screen.getAllByRole('cell');
      dataCells.forEach((cell) => {
        expect(cell).toHaveAttribute('tabIndex', '0');
      });
    });

    it('has focus ring styles for keyboard navigation', () => {
      render(<FidelChart />);
      
      // Check that focus styles are applied
      const allFocusableElements = [
        ...screen.getAllByRole('columnheader'),
        ...screen.getAllByRole('rowheader'),
        ...screen.getAllByRole('cell')
      ];
      
      allFocusableElements.forEach((element) => {
        expect(element).toHaveClass('focus:outline-none');
        expect(element).toHaveClass('focus:ring-2');
        expect(element).toHaveClass('focus:ring-blue-500');
        expect(element).toHaveClass('focus:ring-inset');
      });
    });
  });
});
