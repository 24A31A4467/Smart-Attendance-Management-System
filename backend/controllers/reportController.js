/**
 * Reports Controller
 * Generate and download Excel/CSV attendance reports
 */

const XLSX = require('xlsx');
const Attendance = require('../models/Attendance');
const User = require('../models/User');

// ─── GET /api/reports/export ──────────────────────────────────────────────────
// Export attendance records as Excel file
exports.exportAttendance = async (req, res, next) => {
  try {
    const { startDate, endDate, department, format = 'xlsx' } = req.query;

    let userQuery = { isActive: true, role: { $ne: 'admin' } };
    if (department) userQuery.department = department;

    const users = await User.find(userQuery).select('name email department employeeId');
    const userIds = users.map(u => u._id);

    // Build date filter
    let dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59);
      dateFilter.$lte = end;
    }

    const attendanceQuery = { user: { $in: userIds } };
    if (Object.keys(dateFilter).length) attendanceQuery.date = dateFilter;

    const records = await Attendance.find(attendanceQuery)
      .populate('user', 'name email department employeeId')
      .sort({ date: 1, 'user.name': 1 });

    // Build Excel rows
    const rows = records.map(r => ({
      'Employee ID': r.user?.employeeId || 'N/A',
      'Name': r.user?.name || 'Unknown',
      'Department': r.user?.department || 'N/A',
      'Date': r.date ? new Date(r.date).toLocaleDateString() : 'N/A',
      'Check-In': r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString() : 'Not checked in',
      'Check-Out': r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString() : 'Not checked out',
      'Hours Worked': r.totalHoursWorked || 0,
      'Status': r.status,
      'Late By (mins)': r.lateByMinutes || 0,
      'Verification': r.verificationMethod,
      'Inside Geofence': r.isInsideGeofence ? 'Yes' : 'No',
      'GPS Lat': r.checkInLocation?.latitude || '',
      'GPS Lon': r.checkInLocation?.longitude || '',
      'Notes': r.notes || ''
    }));

    if (format === 'csv') {
      // Generate CSV
      const headers = Object.keys(rows[0] || {});
      const csvRows = [
        headers.join(','),
        ...rows.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
      ];
      const csv = csvRows.join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=attendance_report_${Date.now()}.csv`);
      return res.send(csv);
    }

    // Generate Excel
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');

    // Auto-size columns
    const colWidths = Object.keys(rows[0] || {}).map(key => ({
      wch: Math.max(key.length, 15)
    }));
    ws['!cols'] = colWidths;

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_report_${Date.now()}.xlsx`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/reports/monthly-summary ────────────────────────────────────────
exports.getMonthlySummary = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const targetMonth = parseInt(month) || new Date().getMonth() + 1;
    const targetYear = parseInt(year) || new Date().getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const summary = await Attendance.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: '$user',
          totalDays: { $sum: 1 },
          presentDays: { $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] } },
          lateDays: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
          absentDays: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
          totalHours: { $sum: '$totalHoursWorked' }
        }
      },
      {
        $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' }
      },
      { $unwind: '$user' },
      {
        $project: {
          name: '$user.name',
          department: '$user.department',
          employeeId: '$user.employeeId',
          totalDays: 1,
          presentDays: 1,
          lateDays: 1,
          absentDays: 1,
          totalHours: { $round: ['$totalHours', 1] },
          attendanceRate: {
            $round: [{ $multiply: [{ $divide: ['$presentDays', '$totalDays'] }, 100] }, 0]
          }
        }
      },
      { $sort: { 'name': 1 } }
    ]);

    res.json({ success: true, summary, month: targetMonth, year: targetYear });
  } catch (error) {
    next(error);
  }
};
