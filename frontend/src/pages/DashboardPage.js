import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ icon, label, value, color, sub }) => (
  <div className={`bg-slate-800 rounded-2xl p-5 border border-slate-700`}>
    <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center text-xl mb-3`}>
      {icon}
    </div>
    <p className="text-slate-400 text-sm">{label}</p>
    <p className="text-white text-2xl font-bold mt-1">{value}</p>
    {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
  </div>
);

export default function DashboardPage() {
  const { user } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [summary, setSummary] = useState(null);
  const [recentRecords, setRecentRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [todayRes, summaryRes, histRes] = await Promise.all([
          api.get('/attendance/today'),
          api.get('/attendance/summary'),
          api.get('/attendance/my-history?limit=5')
        ]);
        setTodayAttendance(todayRes.data.attendance);
        setSummary(summaryRes.data.summary);
        setRecentRecords(histRes.data.records);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
        <p className="text-blue-100 text-sm">{greeting}!</p>
        <h1 className="text-2xl font-bold mt-1">{user?.name}</h1>
        <p className="text-blue-200 text-sm mt-1">{user?.department} · {user?.role}</p>
        
        {/* Today's quick status */}
        <div className="mt-4 flex gap-4">
          {todayAttendance?.checkInTime ? (
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <p className="text-xs text-blue-100">Checked in at</p>
              <p className="font-bold">{new Date(todayAttendance.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          ) : (
            <Link to="/attendance" className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl px-4 py-2 transition-colors">
              <p className="text-xs text-blue-100">Not checked in</p>
              <p className="font-bold">Mark Attendance →</p>
            </Link>
          )}
          {todayAttendance?.checkOutTime && (
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <p className="text-xs text-blue-100">Checked out at</p>
              <p className="font-bold">{new Date(todayAttendance.checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          )}
        </div>
      </div>

      {/* This Month's Stats */}
      {summary && (
        <>
          <h2 className="text-white font-semibold text-lg">This Month</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon="✅" label="Present Days" value={summary.present} color="bg-green-500/20" sub="On time" />
            <StatCard icon="⏰" label="Late Arrivals" value={summary.late} color="bg-yellow-500/20" />
            <StatCard icon="❌" label="Absent Days" value={summary.absent} color="bg-red-500/20" />
            <StatCard icon="⏱️" label="Total Hours" value={`${summary.totalHoursWorked}h`} color="bg-blue-500/20" />
          </div>
          
          {/* Attendance Rate */}
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-white font-semibold">Attendance Rate</h3>
              <span className={`text-xl font-bold ${summary.attendanceRate >= 90 ? 'text-green-400' : summary.attendanceRate >= 75 ? 'text-yellow-400' : 'text-red-400'}`}>
                {summary.attendanceRate}%
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${summary.attendanceRate >= 90 ? 'bg-green-500' : summary.attendanceRate >= 75 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${summary.attendanceRate}%` }}
              />
            </div>
            <p className="text-slate-400 text-xs mt-2">
              {summary.attendanceRate >= 90 ? '🌟 Excellent attendance!' : summary.attendanceRate >= 75 ? '👍 Good, keep it up!' : '⚠️ Attendance needs improvement'}
            </p>
          </div>
        </>
      )}

      {/* Recent Records */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white font-semibold text-lg">Recent Records</h2>
          <Link to="/history" className="text-blue-400 hover:text-blue-300 text-sm">View all →</Link>
        </div>

        <div className="space-y-3">
          {recentRecords.length === 0 ? (
            <div className="bg-slate-800 rounded-2xl p-8 text-center text-slate-500 border border-slate-700">
              No attendance records yet
            </div>
          ) : recentRecords.map(record => (
            <div key={record._id} className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">
                  {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
                <p className="text-slate-400 text-sm mt-0.5">
                  {record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'No check-in'}
                  {record.checkOutTime ? ` → ${new Date(record.checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : ''}
                </p>
              </div>
              <div className="text-right">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  record.status === 'present' ? 'bg-green-500/20 text-green-400' :
                  record.status === 'late' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {record.status}
                </span>
                {record.totalHoursWorked && (
                  <p className="text-slate-400 text-xs mt-1">{record.totalHoursWorked}h</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link to="/attendance" className="bg-blue-600 hover:bg-blue-700 rounded-2xl p-5 text-center transition-colors">
          <div className="text-3xl mb-2">✅</div>
          <p className="text-white font-semibold">Mark Attendance</p>
        </Link>
        <Link to="/history" className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl p-5 text-center transition-colors">
          <div className="text-3xl mb-2">📋</div>
          <p className="text-white font-semibold">View History</p>
        </Link>
      </div>
    </div>
  );
}
