// src/routes/contentRoutes.js
const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../config/upload');

// Public routes (students can view)
router.get('/module/:moduleId', contentController.getModuleContent);
router.get('/:id', contentController.getContent);

// Protected routes (teacher/admin only)
// upload.single('media') allows ONE file upload with field name 'media'
router.post('/', 
  protect, 
  authorize('teacher', 'admin'), 
  upload.single('media'),
  contentController.createContent
);

router.put('/:id', 
  protect, 
  authorize('teacher', 'admin'), 
  upload.single('media'),
  contentController.updateContent
);

router.delete('/:id', 
  protect, 
  authorize('teacher', 'admin'), 
  contentController.deleteContent
);

module.exports = router;