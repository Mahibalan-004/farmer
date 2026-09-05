const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { findUserByEmail, findUserById, createUser } = require('../models/userModel');

// Allowed roles for public registration
const ALLOWED_ROLES = ['Farmer', 'Consumer', 'Retailer', 'Restaurant', 'Bulk Buyer'];

// Generate JWT Token helper
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'agrif2c_secret_key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { full_name, email, phone, password, role } = req.body;

    // 1. Basic validation
    if (!full_name || !email || !phone || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields: full_name, email, phone, password, role'
      });
    }

    // 2. Role validation (Disallow public Admin registration)
    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Allowed roles are: ${ALLOWED_ROLES.join(', ')}`
      });
    }

    // 3. Email uniqueness check
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // 4. Hash password with bcryptjs
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Save user in MySQL database
    const userId = await createUser({
      full_name,
      email,
      phone,
      password: hashedPassword,
      role
    });

    // 6. Send successful JSON response directly without post-insert query risks
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: userId,
        full_name,
        email,
        phone,
        role
      }
    });

  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration'
    });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validation
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both email and password' });
    }

    // 2. Find user by email
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // 3. Verify password
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // 4. Generate JWT Token
    const token = generateToken(user);

    // 5. Return success response
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login', error: error.message });
  }
};

// @desc    Get logged in user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error fetching user profile', error: error.message });
  }
};

module.exports = {
  register,
  login,
  getMe
};
