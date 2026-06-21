import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import * as adminAPI from './adminAPI';

// Mock axios
vi.mock('axios');

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('adminAPI', () => {
  const mockToken = 'test-jwt-token';
  const API_URL = 'http://localhost:5000/api';

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    localStorageMock.setItem('token', mockToken);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Authorization Header', () => {
    it('should include Authorization header with Bearer token from localStorage', async () => {
      const mockResponse = { data: { success: true, data: [] } };
      axios.get.mockResolvedValue(mockResponse);

      await adminAPI.getUsers();

      expect(localStorageMock.getItem).toHaveBeenCalledWith('token');
      expect(axios.get).toHaveBeenCalledWith(
        `${API_URL}/admin/users`,
        expect.objectContaining({
          headers: {
            Authorization: `Bearer ${mockToken}`
          }
        })
      );
    });

    it('should include Authorization header in POST requests', async () => {
      const mockResponse = { data: { success: true, data: {} } };
      axios.post.mockResolvedValue(mockResponse);

      const userData = { username: 'test', password: 'pass123' };
      await adminAPI.createUser(userData);

      expect(axios.post).toHaveBeenCalledWith(
        `${API_URL}/admin/users`,
        userData,
        expect.objectContaining({
          headers: {
            Authorization: `Bearer ${mockToken}`
          }
        })
      );
    });

    it('should include Authorization header in PUT requests', async () => {
      const mockResponse = { data: { success: true, data: {} } };
      axios.put.mockResolvedValue(mockResponse);

      const userData = { full_name: 'Updated Name' };
      await adminAPI.updateUser(1, userData);

      expect(axios.put).toHaveBeenCalledWith(
        `${API_URL}/admin/users/1`,
        userData,
        expect.objectContaining({
          headers: {
            Authorization: `Bearer ${mockToken}`
          }
        })
      );
    });

    it('should include Authorization header in DELETE requests', async () => {
      const mockResponse = { data: { success: true } };
      axios.delete.mockResolvedValue(mockResponse);

      await adminAPI.deleteModule(5);

      expect(axios.delete).toHaveBeenCalledWith(
        `${API_URL}/admin/modules/5`,
        expect.objectContaining({
          headers: {
            Authorization: `Bearer ${mockToken}`
          }
        })
      );
    });
  });

  describe('User Management API Methods', () => {
    describe('getUsers', () => {
      it('should call GET /admin/users with correct parameters', async () => {
        const mockResponse = { data: { success: true, data: [] } };
        axios.get.mockResolvedValue(mockResponse);

        const params = { page: 1, limit: 20, role: 'Student' };
        const result = await adminAPI.getUsers(params);

        expect(axios.get).toHaveBeenCalledWith(
          `${API_URL}/admin/users`,
          expect.objectContaining({
            params,
            headers: {
              Authorization: `Bearer ${mockToken}`
            }
          })
        );
        expect(result).toEqual(mockResponse);
      });

      it('should work without parameters', async () => {
        const mockResponse = { data: { success: true, data: [] } };
        axios.get.mockResolvedValue(mockResponse);

        await adminAPI.getUsers();

        expect(axios.get).toHaveBeenCalledWith(
          `${API_URL}/admin/users`,
          expect.objectContaining({
            params: {}
          })
        );
      });
    });

    describe('getUserById', () => {
      it('should call GET /admin/users/:userId with correct userId', async () => {
        const mockResponse = { data: { success: true, data: { id: 42 } } };
        axios.get.mockResolvedValue(mockResponse);

        const result = await adminAPI.getUserById(42);

        expect(axios.get).toHaveBeenCalledWith(
          `${API_URL}/admin/users/42`,
          expect.objectContaining({
            headers: {
              Authorization: `Bearer ${mockToken}`
            }
          })
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe('createUser', () => {
      it('should call POST /admin/users with user data', async () => {
        const mockResponse = { data: { success: true, data: { id: 1 } } };
        axios.post.mockResolvedValue(mockResponse);

        const userData = {
          username: 'newuser',
          password: 'password123',
          full_name: 'New User',
          role: 'Student'
        };
        const result = await adminAPI.createUser(userData);

        expect(axios.post).toHaveBeenCalledWith(
          `${API_URL}/admin/users`,
          userData,
          expect.objectContaining({
            headers: {
              Authorization: `Bearer ${mockToken}`
            }
          })
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe('updateUser', () => {
      it('should call PUT /admin/users/:userId with updated data', async () => {
        const mockResponse = { data: { success: true, data: {} } };
        axios.put.mockResolvedValue(mockResponse);

        const userId = 10;
        const userData = { full_name: 'Updated Name', role: 'Admin' };
        const result = await adminAPI.updateUser(userId, userData);

        expect(axios.put).toHaveBeenCalledWith(
          `${API_URL}/admin/users/${userId}`,
          userData,
          expect.objectContaining({
            headers: {
              Authorization: `Bearer ${mockToken}`
            }
          })
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe('deactivateUser', () => {
      it('should call POST /admin/users/:userId/deactivate', async () => {
        const mockResponse = { data: { success: true } };
        axios.post.mockResolvedValue(mockResponse);

        const userId = 15;
        const result = await adminAPI.deactivateUser(userId);

        expect(axios.post).toHaveBeenCalledWith(
          `${API_URL}/admin/users/${userId}/deactivate`,
          {},
          expect.objectContaining({
            headers: {
              Authorization: `Bearer ${mockToken}`
            }
          })
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe('activateUser', () => {
      it('should call POST /admin/users/:userId/activate', async () => {
        const mockResponse = { data: { success: true } };
        axios.post.mockResolvedValue(mockResponse);

        const userId = 20;
        const result = await adminAPI.activateUser(userId);

        expect(axios.post).toHaveBeenCalledWith(
          `${API_URL}/admin/users/${userId}/activate`,
          {},
          expect.objectContaining({
            headers: {
              Authorization: `Bearer ${mockToken}`
            }
          })
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe('bulkCreateUsers', () => {
      it('should call POST /admin/users/bulk with FormData and correct headers', async () => {
        const mockResponse = { data: { success: true, data: { created: 5 } } };
        axios.post.mockResolvedValue(mockResponse);

        const formData = new FormData();
        formData.append('file', new Blob(['test']), 'users.csv');
        const result = await adminAPI.bulkCreateUsers(formData);

        expect(axios.post).toHaveBeenCalledWith(
          `${API_URL}/admin/users/bulk`,
          formData,
          expect.objectContaining({
            headers: {
              Authorization: `Bearer ${mockToken}`,
              'Content-Type': 'multipart/form-data'
            }
          })
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe('exportUsers', () => {
      it('should call GET /admin/users/export with blob responseType', async () => {
        const mockBlob = new Blob(['csv data'], { type: 'text/csv' });
        const mockResponse = { data: mockBlob };
        axios.get.mockResolvedValue(mockResponse);

        const params = { role: 'Student', status: 'active' };
        const result = await adminAPI.exportUsers(params);

        expect(axios.get).toHaveBeenCalledWith(
          `${API_URL}/admin/users/export`,
          expect.objectContaining({
            params,
            responseType: 'blob',
            headers: {
              Authorization: `Bearer ${mockToken}`
            }
          })
        );
        expect(result).toEqual(mockResponse);
      });

      it('should work without parameters', async () => {
        const mockResponse = { data: new Blob() };
        axios.get.mockResolvedValue(mockResponse);

        await adminAPI.exportUsers();

        expect(axios.get).toHaveBeenCalledWith(
          `${API_URL}/admin/users/export`,
          expect.objectContaining({
            params: {},
            responseType: 'blob'
          })
        );
      });
    });
  });

  describe('Content Management API Methods', () => {
    describe('getModules', () => {
      it('should call GET /admin/modules with search parameters', async () => {
        const mockResponse = { data: { success: true, data: [] } };
        axios.get.mockResolvedValue(mockResponse);

        const params = { search: 'math' };
        const result = await adminAPI.getModules(params);

        expect(axios.get).toHaveBeenCalledWith(
          `${API_URL}/admin/modules`,
          expect.objectContaining({
            params,
            headers: {
              Authorization: `Bearer ${mockToken}`
            }
          })
        );
        expect(result).toEqual(mockResponse);
      });

      it('should work without parameters', async () => {
        const mockResponse = { data: { success: true, data: [] } };
        axios.get.mockResolvedValue(mockResponse);

        await adminAPI.getModules();

        expect(axios.get).toHaveBeenCalledWith(
          `${API_URL}/admin/modules`,
          expect.objectContaining({
            params: {}
          })
        );
      });
    });

    describe('createModule', () => {
      it('should call POST /admin/modules with module data', async () => {
        const mockResponse = { data: { success: true, data: { id: 1 } } };
        axios.post.mockResolvedValue(mockResponse);

        const moduleData = {
          name: 'New Module',
          description: 'Test module',
          level_requirement: 5
        };
        const result = await adminAPI.createModule(moduleData);

        expect(axios.post).toHaveBeenCalledWith(
          `${API_URL}/admin/modules`,
          moduleData,
          expect.objectContaining({
            headers: {
              Authorization: `Bearer ${mockToken}`
            }
          })
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe('updateModule', () => {
      it('should call PUT /admin/modules/:moduleId with updated data', async () => {
        const mockResponse = { data: { success: true, data: {} } };
        axios.put.mockResolvedValue(mockResponse);

        const moduleId = 3;
        const moduleData = { name: 'Updated Module', description: 'Updated' };
        const result = await adminAPI.updateModule(moduleId, moduleData);

        expect(axios.put).toHaveBeenCalledWith(
          `${API_URL}/admin/modules/${moduleId}`,
          moduleData,
          expect.objectContaining({
            headers: {
              Authorization: `Bearer ${mockToken}`
            }
          })
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe('deleteModule', () => {
      it('should call DELETE /admin/modules/:moduleId', async () => {
        const mockResponse = { data: { success: true } };
        axios.delete.mockResolvedValue(mockResponse);

        const moduleId = 7;
        const result = await adminAPI.deleteModule(moduleId);

        expect(axios.delete).toHaveBeenCalledWith(
          `${API_URL}/admin/modules/${moduleId}`,
          expect.objectContaining({
            headers: {
              Authorization: `Bearer ${mockToken}`
            }
          })
        );
        expect(result).toEqual(mockResponse);
      });
    });
  });

  describe('Analytics API Methods', () => {
    describe('getAnalytics', () => {
      it('should call GET /admin/analytics', async () => {
        const mockResponse = {
          data: {
            success: true,
            data: {
              userCounts: { students: 100, parents: 50, admins: 5 }
            }
          }
        };
        axios.get.mockResolvedValue(mockResponse);

        const result = await adminAPI.getAnalytics();

        expect(axios.get).toHaveBeenCalledWith(
          `${API_URL}/admin/analytics`,
          expect.objectContaining({
            headers: {
              Authorization: `Bearer ${mockToken}`
            }
          })
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe('exportAnalytics', () => {
      it('should call GET /admin/analytics/export with blob responseType', async () => {
        const mockBlob = new Blob(['analytics data'], { type: 'text/csv' });
        const mockResponse = { data: mockBlob };
        axios.get.mockResolvedValue(mockResponse);

        const result = await adminAPI.exportAnalytics();

        expect(axios.get).toHaveBeenCalledWith(
          `${API_URL}/admin/analytics/export`,
          expect.objectContaining({
            responseType: 'blob',
            headers: {
              Authorization: `Bearer ${mockToken}`
            }
          })
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe('getActivity', () => {
      it('should call GET /admin/activity', async () => {
        const mockResponse = {
          data: {
            success: true,
            data: {
              activities: []
            }
          }
        };
        axios.get.mockResolvedValue(mockResponse);

        const result = await adminAPI.getActivity();

        expect(axios.get).toHaveBeenCalledWith(
          `${API_URL}/admin/activity`,
          expect.objectContaining({
            headers: {
              Authorization: `Bearer ${mockToken}`
            }
          })
        );
        expect(result).toEqual(mockResponse);
      });
    });
  });
});
