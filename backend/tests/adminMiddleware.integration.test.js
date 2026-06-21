// tests/adminMiddleware.integration.test.js
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const { protect } = require('../src/middleware/authMiddleware');
const { requireAdmin } = require('../src/middleware/adminMiddleware');
const User = require('../src/models/User');
const db = require('../src/config/db');

// Mock the User model
jest.mock('../src/models/User');

describe('Admin Middleware Integration', () => {
  let app;
  const JWT_SECRET = 'test-secret';

  beforeAll(() => {
    // Set JWT_SECRET for testing
    process.env.JWT_SECRET = JWT_SECRET;

    // Create Express app with test route
    app = express();
    app.use(express.json());

    // Test route that requires admin access
    app.get('/api/admin/test', protect, requireAdmin, (req, res) => {
      res.json({
        success: true,
        message: 'Admin access granted',
        user: req.user
      });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Close database connection to allow Jest to exit
    await db.end();
  });

  test('should return 401 when no token is provided', async () => {
    const response = await request(app)
      .get('/api/admin/test');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Not authorized');
  });

  test('should return 403 when user is a Student', async () => {
    const studentUser = {
      id: 1,
      username: 'student1',
      role: 'Student'
    };

    // Mock User.findById to return student user
    User.findById.mockResolvedValue(studentUser);

    // Generate valid JWT token
    const token = jwt.sign({ id: studentUser.id }, JWT_SECRET);

    const response = await request(app)
      .get('/api/admin/test')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Admin access required');
  });

  test('should return 403 when user is a Parent', async () => {
    const parentUser = {
      id: 2,
      username: 'parent1',
      role: 'Parent'
    };

    User.findById.mockResolvedValue(parentUser);

    const token = jwt.sign({ id: parentUser.id }, JWT_SECRET);

    const response = await request(app)
      .get('/api/admin/test')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Admin access required');
  });

  test('should grant access when user is an Admin', async () => {
    const adminUser = {
      id: 3,
      username: 'admin1',
      role: 'Admin'
    };

    User.findById.mockResolvedValue(adminUser);

    const token = jwt.sign({ id: adminUser.id }, JWT_SECRET);

    const response = await request(app)
      .get('/api/admin/test')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Admin access granted');
    expect(response.body.user.role).toBe('Admin');
  });

  test('should grant access when user is a Teacher', async () => {
    const teacherUser = {
      id: 4,
      username: 'teacher1',
      role: 'Teacher'
    };

    User.findById.mockResolvedValue(teacherUser);

    const token = jwt.sign({ id: teacherUser.id }, JWT_SECRET);

    const response = await request(app)
      .get('/api/admin/test')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Admin access granted');
    expect(response.body.user.role).toBe('Teacher');
  });

  test('should return 401 when token is invalid', async () => {
    const response = await request(app)
      .get('/api/admin/test')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Invalid token');
  });
});
