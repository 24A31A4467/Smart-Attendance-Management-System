import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const DEPARTMENTS = [
  'CSE', 'ECE', 'EEE', 'Mechanical', 'IT',
  'Data Science', 'AI', 'AIML', 'Cyber Security', 'Civil'
];
const SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F'];

// Faculty registration requires a secret code known only to admin
// Admin sets this code and shares it only with real faculty members
const FACULTY_SECRET_CODE = 'FACULTY2026';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('employee'); // employee = student
  const [department, setDepartment] = useState('');
  const [section, setSection] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [phone, setPhone] = useState('');
  const [facultyCode, setFacultyCode] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const isStudent = role === 'employee';

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validations
    if (!name || !email || !password) return toast.error('Please fill all required fields');
    if (!department) return toast.error('Please select your department');
    if (isStudent && !section) return toast.error('Students must select a section');
    if (password !== confirmPassword) return toast.error('Passwords do not match');
    if (password.length < 6) return toast.error('Password must be at least 6 characters');

    // SECURITY: Faculty must enter secret code given by admin
    // This prevents students from registering as faculty
    if (!isStudent) {
      if (!facultyCode) return toast.error('Faculty must enter the registration code provided by admin');
      if (facultyCode.trim().toUpperCase() !== FACULTY_SECRET_CODE) {
        return toast.error('❌ Invalid faculty code. Contact your administrator.');
      }
    }

    // SECURITY: Validate roll number - must be at least 4 characters, letters and numbers only
    if (isStudent && employeeId) {
      const rollFormat = /^[a-zA-Z0-9]{4,20}$/;
      if (!rollFormat.test(employeeId)) {
        return toast.error('Invalid roll number. Only letters and numbers allowed (4-20 characters).');
      }
    }

    setLoading(true);
    try {
      await register({
        name,
        email,
        password,
        // Students always get 'employee' role, faculty get 'manager' role
        role: isStudent ? 'employee' : 'manager',
        department: isStudent ? `${department} - Section ${section}` : department,
        employeeId: employeeId.toUpperCase(),
        phone
      });
      toast.success(`${isStudent ? 'Student' : 'Faculty'} account created successfully!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
            </svg>
          </div>
          <h2 className="text-white text-3xl font-bold mb-1">Create Account</h2>
          <p className="text-slate-400 text-sm">College Attendance Management System</p>
        </div>

        <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* Role Selection */}
              <div className="md:col-span-2">
                <label className="text-slate-300 text-sm font-medium mb-2 block">
                  I am a <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => { setRole('employee'); setFacultyCode(''); }}
                    className={`py-3 rounded-xl border-2 font-medium transition-all ${role === 'employee' ? 'border-blue-500 bg-blue-600/20 text-blue-400' : 'border-slate-600 text-slate-400 hover:border-slate-500'}`}>
                    🎓 Student
                  </button>
                  <button type="button" onClick={() => { setRole('manager'); setSection(''); }}
                    className={`py-3 rounded-xl border-2 font-medium transition-all ${role === 'manager' ? 'border-green-500 bg-green-600/20 text-green-400' : 'border-slate-600 text-slate-400 hover:border-slate-500'}`}>
                    👨‍🏫 Faculty
                  </button>
                </div>
              </div>

              {/* Faculty Warning Banner */}
              {!isStudent && (
                <div className="md:col-span-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                  <p className="text-yellow-400 text-sm font-semibold mb-1">⚠️ Faculty Registration</p>
                  <p className="text-slate-300 text-xs">
                    Faculty accounts require a <strong>secret registration code</strong> provided by the administrator.
                    Students cannot register as faculty without this code.
                  </p>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="text-slate-300 text-sm font-medium mb-2 block">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-slate-300 text-sm font-medium mb-2 block">
                  {isStudent ? 'College Email' : 'Official Email'} <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={isStudent ? "rollno@college.edu" : "faculty@college.edu"}
                  className="w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Roll Number / Employee ID */}
              <div>
                <label className="text-slate-300 text-sm font-medium mb-2 block">
                  {isStudent ? 'Roll Number (e.g. 24A31A4467)' : 'Employee ID'}
                </label>
                <input
                  type="text"
                  value={employeeId}
                  onChange={e => setEmployeeId(e.target.value)}
                  placeholder={isStudent ? "e.g. 24A31A4467" : "FAC001"}
                  className="w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="text-slate-300 text-sm font-medium mb-2 block">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Department */}
              <div>
                <label className="text-slate-300 text-sm font-medium mb-2 block">
                  Department <span className="text-red-400">*</span>
                </label>
                <select
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Select Department --</option>
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Section - Students only */}
              {isStudent && (
                <div>
                  <label className="text-slate-300 text-sm font-medium mb-2 block">
                    Section <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={section}
                    onChange={e => setSection(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Select Section --</option>
                    {SECTIONS.map(s => (
                      <option key={s} value={s}>Section {s}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Faculty Secret Code - Faculty only */}
              {!isStudent && (
                <div className="md:col-span-2">
                  <label className="text-slate-300 text-sm font-medium mb-2 block">
                    Faculty Registration Code <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    value={facultyCode}
                    onChange={e => setFacultyCode(e.target.value)}
                    placeholder="Enter code provided by admin"
                    className="w-full bg-slate-700 border border-yellow-600/50 text-white placeholder-slate-500 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-500"
                  />
                  <p className="text-slate-500 text-xs mt-1">
                    Contact your administrator to get the faculty registration code
                  </p>
                </div>
              )}

              {/* Password */}
              <div>
                <label className="text-slate-300 text-sm font-medium mb-2 block">
                  Password <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="text-slate-300 text-sm font-medium mb-2 block">
                  Confirm Password <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"
                />
              </div>

            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating Account...
                </>
              ) : `Create ${isStudent ? 'Student' : 'Faculty'} Account`}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-400 text-sm mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}