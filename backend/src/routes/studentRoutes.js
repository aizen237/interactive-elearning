// src/routes/studentRoutes.js
const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All student routes require student authentication
router.get('/content', 
  protect, 
  authorize('student'), 
  studentController.getAvailableContent
);

router.get('/content/:id', 
  protect, 
  authorize('student'), 
  studentController.getContentItem
);

router.post('/submit', 
  protect, 
  authorize('student'), 
  studentController.submitAnswer
);

router.get('/stats', 
  protect, 
  authorize('student'), 
  studentController.getStudentStats
);

router.get('/leaderboard', 
  protect, 
  authorize('student'), 
  studentController.getLeaderboard
);
module.exports = router;