/**
 * Geofence Model
 * Stores the allowed location(s) where employees can mark attendance.
 * Admin can create multiple geofences for different offices/campuses.
 */

const mongoose = require('mongoose');

const geofenceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Geofence name is required'],
      trim: true,
      maxlength: 100
    },
    description: {
      type: String,
      trim: true,
      maxlength: 300
    },
    
    // ── Center Point of the Geofence ──────────────────────────
    center: {
      latitude: {
        type: Number,
        required: [true, 'Latitude is required'],
        min: -90,
        max: 90
      },
      longitude: {
        type: Number,
        required: [true, 'Longitude is required'],
        min: -180,
        max: 180
      }
    },
    
    // ── Allowed Radius (in meters) ────────────────────────────
    radius: {
      type: Number,
      required: [true, 'Radius is required'],
      min: [10, 'Minimum radius is 10 meters'],
      max: [10000, 'Maximum radius is 10km'],
      default: 100
    },
    
    // ── Working Hours for this location ───────────────────────
    workingHours: {
      startTime: { type: String, default: '09:00' },
      endTime: { type: String, default: '17:00' },
      lateThresholdMinutes: { type: Number, default: 15 }, // Grace period
      workDays: {
        type: [String],
        default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      }
    },
    
    // ── Who This Applies To ───────────────────────────────────
    appliesTo: {
      type: String,
      enum: ['all', 'department', 'specific'],
      default: 'all'
    },
    departments: [String], // If appliesTo === 'department'
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // If specific
    
    isActive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

geofenceSchema.index({ isActive: 1 });

module.exports = mongoose.model('Geofence', geofenceSchema);
