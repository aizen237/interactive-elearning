import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ParentDashboard from './ParentDashboard';
import parentAPI from '../services/parentAPI';

// Mock the parentAPI module
vi.mock('../services/parentAPI', () => ({
  default: {
    getChildrenOverview: vi.fn(),
    getChildStats: vi.fn()
  }
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

describe('ParentDashboard - Empty State Handling', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    
    // Set up localStorage with parent user
    localStorage.setItem('user', JSON.stringify({
      id: 1,
      username: 'parent1',
      full_name: 'Test Parent',
      role: 'Parent'
    }));
    localStorage.setItem('token', 'test-token');
  });

  describe('Empty state: Parent has no children', () => {
    it('displays empty state when parent has no children linked', async () => {
      // Mock API to return empty children array
      parentAPI.getChildrenOverview.mockResolvedValue({
        data: {
          success: true,
          data: {
            children: [],
            total_children: 0
          }
        }
      });

      render(
        <BrowserRouter>
          <ParentDashboard />
        </BrowserRouter>
      );

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText(/Loading dashboard/i)).not.toBeInTheDocument();
      });

      // Verify empty state is displayed
      expect(screen.getByText(/No children linked to your account yet/i)).toBeInTheDocument();
      expect(screen.getByText('👨‍👩‍👧‍👦')).toBeInTheDocument();
    });

    it('does not crash when children array is empty', async () => {
      parentAPI.getChildrenOverview.mockResolvedValue({
        data: {
          success: true,
          data: {
            children: [],
            total_children: 0
          }
        }
      });

      const { container } = render(
        <BrowserRouter>
          <ParentDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.queryByText(/Loading dashboard/i)).not.toBeInTheDocument();
      });

      // Verify component rendered without errors
      expect(container).toBeInTheDocument();
      expect(screen.getByText(/No children linked to your account yet/i)).toBeInTheDocument();
    });
  });

  describe('Empty state: Child has no badges', () => {
    it('displays empty state when child has no badges earned', async () => {
      // Mock overview with one child
      parentAPI.getChildrenOverview.mockResolvedValue({
        data: {
          success: true,
          data: {
            children: [
              {
                id: 1,
                full_name: 'Test Child',
                username: 'child1',
                total_xp: 100,
                current_level: 2,
                badges_earned: 0,
                quizzes_attempted: 5,
                quizzes_passed: 3
              }
            ],
            total_children: 1
          }
        }
      });

      // Mock child stats with no badges
      parentAPI.getChildStats.mockResolvedValue({
        data: {
          success: true,
          data: {
            student: {
              id: 1,
              full_name: 'Test Child'
            },
            xp: {
              total_xp: 100,
              current_level: 2
            },
            badges: {
              earned: [],
              count: 0
            },
            quizzes: {
              recent_attempts: [],
              statistics: {
                total_attempts: 0,
                correct_answers: 0,
                success_rate: 0
              }
            },
            modules: []
          }
        }
      });

      render(
        <BrowserRouter>
          <ParentDashboard />
        </BrowserRouter>
      );

      // Wait for overview to load
      await waitFor(() => {
        expect(screen.getByText('Test Child')).toBeInTheDocument();
      });

      // Click on child card to view details
      const childCard = screen.getByText('Test Child').closest('div[class*="cursor-pointer"]');
      childCard.click();

      // Wait for detail view to load
      await waitFor(() => {
        expect(screen.getByText(/No badges earned yet/i)).toBeInTheDocument();
      });

      // Verify empty state message
      expect(screen.getByText(/Keep learning to unlock achievements/i)).toBeInTheDocument();
    });
  });

  describe('Empty state: Child has no quiz attempts', () => {
    it('displays empty state when child has no quiz attempts', async () => {
      // Mock overview with one child
      parentAPI.getChildrenOverview.mockResolvedValue({
        data: {
          success: true,
          data: {
            children: [
              {
                id: 1,
                full_name: 'Test Child',
                username: 'child1',
                total_xp: 50,
                current_level: 1,
                badges_earned: 0,
                quizzes_attempted: 0,
                quizzes_passed: 0
              }
            ],
            total_children: 1
          }
        }
      });

      // Mock child stats with no quiz attempts
      parentAPI.getChildStats.mockResolvedValue({
        data: {
          success: true,
          data: {
            student: {
              id: 1,
              full_name: 'Test Child'
            },
            xp: {
              total_xp: 50,
              current_level: 1
            },
            badges: {
              earned: [],
              count: 0
            },
            quizzes: {
              recent_attempts: [],
              statistics: {
                total_attempts: 0,
                correct_answers: 0,
                success_rate: 0
              }
            },
            modules: []
          }
        }
      });

      render(
        <BrowserRouter>
          <ParentDashboard />
        </BrowserRouter>
      );

      // Wait for overview to load
      await waitFor(() => {
        expect(screen.getByText('Test Child')).toBeInTheDocument();
      });

      // Click on child card to view details
      const childCard = screen.getByText('Test Child').closest('div[class*="cursor-pointer"]');
      childCard.click();

      // Wait for detail view to load
      await waitFor(() => {
        expect(screen.getByText(/No quiz attempts yet/i)).toBeInTheDocument();
      });

      // Verify empty state message is displayed (no need to check emoji as it appears multiple times)
      expect(screen.getByText(/No quiz attempts yet/i)).toBeInTheDocument();
    });
  });

  describe('Empty state: Child has no module progress', () => {
    it('displays empty state when child has no module progress', async () => {
      // Mock overview with one child
      parentAPI.getChildrenOverview.mockResolvedValue({
        data: {
          success: true,
          data: {
            children: [
              {
                id: 1,
                full_name: 'Test Child',
                username: 'child1',
                total_xp: 0,
                current_level: 1,
                badges_earned: 0,
                quizzes_attempted: 0,
                quizzes_passed: 0
              }
            ],
            total_children: 1
          }
        }
      });

      // Mock child stats with no module progress
      parentAPI.getChildStats.mockResolvedValue({
        data: {
          success: true,
          data: {
            student: {
              id: 1,
              full_name: 'Test Child'
            },
            xp: {
              total_xp: 0,
              current_level: 1
            },
            badges: {
              earned: [],
              count: 0
            },
            quizzes: {
              recent_attempts: [],
              statistics: {
                total_attempts: 0,
                correct_answers: 0,
                success_rate: 0
              }
            },
            modules: []
          }
        }
      });

      render(
        <BrowserRouter>
          <ParentDashboard />
        </BrowserRouter>
      );

      // Wait for overview to load
      await waitFor(() => {
        expect(screen.getByText('Test Child')).toBeInTheDocument();
      });

      // Click on child card to view details
      const childCard = screen.getByText('Test Child').closest('div[class*="cursor-pointer"]');
      childCard.click();

      // Wait for detail view to load
      await waitFor(() => {
        expect(screen.getByText(/No modules started yet/i)).toBeInTheDocument();
      });

      // Verify empty state message is displayed (no need to check emoji as it appears multiple times)
      expect(screen.getByText(/No modules started yet/i)).toBeInTheDocument();
    });
  });

  describe('Empty state: Child has 0 XP', () => {
    it('handles 0 XP gracefully and displays level 1', async () => {
      // Mock overview with one child with 0 XP
      parentAPI.getChildrenOverview.mockResolvedValue({
        data: {
          success: true,
          data: {
            children: [
              {
                id: 1,
                full_name: 'New Child',
                username: 'newchild',
                total_xp: 0,
                current_level: 1,
                badges_earned: 0,
                quizzes_attempted: 0,
                quizzes_passed: 0
              }
            ],
            total_children: 1
          }
        }
      });

      // Mock child stats with 0 XP
      parentAPI.getChildStats.mockResolvedValue({
        data: {
          success: true,
          data: {
            student: {
              id: 1,
              full_name: 'New Child'
            },
            xp: {
              total_xp: 0,
              current_level: 1
            },
            badges: {
              earned: [],
              count: 0
            },
            quizzes: {
              recent_attempts: [],
              statistics: {
                total_attempts: 0,
                correct_answers: 0,
                success_rate: 0
              }
            },
            modules: []
          }
        }
      });

      render(
        <BrowserRouter>
          <ParentDashboard />
        </BrowserRouter>
      );

      // Wait for overview to load
      await waitFor(() => {
        expect(screen.getByText('New Child')).toBeInTheDocument();
      });

      // Verify 0 XP is displayed in overview (multiple 0s exist, so just check it's present)
      expect(screen.getAllByText('0').length).toBeGreaterThan(0);

      // Click on child card to view details
      const childCard = screen.getByText('New Child').closest('div[class*="cursor-pointer"]');
      childCard.click();

      // Wait for detail view to load
      await waitFor(() => {
        expect(screen.getAllByText('1').length).toBeGreaterThan(0); // Level 1
      });

      // Verify level 1 and 0 XP are displayed
      const levelElements = screen.getAllByText('1');
      expect(levelElements.length).toBeGreaterThan(0);
      
      const xpElements = screen.getAllByText('0');
      expect(xpElements.length).toBeGreaterThan(0);
    });

    it('does not crash when displaying 0 XP', async () => {
      parentAPI.getChildrenOverview.mockResolvedValue({
        data: {
          success: true,
          data: {
            children: [
              {
                id: 1,
                full_name: 'Zero XP Child',
                username: 'zeroxp',
                total_xp: 0,
                current_level: 1,
                badges_earned: 0,
                quizzes_attempted: 0,
                quizzes_passed: 0
              }
            ],
            total_children: 1
          }
        }
      });

      parentAPI.getChildStats.mockResolvedValue({
        data: {
          success: true,
          data: {
            student: {
              id: 1,
              full_name: 'Zero XP Child'
            },
            xp: {
              total_xp: 0,
              current_level: 1
            },
            badges: {
              earned: [],
              count: 0
            },
            quizzes: {
              recent_attempts: [],
              statistics: {
                total_attempts: 0,
                correct_answers: 0,
                success_rate: 0
              }
            },
            modules: []
          }
        }
      });

      const { container } = render(
        <BrowserRouter>
          <ParentDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Zero XP Child')).toBeInTheDocument();
      });

      // Click to view details
      const childCard = screen.getByText('Zero XP Child').closest('div[class*="cursor-pointer"]');
      childCard.click();

      await waitFor(() => {
        expect(screen.getAllByText('1').length).toBeGreaterThan(0);
      });

      // Verify component rendered without errors
      expect(container).toBeInTheDocument();
    });
  });

  describe('Combined empty states', () => {
    it('displays all empty states when child has no activity at all', async () => {
      // Mock overview with one child
      parentAPI.getChildrenOverview.mockResolvedValue({
        data: {
          success: true,
          data: {
            children: [
              {
                id: 1,
                full_name: 'Inactive Child',
                username: 'inactive',
                total_xp: 0,
                current_level: 1,
                badges_earned: 0,
                quizzes_attempted: 0,
                quizzes_passed: 0
              }
            ],
            total_children: 1
          }
        }
      });

      // Mock child stats with all empty data
      parentAPI.getChildStats.mockResolvedValue({
        data: {
          success: true,
          data: {
            student: {
              id: 1,
              full_name: 'Inactive Child'
            },
            xp: {
              total_xp: 0,
              current_level: 1
            },
            badges: {
              earned: [],
              count: 0
            },
            quizzes: {
              recent_attempts: [],
              statistics: {
                total_attempts: 0,
                correct_answers: 0,
                success_rate: 0
              }
            },
            modules: []
          }
        }
      });

      render(
        <BrowserRouter>
          <ParentDashboard />
        </BrowserRouter>
      );

      // Wait for overview to load
      await waitFor(() => {
        expect(screen.getByText('Inactive Child')).toBeInTheDocument();
      });

      // Click on child card to view details
      const childCard = screen.getByText('Inactive Child').closest('div[class*="cursor-pointer"]');
      childCard.click();

      // Wait for detail view to load and verify all empty states
      await waitFor(() => {
        expect(screen.getByText(/No badges earned yet/i)).toBeInTheDocument();
      });

      // Verify all empty state messages are present
      expect(screen.getByText(/No badges earned yet/i)).toBeInTheDocument();
      expect(screen.getByText(/No quiz attempts yet/i)).toBeInTheDocument();
      expect(screen.getByText(/No modules started yet/i)).toBeInTheDocument();
      
      // Verify level 1 and 0 XP are displayed
      expect(screen.getAllByText('1').length).toBeGreaterThan(0);
      expect(screen.getAllByText('0').length).toBeGreaterThan(0);
    });
  });

  describe('Null and undefined data handling', () => {
    it('handles null data gracefully without crashing', async () => {
      parentAPI.getChildrenOverview.mockResolvedValue({
        data: {
          success: true,
          data: {
            children: [
              {
                id: 1,
                full_name: 'Test Child',
                username: 'child1',
                total_xp: 0,
                current_level: 1,
                badges_earned: 0,
                quizzes_attempted: 0,
                quizzes_passed: 0
              }
            ],
            total_children: 1
          }
        }
      });

      // Mock with null arrays
      parentAPI.getChildStats.mockResolvedValue({
        data: {
          success: true,
          data: {
            student: {
              id: 1,
              full_name: 'Test Child'
            },
            xp: {
              total_xp: 0,
              current_level: 1
            },
            badges: {
              earned: null,
              count: 0
            },
            quizzes: {
              recent_attempts: null,
              statistics: {
                total_attempts: 0,
                correct_answers: 0,
                success_rate: 0
              }
            },
            modules: null
          }
        }
      });

      const { container } = render(
        <BrowserRouter>
          <ParentDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Child')).toBeInTheDocument();
      });

      // Click to view details
      const childCard = screen.getByText('Test Child').closest('div[class*="cursor-pointer"]');
      childCard.click();

      await waitFor(() => {
        expect(screen.getByText(/No badges earned yet/i)).toBeInTheDocument();
      });

      // Verify component rendered without errors
      expect(container).toBeInTheDocument();
      expect(screen.getByText(/No badges earned yet/i)).toBeInTheDocument();
      expect(screen.getByText(/No quiz attempts yet/i)).toBeInTheDocument();
      expect(screen.getByText(/No modules started yet/i)).toBeInTheDocument();
    });

    it('handles undefined data gracefully without crashing', async () => {
      parentAPI.getChildrenOverview.mockResolvedValue({
        data: {
          success: true,
          data: {
            children: [
              {
                id: 1,
                full_name: 'Test Child',
                username: 'child1',
                total_xp: 0,
                current_level: 1,
                badges_earned: 0,
                quizzes_attempted: 0,
                quizzes_passed: 0
              }
            ],
            total_children: 1
          }
        }
      });

      // Mock with undefined arrays
      parentAPI.getChildStats.mockResolvedValue({
        data: {
          success: true,
          data: {
            student: {
              id: 1,
              full_name: 'Test Child'
            },
            xp: {
              total_xp: 0,
              current_level: 1
            },
            badges: {
              earned: undefined,
              count: 0
            },
            quizzes: {
              recent_attempts: undefined,
              statistics: {
                total_attempts: 0,
                correct_answers: 0,
                success_rate: 0
              }
            },
            modules: undefined
          }
        }
      });

      const { container } = render(
        <BrowserRouter>
          <ParentDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Child')).toBeInTheDocument();
      });

      // Click to view details
      const childCard = screen.getByText('Test Child').closest('div[class*="cursor-pointer"]');
      childCard.click();

      await waitFor(() => {
        expect(screen.getByText(/No badges earned yet/i)).toBeInTheDocument();
      });

      // Verify component rendered without errors
      expect(container).toBeInTheDocument();
      expect(screen.getByText(/No badges earned yet/i)).toBeInTheDocument();
      expect(screen.getByText(/No quiz attempts yet/i)).toBeInTheDocument();
      expect(screen.getByText(/No modules started yet/i)).toBeInTheDocument();
    });
  });
});
