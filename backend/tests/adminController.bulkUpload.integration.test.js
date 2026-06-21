const request = require('supertest');
const express = require('express');
const User = require('../src/models/User');
const bcrypt = require('bcryptjs');
const adminController = require('../src/controllers/adminController');
const { csvUpload } = require('../src/config/upload');

/**
 * Integration Tests for Admin Bulk Upload Endpoint
 * Tests the complete request/response cycle for CSV bulk user upload
 * 
 * **Validates: Requirements 7.3, 7.4, 7.5, 7.6, 7.7, 7.8**
 */

// Mock dependencies
jest.mock('../src/models/User');
jest.mock('bcryptjs');

// Create Express app for testing with mocked auth
const app = express();
app.use(express.json());

// Mock authentication middleware
app.use((req, res, next) => {
  // Check for Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  // Mock user based on token
  const token = authHeader.split(' ')[1];
  if (token === 'admin-token') {
    req.user = { id: 1, username: 'admin@test.com', role: 'Admin' };
  } else if (token === 'student-token') {
    req.user = { id: 2, username: 'student@test.com', role: 'Student' };
  } else {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }

  next();
});

// Mock admin middleware
app.use((req, res, next) => {
  if (req.user && (req.user.role === 'Admin' || req.user.role === 'Teacher')) {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Admin access required' });
  }
});

// Add the bulk upload route
app.post('/api/admin/users/bulk', csvUpload.single('file'), adminController.bulkCreateUsers);

