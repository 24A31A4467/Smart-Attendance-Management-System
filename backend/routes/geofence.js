const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getGeofences, getActiveGeofence, createGeofence, updateGeofence, deleteGeofence
} = require('../controllers/geofenceController');

router.use(protect);
router.get('/active', getActiveGeofence);
router.get('/', authorize('admin', 'manager'), getGeofences);
router.post('/', authorize('admin'), createGeofence);
router.put('/:id', authorize('admin'), updateGeofence);
router.delete('/:id', authorize('admin'), deleteGeofence);

module.exports = router;
