// src/middleware/adminMiddleware.js

/**
 * Admin middleware for role verification
 * Requires the protect middleware to run first to verify JWT and set req.user
 * 
 * Usage: router.get('/admin/endpoint', protect, requireAdmin, controller)
 */
const requireAdmin = (req, res, next) => {
  // Check if user is authenticated (should be set by protect middleware)
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // Verify user role is Admin or Teacher
  if (req.user.role !== 'Admin' && req.user.role !== 'Teacher') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required. Insufficient permissions.'
    });
  }

  // User is authorized, proceed to next middleware/controller
  next();
};

module.exports = {
  requireAdmin
};
