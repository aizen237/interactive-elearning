// src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');
const adminController = require('../controllers/adminController');
const { csvUpload } = require('../config/upload');

// Apply authentication and admin authorization to all routes
router.use(protect);
router.use(requireAdmin);

/**
 * User Management Routes
 */

/**
 * @route   GET /api/admin/users
 * @desc    List all users with pagination, filtering, and search
 * @access  Private (Admin/Teacher only)
 * @query   page, limit, role, status, search
 */
router.get('/users', adminController.getUsers);

/**
 * @route   GET /api/admin/users/export
 * @desc    Export users as CSV
 * @access  Private (Admin/Teacher only)
 * @query   role, status, search (same filters as getUsers)
 */
router.get('/users/export', adminController.exportUsers);

/**
 * @route   GET /api/admin/users/:userId
 * @desc    Get detailed user information
 * @access  Private (Admin/Teacher only)
 */
router.get('/users/:userId', adminController.getUserById);

/**
 * @route   POST /api/admin/users
 * @desc    Create new user
 * @access  Private (Admin/Teacher only)
 * @body    { full_name, email, password, role }
 */
router.post('/users', adminController.createUser);

/**
 * @route   POST /api/admin/users/bulk
 * @desc    Bulk user creation from CSV
 * @access  Private (Admin/Teacher only)
 * @body    CSV file with columns: full_name, email, password, role
 */
router.post('/users/bulk', csvUpload.single('file'), adminController.bulkCreateUsers);

/**
 * @route   PUT /api/admin/users/:userId
 * @desc    Update user information
 * @access  Private (Admin/Teacher only)
 * @body    { full_name, email, role }
 */
router.put('/users/:userId', adminController.updateUser);

/**
 * @route   POST /api/admin/users/:userId/deactivate
 * @desc    Deactivate user account
 * @access  Private (Admin/Teacher only)
 */
router.post('/users/:userId/deactivate', adminController.deactivateUser);

/**
 * @route   POST /api/admin/users/:userId/activate
 * @desc    Reactivate user account
 * @access  Private (Admin/Teacher only)
 */
router.post('/users/:userId/activate', adminController.activateUser);

/**
 * Content Management Routes
 */

/**
 * @route   GET /api/admin/modules
 * @desc    List all modules with search support
 * @access  Private (Admin/Teacher only)
 * @query   search
 */
router.get('/modules', adminController.getModules);

/**
 * @route   POST /api/admin/modules
 * @desc    Create new module
 * @access  Private (Admin/Teacher only)
 * @body    { name, description, level_requirement }
 */
router.post('/modules', adminController.createModule);

/**
 * @route   PUT /api/admin/modules/:moduleId
 * @desc    Update module
 * @access  Private (Admin/Teacher only)
 * @body    { name, description, level_requirement }
 */
router.put('/modules/:moduleId', adminController.updateModule);

/**
 * @route   DELETE /api/admin/modules/:moduleId
 * @desc    Delete module
 * @access  Private (Admin/Teacher only)
 */
router.delete('/modules/:moduleId', adminController.deleteModule);

/**
 * Analytics Routes
 */

/**
 * @route   GET /api/admin/analytics
 * @desc    Platform statistics and metrics
 * @access  Private (Admin/Teacher only)
 */
router.get('/analytics', adminController.getAnalytics);

/**
 * @route   GET /api/admin/analytics/export
 * @desc    Export analytics as CSV
 * @access  Private (Admin/Teacher only)
 */
router.get('/analytics/export', adminController.exportAnalytics);

/**
 * @route   GET /api/admin/activity
 * @desc    Recent platform activity timeline
 * @access  Private (Admin/Teacher only)
 */
router.get('/activity', adminController.getActivity);

module.exports = router;
