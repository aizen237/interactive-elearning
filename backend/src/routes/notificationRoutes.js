// src/routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

// Protect all routes - require authentication
router.use(protect);

/**
 * @route   GET /api/notifications
 * @desc    Get user's notifications with pagination
 * @access  Private (any authenticated user)
 */
router.get('/', notificationController.getNotifications);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get count of unread notifications
 * @access  Private (any authenticated user)
 */
router.get('/unread-count', notificationController.getUnreadCount);

/**
 * @route   GET /api/notifications/preferences
 * @desc    Get user's notification preferences
 * @access  Private (any authenticated user)
 */
router.get('/preferences', notificationController.getPreferences);

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark a single notification as read
 * @access  Private (must own the notification)
 */
router.put('/:id/read', notificationController.markAsRead);

/**
 * @route   PUT /api/notifications/mark-all-read
 * @desc    Mark all user's notifications as read
 * @access  Private (any authenticated user)
 */
router.put('/mark-all-read', notificationController.markAllAsRead);

/**
 * @route   PUT /api/notifications/preferences
 * @desc    Update user's notification preferences
 * @access  Private (any authenticated user)
 */
router.put('/preferences', notificationController.updatePreferences);

module.exports = router;
