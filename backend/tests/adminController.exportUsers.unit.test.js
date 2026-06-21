// tests/adminController.exportUsers.unit.test.js
const adminController = require('../src/controllers/adminController');
const User = require('../src/models/User');

/**
 * Unit Tests for Admin Controller - exportUsers CSV Formatting
 * Tests CSV formatting logic without database dependency
 * 
 * **Validates: Requirements 19.2, 19.3**
 */

// Mock User model
jest.mock('../src/models/User');

describe('Admin Controller - exportUsers Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup request and response objects
    req = {
      query: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis()
    };
  });

  describe('CSV Formatting', () => {
    it('should format users as CSV with correct headers', async () => {
      // Mock User.findAll to return test data
      User.findAll.mockResolvedValue({
        users: [
          {
            id: 1,
            full_name: 'John Doe',
            username: 'john@test.com',
            role: 'Student',
            status: 'active',
            created_at: new Date('2024-01-15'),
            last_login: new Date('2024-01-20')
          }
        ],
        total: 1,
        page: 1,
        totalPages: 1
      });

      // Call exportUsers
      await adminController.exportUsers(req, res);

      // Verify headers were set
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="users-export.csv"');

      // Verify CSV content
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();

      const csvContent = res.send.mock.calls[0][0];
      expect(csvContent).toContain('id,full_name,email,role,status,created_at,last_login');
      expect(csvContent).toContain('1,John Doe,john@test.com,Student,active,2024-01-15,2024-01-20');
    });

    it('should escape CSV fields with commas', async () => {
      // Mock User.findAll with comma in name
      User.findAll.mockResolvedValue({
        users: [
          {
            id: 1,
            full_name: 'Doe, John',
            username: 'john@test.com',
            role: 'Student',
            status: 'active',
            created_at: new Date('2024-01-15'),
            last_login: null
          }
        ],
        total: 1,
        page: 1,
        totalPages: 1
      });

      // Call exportUsers
      await adminController.exportUsers(req, res);

      // Verify CSV content escapes comma
      const csvContent = res.send.mock.calls[0][0];
      expect(csvContent).toContain('"Doe, John"');
    });

    it('should escape CSV fields with quotes', async () => {
      // Mock User.findAll with quote in name
      User.findAll.mockResolvedValue({
        users: [
          {
            id: 1,
            full_name: 'John "Johnny" Doe',
            username: 'john@test.com',
            role: 'Student',
            status: 'active',
            created_at: new Date('2024-01-15'),
            last_login: null
          }
        ],
        total: 1,
        page: 1,
        totalPages: 1
      });

      // Call exportUsers
      await adminController.exportUsers(req, res);

      // Verify CSV content escapes quotes
      const csvContent = res.send.mock.calls[0][0];
      expect(csvContent).toContain('"John ""Johnny"" Doe"');
    });

    it('should handle null values', async () => {
      // Mock User.findAll with null values
      User.findAll.mockResolvedValue({
        users: [
          {
            id: 1,
            full_name: 'John Doe',
            username: 'john@test.com',
            role: 'Student',
            status: null,
            created_at: new Date('2024-01-15'),
            last_login: null
          }
        ],
        total: 1,
        page: 1,
        totalPages: 1
      });

      // Call exportUsers
      await adminController.exportUsers(req, res);

      // Verify CSV content handles nulls
      const csvContent = res.send.mock.calls[0][0];
      expect(csvContent).toContain('1,John Doe,john@test.com,Student,active,2024-01-15,');
    });

    it('should format dates as YYYY-MM-DD', async () => {
      // Mock User.findAll with specific dates
      User.findAll.mockResolvedValue({
        users: [
          {
            id: 1,
            full_name: 'John Doe',
            username: 'john@test.com',
            role: 'Student',
            status: 'active',
            created_at: new Date('2024-03-15T10:30:00Z'),
            last_login: new Date('2024-03-20T15:45:00Z')
          }
        ],
        total: 1,
        page: 1,
        totalPages: 1
      });

      // Call exportUsers
      await adminController.exportUsers(req, res);

      // Verify CSV content has correct date format
      const csvContent = res.send.mock.calls[0][0];
      expect(csvContent).toContain('2024-03-15');
      expect(csvContent).toContain('2024-03-20');
    });

    it('should handle empty result set', async () => {
      // Mock User.findAll with no users
      User.findAll.mockResolvedValue({
        users: [],
        total: 0,
        page: 1,
        totalPages: 0
      });

      // Call exportUsers
      await adminController.exportUsers(req, res);

      // Verify CSV content has only header
      const csvContent = res.send.mock.calls[0][0];
      const lines = csvContent.split('\n').filter(line => line.trim());
      expect(lines.length).toBe(1);
      expect(lines[0]).toBe('id,full_name,email,role,status,created_at,last_login');
    });
  });

  describe('Filter Support', () => {
    it('should pass role filter to User.findAll', async () => {
      // Setup request with role filter
      req.query.role = 'Student';

      // Mock User.findAll
      User.findAll.mockResolvedValue({
        users: [],
        total: 0,
        page: 1,
        totalPages: 0
      });

      // Call exportUsers
      await adminController.exportUsers(req, res);

      // Verify User.findAll was called with role filter
      expect(User.findAll).toHaveBeenCalledWith(
        { role: 'Student' },
        { page: 1, limit: 999999 }
      );
    });

    it('should pass status filter to User.findAll', async () => {
      // Setup request with status filter
      req.query.status = 'inactive';

      // Mock User.findAll
      User.findAll.mockResolvedValue({
        users: [],
        total: 0,
        page: 1,
        totalPages: 0
      });

      // Call exportUsers
      await adminController.exportUsers(req, res);

      // Verify User.findAll was called with status filter
      expect(User.findAll).toHaveBeenCalledWith(
        { status: 'inactive' },
        { page: 1, limit: 999999 }
      );
    });

    it('should pass search filter to User.findAll', async () => {
      // Setup request with search filter
      req.query.search = 'John';

      // Mock User.findAll
      User.findAll.mockResolvedValue({
        users: [],
        total: 0,
        page: 1,
        totalPages: 0
      });

      // Call exportUsers
      await adminController.exportUsers(req, res);

      // Verify User.findAll was called with search filter
      expect(User.findAll).toHaveBeenCalledWith(
        { search: 'John' },
        { page: 1, limit: 999999 }
      );
    });

    it('should pass multiple filters to User.findAll', async () => {
      // Setup request with multiple filters
      req.query.role = 'Student';
      req.query.status = 'active';
      req.query.search = 'John';

      // Mock User.findAll
      User.findAll.mockResolvedValue({
        users: [],
        total: 0,
        page: 1,
        totalPages: 0
      });

      // Call exportUsers
      await adminController.exportUsers(req, res);

      // Verify User.findAll was called with all filters
      expect(User.findAll).toHaveBeenCalledWith(
        { role: 'Student', status: 'active', search: 'John' },
        { page: 1, limit: 999999 }
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors', async () => {
      // Mock User.findAll to throw error
      User.findAll.mockRejectedValue(new Error('Database connection failed'));

      // Call exportUsers
      await adminController.exportUsers(req, res);

      // Verify error response
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error exporting users',
        error: 'Database connection failed'
      });
    });
  });
});
