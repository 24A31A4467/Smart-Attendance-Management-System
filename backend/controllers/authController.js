/**
 * Auth Controller
 * Handles: Register, Login, Get Profile, Update Profile, Change Password
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─── Helper: Generate JWT Token ───────────────────────────────────────────────
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// ─── Helper: Send token response ─────────────────────────────────────────────
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  // Remove password from response
  const userObj = user.toObject();
  delete userObj.password;

  res.status(statusCode).json({
    success: true,
    token,
    user: userObj
  });
};

// ─── POST /api/auth/register ──────────────────────────────────────────────────
// Creates a new user account
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, department, employeeId, phone } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered. Try logging in.'
      });
    }

    // Check if employeeId already exists
    if (employeeId) {
      const existingId = await User.findOne({ employeeId });
      if (existingId) {
        return res.status(400).json({
          success: false,
          message: 'Employee ID already taken.'
        });
      }
    }

    // Only admin can create admin accounts (security measure)
    const assignedRole = role === 'admin' ? 'employee' : (role || 'employee');

    // Create user (password is hashed by the model's pre-save hook)
    const user = await User.create({
      name,
      email,
      password,
      role: assignedRole,
      department,
      employeeId,
      phone
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
// Authenticates user with email + password
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.'
      });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Check email and password.'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account deactivated. Contact your administrator.'
      });
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Check email and password.'
      });
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
// Returns the currently logged-in user's profile
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// ─── PUT /api/auth/update-profile ─────────────────────────────────────────────
// Updates basic profile info (not password)
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, department } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, department },
      { new: true, runValidators: true }
    );

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// ─── PUT /api/auth/change-password ────────────────────────────────────────────
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.'
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/auth/my-face-descriptor ────────────────────────────────────────
// Returns the stored face descriptor for the logged-in user
// Used by attendance page to compare with live face
exports.getMyFaceDescriptor = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+faceDescriptor');
    if (!user.faceDescriptor || user.faceDescriptor.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No face registered. Please register your face in Profile first.'
      });
    }
    res.json({ success: true, faceDescriptor: user.faceDescriptor });
  } catch (error) {
    next(error);
  }
};
// Saves face descriptor (embedding array) for face recognition
exports.saveFaceDescriptor = async (req, res, next) => {
  try {
    const { faceDescriptor } = req.body;

    if (!faceDescriptor || !Array.isArray(faceDescriptor)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid face descriptor data.'
      });
    }

    await User.findByIdAndUpdate(req.user._id, {
      faceDescriptor,
      faceRegistered: true
    });

    res.json({ success: true, message: 'Face registered successfully!' });
  } catch (error) {
    next(error);
  }
};