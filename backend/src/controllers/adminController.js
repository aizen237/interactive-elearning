// src/controllers/adminController.js
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const db = require('../config/db');

/**
 * Get all users with pagination, filtering, and search
 * GET /api/admin/users
 * Query params: page, limit, role, status, search
 */
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, status, search } = req.query;

    // Build filters object
    const filters = {};
    if (role) filters.role = role;
    if (status) filters.status = status;
    if (search) filters.search = search;

    // Build pagination object
    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit)
    };

    // Get users from User model
    const result = await User.findAll(filters, pagination);

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: result
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

/**
 * Get detailed user information by ID
 * GET /api/admin/users/:userId
 */
exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId
    if (!userId || isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid user ID is required'
      });
    }

    // Get detailed user info from User model
    const user = await User.getDetailedInfo(parseInt(userId));

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User details retrieved successfully',
      data: user
    });

  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user details',
      error: error.message
    });
  }
};

/**
 * Create new user
 * POST /api/admin/users
 * Body: { username, password, full_name, role, phone_number }
 */
exports.createUser = async (req, res) => {
  try {
    const { username, password, full_name, role, phone_number } = req.body;

    // Validation
    if (!username || !password || !full_name || !role) {
      return res.status(400).json({
        success: false,
        message: 'Username, password, full_name, and role are required'
      });
    }

    // Validate email format (username is email)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(username)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }

    // Validate role
    const validRoles = ['Student', 'Parent', 'Admin', 'Teacher'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be: Student, Parent, Admin, or Teacher'
      });
    }

    // Check if username already exists
    const existingUser = await User.usernameExists(username);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await User.create({
      username,
      password: hashedPassword,
      full_name,
      role,
      phone_number: phone_number || null
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: newUser
    });

  } catch (error) {
    console.error('Create user error:', error);
    
    // Handle duplicate entry error
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
};

/**
 * Update user information
 * PUT /api/admin/users/:userId
 * Body: { full_name, username, role, phone_number }
 */
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { full_name, username, role, phone_number } = req.body;

    // Validate userId
    if (!userId || isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid user ID is required'
      });
    }

    // Check if user exists
    const existingUser = await User.findById(parseInt(userId));
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate email format if username is being updated
    if (username) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(username)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }

      // Check if new username already exists (and it's not the current user's username)
      if (username !== existingUser.username) {
        const usernameExists = await User.usernameExists(username);
        if (usernameExists) {
          return res.status(409).json({
            success: false,
            message: 'Email already exists'
          });
        }
      }
    }

    // Validate role if provided
    if (role) {
      const validRoles = ['Student', 'Parent', 'Admin', 'Teacher'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role. Must be: Student, Parent, Admin, or Teacher'
        });
      }
    }

    // Build updates object with only provided fields
    const updates = {};
    if (full_name) updates.full_name = full_name;
    if (phone_number !== undefined) updates.phone_number = phone_number;

    // Handle username and role separately as they require special handling
    // For now, we'll update them directly via SQL since User.update doesn't support them
    const updateFields = [];
    const updateValues = [];

    if (full_name) {
      updateFields.push('full_name = ?');
      updateValues.push(full_name);
    }
    if (username) {
      updateFields.push('username = ?');
      updateValues.push(username);
    }
    if (role) {
      updateFields.push('role = ?');
      updateValues.push(role);
    }
    if (phone_number !== undefined) {
      updateFields.push('phone_number = ?');
      updateValues.push(phone_number);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    updateValues.push(parseInt(userId));

    // Execute update
    const [result] = await db.execute(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get updated user
    const updatedUser = await User.findById(parseInt(userId));

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
};

/**
 * Deactivate user account
 * POST /api/admin/users/:userId/deactivate
 */
exports.deactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId
    if (!userId || isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid user ID is required'
      });
    }

    // Check if user exists
    const user = await User.findById(parseInt(userId));
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Deactivate user
    const success = await User.deactivate(parseInt(userId));

    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to deactivate user'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully',
      data: { userId: parseInt(userId), status: 'inactive' }
    });

  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deactivating user',
      error: error.message
    });
  }
};

/**
 * Activate user account
 * POST /api/admin/users/:userId/activate
 */
