// src/controllers/moduleController.js
const Module = require('../models/Module');

/**
 * Get all modules
 * GET /api/modules
 */
exports.getAllModules = async (req, res) => {
  try {
    const modules = await Module.getAll();
    
    res.status(200).json({
      success: true,
      count: modules.length,
      data: modules
    });
  } catch (error) {
    console.error('Get modules error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching modules',
      error: error.message
    });
  }
};

/**
 * Get single module
 * GET /api/modules/:id
 */
exports.getModule = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    
    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    res.status(200).json({
      success: true,
      data: module
    });
  } catch (error) {
    console.error('Get module error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching module',
      error: error.message
    });
  }
};

/**
 * Create module
 * POST /api/modules
 * Protected: Teacher/Admin only
 */
exports.createModule = async (req, res) => {
  try {
   const { title, description } = req.body;

// Validation
if (!title) {
  return res.status(400).json({
    success: false,
    message: 'Title is required'
  });
}

    const newModule = await Module.create({
  title,
  description
});

    res.status(201).json({
      success: true,
      message: 'Module created successfully',
      data: newModule
    });
  } catch (error) {
    console.error('Create module error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating module',
      error: error.message
    });
  }
};

/**
 * Update module
 * PUT /api/modules/:id
 * Protected: Teacher/Admin only
 */
exports.updateModule = async (req, res) => {
  try {
    const updated = await Module.update(req.params.id, req.body);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Module updated successfully'
    });
  } catch (error) {
    console.error('Update module error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating module',
      error: error.message
    });
  }
};

/**
 * Delete module
 * DELETE /api/modules/:id
 * Protected: Admin only
 */
exports.deleteModule = async (req, res) => {
  try {
    const deleted = await Module.delete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Module deleted successfully'
    });
  } catch (error) {
    console.error('Delete module error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting module',
      error: error.message
    });
  }
};