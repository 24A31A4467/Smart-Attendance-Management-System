/**
 * Attendance Controller
 * Handles: Check-in, Check-out, Get Attendance History, Admin Views
 */

const Attendance = require('../models/Attendance');
const Geofence = require('../models/Geofence');
const User = require('../models/User');

// ─── Helper: Calculate distance between two GPS coordinates (Haversine formula) ─
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
};

// ─── Helper: Check if time is late ────────────────────────────────────────────
const checkIfLate = (checkInTime, workStartTime, lateThresholdMinutes = 15) => {
  const [startHour, startMin] = workStartTime.split(':').map(Number);
  const expectedStart = new Date(checkInTime);
  expectedStart.setHours(startHour, startMin + lateThresholdMinutes, 0, 0);
  
  const isLate = checkInTime > expectedStart;
  const lateByMs = isLate ? checkInTime - expectedStart : 0;
  const lateByMinutes = Math.floor(lateByMs / (1000 * 60));
  
  return { isLate, lateByMinutes };
};

// ─── POST /api/attendance/check-in ───────────────────────────────────────────
exports.checkIn = async (req, res, next) => {
  try {
    const { latitude, longitude, accuracy, verificationMethod, faceMatchScore } = req.body;
    const userId = req.user._id;

    // ── 1. Validate GPS coordinates ─────────────────────────────
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'GPS coordinates are required. Please enable location access.'
      });
    }

    // ── 2. Anti-spoofing: Check GPS accuracy ─────────────────────
    // Very high accuracy (< 5m) with low-end devices is suspicious
    if (accuracy && accuracy < 3 && verificationMethod !== 'manual') {
      // Flag but don't block - just mark as suspicious
      console.warn(`Suspicious GPS accuracy: ${accuracy}m for user ${userId}`);
    }

    // ── 3. Check if already checked in today ─────────────────────
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingRecord = await Attendance.findOne({
      user: userId,
      date: { $gte: today, $lt: tomorrow }
    });

    if (existingRecord && existingRecord.checkInTime) {
      return res.status(400).json({
        success: false,
        message: 'You have already checked in today.',
        attendance: existingRecord
      });
    }

    // ── 4. Find applicable geofence ──────────────────────────────
    const geofence = await Geofence.findOne({ isActive: true })
      .sort({ createdAt: -1 });

    let isInsideGeofence = false;
    let distanceFromGeofence = null;
    let isLate = false;
    let lateByMinutes = 0;

    if (geofence) {
      distanceFromGeofence = calculateDistance(
        latitude, longitude,
        geofence.center.latitude, geofence.center.longitude
      );
      isInsideGeofence = distanceFromGeofence <= geofence.radius;

      if (!isInsideGeofence) {
        return res.status(400).json({
          success: false,
          message: `You are outside the allowed area. Distance: ${Math.round(distanceFromGeofence)}m (allowed: ${geofence.radius}m)`,
          distance: Math.round(distanceFromGeofence),
          radius: geofence.radius
        });
      }

      // Check if late
      const lateCheck = checkIfLate(
        new Date(),
        geofence.workingHours.startTime,
        geofence.workingHours.lateThresholdMinutes
      );
      isLate = lateCheck.isLate;
      lateByMinutes = lateCheck.lateByMinutes;
    } else {
      // No geofence configured - allow check-in from anywhere
      isInsideGeofence = true;
    }

    // ── 5. Create or update attendance record ────────────────────
    const checkInTime = new Date();
    const attendanceData = {
      user: userId,
      date: today,
      checkInTime,
      checkInLocation: { latitude, longitude, accuracy },
      verificationMethod: verificationMethod || 'manual',
      faceMatchScore: faceMatchScore || null,
      isInsideGeofence,
      distanceFromGeofence: distanceFromGeofence ? Math.round(distanceFromGeofence) : null,
      isLate,
      lateByMinutes,
      status: isLate ? 'late' : 'present'
    };

    let attendance;
    if (existingRecord) {
      attendance = await Attendance.findByIdAndUpdate(existingRecord._id, attendanceData, { new: true });
    } else {
      attendance = await Attendance.create(attendanceData);
    }

    res.status(201).json({
      success: true,
      message: isLate
        ? `Checked in successfully! You are ${lateByMinutes} minute(s) late.`
        : 'Checked in successfully! Have a great day!',
      attendance
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/attendance/check-out ──────────────────────────────────────────
exports.checkOut = async (req, res, next) => {
  try {
    const { latitude, longitude, accuracy } = req.body;
    const userId = req.user._id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find today's attendance
    const attendance = await Attendance.findOne({
      user: userId,
      date: { $gte: today, $lt: tomorrow }
    });

    if (!attendance || !attendance.checkInTime) {
      return res.status(400).json({
        success: false,
        message: 'No check-in found for today. Please check in first.'
      });
    }

    if (attendance.checkOutTime) {
      return res.status(400).json({
        success: false,
        message: 'You have already checked out today.'
      });
    }

    // Update check-out
    attendance.checkOutTime = new Date();
    if (latitude && longitude) {
      attendance.checkOutLocation = { latitude, longitude, accuracy };
    }

    // Calculate hours worked (pre-save hook handles this)
    await attendance.save();

    res.json({
      success: true,
      message: `Checked out successfully! Total time: ${attendance.durationString}`,
      attendance
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/attendance/today ────────────────────────────────────────────────
exports.getTodayAttendance = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await Attendance.findOne({
      user: req.user._id,
      date: { $gte: today, $lt: tomorrow }
    });

    res.json({ success: true, attendance });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/attendance/my-history ──────────────────────────────────────────
exports.getMyHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 30, month, year } = req.query;

    let query = { user: req.user._id };

    // Filter by month/year if provided
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const total = await Attendance.countDocuments(query);
    const records = await Attendance.find(query)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('markedBy', 'name');

    res.json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      records
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/attendance/all (Admin/Manager) ──────────────────────────────────
exports.getAllAttendance = async (req, res, next) => {
  try {
    const { date, userId, department, status, page = 1, limit = 50 } = req.query;

    let query = {};

    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);
      query.date = { $gte: d, $lt: nextDay };
    }

    if (userId) query.user = userId;
    if (status) query.status = status;

    // If filtering by department, first find users in that department
    if (department) {
      const deptUsers = await User.find({ department }).select('_id');
      query.user = { $in: deptUsers.map(u => u._id) };
    }

    const total = await Attendance.countDocuments(query);
    const records = await Attendance.find(query)
      .sort({ date: -1, checkInTime: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('user', 'name email department role employeeId avatar')
      .populate('markedBy', 'name');

    res.json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      records
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/attendance/manual (Admin) ─────────────────────────────────────
// Admin can manually mark attendance for any user
exports.manualMark = async (req, res, next) => {
  try {
    const { userId, date, status, checkInTime, checkOutTime, notes } = req.body;

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const existing = await Attendance.findOne({
      user: userId,
      date: { $gte: targetDate, $lt: nextDay }
    });

    const data = {
      user: userId,
      date: targetDate,
      status,
      checkInTime: checkInTime ? new Date(checkInTime) : null,
      checkOutTime: checkOutTime ? new Date(checkOutTime) : null,
      notes,
      verificationMethod: 'manual',
      markedBy: req.user._id
    };

    let attendance;
    if (existing) {
      attendance = await Attendance.findByIdAndUpdate(existing._id, data, { new: true });
    } else {
      attendance = await Attendance.create(data);
    }

    res.json({ success: true, message: 'Attendance marked successfully.', attendance });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/attendance/summary ─────────────────────────────────────────────
exports.getAttendanceSummary = async (req, res, next) => {
  try {
    const { userId, month, year } = req.query;
    const targetUserId = userId || req.user._id;
    
    const targetMonth = parseInt(month) || new Date().getMonth() + 1;
    const targetYear = parseInt(year) || new Date().getFullYear();
    
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const records = await Attendance.find({
      user: targetUserId,
      date: { $gte: startDate, $lte: endDate }
    });

    const summary = {
      total: records.length,
      present: records.filter(r => r.status === 'present').length,
      absent: records.filter(r => r.status === 'absent').length,
      late: records.filter(r => r.status === 'late').length,
      halfDay: records.filter(r => r.status === 'half-day').length,
      onLeave: records.filter(r => r.status === 'on-leave').length,
      totalHoursWorked: records.reduce((sum, r) => sum + (r.totalHoursWorked || 0), 0).toFixed(1),
      attendanceRate: records.length > 0
        ? Math.round((records.filter(r => ['present', 'late'].includes(r.status)).length / records.length) * 100)
        : 0
    };

    res.json({ success: true, summary, records });
  } catch (error) {
    next(error);
  }
};