exports.activateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId
    if (!userId || isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid user ID is required'
      });
    }

    // Check if user exists
    const user = await User.findById(parseInt(userId));
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Activate user
    const success = await User.activate(parseInt(userId));

    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to activate user'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User activated successfully',
      data: { userId: parseInt(userId), status: 'active' }
    });

  } catch (error) {
    console.error('Activate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error activating user',
      error: error.message
    });
  }
};

/**
 * Bulk create users from CSV file
 * POST /api/admin/users/bulk
 * Body: multipart/form-data with CSV file
 * CSV format: full_name, email, password, role
 */
exports.bulkCreateUsers = async (req, res) => {
  const csv = require('csv-parser');
  const { Readable } = require('stream');

  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required'
      });
    }

    const users = [];
    const errors = [];
    let lineNumber = 1; // Start at 1 for header

    // Parse CSV from buffer
    const stream = Readable.from(req.file.buffer.toString());
    
    // Collect all rows first
    const rows = [];
    await new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (row) => {
          rows.push(row);
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Validate CSV has required columns
    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is empty'
      });
    }

    const firstRow = rows[0];
    const requiredColumns = ['full_name', 'email', 'password', 'role'];
    const missingColumns = requiredColumns.filter(col => !(col in firstRow));
    
    if (missingColumns.length > 0) {
      return res.status(400).json({
        success: false,
        message: `CSV is missing required columns: ${missingColumns.join(', ')}`
      });
    }

    // Process each row
    for (const row of rows) {
      lineNumber++;
      
      const { full_name, email, password, role } = row;

      // Validate required fields
      if (!full_name || !email || !password || !role) {
        errors.push({
          line: lineNumber,
          email: email || 'N/A',
          error: 'Missing required fields (full_name, email, password, role)'
        });
        continue;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push({
          line: lineNumber,
          email: email,
          error: 'Invalid email format'
        });
        continue;
      }

      // Validate password length
      if (password.length < 8) {
        errors.push({
          line: lineNumber,
          email: email,
          error: 'Password must be at least 8 characters'
        });
        continue;
      }

      // Validate role
      const validRoles = ['Student', 'Parent', 'Admin', 'Teacher'];
      if (!validRoles.includes(role)) {
        errors.push({
          line: lineNumber,
          email: email,
          error: `Invalid role. Must be: ${validRoles.join(', ')}`
        });
        continue;
      }

      // Check if email already exists
      const existingUser = await User.usernameExists(email);
      if (existingUser) {
        errors.push({
          line: lineNumber,
          email: email,
          error: 'Email already exists'
        });
        continue;
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      try {
        const newUser = await User.create({
          username: email,
          password: hashedPassword,
          full_name: full_name,
          role: role,
          phone_number: null
        });

        users.push({
          id: newUser.id,
          full_name: full_name,
          email: email,
          role: role
        });
      } catch (createError) {
        errors.push({
          line: lineNumber,
          email: email,
          error: createError.message
        });
      }
    }

    // Return summary
    res.status(200).json({
      success: true,
      message: `Bulk upload completed. ${users.length} users created, ${errors.length} failed`,
      data: {
        successCount: users.length,
        failureCount: errors.length,
        createdUsers: users,
        errors: errors
      }
    });

  } catch (error) {
    console.error('Bulk create users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing CSV file',
      error: error.message
    });
  }
};

/**
 * Export users as CSV
 * GET /api/admin/users/export
 * Query params: role, status, search (same as getUsers)
 */
exports.exportUsers = async (req, res) => {
  try {
    const { role, status, search } = req.query;

    // Build filters object (same as getUsers)
    const filters = {};
    if (role) filters.role = role;
    if (status) filters.status = status;
    if (search) filters.search = search;

    // Get all users without pagination
    const pagination = {
      page: 1,
      limit: 999999 // Get all users
    };

    const result = await User.findAll(filters, pagination);
    const users = result.users;

    // Format data as CSV
    const csvHeaders = 'id,full_name,email,role,status,created_at,last_login\n';
    
    const csvRows = users.map(user => {
      // Format dates
      const createdAt = user.created_at ? new Date(user.created_at).toISOString().split('T')[0] : '';
      const lastLogin = user.last_login ? new Date(user.last_login).toISOString().split('T')[0] : '';
      
      // Escape fields that might contain commas or quotes
      const escapeCsvField = (field) => {
        if (field === null || field === undefined) return '';
        const stringField = String(field);
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
          return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
      };

      return [
        user.id,
        escapeCsvField(user.full_name),
        escapeCsvField(user.username), // username is email
        escapeCsvField(user.role),
        escapeCsvField(user.status || 'active'),
        createdAt,
        lastLogin
      ].join(',');
    }).join('\n');

    const csvContent = csvHeaders + csvRows;

    // Set appropriate response headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="users-export.csv"');
    res.status(200).send(csvContent);

  } catch (error) {
    console.error('Export users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting users',
      error: error.message
    });
  }
};

