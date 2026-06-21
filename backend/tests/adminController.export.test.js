// tests/adminController.export.test.js
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const adminRoutes = require('../src/routes/adminRoutes');
const dbTestHelper = require('./helpers/dbTestHelper');
const db = require('../src/config/db');

/**
 * Integration Tests for Admin Controller - User Export
 * Tests user export endpoint with CSV formatting
 * 
 * **Validates: Requirements 19.1, 19.2, 19.3, 19.4**
 */

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/admin', adminRoutes);

describe('Admin Controller - User Export', () => {
  let adminToken;
  const testUserId = 20000;

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

  describe('GET /api/admin/users/export', () => {
    it('should export all users as CSV with correct headers', async () => {
      // Setup: Create test users
      await dbTestHelper.createTestUsers(3, testUserId, 'Student');

      // Test: Export users
      const response = await request(app)
        .get('/api/admin/users/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify: Response headers
      expect(response.headers['content-type']).toBe('text/csv; charset=utf-8');
      expect(response.headers['content-disposition']).toBe('attachment; filename="users-export.csv"');

      // Verify: CSV content
      const csvContent = response.text;
      expect(csvContent).toContain('id,full_name,email,role,status,created_at,last_login');
      
      // Verify: Test users are in CSV
      const lines = csvContent.split('\n');
      expect(lines.length).toBeGreaterThan(1); // Header + at least one user
    });

    it('should export users with role filter', async () => {
      // Setup: Create test users with different roles
      await dbTestHelper.createTestUsers(2, testUserId, 'Student');
      await dbTestHelper.createTestUsers(2, testUserId + 2, 'Parent');

      // Test: Export only students
      const response = await request(app)
        .get('/api/admin/users/export?role=Student')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify: CSV content
      const csvContent = response.text;
      const lines = csvContent.split('\n').filter(line => line.trim());
      
      // Check that exported users are students
      for (let i = 1; i < lines.length; i++) {
        const fields = lines[i].split(',');
        const role = fields[3]; // role is 4th column
        if (fields[0] >= testUserId) {
          expect(role).toBe('Student');
        }
      }
    });

    it('should export users with status filter', async () => {
      // Setup: Create test users and deactivate one
      await dbTestHelper.createTestUsers(2, testUserId, 'Student');
      await db.execute('UPDATE users SET status = ? WHERE id = ?', ['inactive', testUserId]);

      // Test: Export only active users
      const response = await request(app)
        .get('/api/admin/users/export?status=active')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify: CSV content
      const csvContent = response.text;
      const lines = csvContent.split('\n').filter(line => line.trim());
      
      // Check that exported users are active
      for (let i = 1; i < lines.length; i++) {
        const fields = lines[i].split(',');
        const status = fields[4]; // status is 5th column
        if (fields[0] >= testUserId) {
          expect(status).toBe('active');
        }
      }
    });

    it('should export users with search filter', async () => {
      // Setup: Create test user with specific name
      const userId = testUserId;
      await db.execute(
        `INSERT INTO users (id, username, password, role, full_name)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, `exporttest${userId}@test.com`, 'hashedpass', 'Student', 'Exportable User']
      );

      // Test: Export with search filter
      const response = await request(app)
        .get('/api/admin/users/export?search=Exportable')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify: CSV content contains searched user
      const csvContent = response.text;
      expect(csvContent).toContain('Exportable User');
      expect(csvContent).toContain(`exporttest${userId}@test.com`);
    });

    it('should properly escape CSV fields with commas', async () => {
      // Setup: Create user with comma in name
      const userId = testUserId;
      await db.execute(
        `INSERT INTO users (id, username, password, role, full_name)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, `comma${userId}@test.com`, 'hashedpass', 'Student', 'Last, First']
      );

      // Test: Export users
      const response = await request(app)
        .get('/api/admin/users/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify: CSV content properly escapes comma
      const csvContent = response.text;
      expect(csvContent).toContain('"Last, First"');
    });

    it('should properly escape CSV fields with quotes', async () => {
      // Setup: Create user with quote in name
      const userId = testUserId;
      await db.execute(
        `INSERT INTO users (id, username, password, role, full_name)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, `quote${userId}@test.com`, 'hashedpass', 'Student', 'John "Johnny" Doe']
      );

      // Test: Export users
      const response = await request(app)
        .get('/api/admin/users/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify: CSV content properly escapes quotes
      const csvContent = response.text;
      expect(csvContent).toContain('"John ""Johnny"" Doe"');
    });

    it('should handle empty result set', async () => {
      // Test: Export with filter that matches no users
      const response = await request(app)
        .get('/api/admin/users/export?search=NonExistentUser12345')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify: CSV contains only header
      const csvContent = response.text;
      const lines = csvContent.split('\n').filter(line => line.trim());
      expect(lines.length).toBe(1); // Only header
      expect(lines[0]).toBe('id,full_name,email,role,status,created_at,last_login');
    });

    it('should format dates correctly', async () => {
      // Setup: Create test user
      const userId = testUserId;
      await dbTestHelper.createTestUser(userId, 'Student');

      // Test: Export users
      const response = await request(app)
        .get('/api/admin/users/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify: CSV content has date format (YYYY-MM-DD)
      const csvContent = response.text;
      const lines = csvContent.split('\n');
      const userLine = lines.find(line => line.includes(`testuser${userId}@test.com`));
      
      if (userLine) {
        const fields = userLine.split(',');
        const createdAt = fields[5]; // created_at is 6th column
        // Check date format (YYYY-MM-DD)
        expect(createdAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    });

    it('should require authentication', async () => {
      // Test: Export without token
      const response = await request(app)
        .get('/api/admin/users/export')
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

      // Test: Export with student token
      const response = await request(app)
        .get('/api/admin/users/export')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);

      // Verify: Forbidden
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Admin access required');
    });
  });
});
