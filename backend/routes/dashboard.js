const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getTodayStats, getWeeklyStats, getDepartmentStats, getTopAbsentees } = require('../controllers/dashboardController');

router.use(protect, authorize('admin', 'manager'));
router.get('/today-stats', getTodayStats);
router.get('/weekly-stats', getWeeklyStats);
router.get('/department-stats', getDepartmentStats);
router.get('/top-absentees', getTopAbsentees);

module.exports = router;