/**
 * Get all modules with search support
 * GET /api/admin/modules
 * Query params: search
 */
exports.getModules = async (req, res) => {
  try {
    const { search } = req.query;

    let query = 'SELECT id, module_name as name, description, is_locked, created_at FROM modules';
    const params = [];

    // Add search filter if provided
    if (search) {
      query += ' WHERE module_name LIKE ?';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY id ASC';

    const [modules] = await db.execute(query, params);

    // Get content item count for each module
    for (const module of modules) {
      const [countResult] = await db.execute(
        'SELECT COUNT(*) as count FROM content_items WHERE module_id = ?',
        [module.id]
      );
      module.item_count = countResult[0].count;
    }

    res.status(200).json({
      success: true,
      message: 'Modules retrieved successfully',
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
 * Create new module
 * POST /api/admin/modules
 * Body: { name, description, level_requirement }
 */
exports.createModule = async (req, res) => {
  try {
    const { name, description, level_requirement } = req.body;

    // Validation
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Module name is required'
      });
    }

    // Validate level_requirement if provided
    if (level_requirement !== undefined && level_requirement !== null) {
      const levelNum = parseInt(level_requirement);
      if (isNaN(levelNum) || levelNum < 0) {
        return res.status(400).json({
          success: false,
          message: 'Level requirement must be a positive integer'
        });
      }
    }

    // Create module using Module model
    const Module = require('../models/Module');
    const newModule = await Module.create({
      title: name,
      description: description || null
    });

    res.status(201).json({
      success: true,
      message: 'Module created successfully',
      data: {
        id: newModule.module_id,
        name: name,
        description: description || null,
        is_locked: 0,
        item_count: 0
      }
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
 * PUT /api/admin/modules/:moduleId
 * Body: { name, description, level_requirement }
 */
exports.updateModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { name, description, level_requirement } = req.body;

    // Validate moduleId
    if (!moduleId || isNaN(moduleId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid module ID is required'
      });
    }

    // Check if module exists
    const Module = require('../models/Module');
    const existingModule = await Module.findById(parseInt(moduleId));
    if (!existingModule) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    // Validate name if provided
    if (name !== undefined && name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Module name cannot be empty'
      });
    }

    // Validate level_requirement if provided
    if (level_requirement !== undefined && level_requirement !== null) {
      const levelNum = parseInt(level_requirement);
      if (isNaN(levelNum) || levelNum < 0) {
        return res.status(400).json({
          success: false,
          message: 'Level requirement must be a positive integer'
        });
      }
    }

    // Build updates object
    const updates = {};
    if (name) updates.title = name;
    if (description !== undefined) updates.description = description;

    // Check if there are any updates
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    // Update module
    const success = await Module.update(parseInt(moduleId), updates);

    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update module'
      });
    }

    // Get updated module
    const updatedModule = await Module.findById(parseInt(moduleId));

    // Get content item count
    const [countResult] = await db.execute(
      'SELECT COUNT(*) as count FROM content_items WHERE module_id = ?',
      [moduleId]
    );

    res.status(200).json({
      success: true,
      message: 'Module updated successfully',
      data: {
        id: updatedModule.module_id,
        name: updatedModule.title,
        description: updatedModule.description,
        is_locked: updatedModule.is_locked,
        item_count: countResult[0].count
      }
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
 * DELETE /api/admin/modules/:moduleId
 */
exports.deleteModule = async (req, res) => {
  try {
    const { moduleId } = req.params;

    // Validate moduleId
    if (!moduleId || isNaN(moduleId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid module ID is required'
      });
    }

    // Check if module exists
    const Module = require('../models/Module');
    const existingModule = await Module.findById(parseInt(moduleId));
    if (!existingModule) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    // Check for existing content items
    const [contentItems] = await db.execute(
      'SELECT COUNT(*) as count FROM content_items WHERE module_id = ?',
      [moduleId]
    );

    if (contentItems[0].count > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete module: ${contentItems[0].count} content item(s) are associated with this module. Please delete the content items first.`
      });
    }

    // Check for existing student progress
    const [studentProgress] = await db.execute(
      'SELECT COUNT(*) as count FROM student_progress WHERE module_id = ?',
      [moduleId]
    );

    if (studentProgress[0].count > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete module: ${studentProgress[0].count} student progress record(s) are associated with this module. Deleting would result in data loss.`
      });
    }

    // Delete module
    const success = await Module.delete(parseInt(moduleId));

    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete module'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Module deleted successfully',
      data: { moduleId: parseInt(moduleId) }
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

module.exports = exports;

/**
 * Get platform analytics and statistics
 * GET /api/admin/analytics
 */
exports.getAnalytics = async (req, res) => {
  try {
    // 1. Get user counts by role
    const [userCounts] = await db.execute(
      `SELECT 
        role,
        COUNT(*) as count
      FROM users
      GROUP BY role`
    );

    const userCountsByRole = {
      students: 0,
      parents: 0,
      admins: 0,
      total: 0
    };

    userCounts.forEach(row => {
      const count = parseInt(row.count);
      userCountsByRole.total += count;
      
      if (row.role === 'Student') {
        userCountsByRole.students = count;
      } else if (row.role === 'Parent') {
        userCountsByRole.parents = count;
      } else if (row.role === 'Admin' || row.role === 'Teacher') {
        userCountsByRole.admins += count;
      }
    });

    // 2. Get quiz statistics
    const [quizStats] = await db.execute(
      `SELECT 
        COUNT(*) as total_attempts,
        AVG(score_obtained) as average_score,
        SUM(CASE WHEN score_obtained >= 80 THEN 1 ELSE 0 END) as passed_attempts
      FROM score_logs
      WHERE content_type = 'quiz'`
    );

    const quizStatistics = {
      totalAttempts: parseInt(quizStats[0].total_attempts) || 0,
      averageScore: parseFloat(quizStats[0].average_score) || 0,
      passRate: quizStats[0].total_attempts > 0 
        ? (parseInt(quizStats[0].passed_attempts) / parseInt(quizStats[0].total_attempts)) * 100 
        : 0
    };

    // 3. Get badge statistics
    const [badgeStats] = await db.execute(
      `SELECT COUNT(*) as total_badges_earned
      FROM student_badges`
    );

    const badgeStatistics = {
      totalBadgesEarned: parseInt(badgeStats[0].total_badges_earned) || 0
    };

    // 4. Get activity statistics (active users in last 7 days, new registrations in last 30 days)
    const [activityStats] = await db.execute(
      `SELECT 
        COUNT(DISTINCT CASE WHEN last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN id END) as active_users,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_registrations
      FROM users`
    );

    const activityStatistics = {
      activeUsers: parseInt(activityStats[0].active_users) || 0,
      newRegistrations: parseInt(activityStats[0].new_registrations) || 0
    };

    // 5. Get student statistics (average XP, level distribution)
    const [studentStats] = await db.execute(
      `SELECT 
        AVG(total_xp) as average_xp
      FROM student_profiles`
    );

    const [levelDistribution] = await db.execute(
      `SELECT 
        current_level as level,
        COUNT(*) as count
      FROM student_profiles
      GROUP BY current_level
      ORDER BY current_level ASC`
    );

    // 6. Get module completion rates
    const [moduleCompletionRates] = await db.execute(
      `SELECT 
        m.id as module_id,
        m.module_name as module_name,
        COUNT(DISTINCT sp.student_id) as completed_students,
        (SELECT COUNT(*) FROM users WHERE role = 'Student') as total_students
      FROM modules m
      LEFT JOIN student_progress sp ON m.id = sp.module_id AND sp.completed = 1
      GROUP BY m.id, m.module_name
      ORDER BY m.id ASC`
    );

    const moduleCompletionData = moduleCompletionRates.map(row => ({
      moduleId: row.module_id,
      moduleName: row.module_name,
      completionRate: row.total_students > 0 
        ? (parseInt(row.completed_students) / parseInt(row.total_students)) * 100 
        : 0
    }));

    const studentStatistics = {
      averageXP: parseFloat(studentStats[0].average_xp) || 0,
      levelDistribution: levelDistribution.map(row => ({
        level: parseInt(row.level),
        count: parseInt(row.count)
      })),
      moduleCompletionRates: moduleCompletionData
    };

    // Compile all analytics data
    const analyticsData = {
      userCounts: userCountsByRole,
      quizStats: quizStatistics,
      badgeStats: badgeStatistics,
      activityStats: activityStatistics,
      studentStats: studentStatistics
    };

    res.status(200).json({
      success: true,
      message: 'Analytics retrieved successfully',
      data: analyticsData
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
      error: error.message
    });
  }
};

/**
 * Get recent platform activity timeline
 * GET /api/admin/activity
 */
exports.getActivity = async (req, res) => {
  try {
    const activities = [];

    // 1. Get recent quiz completions
    const [quizCompletions] = await db.execute(
      `SELECT 
        sl.id,
        sl.student_id as user_id,
        u.full_name as user_name,
        sl.content_id,
        ci.title as quiz_name,
        sl.score_obtained as score,
        sl.created_at as timestamp,
        'quiz_completion' as type
      FROM score_logs sl
      JOIN users u ON sl.student_id = u.id
      LEFT JOIN content_items ci ON sl.content_id = ci.id
      WHERE sl.content_type = 'quiz'
      ORDER BY sl.created_at DESC
      LIMIT 20`
    );

    quizCompletions.forEach(row => {
      activities.push({
        id: `quiz_${row.id}`,
        type: 'quiz_completion',
        userId: row.user_id,
        userName: row.user_name,
        description: `${row.user_name} completed quiz "${row.quiz_name || 'Unknown Quiz'}" with score ${row.score}%`,
        metadata: {
          quizName: row.quiz_name || 'Unknown Quiz',
          score: row.score
        },
        timestamp: row.timestamp
      });
    });

    // 2. Get recent badge achievements
    const [badgeAchievements] = await db.execute(
      `SELECT 
        sb.id,
        sb.student_id as user_id,
        u.full_name as user_name,
        b.badge_name,
        sb.earned_at as timestamp,
        'badge_earned' as type
      FROM student_badges sb
      JOIN users u ON sb.student_id = u.id
      JOIN badges b ON sb.badge_id = b.id
      ORDER BY sb.earned_at DESC
      LIMIT 20`
    );

    badgeAchievements.forEach(row => {
      activities.push({
        id: `badge_${row.id}`,
        type: 'badge_earned',
        userId: row.user_id,
        userName: row.user_name,
        description: `${row.user_name} earned badge "${row.badge_name}"`,
        metadata: {
          badgeName: row.badge_name
        },
        timestamp: row.timestamp
      });
    });

    // 3. Get recent user registrations
    const [registrations] = await db.execute(
      `SELECT 
        id,
        id as user_id,
        full_name as user_name,
        role,
        created_at as timestamp,
        'registration' as type
      FROM users
      ORDER BY created_at DESC
      LIMIT 20`
    );

    registrations.forEach(row => {
      activities.push({
        id: `registration_${row.id}`,
        type: 'registration',
        userId: row.user_id,
        userName: row.user_name,
        description: `${row.user_name} registered as ${row.role}`,
        metadata: {
          role: row.role
        },
        timestamp: row.timestamp
      });
    });

    // 4. Get recent level ups (by checking student_profiles history or XP changes)
    // Note: This assumes we track level changes. If not tracked, we can infer from current levels
    // For now, we'll query students who recently gained XP and check if they leveled up
    const [levelUps] = await db.execute(
      `SELECT 
        sp.student_id as user_id,
        u.full_name as user_name,
        sp.current_level as level,
        sp.updated_at as timestamp,
        'level_up' as type
      FROM student_profiles sp
      JOIN users u ON sp.student_id = u.id
      WHERE sp.updated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      ORDER BY sp.updated_at DESC
      LIMIT 20`
    );

    levelUps.forEach(row => {
      activities.push({
        id: `levelup_${row.user_id}_${row.level}`,
        type: 'level_up',
        userId: row.user_id,
        userName: row.user_name,
        description: `${row.user_name} reached level ${row.level}`,
        metadata: {
          level: row.level
        },
        timestamp: row.timestamp
      });
    });

    // Sort all activities by timestamp descending and take top 20
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const recentActivities = activities.slice(0, 20);

    res.status(200).json({
      success: true,
      message: 'Activity timeline retrieved successfully',
      data: {
        activities: recentActivities
      }
    });

  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activity timeline',
      error: error.message
    });
  }
};

