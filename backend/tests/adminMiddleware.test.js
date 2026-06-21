// tests/adminMiddleware.test.js
const { requireAdmin } = require('../src/middleware/adminMiddleware');

describe('Admin Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  describe('requireAdmin', () => {
    test('should return 401 when user is not authenticated', () => {
      req.user = null;

      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 403 when user role is Student', () => {
      req.user = {
        id: 1,
        username: 'student1',
        role: 'Student'
      };

      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Admin access required. Insufficient permissions.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 403 when user role is Parent', () => {
      req.user = {
        id: 2,
        username: 'parent1',
        role: 'Parent'
      };

      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Admin access required. Insufficient permissions.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should call next() when user role is Admin', () => {
      req.user = {
        id: 3,
        username: 'admin1',
        role: 'Admin'
      };

      requireAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    test('should call next() when user role is Teacher', () => {
      req.user = {
        id: 4,
        username: 'teacher1',
        role: 'Teacher'
      };

      requireAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    test('should return 401 when req.user is undefined', () => {
      // req.user is undefined (not set)

      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
