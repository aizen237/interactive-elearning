// src/routes/parentRoutes.js
const express = require('express');
const router = express.Router();
const parentController = require('../controllers/parentController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Protect all routes - require authentication and Parent role
router.use(protect);
router.use(authorize('Parent'));

/**
 * @route   GET /api/parent/children
 * @desc    Get all children linked to the parent
 * @access  Private (Parent only)
 */
router.get('/children', parentController.getChildren);

/**
 * @route   GET /api/parent/overview
 * @desc    Get overview of all children's progress
 * @access  Private (Parent only)
 */
router.get('/overview', parentController.getChildrenOverview);

/**
 * @route   GET /api/parent/child/:studentId/stats
 * @desc    Get detailed stats for a specific child
 * @access  Private (Parent only - must be linked to student)
 */
router.get('/child/:studentId/stats', parentController.getChildStats);

module.exports = router;
