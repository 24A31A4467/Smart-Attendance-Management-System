<div align="center">

# 🎓 Smart Attendance Management System (SAMS)

### AI-Powered College Attendance Using GPS Geofencing & Face Recognition

[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?style=for-the-badge&logo=mongodb)](https://mongodb.com/)
[![Express](https://img.shields.io/badge/Express.js-4.18-000000?style=for-the-badge&logo=express)](https://expressjs.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens)](https://jwt.io/)

**No more proxy attendance. No more manual registers. Just real-time, verified attendance.**

[Features](#-features) · [Tech Stack](#-tech-stack) · [Installation](#-installation) · [Screenshots](#-screenshots) · [API Docs](#-api-reference)

</div>

---

## 🔥 Why SAMS?

Traditional attendance systems are broken:
- ❌ Students mark attendance for absent friends (proxy)
- ❌ Manual registers get lost or tampered
- ❌ Faculty waste class time taking attendance
- ❌ No real-time data for administration

**SAMS solves all of this:**
- ✅ Students must be **physically inside the classroom** (GPS verified)
- ✅ Students must show their **own face** (face recognition verified)
- ✅ Attendance marked in **seconds** — not minutes
- ✅ **Real-time analytics** for admin and faculty

---

## ✨ Features

### 🎓 For Students
| Feature | Description |
|---------|-------------|
| 📍 GPS Geofencing | Can only mark attendance from inside classroom |
| 🤖 Face Verification | Must match registered face — no proxy allowed |
| 📊 Personal Dashboard | View attendance rate, history, and stats |
| 📋 Attendance History | Month-wise detailed records |
| 🔔 Late Alerts | Know immediately if marked late |

### 👨‍🏫 For Faculty
| Feature | Description |
|---------|-------------|
| 📊 Class Dashboard | Real-time who is present/absent |
| ✏️ Manual Override | Mark attendance manually if needed |
| 📈 Department Reports | View attendance by section/department |
| 📥 Export Data | Download Excel/CSV reports |

### 🔧 For Admin
| Feature | Description |
|---------|-------------|
| 🗺️ Geofence Setup | Set exact classroom GPS coordinates |
| 👥 User Management | Add/edit/deactivate students and faculty |
| 📊 Analytics Dashboard | College-wide attendance insights |
| ⏰ Auto Checkout | Automatically checks out at end of day |
| 🏢 Department Stats | Compare attendance across departments |

---

## 🛠 Tech Stack

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                         │
│  React.js 18  │  Tailwind CSS  │  Chart.js          │
│  face-api.js  │  React Router  │  Axios             │
├─────────────────────────────────────────────────────┤
│                    BACKEND                          │
│  Node.js 18+  │  Express.js    │  JWT Auth          │
│  bcryptjs     │  Mongoose ORM  │  node-cron         │
├─────────────────────────────────────────────────────┤
│                   DATABASE                          │
│  MongoDB 7.0  │  3 Collections │  Indexed Queries   │
├─────────────────────────────────────────────────────┤
│                  DEPLOYMENT                         │
│  Docker  │  Docker Compose  │  Nginx  │  .env       │
└─────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
smart-attendance/
│
├── 📂 backend/
│   ├── 📂 controllers/
│   │   ├── authController.js        # Login, Register, Face
│   │   ├── attendanceController.js  # Check-in, Check-out
│   │   ├── userController.js        # User CRUD
│   │   ├── dashboardController.js   # Analytics
│   │   ├── geofenceController.js    # Classroom zones
│   │   └── reportController.js      # Excel/CSV export
│   ├── 📂 middleware/
│   │   └── auth.js                  # JWT verification
│   ├── 📂 models/
│   │   ├── User.js                  # User schema
│   │   ├── Attendance.js            # Attendance records
│   │   └── Geofence.js              # Classroom zones
│   ├── 📂 routes/                   # API endpoints
│   ├── 📂 utils/
│   │   ├── seed.js                  # Sample data generator
│   │   └── cronJobs.js              # Auto-checkout scheduler
│   ├── .env.example
│   ├── Dockerfile
│   └── server.js                    # App entry point
│
├── 📂 frontend/
│   ├── 📂 src/
│   │   ├── 📂 components/common/
│   │   │   └── Layout.js            # Sidebar + Header
│   │   ├── 📂 context/
│   │   │   └── AuthContext.js       # Global auth state
│   │   ├── 📂 pages/
│   │   │   ├── LoginPage.js
│   │   │   ├── RegisterPage.js      # Student/Faculty signup
│   │   │   ├── DashboardPage.js     # Student dashboard
│   │   │   ├── AdminDashboardPage.js
│   │   │   ├── AttendancePage.js    # GPS + Face check-in
│   │   │   ├── AttendanceHistoryPage.js
│   │   │   ├── UserManagementPage.js
│   │   │   ├── GeofenceSettingsPage.js
│   │   │   ├── ReportsPage.js
│   │   │   └── ProfilePage.js       # Face registration
│   │   └── 📂 utils/
│   │       └── api.js               # Axios with JWT
│   ├── Dockerfile
│   └── nginx.conf
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## 🚀 Installation

### Prerequisites
- Node.js v18 or higher
- MongoDB (local or Atlas)
- Git

### Step 1 — Clone the repository
```bash
git clone https://github.com/yourusername/smart-attendance-management-system.git
cd smart-attendance-management-system/smart-attendance
```

### Step 2 — Setup Backend
```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` file:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/smart_attendance
JWT_SECRET=your_super_secret_key_minimum_32_characters
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
ADMIN_EMAIL=admin@college.com
ADMIN_PASSWORD=Admin@123456
```

```bash
# Create sample data
node utils/seed.js

# Start backend
npm run dev
```

### Step 3 — Setup Frontend
```bash
# Open new terminal
cd frontend
npm install
npm start
```

### Step 4 — Open the app
```
http://localhost:3000
```

---

## 🔑 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| 🔧 Admin | admin@company.com | Admin@123456 |
| 👨‍🏫 Faculty | manager@company.com | Manager@123 |
| 🎓 Student | john@company.com | Employee@123 |

---

## 🤖 How Face Verification Works

```
STEP 1 — REGISTER (one time)
Student → Profile Page → Register Face
→ Camera captures face
→ face-api.js extracts 128 unique face points
→ Saved securely in database

STEP 2 — ATTENDANCE (every day)
Student → Attendance Page → Open Camera
→ Live face captured
→ 128 points extracted from live face
→ Compared with stored 128 points
→ Distance < 0.6 → ✅ MATCH → Attendance marked
→ Distance > 0.6 → ❌ NO MATCH → Blocked
```

---

## 📍 How GPS Geofencing Works

```
Admin sets classroom coordinates (lat/lng) + radius (e.g. 30m)
                    ↓
Student opens attendance page
                    ↓
Browser captures student's GPS location
                    ↓
System calculates distance from classroom center
                    ↓
Distance < 30m  →  ✅ Inside classroom → Can check in
Distance > 30m  →  ❌ Outside classroom → Blocked
```

---

## 🗄 Database Schema

### Users Collection
```javascript
{
  name: String,
  email: String,           // unique
  password: String,        // bcrypt hashed
  role: "admin" | "employee" | "manager",
  department: String,      // e.g. "CSE - Section A"
  employeeId: String,      // Roll number for students
  faceDescriptor: [Number], // 128 face embedding points
  faceRegistered: Boolean,
  isActive: Boolean,
  lastLogin: Date
}
```

### Attendance Collection
```javascript
{
  user: ObjectId,
  date: Date,
  checkInTime: Date,
  checkOutTime: Date,
  checkInLocation: { latitude, longitude, accuracy },
  verificationMethod: "face" | "gps" | "manual",
  isInsideGeofence: Boolean,
  distanceFromGeofence: Number,
  status: "present" | "late" | "absent" | "half-day",
  isLate: Boolean,
  lateByMinutes: Number,
  totalHoursWorked: Number,
  faceMatchScore: Number
}
```

### Geofence Collection
```javascript
{
  name: String,            // e.g. "Room 101"
  center: { latitude, longitude },
  radius: Number,          // in meters
  workingHours: {
    startTime: "09:00",
    endTime: "17:00",
    lateThresholdMinutes: 15
  },
  isActive: Boolean,
  createdBy: ObjectId
}
```

---

## 📡 API Reference

### Auth Routes
```
POST   /api/auth/register          Create account
POST   /api/auth/login             Login → JWT token
GET    /api/auth/me                Get current user
PUT    /api/auth/update-profile    Update profile
PUT    /api/auth/change-password   Change password
POST   /api/auth/save-face         Save face descriptor
GET    /api/auth/my-face-descriptor Get stored face data
```

### Attendance Routes
```
POST   /api/attendance/check-in    Mark check-in
POST   /api/attendance/check-out   Mark check-out
GET    /api/attendance/today       Today's record
GET    /api/attendance/my-history  Personal history
GET    /api/attendance/summary     Monthly summary
GET    /api/attendance/all         All records (admin)
POST   /api/attendance/manual      Manual mark (admin)
```

### Admin Routes
```
GET    /api/users                  List all users
POST   /api/users                  Create user
PUT    /api/users/:id              Update user
DELETE /api/users/:id              Deactivate user
GET    /api/geofence               List geofences
POST   /api/geofence               Create geofence
GET    /api/dashboard/today-stats  Today's stats
GET    /api/dashboard/weekly-stats Weekly trend
GET    /api/reports/export         Download Excel/CSV
```

---

## 🔒 Security

- 🔐 **JWT Authentication** — Stateless token-based auth
- 🔑 **bcryptjs** — Passwords hashed with salt factor 12
- 🛡️ **Role Authorization** — Admin/Faculty/Student access levels
- 📍 **GPS Verification** — Physical presence required
- 🤖 **Face Matching** — Biometric identity verification
- 🚫 **Proxy Prevention** — Both GPS + Face required simultaneously
- 🔒 **Faculty Protection** — Secret code required for faculty registration

---

## 🐳 Docker Deployment

```bash
# Start everything with one command
docker-compose up --build

# Seed database
docker exec attendance_backend node utils/seed.js

# Stop
docker-compose down
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Login fails | Run `node utils/seed.js` to reset accounts |
| GPS not working | Allow location permission in browser |
| Face not detected | Ensure good lighting, face camera directly |
| CORS error | Restart both backend and frontend |
| Outside classroom | Admin must set correct classroom GPS coordinates |

---

## 🤝 Departments Supported

`CSE` `ECE` `EEE` `Mechanical` `IT` `Data Science` `AI` `AIML` `Cyber Security` `Civil`

Sections: `A` `B` `C` `D` `E` `F`

---

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">

**Built with ❤️ for smarter college attendance**

⭐ Star this repo if you found it helpful!

</div>
