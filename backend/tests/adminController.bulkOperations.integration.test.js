// tests/adminController.bulkOperations.integration.test.js
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const adminRoutes = require('../src/routes/adminRoutes');
const dbTestHelper = require('./helpers/dbTestHelper');
const db = require('../src/config/db');

/**
 * Integration Tests for Admin Controller - Bulk Operations
 * Tests bulk upload and export functionality with real database
 * 
 * **Validates: Requirements 7.5, 7.8, 19.3**
 */

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/admin', adminRoutes);

describe('Admin Controller - Bulk Operations Integration', () => {
  let adminToken;
  const testUserId = 30000;

  beforeAll(() => {
    // Create a valid admin token for testing
    adminToken = jwt.sign(
      { id: 1, role: 'Admin' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  beforeEach(async () => {
    // Clean up only test users (don't try to clean notifications table)
    await db.execute('DELETE FROM users WHERE id >= ?', [testUserId]);
  });

  afterEach(async () => {
    // Clean up only test users
    await db.execute('DELETE FROM users WHERE id >= ?', [testUserId]);
  });

  afterAll(async () => {
    // Clean up only test users
    await db.execute('DELETE FROM users WHERE id >= ?', [testUserId]);
  });

  describe('POST /api/admin/users/bulk - CSV Upload with Valid Data', () => {
    it('should successfully upload valid CSV and create users in database', async () => {
      // Test: Upload CSV file with valid users
      const csvContent = 'full_name,email,password,role\nAlice Johnson,alice30000@test.com,password123,Student\nBob Smith,bob30001@test.com,password456,Parent';
      
      const response = await request(app)
        .post('/api/admin/users/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', Buffer.from(csvContent), 'users.csv');

      // Verify: Response is successful
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.successCount).toBe(2);
      expect(response.body.data.failureCount).toBe(0);
      expect(response.body.data.createdUsers).toHaveLength(2);

      // Verify: Users exist in database
      const [users] = await db.execute(
        'SELECT * FROM users WHERE username IN (?, ?)',
        ['alice30000@test.com', 'bob30001@test.com']
      );
      expect(users).toHaveLength(2);
      expect(users[0].full_name).toBe('Alice Johnson');
      expect(users[0].role).toBe('Student');
      expect(users[1].full_name).toBe('Bob Smith');
      expect(users[1].role).toBe('Parent');
    });

    it('should create users with different roles', async () => {
      // Test: Upload CSV with all role types
      const csvContent = 'full_name,email,password,role\nStudent User,student30002@test.com,password123,Student\nParent User,parent30003@test.com,password456,Parent\nAdmin User,admin30004@test.com,password789,Admin\nTeacher User,teacher30005@test.com,password012,Teacher';
      
      const response = await request(app)
        .post('/api/admin/users/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', Buffer.from(csvContent), 'users.csv');

      // Verify: All users created
      expect(response.status).toBe(200);
      expect(response.body.data.successCount).toBe(4);
      expect(response.body.data.failureCount).toBe(0);

      // Verify: Each role exists in database
      const [students] = await db.execute('SELECT * FROM users WHERE username = ?', ['student30002@test.com']);
      expect(students[0].role).toBe('Student');

      const [parents] = await db.execute('SELECT * FROM users WHERE username = ?', ['parent30003@test.com']);
      expect(parents[0].role).toBe('Parent');

      const [admins] = await db.execute('SELECT * FROM users WHERE username = ?', ['admin30004@test.com']);
      expect(admins[0].role).toBe('Admin');

      const [teachers] = await db.execute('SELECT * FROM users WHERE username = ?', ['teacher30005@test.com']);
      expect(teachers[0].role).toBe('Teacher');
    });

    it('should hash passwords correctly', async () => {
      // Test: Upload CSV and verify password is hashed
      const csvContent = 'full_name,email,password,role\nTest User,test30006@test.com,mypassword123,Student';
      
      const response = await request(app)
        .post('/api/admin/users/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', Buffer.from(csvContent), 'users.csv');

      expect(response.status).toBe(200);
      expect(response.body.data.successCount).toBe(1);

      // Verify: Password is hashed (not plain text)
      const [users] = await db.execute('SELECT password FROM users WHERE username = ?', ['test30006@test.com']);
      expect(users[0].password).not.toBe('mypassword123');
      expect(users[0].password).toMatch(/^\$2[aby]\$/); // bcrypt hash pattern
    });
  });

  describe('POST /api/admin/users/bulk - CSV Upload with Invalid Rows', () => {
    it('should handle partial success with some invalid rows', async () => {
      // Test: Upload CSV with mix of valid and invalid rows
      const csvContent = 'full_name,email,password,role\nValid User,valid30007@test.com,password123,Student\nInvalid Email,notanemail,password456,Parent\nShort Pass,short30008@test.com,pass,Student\nInvalid Role,invalid30009@test.com,password789,InvalidRole';
      
      const response = await request(app)
        .post('/api/admin/users/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', Buffer.from(csvContent), 'users.csv');

      // Verify: Partial success
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.successCount).toBe(1);
      expect(response.body.data.failureCount).toBe(3);
      expect(response.body.data.errors).toHaveLength(3);

      // Verify: Only valid user exists in database
      const [users] = await db.execute(
        'SELECT * FROM users WHERE username IN (?, ?, ?, ?)',
        ['valid30007@test.com', 'notanemail', 'short30008@test.com', 'invalid30009@test.com']
      );
      expect(users).toHaveLength(1);
      expect(users[0].username).toBe('valid30007@test.com');
    });

    it('should report specific errors for each invalid row', async () => {
      // Test: Upload CSV with various validation errors
      const csvContent = 'full_name,email,password,role\nBad Email,bademail,password123,Student\nShort Password,short30010@test.com,short,Student\nBad Role,badrole30011@test.com,password123,SuperAdmin';
      
      const response = await request(app)
        .post('/api/admin/users/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', Buffer.from(csvContent), 'users.csv');

      // Verify: All rows failed with specific errors
      expect(response.body.data.successCount).toBe(0);
      expect(response.body.data.failureCount).toBe(3);
      
      const errors = response.body.data.errors;
      expect(errors[0].error).toContain('Invalid email format');
      expect(errors[1].error).toContain('Password must be at least 8 characters');
      expect(errors[2].error).toContain('Invalid role');
    });

    it('should reject duplicate emails within CSV', async () => {
      // Setup: Create existing user
      await dbTestHelper.createTestUser(testUserId, 'Student');
      const [existingUser] = await db.execute('SELECT username FROM users WHERE id = ?', [testUserId]);
      const existingEmail = existingUser[0].username;

      // Test: Upload CSV with duplicate email
      const csvContent = `full_name,email,password,role\nNew User,${existingEmail},password123,Student`;
      
      const response = await request(app)
        .post('/api/admin/users/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', Buffer.from(csvContent), 'users.csv');

      // Verify: Duplicate rejected
      expect(response.body.data.successCount).toBe(0);
      expect(response.body.data.failureCount).toBe(1);
      expect(response.body.data.errors[0].error).toContain('Email already exists');
    });

    it('should handle missing required fields', async () => {
      // Test: Upload CSV with missing fields
      const csvContent = 'full_name,email,password,role\n,missing30012@test.com,password123,Student\nMissing Email,,password456,Parent\nMissing Password,missing30013@test.com,,Student\nMissing Role,missing30014@test.com,password789,';
      
      const response = await request(app)
        .post('/api/admin/users/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', Buffer.from(csvContent), 'users.csv');

      // Verify: All rows failed
      expect(response.body.data.successCount).toBe(0);
      expect(response.body.data.failureCount).toBe(4);
      
      // Verify: All errors mention missing fields
      response.body.data.errors.forEach(error => {
        expect(error.error).toContain('Missing required fields');
      });
    });
  });

  describe('GET /api/admin/users/export - User Export Functionality', () => {
    it('should export all users as CSV', async () => {
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
      expect(lines.length).toBeGreaterThan(1);
      
      // Check that our test users are included
      expect(csvContent).toContain(`testuser${testUserId}`);
      expect(csvContent).toContain(`testuser${testUserId + 1}`);
      expect(csvContent).toContain(`testuser${testUserId + 2}`);
    });

    it('should export users with role filter', async () => {
      // Setup: Create users with different roles
      await dbTestHelper.createTestUsers(2, testUserId, 'Student');
      await dbTestHelper.createTestUsers(2, testUserId + 2, 'Parent');

      // Test: Export only students
      const response = await request(app)
        .get('/api/admin/users/export?role=Student')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify: CSV content contains students
      const csvContent = response.text;
      const lines = csvContent.split('\n').filter(line => line.trim());
      
      // Check that student users are included
      expect(csvContent).toContain(`testuser${testUserId}`);
      expect(csvContent).toContain(`testuser${testUserId + 1}`);
      
      // Verify role column shows Student for our test users
      const studentLines = lines.filter(line => line.includes(`testuser${testUserId}`));
      studentLines.forEach(line => {
        const fields = line.split(',');
        const role = fields[3];
        expect(role).toBe('Student');
      });
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
      
      // Active user should be included
      expect(csvContent).toContain(`testuser${testUserId + 1}`);
      
      // Verify status column shows active for our test user
      const lines = csvContent.split('\n').filter(line => line.includes(`testuser${testUserId + 1}`));
      expect(lines.length).toBeGreaterThan(0);
      const fields = lines[0].split(',');
      const status = fields[4];
      expect(status).toBe('active');
    });

    it('should export users with search filter', async () => {
      // Setup: Create test user with specific name
      const userId = testUserId;
      await db.execute(
        `INSERT INTO users (id, username, password, role, full_name)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, `searchable${userId}@test.com`, 'hashedpass', 'Student', 'Searchable User Name']
      );

      // Test: Export with search filter
      const response = await request(app)
        .get('/api/admin/users/export?search=Searchable')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify: CSV content contains searched user
      const csvContent = response.text;
      expect(csvContent).toContain('Searchable User Name');
      expect(csvContent).toContain(`searchable${userId}@test.com`);
    });

    it('should properly escape CSV fields with special characters', async () => {
      // Setup: Create users with special characters
      const userId1 = testUserId;
      const userId2 = testUserId + 1;
      
      await db.execute(
        `INSERT INTO users (id, username, password, role, full_name)
         VALUES (?, ?, ?, ?, ?)`,
        [userId1, `comma${userId1}@test.com`, 'hashedpass', 'Student', 'Last, First']
      );
      
      await db.execute(
        `INSERT INTO users (id, username, password, role, full_name)
         VALUES (?, ?, ?, ?, ?)`,
        [userId2, `quote${userId2}@test.com`, 'hashedpass', 'Student', 'John "Johnny" Doe']
      );

      // Test: Export users
      const response = await request(app)
        .get('/api/admin/users/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify: CSV content properly escapes special characters
      const csvContent = response.text;
      expect(csvContent).toContain('"Last, First"');
      expect(csvContent).toContain('"John ""Johnny"" Doe"');
    });

    it('should handle empty result set', async () => {
      // Test: Export with filter that matches no users
      const response = await request(app)
        .get('/api/admin/users/export?search=NonExistentUser99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify: CSV contains only header
      const csvContent = response.text;
      const lines = csvContent.split('\n').filter(line => line.trim());
      expect(lines.length).toBe(1);
      expect(lines[0]).toBe('id,full_name,email,role,status,created_at,last_login');
    });

    it('should format dates correctly in export', async () => {
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
      
      expect(userLine).toBeDefined();
      const fields = userLine.split(',');
      const createdAt = fields[5];
      // Check date format (YYYY-MM-DD)
      expect(createdAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('Bulk Operations - Authentication and Authorization', () => {
    it('should require authentication for bulk upload', async () => {
      // Test: Upload without token
      const csvContent = 'full_name,email,password,role\nTest User,test@test.com,password123,Student';
      
      const response = await request(app)
        .post('/api/admin/users/bulk')
        .attach('file', Buffer.from(csvContent), 'users.csv')
        .expect(401);

      // Verify: Unauthorized
      expect(response.body.success).toBe(false);
    });

    it('should require admin role for bulk upload', async () => {
      // Setup: Create student token
      const studentToken = jwt.sign(
        { id: 1, role: 'Student' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      // Test: Upload with student token
      const csvContent = 'full_name,email,password,role\nTest User,test@test.com,password123,Student';
      
      const response = await request(app)
        .post('/api/admin/users/bulk')
        .set('Authorization', `Bearer ${studentToken}`)
        .attach('file', Buffer.from(csvContent), 'users.csv')
        .expect(403);

      // Verify: Forbidden
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Admin access required');
    });

    it('should require authentication for export', async () => {
      // Test: Export without token
      const response = await request(app)
        .get('/api/admin/users/export')
        .expect(401);

      // Verify: Unauthorized
      expect(response.body.success).toBe(false);
    });

    it('should require admin role for export', async () => {
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

  describe('Bulk Operations - Edge Cases', () => {
    it('should handle large CSV files', async () => {
      // Test: Upload CSV with many users
      let csvContent = 'full_name,email,password,role\n';
      const userCount = 50;
      
      for (let i = 0; i < userCount; i++) {
        csvContent += `User ${i},user${testUserId + i}@test.com,password123,Student\n`;
      }
      
      const response = await request(app)
        .post('/api/admin/users/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', Buffer.from(csvContent), 'users.csv');

      // Verify: All users created
      expect(response.status).toBe(200);
      expect(response.body.data.successCount).toBe(userCount);
      expect(response.body.data.failureCount).toBe(0);

      // Verify: Users exist in database
      const [users] = await db.execute(
        'SELECT COUNT(*) as count FROM users WHERE id >= ? AND id < ?',
        [testUserId, testUserId + userCount]
      );
      expect(users[0].count).toBe(userCount);
    });

    it('should handle CSV with extra whitespace', async () => {
      // Test: Upload CSV with whitespace in fields
      const csvContent = 'full_name,email,password,role\n  Alice Johnson  ,  alice30100@test.com  ,password123,  Student  ';
      
      const response = await request(app)
        .post('/api/admin/users/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', Buffer.from(csvContent), 'users.csv');

      // Verify: User created (csv-parser trims whitespace by default)
      expect(response.status).toBe(200);
      expect(response.body.data.successCount).toBe(1);

      // Verify: User exists in database
      const [users] = await db.execute(
        'SELECT * FROM users WHERE username LIKE ?',
        ['%alice30100@test.com%']
      );
      expect(users.length).toBeGreaterThan(0);
    });

    it('should export large number of users', async () => {
      // Setup: Create many test users
      await dbTestHelper.createTestUsers(20, testUserId, 'Student');

      // Test: Export all users
      const response = await request(app)
        .get('/api/admin/users/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify: CSV contains all test users
      const csvContent = response.text;
      const lines = csvContent.split('\n').filter(line => line.trim());
      
      // Should have header + at least our 20 test users
      expect(lines.length).toBeGreaterThan(20);
    });
  });
});
