/**
 * Database Seeder
 * Run: node utils/seed.js
 * Creates default admin, sample employees, and geofence
 */

const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');
const Geofence = require('../models/Geofence');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data (be careful in production!)
    await User.deleteMany({});
    await Geofence.deleteMany({});

    // Create Admin
    const admin = await User.create({
      name: 'System Admin',
      email: process.env.ADMIN_EMAIL || 'admin@company.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123456',
      role: 'admin',
      department: 'Administration',
      employeeId: 'ADM001',
      isActive: true
    });
    console.log('✅ Admin created:', admin.email);

    // Create sample manager
    const manager = await User.create({
      name: 'Sarah Manager',
      email: 'manager@company.com',
      password: 'Manager@123',
      role: 'manager',
      department: 'Engineering',
      employeeId: 'MGR001'
    });

    // Create sample employees
    const employees = await User.insertMany([
      { name: 'John Smith', email: 'john@company.com', password: 'Employee@123', role: 'employee', department: 'Engineering', employeeId: 'EMP001' },
      { name: 'Jane Doe', email: 'jane@company.com', password: 'Employee@123', role: 'employee', department: 'Marketing', employeeId: 'EMP002' },
      { name: 'Bob Johnson', email: 'bob@company.com', password: 'Employee@123', role: 'employee', department: 'Engineering', employeeId: 'EMP003' },
      { name: 'Alice Brown', email: 'alice@company.com', password: 'Employee@123', role: 'employee', department: 'HR', employeeId: 'EMP004' },
    ]);
    console.log(`✅ Created ${employees.length} sample employees`);

    // Create default geofence (using a sample location - Hyderabad, India)
    await Geofence.create({
      name: 'Main Office',
      description: 'Headquarters - Primary attendance zone',
      center: { latitude: 17.3850, longitude: 78.4867 },
      radius: 100,
      workingHours: {
        startTime: '09:00',
        endTime: '18:00',
        lateThresholdMinutes: 15,
        workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      },
      isActive: true,
      createdBy: admin._id
    });
    console.log('✅ Default geofence created');

    console.log('\n🎉 Seeding complete!');
    console.log('─────────────────────────────────');
    console.log(`Admin:    ${admin.email} / ${process.env.ADMIN_PASSWORD || 'Admin@123456'}`);
    console.log(`Manager:  manager@company.com / Manager@123`);
    console.log(`Employee: john@company.com / Employee@123`);
    console.log('─────────────────────────────────');

    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seed();
