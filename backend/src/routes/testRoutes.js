// src/routes/testRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');

/**
 * Test route - Any authenticated user
 * GET /api/test/protected
 */
router.get('/protected', protect, (req, res) => {
  res.json({
    success: true,
    message: 'You are authenticated!',
    user: req.user
  });
});

/**
 * Test route - Teachers only
 * GET /api/test/teacher-only
 */
router.get('/teacher-only', protect, authorize('teacher', 'admin'), (req, res) => {
  res.json({
    success: true,
    message: 'Welcome, teacher!',
    user: req.user
  });
});

/**
 * Test route - Students only
 * GET /api/test/student-only
 */
router.get('/student-only', protect, authorize('student'), (req, res) => {
  res.json({
    success: true,
    message: 'Welcome, student!',
    user: req.user
  });
});

/**
 * Test route - Admins only
 * GET /api/test/admin-only
 */
router.get('/admin-only', protect, authorize('admin'), (req, res) => {
  res.json({
    success: true,
    message: 'Welcome, admin!',
    user: req.user
  });
});

module.exports = router;