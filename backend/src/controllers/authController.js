// src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // NEW
const User = require('../models/User');

/**
 * Generate JWT Token
 * @param {number} userId 
 * @param {string} role 
 * @returns {string} JWT token
 */
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role: role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

/**
 * Register a new user
 * POST /api/auth/register
 */
exports.register = async (req, res) => {
  try {
    const { username, password, full_name, role, phone_number } = req.body;

    // Validation
    if (!username || !password || !full_name || !role) {
      return res.status(400).json({
        success: false,
        message: 'Username, password, full_name, and role are required'
      });
    }

    // Validate role
    const validRoles = ['student', 'teacher', 'admin', 'parent'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be: student, teacher, admin, or parent'
      });
    }

    // Check if username already exists
    const existingUser = await User.usernameExists(username);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Username already exists'
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

    // Generate token
    const token = generateToken(newUser.id, newUser.role);

    // Return success with token
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token: token, // NEW
      data: {
        id: newUser.id,
        username: newUser.username,
        full_name: newUser.full_name,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Find user
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user.id, user.role);

    // Return user data with token
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token: token, // NEW
      data: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        phone_number: user.phone_number
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 * Protected route (requires auth middleware)
 */
exports.getMe = async (req, res) => {
  try {
    // req.user is set by auth middleware
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};