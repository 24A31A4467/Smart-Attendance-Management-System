/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches the user to req.user
 * Used to protect API routes that require login.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─── Protect Route: Verify JWT Token ─────────────────────────────────────────
const protect = async (req, res, next) => {
  try {
    let token;

    // Extract token from Authorization header: "Bearer <token>"
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided. Please log in.'
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user in database (token might be valid but user deleted)
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists. Please log in again.'
      });
    }

    // Check if user is still active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Contact admin.'
      });
    }

    // Attach user to request for use in route handlers
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid token. Please log in again.'
    });
  }
};

// ─── Role-Based Authorization ─────────────────────────────────────────────────
// Usage: authorize('admin') or authorize('admin', 'manager')
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
