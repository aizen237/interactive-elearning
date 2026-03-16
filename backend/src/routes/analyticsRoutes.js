// src/routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All analytics routes require teacher/admin authentication
router.get('/dashboard', 
  protect, 
  authorize('teacher', 'admin'), 
  analyticsController.getDashboardStats
);

router.get('/module/:id', 
  protect, 
  authorize('teacher', 'admin'), 
  analyticsController.getModuleStats
);

module.exports = router;