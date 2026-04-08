import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ParentDashboard from './ParentDashboard';
import parentAPI from '../services/parentAPI';

// Mock the navigate function
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock the parentAPI
vi.mock('../services/parentAPI', () => ({
  default: {
    getChildrenOverview: vi.fn(),
    getChildStats: vi.fn(),
  },
}));

describe('ParentDashboard - Responsive Design', () => {
  const mockOverviewData = {
    data: {
      data: {
        children: [
          {
            id: 1,
            full_name: 'Child One',
            username: 'child1',
            total_xp: 100,
            current_level: 2,
            badges_earned: 3,
            quizzes_attempted: 5,
            quizzes_passed: 4
          },
          {
            id: 2,
            full_name: 'Child Two',
            username: 'child2',
            total_xp: 200,
            current_level: 3,
            badges_earned: 5,
            quizzes_attempted: 8,
            quizzes_passed: 7
          },
          {
            id: 3,
            full_name: 'Child Three',
            username: 'child3',
            total_xp: 300,
            current_level: 4,
            badges_earned: 7,
            quizzes_attempted: 10,
            quizzes_passed: 9
          }
        ],
        total_children: 3
      }
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('user', JSON.stringify({ 
      full_name: 'Test Parent',
      role: 'Parent'
    }));
    parentAPI.getChildrenOverview.mockResolvedValue(mockOverviewData);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Grid Layout Classes', () => {
    it('applies responsive grid layout classes to children container', async () => {
      const { container } = render(
        <BrowserRouter>
          <ParentDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Child One')).toBeInTheDocument();
      });

      // Find the grid container
      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toBeInTheDocument();
    });

    it('applies mobile-first single column layout (grid-cols-1)', async () => {
      const { container } = render(
        <BrowserRouter>
          <ParentDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Child One')).toBeInTheDocument();
      });

      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toHaveClass('grid-cols-1');
    });

    it('applies tablet two-column layout (md:grid-cols-2)', async () => {
      const { container } = render(
        <BrowserRouter>
          <ParentDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Child One')).toBeInTheDocument();
      });

      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toHaveClass('md:grid-cols-2');
    });

    it('applies desktop three-column layout (lg:grid-cols-3)', async () => {
      const { container } = render(
        <BrowserRouter>
          <ParentDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Child One')).toBeInTheDocument();
      });

      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toHaveClass('lg:grid-cols-3');
    });

    it('applies gap spacing between grid items', async () => {
      const { container } = render(
        <BrowserRouter>
          <ParentDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Child One')).toBeInTheDocument();
      });

      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toHaveClass('gap-6');
    });

    it('applies all responsive grid classes together', async () => {
      const { container } = render(
        <BrowserRouter>
          <ParentDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Child One')).toBeInTheDocument();
      });

      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toHaveClass(
        'grid',
        'grid-cols-1',
        'md:grid-cols-2',
        'lg:grid-cols-3',
        'gap-6'
      );
    });
  });

  describe('Card Stacking Behavior', () => {
    it('renders all child cards in the grid', async () => {
      render(
        <BrowserRouter>
          <ParentDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Child One')).toBeInTheDocument();
        expect(screen.getByText('Child Two')).toBeInTheDocument();
        expect(screen.getByText('Child Three')).toBeInTheDocument();
      });
    });

    it('renders cards as direct children of grid container', async () => {
      const { container } = render(
        <BrowserRouter>
          <ParentDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Child One')).toBeInTheDocument();
      });

      const gridContainer = container.querySelector('.grid');
      const childCards = gridContainer.children;
      
      // Should have 3 child cards
      expect(childCards.length).toBe(3);
    });

    it('each card maintains its own styling independent of grid', async () => {
      render(
        <BrowserRouter>
          <ParentDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Child One')).toBeInTheDocument();
      });

      // Verify each card has its own styling
      const card1 = screen.getByText('Child One').closest('div').parentElement;
      const card2 = screen.getByText('Child Two').closest('div').parentElement;
      const card3 = screen.getByText('Child Three').closest('div').parentElement;

      expect(card1).toHaveClass('bg-white', 'rounded-2xl', 'shadow-lg');
      expect(card2).toHaveClass('bg-white', 'rounded-2xl', 'shadow-lg');
      expect(card3).toHaveClass('bg-white', 'rounded-2xl', 'shadow-lg');
    });
  });

  describe('Container Responsive Behavior', () => {
    it('applies max-width container for content', async () => {
      const { container } = render(
        <BrowserRouter>
          <ParentDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Child One')).toBeInTheDocument();
      });

      const maxWidthContainer = container.querySelector('.max-w-7xl');
      expect(maxWidthContainer).toBeInTheDocument();
      expect(maxWidthContainer).toHaveClass('mx-auto');
    });

    it('applies padding to main container', async () => {
      const { container } = render(
        <BrowserRouter>
          <ParentDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Child One')).toBeInTheDocument();
      });

      const mainContainer = container.querySelector('.min-h-screen');
      expect(mainContainer).toHaveClass('p-8');
    });

    it('applies gradient background', async () => {
      const { container } = render(
        <BrowserRouter>
          <ParentDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Child One')).toBeInTheDocument();
      });

      const mainContainer = container.querySelector('.min-h-screen');
      expect(mainContainer).toHaveClass(
        'bg-gradient-to-br',
        'from-purple-50',
        'to-blue-50'
      );
    });
  });

  describe('Responsive Layout with Different Child Counts', () => {
    it('handles single child correctly', async () => {
      const singleChildData = {
        data: {
          data: {
            children: [mockOverviewData.data.data.children[0]],
            total_children: 1
          }
        }
      };
      parentAPI.getChildrenOverview.mockResolvedValue(singleChildData);

      const { container } = render(
        <BrowserRouter>
          <ParentDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Child One')).toBeInTheDocument();
      });

      const gridContainer = container.querySelector('.grid');
      expect(gridContainer.children.length).toBe(1);
      expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
    });

    it('handles two children correctly', async () => {
      const twoChildrenData = {
        data: {
          data: {
            children: mockOverviewData.data.data.children.slice(0, 2),
            total_children: 2
          }
        }
      };
      parentAPI.getChildrenOverview.mockResolvedValue(twoChildrenData);

      const { container } = render(
        <BrowserRouter>
          <ParentDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Child One')).toBeInTheDocument();
        expect(screen.getByText('Child Two')).toBeInTheDocument();
      });

      const gridContainer = container.querySelector('.grid');
      expect(gridContainer.children.length).toBe(2);
    });

    it('handles many children correctly', async () => {
      const manyChildren = Array.from({ length: 6 }, (_, i) => ({
        id: i + 1,
        full_name: `Child ${i + 1}`,
        username: `child${i + 1}`,
        total_xp: (i + 1) * 100,
        current_level: i + 2,
        badges_earned: i + 3,
        quizzes_attempted: i + 5,
        quizzes_passed: i + 4
      }));

      const manyChildrenData = {
        data: {
          data: {
            children: manyChildren,
            total_children: 6
          }
        }
      };
      parentAPI.getChildrenOverview.mockResolvedValue(manyChildrenData);

      const { container } = render(
        <BrowserRouter>
          <ParentDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Child 1')).toBeInTheDocument();
      });

      const gridContainer = container.querySelector('.grid');
      expect(gridContainer.children.length).toBe(6);
      expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
    });
  });

  describe('Responsive Design Requirements Validation', () => {
    it('validates Requirement 5.2: responsive grid layout', async () => {
      const { container } = render(
        <BrowserRouter>
          <ParentDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Child One')).toBeInTheDocument();
      });

      const gridContainer = container.querySelector('.grid');
      // Requirement 5.2: THE Parent_Dashboard SHALL use a responsive grid layout that adapts to screen sizes
      expect(gridContainer).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
    });

    it('validates Requirement 5.6: cards stack vertically on mobile', async () => {
      const { container } = render(
        <BrowserRouter>
          <ParentDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Child One')).toBeInTheDocument();
      });

      const gridContainer = container.querySelector('.grid');
      // Requirement 5.6: WHEN viewed on mobile devices, THE Parent_Dashboard SHALL stack cards vertically
      // This is achieved with grid-cols-1 (single column = vertical stacking)
      expect(gridContainer).toHaveClass('grid-cols-1');
    });

    it('validates Requirement 5.7: multi-column grid on desktop', async () => {
      const { container } = render(
        <BrowserRouter>
          <ParentDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Child One')).toBeInTheDocument();
      });

      const gridContainer = container.querySelector('.grid');
      // Requirement 5.7: WHEN viewed on desktop devices, THE Parent_Dashboard SHALL display cards in a multi-column grid
      // This is achieved with md:grid-cols-2 (tablet) and lg:grid-cols-3 (desktop)
      expect(gridContainer).toHaveClass('md:grid-cols-2', 'lg:grid-cols-3');
    });
  });

  describe('Grid Layout Does Not Appear in Empty State', () => {
    it('does not render grid when no children exist', async () => {
      const emptyData = {
        data: {
          data: {
            children: [],
            total_children: 0
          }
        }
      };
      parentAPI.getChildrenOverview.mockResolvedValue(emptyData);

      const { container } = render(
        <BrowserRouter>
          <ParentDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/No children linked to your account/i)).toBeInTheDocument();
      });

      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).not.toBeInTheDocument();
    });
  });

  describe('Grid Layout Does Not Appear in Detail View', () => {
    it('does not render grid when in detail view', async () => {
      const mockDetailData = {
        data: {
          data: {
            student: { id: 1, full_name: 'Child One' },
            xp: { total_xp: 100, current_level: 2 },
            badges: { earned: [], count: 0 },
            quizzes: {
              recent_attempts: [],
              statistics: { total_attempts: 0, correct_answers: 0, success_rate: 0 }
            },
            modules: []
          }
        }
      };
      parentAPI.getChildStats.mockResolvedValue(mockDetailData);

      const { container } = render(
        <BrowserRouter>
          <ParentDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Child One')).toBeInTheDocument();
      });

      // Click on the first child card
      const card = screen.getByText('Child One').closest('div').parentElement;
      card.click();

      await waitFor(() => {
        // In detail view, the grid should not be present
        const gridContainer = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3');
        expect(gridContainer).not.toBeInTheDocument();
      });
    });
  });
});