/**
 * Export analytics data as CSV
 * GET /api/admin/analytics/export
 */
exports.exportAnalytics = async (req, res) => {
  try {
    // Reuse the getAnalytics logic to get all analytics data
    // 1. Get user counts by role
    const [userCounts] = await db.execute(
      `SELECT 
        role,
        COUNT(*) as count
      FROM users
      GROUP BY role`
    );

    const userCountsByRole = {
      students: 0,
      parents: 0,
      admins: 0,
      total: 0
    };

    userCounts.forEach(row => {
      const count = parseInt(row.count);
      userCountsByRole.total += count;
      
      if (row.role === 'Student') {
        userCountsByRole.students = count;
      } else if (row.role === 'Parent') {
        userCountsByRole.parents = count;
      } else if (row.role === 'Admin' || row.role === 'Teacher') {
        userCountsByRole.admins += count;
      }
    });

    // 2. Get quiz statistics
    const [quizStats] = await db.execute(
      `SELECT 
        COUNT(*) as total_attempts,
        AVG(score_obtained) as average_score,
        SUM(CASE WHEN score_obtained >= 80 THEN 1 ELSE 0 END) as passed_attempts
      FROM score_logs
      WHERE content_type = 'quiz'`
    );

    const quizStatistics = {
      totalAttempts: parseInt(quizStats[0].total_attempts) || 0,
      averageScore: parseFloat(quizStats[0].average_score) || 0,
      passRate: quizStats[0].total_attempts > 0 
        ? (parseInt(quizStats[0].passed_attempts) / parseInt(quizStats[0].total_attempts)) * 100 
        : 0
    };

    // 3. Get badge statistics
    const [badgeStats] = await db.execute(
      `SELECT COUNT(*) as total_badges_earned
      FROM student_badges`
    );

    // 4. Get activity statistics
    const [activityStats] = await db.execute(
      `SELECT 
        COUNT(DISTINCT CASE WHEN last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN id END) as active_users,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_registrations
      FROM users`
    );

    // 5. Get student statistics
    const [studentStats] = await db.execute(
      `SELECT 
        AVG(total_xp) as average_xp
      FROM student_profiles`
    );

    // Format data as CSV
    const csvRows = [];
    csvRows.push('metric,value');
    
    // User counts
    csvRows.push(`Total Students,${userCountsByRole.students}`);
    csvRows.push(`Total Parents,${userCountsByRole.parents}`);
    csvRows.push(`Total Admins,${userCountsByRole.admins}`);
    csvRows.push(`Total Users,${userCountsByRole.total}`);
    
    // Quiz statistics
    csvRows.push(`Total Quiz Attempts,${quizStatistics.totalAttempts}`);
    csvRows.push(`Average Quiz Score,${quizStatistics.averageScore.toFixed(2)}%`);
    csvRows.push(`Quiz Pass Rate,${quizStatistics.passRate.toFixed(2)}%`);
    
    // Badge statistics
    csvRows.push(`Total Badges Earned,${badgeStats[0].total_badges_earned || 0}`);
    
    // Activity statistics
    csvRows.push(`Active Users (Last 7 Days),${activityStats[0].active_users || 0}`);
    csvRows.push(`New Registrations (Last 30 Days),${activityStats[0].new_registrations || 0}`);
    
    // Student statistics
    csvRows.push(`Average Student XP,${parseFloat(studentStats[0].average_xp || 0).toFixed(2)}`);

    const csvContent = csvRows.join('\n');

    // Set appropriate response headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="analytics-export.csv"');
    res.status(200).send(csvContent);

  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting analytics',
      error: error.message
    });
  }
};
