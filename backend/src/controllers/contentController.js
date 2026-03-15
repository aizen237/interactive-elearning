// src/controllers/contentController.js
const ContentItem = require('../models/ContentItem');
const path = require('path');

/**
 * Get all content for a module
 * GET /api/content/module/:moduleId
 */
exports.getModuleContent = async (req, res) => {
  try {
    const content = await ContentItem.getByModule(req.params.moduleId);
    
    res.status(200).json({
      success: true,
      count: content.length,
      data: content
    });
  } catch (error) {
    console.error('Get module content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching content',
      error: error.message
    });
  }
};

/**
 * Get single content item
 * GET /api/content/:id
 */
exports.getContent = async (req, res) => {
  try {
    const content = await ContentItem.findById(req.params.id);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    res.status(200).json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching content',
      error: error.message
    });
  }
};

/**
 * Create content with optional file upload
 * POST /api/content
 * Protected: Teacher/Admin only
 */
exports.createContent = async (req, res) => {
  try {
    const {
      module_id,
      item_type,
      title,
      question_text,
      correct_answer,
      difficulty,
      options,
      explanation
    } = req.body;

    // Validation
    if (!module_id || !question_text || !correct_answer) {
      return res.status(400).json({
        success: false,
        message: 'Module ID, question text, and correct answer are required'
      });
    }

    // Get file path if file was uploaded
    let file_path = null;
    if (req.file) {
      // Store relative path
      file_path = req.file.filename;
    }

    // Parse options if it's a string
    let parsedOptions = options;
    if (typeof options === 'string') {
      try {
        parsedOptions = JSON.parse(options);
      } catch (e) {
        parsedOptions = options;
      }
    }

    const newContent = await ContentItem.create({
      module_id,
      item_type,
      title,
      question_text,
      correct_answer,
      difficulty,
      options: parsedOptions,
      explanation,
      file_path
    });

    res.status(201).json({
      success: true,
      message: 'Content created successfully',
      data: newContent
    });
  } catch (error) {
    console.error('Create content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating content',
      error: error.message
    });
  }
};

/**
 * Update content
 * PUT /api/content/:id
 * Protected: Teacher/Admin only
 */
exports.updateContent = async (req, res) => {
  try {
    const updates = { ...req.body };

    // Add new media URL if file was uploaded
    if (req.file) {
      updates.media_url = `/uploads/${req.file.filename}`;
    }

    const updated = await ContentItem.update(req.params.id, updates);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Content updated successfully'
    });
  } catch (error) {
    console.error('Update content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating content',
      error: error.message
    });
  }
};

/**
 * Delete content
 * DELETE /api/content/:id
 * Protected: Teacher/Admin only
 */
exports.deleteContent = async (req, res) => {
  try {
    const deleted = await ContentItem.delete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Content deleted successfully'
    });
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting content',
      error: error.message
    });
  }
};