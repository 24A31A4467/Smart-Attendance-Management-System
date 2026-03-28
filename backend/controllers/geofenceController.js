/**
 * Geofence Controller
 * Admin can create/edit geofence zones that define where attendance can be marked.
 */

const Geofence = require('../models/Geofence');

// ─── GET /api/geofence ────────────────────────────────────────────────────────
exports.getGeofences = async (req, res, next) => {
  try {
    const geofences = await Geofence.find()
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, geofences });
  } catch (error) { next(error); }
};

// ─── GET /api/geofence/active ─────────────────────────────────────────────────
exports.getActiveGeofence = async (req, res, next) => {
  try {
    const geofence = await Geofence.findOne({ isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, geofence });
  } catch (error) { next(error); }
};

// ─── POST /api/geofence ───────────────────────────────────────────────────────
exports.createGeofence = async (req, res, next) => {
  try {
    const { name, description, center, radius, workingHours, appliesTo, departments } = req.body;

    const geofence = await Geofence.create({
      name, description, center, radius, workingHours, appliesTo, departments,
      createdBy: req.user._id
    });

    res.status(201).json({ success: true, message: 'Geofence created!', geofence });
  } catch (error) { next(error); }
};

// ─── PUT /api/geofence/:id ────────────────────────────────────────────────────
exports.updateGeofence = async (req, res, next) => {
  try {
    const geofence = await Geofence.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!geofence) return res.status(404).json({ success: false, message: 'Geofence not found.' });
    res.json({ success: true, message: 'Geofence updated!', geofence });
  } catch (error) { next(error); }
};

// ─── DELETE /api/geofence/:id ─────────────────────────────────────────────────
exports.deleteGeofence = async (req, res, next) => {
  try {
    await Geofence.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Geofence deleted.' });
  } catch (error) { next(error); }
};
