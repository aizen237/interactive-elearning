// tests/adminController.integration.test.js
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const adminRoutes = require('../src/routes/adminRoutes');
const dbTestHelper = require('./helpers/dbTestHelper');
const db = require('../src/config/db');

/**
 * Integration Tests for Admin Controller - User Management
 * Tests admin user management endpoints with real database
 * 
 * **Validates: Requirements 2.1, 3.1, 4.5, 5.5, 6.3, 6.6**
 */

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/admin', adminRoutes);

describe('Admin Controller - User Management', () => {
  let adminToken;
  const testUserId = 10000;

  beforeAll(() => {
    // Create a valid admin token for testing
    adminToken = jwt.sign(
      { id: 1, role: 'Admin' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  beforeEach(async () => {
    await dbTestHelper.cleanup();
  });

  afterEach(async () => {
    await dbTestHelper.cleanup();
  });

  afterAll(async () => {
    await dbTestHelper.cleanup();
  });

  describe('GET /api/admin/users', () => {
    it('should return paginated list of users', async () => {
      // Setup: Create test users
      await dbTestHelper.createTestUsers(5, testUserId, 'Student');

      // Test: Get users
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify: Response structure
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('users');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('page');
      expect(response.body.data).toHaveProperty('totalPages');
      expect(Array.isArray(response.body.data.users)).toBe(true);
      expect(response.body.data.users.length).toBeGreaterThan(0);
    });

    it('should filter users by role', async () => {
      // Setup: Create test users with different roles
      await dbTestHelper.createTestUsers(3, testUserId, 'Student');
      await dbTestHelper.createTestUsers(2, testUserId + 3, 'Parent');

      // Test: Get only students
      const response = await request(app)
        .get('/api/admin/users?role=Student')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify: Only students returned
      expect(response.body.success).toBe(true);
      const students = response.body.data.users.filter(u => u.id >= testUserId);
      expect(students.length).toBeGreaterThanOrEqual(3);
      students.forEach(user => {
        expect(user.role).toBe('Student');
      });
    });

    it('should search users by name', async () => {
      // Setup: Create test user with specific name
      const userId = testUserId;
      await db.execute(
        `INSERT INTO users (id, username, password, role, full_name)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, `searchtest${userId}@test.com`, 'hashedpass', 'Student', 'Searchable User']
      );

      // Test: Search for user
      const response = await request(app)
        .get('/api/admin/users?search=Searchable')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify: User found
      expect(response.body.success).toBe(true);
      const foundUser = response.body.data.users.find(u => u.id === userId);
      expect(foundUser).toBeDefined();
      expect(foundUser.full_name).toBe('Searchable User');
    });

    it('should support pagination', async () => {
      // Setup: Create many test users
      await dbTestHelper.createTestUsers(25, testUserId, 'Student');

      // Test: Get first page
      const response1 = await request(app)
        .get('/api/admin/users?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify: Pagination works
      expect(response1.body.success).toBe(true);
      expect(response1.body.data.page).toBe(1);
      expect(response1.body.data.users.length).toBeLessThanOrEqual(10);
    });
  });

  describe('GET /api/admin/users/:userId', () => {
    it('should return detailed user information', async () => {
      // Setup: Create test user
      const userId = testUserId;
      await dbTestHelper.createTestUser(userId, 'Student');

      // Test: Get user details
      const response = await request(app)
        .get(`/api/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify: User details returned
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', userId);
      expect(response.body.data).toHaveProperty('username');
      expect(response.body.data).toHaveProperty('full_name');
      expect(response.body.data).toHaveProperty('role', 'Student');
    });

    it('should return 404 for non-existent user', async () => {
      // Test: Get non-existent user
      const response = await request(app)
        .get('/api/admin/users/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      // Verify: Error message
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });

    it('should return 400 for invalid user ID', async () => {
      // Test: Get user with invalid ID
      const response = await request(app)
        .get('/api/admin/users/invalid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      // Verify: Error message
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Valid user ID is required');
    });
  });

  describe('POST /api/admin/users', () => {
    it('should create a new user with valid data', async () => {
      // Test: Create user
      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'newuser@test.com',
          password: 'password123',
          full_name: 'New Test User',
          role: 'Student',
          phone_number: '1234567890'
        })
        .expect(201);

      // Verify: User created
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User created successfully');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.username).toBe('newuser@test.com');
      expect(response.body.data.full_name).toBe('New Test User');
      expect(response.body.data.role).toBe('Student');

      // Cleanup: Delete created user
      await db.execute('DELETE FROM users WHERE username = ?', ['newuser@test.com']);
    });

    it('should validate required fields', async () => {
      // Test: Create user without required fields
      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'incomplete@test.com'
        })
        .expect(400);

      // Verify: Validation error
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });

    it('should validate email format', async () => {
      // Test: Create user with invalid email
      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'invalidemail',
          password: 'password123',
          full_name: 'Test User',
          role: 'Student'
        })
        .expect(400);

      // Verify: Validation error
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email format');
    });

    it('should validate password length', async () => {
      // Test: Create user with short password
      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'test@test.com',
          password: 'short',
          full_name: 'Test User',
          role: 'Student'
        })
        .expect(400);

      // Verify: Validation error
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Password must be at least 8 characters');
    });

    it('should reject duplicate email', async () => {
      // Setup: Create first user
      const email = 'duplicate@test.com';
      await db.execute(
        `INSERT INTO users (username, password, role, full_name)
         VALUES (?, ?, ?, ?)`,
        [email, 'hashedpass', 'Student', 'First User']
      );

      // Test: Try to create user with same email
      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: email,
          password: 'password123',
          full_name: 'Second User',
          role: 'Student'
        })
        .expect(409);

      // Verify: Conflict error
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email already exists');

      // Cleanup
      await db.execute('DELETE FROM users WHERE username = ?', [email]);
    });
  });

  describe('PUT /api/admin/users/:userId', () => {
    it('should update user information', async () => {
      // Setup: Create test user
      const userId = testUserId;
      await dbTestHelper.createTestUser(userId, 'Student');

      // Test: Update user
      const response = await request(app)
        .put(`/api/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          full_name: 'Updated Name',
          phone_number: '9876543210'
        })
        .expect(200);

      // Verify: User updated
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User updated successfully');
      expect(response.body.data.full_name).toBe('Updated Name');
    });

    it('should return 404 for non-existent user', async () => {
      // Test: Update non-existent user
      const response = await request(app)
        .put('/api/admin/users/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          full_name: 'Updated Name'
        })
        .expect(404);

      // Verify: Error message
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });

    it('should validate email format when updating', async () => {
      // Setup: Create test user
      const userId = testUserId;
      await dbTestHelper.createTestUser(userId, 'Student');

      // Test: Update with invalid email
      const response = await request(app)
        .put(`/api/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'invalidemail'
        })
        .expect(400);

      // Verify: Validation error
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email format');
    });
  });

  describe('POST /api/admin/users/:userId/deactivate', () => {
    it('should deactivate user account', async () => {
      // Setup: Create test user
      const userId = testUserId;
      await dbTestHelper.createTestUser(userId, 'Student');

      // Test: Deactivate user
      const response = await request(app)
        .post(`/api/admin/users/${userId}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify: User deactivated
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User deactivated successfully');
      expect(response.body.data.status).toBe('inactive');

      // Verify in database
      const [users] = await db.execute('SELECT status FROM users WHERE id = ?', [userId]);
      expect(users[0].status).toBe('inactive');
    });

    it('should return 404 for non-existent user', async () => {
      // Test: Deactivate non-existent user
      const response = await request(app)
        .post('/api/admin/users/99999/deactivate')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      // Verify: Error message
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });
  });

  describe('POST /api/admin/users/:userId/activate', () => {
    it('should activate user account', async () => {
      // Setup: Create test user and deactivate
      const userId = testUserId;
      await dbTestHelper.createTestUser(userId, 'Student');
      await db.execute('UPDATE users SET status = ? WHERE id = ?', ['inactive', userId]);

      // Test: Activate user
      const response = await request(app)
        .post(`/api/admin/users/${userId}/activate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify: User activated
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User activated successfully');
      expect(response.body.data.status).toBe('active');

      // Verify in database
      const [users] = await db.execute('SELECT status FROM users WHERE id = ?', [userId]);
      expect(users[0].status).toBe('active');
    });

    it('should return 404 for non-existent user', async () => {
      // Test: Activate non-existent user
      const response = await request(app)
        .post('/api/admin/users/99999/activate')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      // Verify: Error message
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication', async () => {
      // Test: Access without token
      const response = await request(app)
        .get('/api/admin/users')
        .expect(401);

      // Verify: Unauthorized
      expect(response.body.success).toBe(false);
    });

    it('should require admin role', async () => {
      // Setup: Create student token
      const studentToken = jwt.sign(
        { id: 1, role: 'Student' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      // Test: Access with student token
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);

      // Verify: Forbidden
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Admin access required');
    });
  });
});
