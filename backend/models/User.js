/**
 * User Model
 * Defines the schema for all users (Admin, Employee, Manager/Teacher)
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    // ── Basic Info ──────────────────────────────────────────
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false // Never return password in queries by default
    },
    
    // ── Role & Department ───────────────────────────────────
    role: {
      type: String,
      enum: ['admin', 'employee', 'manager'],
      default: 'employee'
    },
    department: {
      type: String,
      trim: true,
      default: 'General'
    },
    employeeId: {
      type: String,
      unique: true,
      sparse: true, // Allows null values to not conflict
      trim: true
    },
    
    // ── Contact ─────────────────────────────────────────────
    phone: {
      type: String,
      trim: true
    },
    avatar: {
      type: String, // URL to profile picture
      default: null
    },
    
    // ── Face Recognition Data ───────────────────────────────
    faceDescriptor: {
      type: [Number], // 128-dimensional face embedding from face-api.js
      default: null,
      select: false // Sensitive data, don't return by default
    },
    faceRegistered: {
      type: Boolean,
      default: false
    },
    
    // ── WebAuthn / Fingerprint ──────────────────────────────
    webAuthnCredentials: [
      {
        credentialId: String,
        publicKey: String,
        counter: Number,
        deviceName: String,
        registeredAt: { type: Date, default: Date.now }
      }
    ],
    
    // ── Work Schedule ───────────────────────────────────────
    workingHours: {
      startTime: { type: String, default: '09:00' }, // "HH:MM" format
      endTime: { type: String, default: '17:00' },
      workDays: {
        type: [String],
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      }
    },
    
    // ── Status ──────────────────────────────────────────────
    isActive: {
      type: Boolean,
      default: true
    },
    lastLogin: {
      type: Date,
      default: null
    },
    
    // ── Password Reset ──────────────────────────────────────
    passwordResetToken: String,
    passwordResetExpires: Date
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ─── Indexes for faster queries ───────────────────────────────────────────────
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ department: 1 });
userSchema.index({ employeeId: 1 });

// ─── Hash password before saving ─────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  // Only hash if password was modified (not on other updates)
  if (!this.isModified('password')) return next();
  
  // Hash with cost factor 12 (higher = more secure but slower)
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Instance method: Compare passwords ──────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// ─── Virtual: Full display name with role ─────────────────────────────────────
userSchema.virtual('displayName').get(function () {
  return `${this.name} (${this.role})`;
});

module.exports = mongoose.model('User', userSchema);
