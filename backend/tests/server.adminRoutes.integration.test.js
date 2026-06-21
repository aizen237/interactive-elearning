// tests/server.adminRoutes.integration.test.js
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

describe('Server Admin Routes Integration', () => {
  let app;
  let adminToken;

  beforeAll(() => {
    // Create a minimal Express app that mimics the server setup
    app = express();
    app.use(express.json());
    
    // Import and mount admin routes
    const adminRoutes = require('../src/routes/adminRoutes');
    app.use('/api/admin', adminRoutes);

    // Create a valid admin token for testing
    adminToken = jwt.sign(
      { id: 1, role: 'Admin' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  describe('Admin routes mounted at /api/admin', () => {
    it('should respond to /api/admin/users with authentication', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);
      
      // Should get 501 (Not Implemented) since handlers aren't implemented yet
      expect(response.status).toBe(501);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Not implemented yet');
    });

    it('should respond to /api/admin/modules with authentication', async () => {
      const response = await request(app)
        .get('/api/admin/modules')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(501);
      expect(response.body.success).toBe(false);
    });

    it('should respond to /api/admin/analytics with authentication', async () => {
      const response = await request(app)
        .get('/api/admin/analytics')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(501);
      expect(response.body.success).toBe(false);
    });

    it('should require authentication for admin routes', async () => {
      const response = await request(app)
        .get('/api/admin/users');
      
      // Should get 401 (Unauthorized) without token
      expect(response.status).toBe(401);
    });
  });
});