describe('Admin Bulk Upload Integration Tests', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Mock console.error to avoid cluttering test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('POST /api/admin/users/bulk', () => {
    it('should successfully upload valid CSV and create users', async () => {
      // Setup: Mock bcrypt and User methods
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedPassword');
      User.usernameExists.mockResolvedValue(false);
      User.create
        .mockResolvedValueOnce({ id: 1, username: 'john@test.com', full_name: 'John Doe', role: 'Student' })
        .mockResolvedValueOnce({ id: 2, username: 'jane@test.com', full_name: 'Jane Smith', role: 'Parent' });

      // Test: Upload CSV file
      const csvContent = 'full_name,email,password,role\nJohn Doe,john@test.com,password123,Student\nJane Smith,jane@test.com,password456,Parent';
      
      const response = await request(app)
        .post('/api/admin/users/bulk')
        .set('Authorization', 'Bearer admin-token')
        .attach('file', Buffer.from(csvContent), 'users.csv');

      // Verify: Response is successful
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('2 users created');
      expect(response.body.data.successCount).toBe(2);
      expect(response.body.data.failureCount).toBe(0);
      expect(response.body.data.createdUsers).toHaveLength(2);
      expect(response.body.data.errors).toHaveLength(0);
    });

    it('should return 400 when no file is uploaded', async () => {
      // Test: Request without file
      const response = await request(app)
        .post('/api/admin/users/bulk')
        .set('Authorization', 'Bearer admin-token');

      // Verify: Error response
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('CSV file is required');
    });

    it('should return 400 for empty CSV file', async () => {
      // Test: Upload empty CSV
      const csvContent = 'full_name,email,password,role';
      
      const response = await request(app)
        .post('/api/admin/users/bulk')
        .set('Authorization', 'Bearer admin-token')
        .attach('file', Buffer.from(csvContent), 'users.csv');

      // Verify: Error response
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('CSV file is empty');
    });

    it('should return 400 for CSV missing required columns', async () => {
      // Test: Upload CSV without 'role' column
      const csvContent = 'full_name,email,password\nJohn Doe,john@test.com,password123';
      
      const response = await request(app)
        .post('/api/admin/users/bulk')
        .set('Authorization', 'Bearer admin-token')
        .attach('file', Buffer.from(csvContent), 'users.csv');

      // Verify: Error response
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('missing required columns');
    });

    it('should handle partial success with validation errors', async () => {
      // Setup: Mock for one successful user
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedPassword');
      User.usernameExists.mockResolvedValue(false);
      User.create.mockResolvedValue({ id: 1, username: 'john@test.com', full_name: 'John Doe', role: 'Student' });

      // Test: Upload CSV with one valid and one invalid row
      const csvContent = 'full_name,email,password,role\nJohn Doe,john@test.com,password123,Student\nInvalid,invalidemail,password456,Parent';
      
      const response = await request(app)
        .post('/api/admin/users/bulk')
        .set('Authorization', 'Bearer admin-token')
        .attach('file', Buffer.from(csvContent), 'users.csv');

      // Verify: Partial success response
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.successCount).toBe(1);
      expect(response.body.data.failureCount).toBe(1);
      expect(response.body.data.createdUsers).toHaveLength(1);
      expect(response.body.data.errors).toHaveLength(1);
      expect(response.body.data.errors[0]).toMatchObject({
        email: 'invalidemail',
        error: 'Invalid email format'
      });
    });

    it('should reject duplicate emails', async () => {
      // Setup: Mock existing user
      User.usernameExists.mockResolvedValue(true);

      // Test: Upload CSV with duplicate email
      const csvContent = 'full_name,email,password,role\nJohn Doe,existing@test.com,password123,Student';
      
      const response = await request(app)
        .post('/api/admin/users/bulk')
        .set('Authorization', 'Bearer admin-token')
        .attach('file', Buffer.from(csvContent), 'users.csv');

      // Verify: Error reported
      expect(response.status).toBe(200);
      expect(response.body.data.successCount).toBe(0);
      expect(response.body.data.failureCount).toBe(1);
      expect(response.body.data.errors[0]).toMatchObject({
        email: 'existing@test.com',
        error: 'Email already exists'
      });
    });

    it('should validate password length', async () => {
      // Test: Upload CSV with short password
      const csvContent = 'full_name,email,password,role\nJohn Doe,john@test.com,short,Student';
      
      const response = await request(app)
        .post('/api/admin/users/bulk')
        .set('Authorization', 'Bearer admin-token')
        .attach('file', Buffer.from(csvContent), 'users.csv');

      // Verify: Validation error
      expect(response.status).toBe(200);
      expect(response.body.data.failureCount).toBe(1);
      expect(response.body.data.errors[0]).toMatchObject({
        email: 'john@test.com',
        error: 'Password must be at least 8 characters'
      });
    });

    it('should validate role values', async () => {
      // Test: Upload CSV with invalid role
      const csvContent = 'full_name,email,password,role\nJohn Doe,john@test.com,password123,InvalidRole';
      
      const response = await request(app)
        .post('/api/admin/users/bulk')
        .set('Authorization', 'Bearer admin-token')
        .attach('file', Buffer.from(csvContent), 'users.csv');

      // Verify: Validation error
      expect(response.status).toBe(200);
      expect(response.body.data.failureCount).toBe(1);
      expect(response.body.data.errors[0]).toMatchObject({
        email: 'john@test.com',
        error: expect.stringContaining('Invalid role')
      });
    });

    it('should require authentication', async () => {
      // Test: Request without token
      const csvContent = 'full_name,email,password,role\nJohn Doe,john@test.com,password123,Student';
      
      const response = await request(app)
        .post('/api/admin/users/bulk')
        .attach('file', Buffer.from(csvContent), 'users.csv');

      // Verify: Unauthorized
      expect(response.status).toBe(401);
    });

    it('should require admin role', async () => {
      // Test: Request with student token
      const csvContent = 'full_name,email,password,role\nJohn Doe,john@test.com,password123,Student';
      
      const response = await request(app)
        .post('/api/admin/users/bulk')
        .set('Authorization', 'Bearer student-token')
        .attach('file', Buffer.from(csvContent), 'users.csv');

      // Verify: Forbidden
      expect(response.status).toBe(403);
    });

    it('should reject non-CSV files', async () => {
      // Test: Upload non-CSV file
      const textContent = 'This is not a CSV file';
      
      const response = await request(app)
        .post('/api/admin/users/bulk')
        .set('Authorization', 'Bearer admin-token')
        .attach('file', Buffer.from(textContent), 'users.txt');

      // Verify: File type error from multer (multer returns 500 for file filter errors)
      expect(response.status).toBe(500);
    });

    it('should handle database errors during user creation', async () => {
      // Setup: Mock database error
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedPassword');
      User.usernameExists.mockResolvedValue(false);
      User.create.mockRejectedValue(new Error('Database insert failed'));

      // Test: Upload valid CSV
      const csvContent = 'full_name,email,password,role\nJohn Doe,john@test.com,password123,Student';
      
      const response = await request(app)
        .post('/api/admin/users/bulk')
        .set('Authorization', 'Bearer admin-token')
        .attach('file', Buffer.from(csvContent), 'users.csv');

      // Verify: Error reported in results
      expect(response.status).toBe(200);
      expect(response.body.data.successCount).toBe(0);
      expect(response.body.data.failureCount).toBe(1);
      expect(response.body.data.errors[0]).toMatchObject({
        email: 'john@test.com',
        error: 'Database insert failed'
      });
    });
  });
});
