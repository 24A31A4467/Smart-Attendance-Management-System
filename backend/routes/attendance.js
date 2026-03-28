const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  checkIn, checkOut, getTodayAttendance, getMyHistory,
  getAllAttendance, manualMark, getAttendanceSummary
} = require('../controllers/attendanceController');

router.use(protect);

router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.get('/today', getTodayAttendance);
router.get('/my-history', getMyHistory);
router.get('/summary', getAttendanceSummary);
router.get('/all', authorize('admin', 'manager'), getAllAttendance);
router.post('/manual', authorize('admin', 'manager'), manualMark);

module.exports = router;
