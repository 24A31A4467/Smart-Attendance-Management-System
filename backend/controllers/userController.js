/**
 * User Controller
 * Admin: Create, Read, Update, Delete users, manage roles
 */

const User = require('../models/User');
const Attendance = require('../models/Attendance');

// ─── GET /api/users ───────────────────────────────────────────────────────────
exports.getUsers = async (req, res, next) => {
  try {
    const { role, department, isActive, search, page = 1, limit = 20 } = req.query;
    
    let query = {};
    if (role) query.role = role;
    if (department) query.department = department;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password -faceDescriptor -webAuthnCredentials')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, total, users });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/users/:id ───────────────────────────────────────────────────────
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password -faceDescriptor');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/users (Admin: create user) ────────────────────────────────────
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, department, employeeId, phone, workingHours } = req.body;

    const existing = await User.findOne({ $or: [{ email }, { employeeId: employeeId || null }] });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: existing.email === email ? 'Email already exists.' : 'Employee ID already exists.'
      });
    }

    const user = await User.create({
      name, email, password, role, department, employeeId, phone, workingHours
    });

    const userObj = user.toObject();
    delete userObj.password;

    res.status(201).json({ success: true, message: 'User created successfully.', user: userObj });
  } catch (error) {
    next(error);
  }
};

// ─── PUT /api/users/:id ───────────────────────────────────────────────────────
exports.updateUser = async (req, res, next) => {
  try {
    const { name, email, role, department, employeeId, phone, isActive, workingHours } = req.body;

    // Don't allow changing password via this route
    const updateData = { name, email, role, department, employeeId, phone, isActive, workingHours };

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    }).select('-password -faceDescriptor');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({ success: true, message: 'User updated successfully.', user });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/users/:id ────────────────────────────────────────────────────
exports.deleteUser = async (req, res, next) => {
  try {
    // Prevent deleting yourself
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account.'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Soft delete: deactivate instead of removing
    user.isActive = false;
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'User deactivated successfully.' });
  } catch (error) {
    next(error);
  }
};

// ─── PUT /api/users/:id/reset-password (Admin) ───────────────────────────────
exports.resetUserPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully.' });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/users/departments ───────────────────────────────────────────────
exports.getDepartments = async (req, res, next) => {
  try {
    const departments = await User.distinct('department', { isActive: true });
    res.json({ success: true, departments: departments.filter(Boolean) });
  } catch (error) {
    next(error);
  }
};
