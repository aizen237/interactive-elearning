const adminController = require('../src/controllers/adminController');
const User = require('../src/models/User');
const db = require('../src/config/db');
const bcrypt = require('bcryptjs');

/**
 * Unit Tests for Admin Controller - User Management Endpoints
 * Tests controller logic with mocked database calls
 * 
 * **Validates: Requirements 2.1, 3.1, 4.5, 5.5, 6.3, 6.6**
 */

// Mock dependencies
jest.mock('../src/models/User');
jest.mock('../src/config/db');
jest.mock('bcryptjs');

describe('Admin Controller Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Setup mock request and response objects
    req = {
      params: {},
      query: {},
      body: {},
      user: { id: 1, role: 'Admin' }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Mock console.error to avoid cluttering test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('getUsers', () => {
    it('should return paginated users with default parameters', async () => {
      // Setup: Mock User.findAll to return test data
      const mockResult = {
        users: [
          { id: 1, username: 'user1@test.com', role: 'Student' },
          { id: 2, username: 'user2@test.com', role: 'Parent' }
        ],
        total: 2,
        page: 1,
        totalPages: 1
      };
      User.findAll.mockResolvedValue(mockResult);

      // Test: Call getUsers
      await adminController.getUsers(req, res);

      // Verify: User.findAll called with correct parameters
      expect(User.findAll).toHaveBeenCalledWith(
        {},
        { page: 1, limit: 20 }
      );

      // Verify: Response formatted correctly
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Users retrieved successfully',
        data: mockResult
      });
    });

    it('should apply role filter when provided', async () => {
      // Setup: Request with role filter
      req.query = { role: 'Student' };
      const mockResult = {
        users: [{ id: 1, username: 'student@test.com', role: 'Student' }],
        total: 1,
        page: 1,
        totalPages: 1
      };
      User.findAll.mockResolvedValue(mockResult);

      // Test: Call getUsers with role filter
      await adminController.getUsers(req, res);

      // Verify: Filter passed to User.findAll
      expect(User.findAll).toHaveBeenCalledWith(
        { role: 'Student' },
        { page: 1, limit: 20 }
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should apply search filter when provided', async () => {
      // Setup: Request with search query
      req.query = { search: 'john' };
      User.findAll.mockResolvedValue({ users: [], total: 0, page: 1, totalPages: 0 });

      // Test: Call getUsers with search
      await adminController.getUsers(req, res);

      // Verify: Search filter passed to User.findAll
      expect(User.findAll).toHaveBeenCalledWith(
        { search: 'john' },
        { page: 1, limit: 20 }
      );
    });

    it('should handle custom pagination parameters', async () => {
      // Setup: Request with custom pagination
      req.query = { page: '3', limit: '50' };
      User.findAll.mockResolvedValue({ users: [], total: 0, page: 3, totalPages: 0 });

      // Test: Call getUsers with custom pagination
      await adminController.getUsers(req, res);

      // Verify: Pagination parameters parsed and passed correctly
      expect(User.findAll).toHaveBeenCalledWith(
        {},
        { page: 3, limit: 50 }
      );
    });

    it('should handle database errors gracefully', async () => {
      // Setup: Mock User.findAll to throw error
      const dbError = new Error('Database connection failed');
      User.findAll.mockRejectedValue(dbError);

      // Test: Call getUsers
      await adminController.getUsers(req, res);

      // Verify: Error response returned
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error fetching users',
        error: 'Database connection failed'
      });
    });
  });

  describe('getUserById', () => {
    it('should return user details for valid user ID', async () => {
      // Setup: Mock User.getDetailedInfo to return user data
      req.params = { userId: '123' };
      const mockUser = {
        id: 123,
        username: 'test@test.com',
        full_name: 'Test User',
        role: 'Student',
        xp: 500,
        level: 5
      };
      User.getDetailedInfo.mockResolvedValue(mockUser);

      // Test: Call getUserById
      await adminController.getUserById(req, res);

      // Verify: User.getDetailedInfo called with correct ID
      expect(User.getDetailedInfo).toHaveBeenCalledWith(123);

      // Verify: Response formatted correctly
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User details retrieved successfully',
        data: mockUser
      });
    });

    it('should return 404 when user not found', async () => {
      // Setup: Mock User.getDetailedInfo to return null
      req.params = { userId: '999' };
      User.getDetailedInfo.mockResolvedValue(null);

      // Test: Call getUserById
      await adminController.getUserById(req, res);

      // Verify: 404 response returned
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
    });

    it('should return 400 for invalid user ID', async () => {
      // Setup: Request with invalid user ID
      req.params = { userId: 'invalid' };

      // Test: Call getUserById
      await adminController.getUserById(req, res);

      // Verify: 400 response returned without calling database
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Valid user ID is required'
      });
      expect(User.getDetailedInfo).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      // Setup: Mock User.getDetailedInfo to throw error
      req.params = { userId: '123' };
      const dbError = new Error('Database query failed');
      User.getDetailedInfo.mockRejectedValue(dbError);

      // Test: Call getUserById
      await adminController.getUserById(req, res);

      // Verify: Error response returned
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error fetching user details',
        error: 'Database query failed'
      });
    });
  });

  describe('createUser', () => {
    it('should create user with valid data', async () => {
      // Setup: Valid user data
      req.body = {
        username: 'newuser@test.com',
        password: 'password123',
        full_name: 'New User',
        role: 'Student',
        phone_number: '1234567890'
      };

      // Mock bcrypt and User methods
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedPassword');
      User.usernameExists.mockResolvedValue(false);
      User.create.mockResolvedValue({
        id: 100,
        username: 'newuser@test.com',
        full_name: 'New User',
        role: 'Student'
      });

      // Test: Call createUser
      await adminController.createUser(req, res);

      // Verify: Password hashed
      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 'salt');

      // Verify: User.create called with hashed password
      expect(User.create).toHaveBeenCalledWith({
        username: 'newuser@test.com',
        password: 'hashedPassword',
        full_name: 'New User',
        role: 'Student',
        phone_number: '1234567890'
      });

      // Verify: Success response returned
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User created successfully',
        data: expect.objectContaining({
          id: 100,
          username: 'newuser@test.com'
        })
      });
    });

    it('should validate required fields', async () => {
      // Setup: Missing required fields
      req.body = {
        username: 'test@test.com'
      };

      // Test: Call createUser
      await adminController.createUser(req, res);

      // Verify: Validation error returned
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Username, password, full_name, and role are required'
      });
      expect(User.create).not.toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      // Setup: Invalid email format
      req.body = {
        username: 'invalidemail',
        password: 'password123',
        full_name: 'Test User',
        role: 'Student'
      };

      // Test: Call createUser
      await adminController.createUser(req, res);

      // Verify: Email validation error returned
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid email format'
      });
      expect(User.create).not.toHaveBeenCalled();
    });

    it('should validate password length', async () => {
      // Setup: Password too short
      req.body = {
        username: 'test@test.com',
        password: 'short',
        full_name: 'Test User',
        role: 'Student'
      };

      // Test: Call createUser
      await adminController.createUser(req, res);

      // Verify: Password validation error returned
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Password must be at least 8 characters'
      });
      expect(User.create).not.toHaveBeenCalled();
    });

    it('should validate role', async () => {
      // Setup: Invalid role
      req.body = {
        username: 'test@test.com',
        password: 'password123',
        full_name: 'Test User',
        role: 'InvalidRole'
      };

      // Test: Call createUser
      await adminController.createUser(req, res);

      // Verify: Role validation error returned
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid role. Must be: Student, Parent, Admin, or Teacher'
      });
      expect(User.create).not.toHaveBeenCalled();
    });

    it('should reject duplicate email', async () => {
      // Setup: Valid data but email exists
      req.body = {
        username: 'existing@test.com',
        password: 'password123',
        full_name: 'Test User',
        role: 'Student'
      };
      User.usernameExists.mockResolvedValue(true);

      // Test: Call createUser
      await adminController.createUser(req, res);

      // Verify: Duplicate email error returned
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Email already exists'
      });
      expect(User.create).not.toHaveBeenCalled();
    });

    it('should handle database errors during creation', async () => {
      // Setup: Valid data but database error
      req.body = {
        username: 'test@test.com',
        password: 'password123',
        full_name: 'Test User',
        role: 'Student'
      };
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedPassword');
      User.usernameExists.mockResolvedValue(false);
      User.create.mockRejectedValue(new Error('Database insert failed'));

      // Test: Call createUser
      await adminController.createUser(req, res);

      // Verify: Error response returned
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error creating user',
        error: 'Database insert failed'
      });
    });
  });

  describe('updateUser', () => {
    it('should update user with valid data', async () => {
      // Setup: Valid update data
      req.params = { userId: '123' };
      req.body = {
        full_name: 'Updated Name',
        phone_number: '9876543210'
      };

      const existingUser = {
        id: 123,
        username: 'test@test.com',
        full_name: 'Old Name',
        role: 'Student'
      };

      const updatedUser = {
        id: 123,
        username: 'test@test.com',
        full_name: 'Updated Name',
        role: 'Student',
        phone_number: '9876543210'
      };

      User.findById.mockResolvedValueOnce(existingUser).mockResolvedValueOnce(updatedUser);
      db.execute.mockResolvedValue([{ affectedRows: 1 }]);

      // Test: Call updateUser
      await adminController.updateUser(req, res);

      // Verify: Database update called
      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET'),
        expect.arrayContaining(['Updated Name', '9876543210', 123])
      );

      // Verify: Success response returned
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User updated successfully',
        data: updatedUser
      });
    });

    it('should return 404 when user not found', async () => {
      // Setup: User doesn't exist
      req.params = { userId: '999' };
      req.body = { full_name: 'Updated Name' };
      User.findById.mockResolvedValue(null);

      // Test: Call updateUser
      await adminController.updateUser(req, res);

      // Verify: 404 response returned
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
      expect(db.execute).not.toHaveBeenCalled();
    });

    it('should validate email format when updating username', async () => {
      // Setup: Invalid email in update
      req.params = { userId: '123' };
      req.body = { username: 'invalidemail' };
      User.findById.mockResolvedValue({ id: 123, username: 'old@test.com' });

      // Test: Call updateUser
      await adminController.updateUser(req, res);

      // Verify: Email validation error returned
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid email format'
      });
      expect(db.execute).not.toHaveBeenCalled();
    });

    it('should validate role when updating', async () => {
      // Setup: Invalid role in update
      req.params = { userId: '123' };
      req.body = { role: 'InvalidRole' };
      User.findById.mockResolvedValue({ id: 123, role: 'Student' });

      // Test: Call updateUser
      await adminController.updateUser(req, res);

      // Verify: Role validation error returned
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid role. Must be: Student, Parent, Admin, or Teacher'
      });
      expect(db.execute).not.toHaveBeenCalled();
    });

    it('should check for duplicate email when changing username', async () => {
      // Setup: Changing to existing email
      req.params = { userId: '123' };
      req.body = { username: 'existing@test.com' };
      User.findById.mockResolvedValue({ id: 123, username: 'old@test.com' });
      User.usernameExists.mockResolvedValue(true);

      // Test: Call updateUser
      await adminController.updateUser(req, res);

      // Verify: Duplicate email error returned
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Email already exists'
      });
      expect(db.execute).not.toHaveBeenCalled();
    });

    it('should return 400 when no fields to update', async () => {
      // Setup: Empty update body
      req.params = { userId: '123' };
      req.body = {};
      User.findById.mockResolvedValue({ id: 123 });

      // Test: Call updateUser
      await adminController.updateUser(req, res);

      // Verify: Validation error returned
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'No valid fields to update'
      });
      expect(db.execute).not.toHaveBeenCalled();
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user successfully', async () => {
      // Setup: Valid user ID
      req.params = { userId: '123' };
      User.findById.mockResolvedValue({ id: 123, status: 'active' });
      User.deactivate.mockResolvedValue(true);

      // Test: Call deactivateUser
      await adminController.deactivateUser(req, res);

      // Verify: User.deactivate called with correct ID
      expect(User.deactivate).toHaveBeenCalledWith(123);

      // Verify: Success response returned
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User deactivated successfully',
        data: { userId: 123, status: 'inactive' }
      });
    });

    it('should return 404 when user not found', async () => {
      // Setup: User doesn't exist
      req.params = { userId: '999' };
      User.findById.mockResolvedValue(null);

      // Test: Call deactivateUser
      await adminController.deactivateUser(req, res);

      // Verify: 404 response returned
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
      expect(User.deactivate).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid user ID', async () => {
      // Setup: Invalid user ID
      req.params = { userId: 'invalid' };

      // Test: Call deactivateUser
      await adminController.deactivateUser(req, res);

      // Verify: 400 response returned
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Valid user ID is required'
      });
      expect(User.findById).not.toHaveBeenCalled();
    });

    it('should handle deactivation failure', async () => {
      // Setup: Deactivation fails
      req.params = { userId: '123' };
      User.findById.mockResolvedValue({ id: 123 });
      User.deactivate.mockResolvedValue(false);

      // Test: Call deactivateUser
      await adminController.deactivateUser(req, res);

      // Verify: Error response returned
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to deactivate user'
      });
    });
  });

  describe('activateUser', () => {
    it('should activate user successfully', async () => {
      // Setup: Valid user ID
      req.params = { userId: '123' };
      User.findById.mockResolvedValue({ id: 123, status: 'inactive' });
      User.activate.mockResolvedValue(true);

      // Test: Call activateUser
      await adminController.activateUser(req, res);

      // Verify: User.activate called with correct ID
      expect(User.activate).toHaveBeenCalledWith(123);

      // Verify: Success response returned
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User activated successfully',
        data: { userId: 123, status: 'active' }
      });
    });

    it('should return 404 when user not found', async () => {
      // Setup: User doesn't exist
      req.params = { userId: '999' };
      User.findById.mockResolvedValue(null);

      // Test: Call activateUser
      await adminController.activateUser(req, res);

      // Verify: 404 response returned
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
      expect(User.activate).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid user ID', async () => {
      // Setup: Invalid user ID
      req.params = { userId: 'invalid' };

      // Test: Call activateUser
      await adminController.activateUser(req, res);

      // Verify: 400 response returned
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Valid user ID is required'
      });
      expect(User.findById).not.toHaveBeenCalled();
    });

    it('should handle activation failure', async () => {
      // Setup: Activation fails
      req.params = { userId: '123' };
      User.findById.mockResolvedValue({ id: 123 });
      User.activate.mockResolvedValue(false);

      // Test: Call activateUser
      await adminController.activateUser(req, res);

      // Verify: Error response returned
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to activate user'
      });
    });
  });

  describe('bulkCreateUsers', () => {
    it('should create multiple users from valid CSV', async () => {
      // Setup: Valid CSV data
      const csvContent = 'full_name,email,password,role\nJohn Doe,john@test.com,password123,Student\nJane Smith,jane@test.com,password456,Parent';
      req.file = {
        buffer: Buffer.from(csvContent)
      };

      // Mock bcrypt and User methods
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedPassword');
      User.usernameExists.mockResolvedValue(false);
      User.create
        .mockResolvedValueOnce({ id: 1, username: 'john@test.com', full_name: 'John Doe', role: 'Student' })
        .mockResolvedValueOnce({ id: 2, username: 'jane@test.com', full_name: 'Jane Smith', role: 'Parent' });

      // Test: Call bulkCreateUsers
      await adminController.bulkCreateUsers(req, res);

      // Verify: Both users created
      expect(User.create).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Bulk upload completed. 2 users created, 0 failed',
        data: {
          successCount: 2,
          failureCount: 0,
          createdUsers: expect.arrayContaining([
            expect.objectContaining({ email: 'john@test.com' }),
            expect.objectContaining({ email: 'jane@test.com' })
          ]),
          errors: []
        }
      });
    });

    it('should return 400 when no file uploaded', async () => {
      // Setup: No file in request
      req.file = null;

      // Test: Call bulkCreateUsers
      await adminController.bulkCreateUsers(req, res);

      // Verify: Error response returned
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'CSV file is required'
      });
      expect(User.create).not.toHaveBeenCalled();
    });

    it('should return 400 for empty CSV file', async () => {
      // Setup: Empty CSV
      const csvContent = 'full_name,email,password,role';
      req.file = {
        buffer: Buffer.from(csvContent)
      };

      // Test: Call bulkCreateUsers
      await adminController.bulkCreateUsers(req, res);

      // Verify: Error response returned
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'CSV file is empty'
      });
    });

    it('should return 400 for CSV missing required columns', async () => {
      // Setup: CSV missing 'role' column
      const csvContent = 'full_name,email,password\nJohn Doe,john@test.com,password123';
      req.file = {
        buffer: Buffer.from(csvContent)
      };

      // Test: Call bulkCreateUsers
      await adminController.bulkCreateUsers(req, res);

      // Verify: Error response returned
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'CSV is missing required columns: role'
      });
    });

    it('should skip rows with missing required fields', async () => {
      // Setup: CSV with one valid row and one invalid row
      const csvContent = 'full_name,email,password,role\nJohn Doe,john@test.com,password123,Student\n,jane@test.com,password456,Parent';
      req.file = {
        buffer: Buffer.from(csvContent)
      };

      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedPassword');
      User.usernameExists.mockResolvedValue(false);
      User.create.mockResolvedValue({ id: 1, username: 'john@test.com', full_name: 'John Doe', role: 'Student' });

      // Test: Call bulkCreateUsers
      await adminController.bulkCreateUsers(req, res);

      // Verify: Only one user created, one error reported
      expect(User.create).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Bulk upload completed. 1 users created, 1 failed',
        data: {
          successCount: 1,
          failureCount: 1,
          createdUsers: expect.arrayContaining([
            expect.objectContaining({ email: 'john@test.com' })
          ]),
          errors: expect.arrayContaining([
            expect.objectContaining({
              line: 3,
              email: 'jane@test.com',
              error: 'Missing required fields (full_name, email, password, role)'
            })
          ])
        }
      });
    });

    it('should validate email format in CSV rows', async () => {
      // Setup: CSV with invalid email
      const csvContent = 'full_name,email,password,role\nJohn Doe,invalidemail,password123,Student';
      req.file = {
        buffer: Buffer.from(csvContent)
      };

      // Test: Call bulkCreateUsers
      await adminController.bulkCreateUsers(req, res);

      // Verify: No users created, error reported
      expect(User.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Bulk upload completed. 0 users created, 1 failed',
        data: {
          successCount: 0,
          failureCount: 1,
          createdUsers: [],
          errors: expect.arrayContaining([
            expect.objectContaining({
              email: 'invalidemail',
              error: 'Invalid email format'
            })
          ])
        }
      });
    });

    it('should validate password length in CSV rows', async () => {
      // Setup: CSV with short password
      const csvContent = 'full_name,email,password,role\nJohn Doe,john@test.com,short,Student';
      req.file = {
        buffer: Buffer.from(csvContent)
      };

      // Test: Call bulkCreateUsers
      await adminController.bulkCreateUsers(req, res);

      // Verify: No users created, error reported
      expect(User.create).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Bulk upload completed. 0 users created, 1 failed',
        data: {
          successCount: 0,
          failureCount: 1,
          createdUsers: [],
          errors: expect.arrayContaining([
            expect.objectContaining({
              email: 'john@test.com',
              error: 'Password must be at least 8 characters'
            })
          ])
        }
      });
    });

    it('should validate role in CSV rows', async () => {
      // Setup: CSV with invalid role
      const csvContent = 'full_name,email,password,role\nJohn Doe,john@test.com,password123,InvalidRole';
      req.file = {
        buffer: Buffer.from(csvContent)
      };

      // Test: Call bulkCreateUsers
      await adminController.bulkCreateUsers(req, res);

      // Verify: No users created, error reported
      expect(User.create).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Bulk upload completed. 0 users created, 1 failed',
        data: {
          successCount: 0,
          failureCount: 1,
          createdUsers: [],
          errors: expect.arrayContaining([
            expect.objectContaining({
              email: 'john@test.com',
              error: 'Invalid role. Must be: Student, Parent, Admin, Teacher'
            })
          ])
        }
      });
    });

    it('should skip duplicate emails in CSV', async () => {
      // Setup: CSV with duplicate email
      const csvContent = 'full_name,email,password,role\nJohn Doe,existing@test.com,password123,Student';
      req.file = {
        buffer: Buffer.from(csvContent)
      };

      User.usernameExists.mockResolvedValue(true);

      // Test: Call bulkCreateUsers
      await adminController.bulkCreateUsers(req, res);

      // Verify: No users created, error reported
      expect(User.create).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Bulk upload completed. 0 users created, 1 failed',
        data: {
          successCount: 0,
          failureCount: 1,
          createdUsers: [],
          errors: expect.arrayContaining([
            expect.objectContaining({
              email: 'existing@test.com',
              error: 'Email already exists'
            })
          ])
        }
      });
    });

    it('should handle partial success with mixed valid and invalid rows', async () => {
      // Setup: CSV with 2 valid and 2 invalid rows
      const csvContent = 'full_name,email,password,role\nJohn Doe,john@test.com,password123,Student\nInvalid,invalidemail,password456,Parent\nJane Smith,jane@test.com,password789,Teacher\nShort,short@test.com,pass,Admin';
      req.file = {
        buffer: Buffer.from(csvContent)
      };

      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedPassword');
      User.usernameExists.mockResolvedValue(false);
      User.create
        .mockResolvedValueOnce({ id: 1, username: 'john@test.com', full_name: 'John Doe', role: 'Student' })
        .mockResolvedValueOnce({ id: 2, username: 'jane@test.com', full_name: 'Jane Smith', role: 'Teacher' });

      // Test: Call bulkCreateUsers
      await adminController.bulkCreateUsers(req, res);

      // Verify: 2 users created, 2 errors reported
      expect(User.create).toHaveBeenCalledTimes(2);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Bulk upload completed. 2 users created, 2 failed',
        data: {
          successCount: 2,
          failureCount: 2,
          createdUsers: expect.arrayContaining([
            expect.objectContaining({ email: 'john@test.com' }),
            expect.objectContaining({ email: 'jane@test.com' })
          ]),
          errors: expect.arrayContaining([
            expect.objectContaining({ email: 'invalidemail' }),
            expect.objectContaining({ email: 'short@test.com' })
          ])
        }
      });
    });

    it('should handle database errors during user creation', async () => {
      // Setup: Valid CSV but database error
      const csvContent = 'full_name,email,password,role\nJohn Doe,john@test.com,password123,Student';
      req.file = {
        buffer: Buffer.from(csvContent)
      };

      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedPassword');
      User.usernameExists.mockResolvedValue(false);
      User.create.mockRejectedValue(new Error('Database insert failed'));

      // Test: Call bulkCreateUsers
      await adminController.bulkCreateUsers(req, res);

      // Verify: No users created, error reported
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Bulk upload completed. 0 users created, 1 failed',
        data: {
          successCount: 0,
          failureCount: 1,
          createdUsers: [],
          errors: expect.arrayContaining([
            expect.objectContaining({
              email: 'john@test.com',
              error: 'Database insert failed'
            })
          ])
        }
      });
    });

    it('should handle unexpected errors during processing', async () => {
      // Setup: Valid CSV structure but force an error by mocking User.usernameExists to throw
      const csvContent = 'full_name,email,password,role\nJohn Doe,john@test.com,password123,Student';
      req.file = {
        buffer: Buffer.from(csvContent)
      };

      // Mock User.usernameExists to throw an unexpected error
      User.usernameExists.mockRejectedValue(new Error('Unexpected database error'));

      // Test: Call bulkCreateUsers
      await adminController.bulkCreateUsers(req, res);

      // Verify: Error response returned
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error processing CSV file',
        error: 'Unexpected database error'
      });
    });
  });
});
