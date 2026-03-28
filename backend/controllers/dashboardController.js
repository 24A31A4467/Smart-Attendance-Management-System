/**
 * Dashboard Controller
 * Provides analytics and statistics for admin/manager dashboards
 */

const Attendance = require('../models/Attendance');
const User = require('../models/User');

// ─── GET /api/dashboard/stats ─────────────────────────────────────────────────
// Returns today's stats: present, absent, late counts
exports.getTodayStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Total active employees
    const totalEmployees = await User.countDocuments({
      isActive: true,
      role: { $in: ['employee', 'manager'] }
    });

    // Today's attendance records
    const todayRecords = await Attendance.find({
      date: { $gte: today, $lt: tomorrow }
    }).populate('user', 'name department');

    const presentCount = todayRecords.filter(r => ['present', 'late'].includes(r.status)).length;
    const lateCount = todayRecords.filter(r => r.status === 'late').length;
    const checkedOutCount = todayRecords.filter(r => r.checkOutTime).length;

    // Absent = total employees - those who have any record today
    const absentCount = Math.max(0, totalEmployees - presentCount);

    // Recent check-ins (last 10)
    const recentCheckIns = await Attendance.find({
      date: { $gte: today, $lt: tomorrow },
      checkInTime: { $ne: null }
    })
      .sort({ checkInTime: -1 })
      .limit(10)
      .populate('user', 'name department avatar');

    res.json({
      success: true,
      stats: {
        totalEmployees,
        presentCount,
        absentCount,
        lateCount,
        checkedOutCount,
        attendanceRate: totalEmployees > 0 ? Math.round((presentCount / totalEmployees) * 100) : 0
      },
      recentCheckIns
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/dashboard/weekly ────────────────────────────────────────────────
// Returns attendance trends for the past 7 days
exports.getWeeklyStats = async (req, res, next) => {
  try {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      days.push(d);
    }

    const weeklyData = await Promise.all(
      days.map(async (day) => {
        const nextDay = new Date(day);
        nextDay.setDate(nextDay.getDate() + 1);

        const records = await Attendance.find({
          date: { $gte: day, $lt: nextDay }
        });

        return {
          date: day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          present: records.filter(r => r.status === 'present').length,
          late: records.filter(r => r.status === 'late').length,
          absent: records.filter(r => r.status === 'absent').length
        };
      })
    );

    res.json({ success: true, weeklyData });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/dashboard/department-stats ──────────────────────────────────────
exports.getDepartmentStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const departments = await User.distinct('department', { isActive: true });

    const deptStats = await Promise.all(
      departments.filter(Boolean).map(async (dept) => {
        const deptUsers = await User.find({ department: dept, isActive: true, role: { $ne: 'admin' } });
        const userIds = deptUsers.map(u => u._id);

        const todayAttendance = await Attendance.find({
          user: { $in: userIds },
          date: { $gte: today, $lt: tomorrow },
          status: { $in: ['present', 'late'] }
        });

        return {
          department: dept,
          total: deptUsers.length,
          present: todayAttendance.length,
          rate: deptUsers.length > 0
            ? Math.round((todayAttendance.length / deptUsers.length) * 100)
            : 0
        };
      })
    );

    res.json({ success: true, deptStats });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/dashboard/top-absentees ────────────────────────────────────────
exports.getTopAbsentees = async (req, res, next) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const absenteeData = await Attendance.aggregate([
      { $match: { date: { $gte: startOfMonth }, status: 'absent' } },
      { $group: { _id: '$user', absentDays: { $sum: 1 } } },
      { $sort: { absentDays: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          name: '$user.name',
          department: '$user.department',
          absentDays: 1
        }
      }
    ]);

    res.json({ success: true, absenteeData });
  } catch (error) {
    next(error);
  }
};
