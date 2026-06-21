const NotificationRepository = require('../repositories/NotificationRepository');
const NotificationPreferencesService = require('../services/NotificationPreferencesService');

/**
 * NotificationController - HTTP request handling for notification endpoints
 * Handles notification retrieval, marking as read, and preference management
 */
class NotificationController {
  /**
   * Get user's notifications with pagination
   * @route GET /api/notifications
   * @access Private (any authenticated user)
   */
  async getNotifications(req, res) {
    try {
      const userId = req.user.id;
      const page = req.query.page !== undefined ? parseInt(req.query.page) : 1;
      const limit = req.query.limit !== undefined ? parseInt(req.query.limit) : 20;

      // Validate pagination parameters
      if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1 || limit > 100) {
        return res.status(400).json({
          success: false,
          message: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100.'
        });
      }

      // Get notifications from repository
      const { notifications, total } = await NotificationRepository.getByUser(userId, page, limit);

      // Calculate total pages
      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: {
          notifications,
          total,
          page,
          totalPages
        }
      });
    } catch (error) {
      console.error('Error in getNotifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve notifications',
        error: error.message
      });
    }
  }

  /**
   * Get unread notification count for user
   * @route GET /api/notifications/unread-count
   * @access Private (any authenticated user)
   */
  async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;

      // Get unread count from repository
      const count = await NotificationRepository.getUnreadCount(userId);

      res.json({
        success: true,
        data: {
          count
        }
      });
    } catch (error) {
      console.error('Error in getUnreadCount:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve unread count',
        error: error.message
      });
    }
  }

  /**
   * Get user's notification preferences
   * @route GET /api/notifications/preferences
   * @access Private (any authenticated user)
   */
  async getPreferences(req, res) {
    try {
      const userId = req.user.id;

      // Get preferences from service
      const preferences = await NotificationPreferencesService.getPreferences(userId);

      res.json({
        success: true,
        data: {
          preferences
        }
      });
    } catch (error) {
      console.error('Error in getPreferences:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve notification preferences',
        error: error.message
      });
    }
  }

  /**
   * Mark a single notification as read
   * @route PUT /api/notifications/:id/read
   * @access Private (must own the notification)
   */
  async markAsRead(req, res) {
    try {
      const userId = req.user.id;
      const notificationId = parseInt(req.params.id);

      // Validate notification ID
      if (!notificationId || notificationId < 1) {
        return res.status(400).json({
          success: false,
          message: 'Invalid notification ID'
        });
      }

      // Mark notification as read (includes authorization check)
      const success = await NotificationRepository.markAsRead(notificationId, userId);

      if (!success) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to modify this notification'
        });
      }

      res.json({
        success: true,
        message: 'Notification marked as read'
      });
    } catch (error) {
      console.error('Error in markAsRead:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read',
        error: error.message
      });
    }
  }

  /**
   * Mark all notifications as read for user
   * @route PUT /api/notifications/mark-all-read
   * @access Private (any authenticated user)
   */
  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;

      // Mark all notifications as read
      const updated = await NotificationRepository.markAllAsRead(userId);

      res.json({
        success: true,
        message: `${updated} notification(s) marked as read`,
        data: {
          updated
        }
      });
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark all notifications as read',
        error: error.message
      });
    }
  }

  /**
   * Update user's notification preferences
   * @route PUT /api/notifications/preferences
   * @access Private (any authenticated user)
   */
  async updatePreferences(req, res) {
    try {
      const userId = req.user.id;
      const updates = req.body;

      // Validate that at least one preference field is provided
      const validFields = [
        'badge_earned',
        'level_up',
        'streak_reminder',
        'child_quiz_complete',
        'child_milestone',
        'admin_operation',
        'admin_security'
      ];

      const hasValidField = Object.keys(updates).some(key => validFields.includes(key));

      if (!hasValidField) {
        return res.status(400).json({
          success: false,
          message: 'No valid preference fields provided'
        });
      }

      // Validate that all provided fields are boolean
      for (const [key, value] of Object.entries(updates)) {
        if (validFields.includes(key) && typeof value !== 'boolean') {
          return res.status(400).json({
            success: false,
            message: `Invalid value for ${key}. Must be a boolean.`
          });
        }
      }

      // Update preferences
      const preferences = await NotificationPreferencesService.updatePreferences(userId, updates);

      res.json({
        success: true,
        message: 'Notification preferences updated',
        data: {
          preferences
        }
      });
    } catch (error) {
      console.error('Error in updatePreferences:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update notification preferences',
        error: error.message
      });
    }
  }
}

module.exports = new NotificationController();
