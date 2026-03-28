/**
 * Cron Jobs
 * Auto-checkout employees who forgot to check out
 * Marks absent for employees who didn't check in
 */

const cron = require('node-cron');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Geofence = require('../models/Geofence');

const startAutoCronJobs = () => {
  // ── Auto Checkout at 11:59 PM every day ────────────────────────
  cron.schedule('59 23 * * *', async () => {
    console.log('⏰ Running auto-checkout job...');
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Find records that have check-in but no check-out
      const uncheckedOut = await Attendance.find({
        date: { $gte: today, $lt: tomorrow },
        checkInTime: { $ne: null },
        checkOutTime: null
      });

      const geofence = await Geofence.findOne({ isActive: true });
      const endTime = geofence?.workingHours?.endTime || '17:00';
      const [endHour, endMin] = endTime.split(':').map(Number);

      for (const record of uncheckedOut) {
        const autoCheckout = new Date(today);
        autoCheckout.setHours(endHour, endMin, 0, 0);

        record.checkOutTime = autoCheckout;
        record.notes = (record.notes || '') + ' [Auto checked-out at end of day]';
        record.verificationMethod = 'auto';
        await record.save();
      }

      console.log(`✅ Auto-checked out ${uncheckedOut.length} employees`);
    } catch (err) {
      console.error('Auto-checkout error:', err);
    }
  });

  // ── Mark Absent at start of day for employees with no record ───
  // Runs at 10 AM - gives employees time to check in
  cron.schedule('0 10 * * 1-5', async () => {
    console.log('📋 Running absent marking job...');
    // This is informational - actual absent marking is done in reports
    // You can extend this to create absent records automatically
  });
};

module.exports = { startAutoCronJobs };
