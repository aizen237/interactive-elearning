import { describe, it, expect, vi, beforeEach } from 'vitest';
import parentAPI from './parentAPI';
import api from './api';

// Mock the api module
vi.mock('./api', () => ({
  default: {
    get: vi.fn()
  }
}));

describe('parentAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getChildrenOverview', () => {
    it('should call GET /parent/overview endpoint', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            children: [],
            total_children: 0
          }
        }
      };
      api.get.mockResolvedValue(mockResponse);

      const result = await parentAPI.getChildrenOverview();

      expect(api.get).toHaveBeenCalledWith('/parent/overview');
      expect(result).toEqual(mockResponse);
    });

    it('should return promise that resolves to API response data', async () => {
      const mockData = {
        data: {
          success: true,
          data: {
            children: [
              { id: 1, full_name: 'Test Child', total_xp: 100 }
            ],
            total_children: 1
          }
        }
      };
      api.get.mockResolvedValue(mockData);

      const result = await parentAPI.getChildrenOverview();

      expect(result.data.data.children).toHaveLength(1);
      expect(result.data.data.total_children).toBe(1);
    });
  });

  describe('getChildren', () => {
    it('should call GET /parent/children endpoint', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: []
        }
      };
      api.get.mockResolvedValue(mockResponse);

      const result = await parentAPI.getChildren();

      expect(api.get).toHaveBeenCalledWith('/parent/children');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getChildStats', () => {
    it('should call GET /parent/child/:studentId/stats endpoint with correct studentId', async () => {
      const studentId = 42;
      const mockResponse = {
        data: {
          success: true,
          data: {
            student: { id: 42, full_name: 'Test Child' },
            xp: { total_xp: 500, current_level: 5 }
          }
        }
      };
      api.get.mockResolvedValue(mockResponse);

      const result = await parentAPI.getChildStats(studentId);

      expect(api.get).toHaveBeenCalledWith('/parent/child/42/stats');
      expect(result).toEqual(mockResponse);
    });

    it('should handle different studentId values', async () => {
      const mockResponse = { data: { success: true, data: {} } };
      api.get.mockResolvedValue(mockResponse);

      await parentAPI.getChildStats(123);
      expect(api.get).toHaveBeenCalledWith('/parent/child/123/stats');

      await parentAPI.getChildStats(999);
      expect(api.get).toHaveBeenCalledWith('/parent/child/999/stats');
    });
  });
});
