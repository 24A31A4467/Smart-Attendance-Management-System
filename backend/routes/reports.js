const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { exportAttendance, getMonthlySummary } = require('../controllers/reportController');

router.use(protect, authorize('admin', 'manager'));
router.get('/export', exportAttendance);
router.get('/monthly-summary', getMonthlySummary);

module.exports = router;
