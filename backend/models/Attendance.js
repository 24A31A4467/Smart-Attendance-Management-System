/**
 * Attendance Model
 * Records every check-in and check-out with GPS coordinates,
 * verification method, and status.
 */

const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    // ── Who ──────────────────────────────────────────────────
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required']
    },
    
    // ── When ─────────────────────────────────────────────────
    date: {
      type: Date,
      required: true,
      default: () => {
        // Store just the date (midnight UTC) for easy day-based queries
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
      }
    },
    checkInTime: {
      type: Date,
      default: null
    },
    checkOutTime: {
      type: Date,
      default: null
    },
    
    // ── Where ────────────────────────────────────────────────
    checkInLocation: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      accuracy: { type: Number, default: null }, // GPS accuracy in meters
      address: { type: String, default: null }    // Reverse-geocoded address
    },
    checkOutLocation: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      accuracy: { type: Number, default: null },
      address: { type: String, default: null }
    },
    
    // ── Verification ─────────────────────────────────────────
    verificationMethod: {
      type: String,
      enum: ['face', 'fingerprint', 'manual', 'auto'], // How they checked in
      default: 'manual'
    },
    faceMatchScore: {
      type: Number, // Confidence score 0-1 (1 = perfect match)
      default: null
    },
    isInsideGeofence: {
      type: Boolean,
      default: false
    },
    distanceFromGeofence: {
      type: Number, // Distance in meters from geofence center
      default: null
    },
    
    // ── Status ───────────────────────────────────────────────
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'half-day', 'on-leave'],
      default: 'present'
    },
    isLate: {
      type: Boolean,
      default: false
    },
    lateByMinutes: {
      type: Number,
      default: 0
    },
    
    // ── Work Duration ────────────────────────────────────────
    totalHoursWorked: {
      type: Number, // In decimal hours (e.g., 7.5 for 7h 30m)
      default: null
    },
    overtimeHours: {
      type: Number,
      default: 0
    },
    
    // ── Notes ────────────────────────────────────────────────
    notes: {
      type: String,
      maxlength: 500,
      default: null
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null // null means self-marked, otherwise admin marked it
    },
    
    // ── Security Flags ───────────────────────────────────────
    suspiciousActivity: {
      type: Boolean,
      default: false
    },
    suspicionReason: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ─── Compound Index: One attendance record per user per day ───────────────────
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ status: 1 });
attendanceSchema.index({ user: 1, date: -1 });

// ─── Virtual: Duration in hours and minutes string ────────────────────────────
attendanceSchema.virtual('durationString').get(function () {
  if (!this.totalHoursWorked) return 'N/A';
  const hours = Math.floor(this.totalHoursWorked);
  const minutes = Math.round((this.totalHoursWorked - hours) * 60);
  return `${hours}h ${minutes}m`;
});

// ─── Pre-save: Calculate hours worked ─────────────────────────────────────────
attendanceSchema.pre('save', function (next) {
  if (this.checkInTime && this.checkOutTime) {
    const diff = this.checkOutTime - this.checkInTime; // milliseconds
    this.totalHoursWorked = parseFloat((diff / (1000 * 60 * 60)).toFixed(2));
  }
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);
