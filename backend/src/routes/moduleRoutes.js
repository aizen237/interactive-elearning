// src/routes/moduleRoutes.js
const express = require('express');
const router = express.Router();
const moduleController = require('../controllers/moduleController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public routes (students can view)
router.get('/', moduleController.getAllModules);
router.get('/:id', moduleController.getModule);

// Protected routes (teacher/admin only)
router.post('/', protect, authorize('teacher', 'admin'), moduleController.createModule);
router.put('/:id', protect, authorize('teacher', 'admin'), moduleController.updateModule);
router.delete('/:id', protect, authorize('admin'), moduleController.deleteModule);

module.exports = router;