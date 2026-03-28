/**
 * Login Page
 * Beautiful login form with email + password authentication
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    const creds = {
      admin: { email: 'admin@company.com', password: 'Admin@123456' },
      manager: { email: 'manager@company.com', password: 'Manager@123' },
      employee: { email: 'john@company.com', password: 'Employee@123' },
    };
    setForm(creds[role]);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background circles */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-white/5 rounded-full" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-white text-xl font-bold">SmartAttend</span>
          </div>
          
          <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
            Smart Attendance<br />
            <span className="text-blue-200">Made Simple</span>
          </h1>
          <p className="text-blue-100 text-lg leading-relaxed">
            GPS-based geofencing, face recognition, and real-time attendance tracking 
            for modern organizations.
          </p>
        </div>

        {/* Feature cards */}
        <div className="relative z-10 grid grid-cols-2 gap-4">
          {[
            { icon: '📍', title: 'GPS Geofencing', desc: 'Location-based check-in' },
            { icon: '🤖', title: 'Face Recognition', desc: 'Biometric verification' },
            { icon: '📊', title: 'Real-time Analytics', desc: 'Live dashboards' },
            { icon: '📥', title: 'Export Reports', desc: 'Excel & CSV export' },
          ].map((f, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <p className="text-2xl mb-2">{f.icon}</p>
              <p className="text-white font-semibold text-sm">{f.title}</p>
              <p className="text-blue-200 text-xs">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-white text-2xl font-bold">SmartAttend</h2>
          </div>

          <div className="mb-8">
            <h2 className="text-white text-3xl font-bold mb-2">Welcome back</h2>
            <p className="text-slate-400">Sign in to your account to continue</p>
          </div>

          {/* Demo Quick-Login Buttons */}
          <div className="mb-6 p-4 bg-slate-800 rounded-xl border border-slate-700">
            <p className="text-slate-400 text-xs mb-3 font-semibold uppercase tracking-wider">Quick Demo Login</p>
            <div className="flex gap-2 flex-wrap">
              {['admin', 'manager', 'employee'].map(role => (
                <button
                  key={role}
                  onClick={() => fillDemo(role)}
                  className="text-xs px-3 py-1.5 bg-slate-700 hover:bg-blue-600 text-slate-300 hover:text-white rounded-lg transition-colors capitalize"
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="text-slate-300 text-sm font-medium mb-2 block">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                placeholder="you@company.com"
                className="w-full bg-slate-800 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-slate-300 text-sm font-medium mb-2 block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                  placeholder="Enter your password"
                  className="w-full bg-slate-800 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-blue-500 transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing in...
                </>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
