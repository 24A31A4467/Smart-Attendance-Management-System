import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import api from '../utils/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const StatCard = ({ icon, label, value, color, bgColor, sub }) => (
  <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
    <div className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center mb-3`}>
      <span className="text-2xl">{icon}</span>
    </div>
    <p className="text-slate-400 text-sm">{label}</p>
    <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
    {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
  </div>
);

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [weeklyData, setWeeklyData] = useState(null);
  const [deptStats, setDeptStats] = useState([]);
  const [absentees, setAbsentees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, weeklyRes, deptRes, absentRes] = await Promise.all([
          api.get('/dashboard/today-stats'),
          api.get('/dashboard/weekly-stats'),
          api.get('/dashboard/department-stats'),
          api.get('/dashboard/top-absentees'),
        ]);
        setStats(statsRes.data.stats);
        setWeeklyData(weeklyRes.data.weeklyData);
        setDeptStats(deptRes.data.deptStats);
        setAbsentees(absentRes.data.absenteeData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const chartData = weeklyData ? {
    labels: weeklyData.map(d => d.date),
    datasets: [
      { label: 'Present', data: weeklyData.map(d => d.present), backgroundColor: '#22c55e', borderRadius: 6 },
      { label: 'Late', data: weeklyData.map(d => d.late), backgroundColor: '#eab308', borderRadius: 6 },
      { label: 'Absent', data: weeklyData.map(d => d.absent), backgroundColor: '#ef4444', borderRadius: 6 },
    ]
  } : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { color: '#94a3b8' } },
    },
    scales: {
      x: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } },
      y: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } }
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link to="/reports" className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-xl transition-colors">
          📊 Export Reports
        </Link>
      </div>

      {/* Today's Quick Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="👥" label="Total Employees" value={stats.totalEmployees} color="text-blue-400" bgColor="bg-blue-500/20" />
          <StatCard icon="✅" label="Present Today" value={stats.presentCount} color="text-green-400" bgColor="bg-green-500/20" sub={`${stats.attendanceRate}% rate`} />
          <StatCard icon="❌" label="Absent Today" value={stats.absentCount} color="text-red-400" bgColor="bg-red-500/20" />
          <StatCard icon="⏰" label="Late Arrivals" value={stats.lateCount} color="text-yellow-400" bgColor="bg-yellow-500/20" />
        </div>
      )}

      {/* Weekly Chart + Dept Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <h2 className="text-white font-semibold mb-4">Weekly Attendance Trend</h2>
          {chartData && <Bar data={chartData} options={chartOptions} />}
        </div>

        {/* Department Stats */}
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <h2 className="text-white font-semibold mb-4">By Department</h2>
          <div className="space-y-3">
            {deptStats.map((dept, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">{dept.department}</span>
                  <span className="text-slate-400">{dept.present}/{dept.total}</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${dept.rate >= 80 ? 'bg-green-500' : dept.rate >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${dept.rate}%` }}
                  />
                </div>
              </div>
            ))}
            {deptStats.length === 0 && <p className="text-slate-500 text-sm text-center py-4">No department data</p>}
          </div>
        </div>
      </div>

      {/* Recent Check-ins + Top Absentees */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Check-ins */}
        {stats?.recentCheckIns && (
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h2 className="text-white font-semibold mb-4">Recent Check-ins</h2>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {stats.recentCheckIns?.map ? stats.recentCheckIns.map((r, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {r.user?.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{r.user?.name}</p>
                    <p className="text-slate-400 text-xs">{r.user?.department}</p>
                  </div>
                  <span className="text-slate-400 text-xs whitespace-nowrap">
                    {r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--'}
                  </span>
                </div>
              )) : null}
              {(!stats.recentCheckIns || stats.recentCheckIns.length === 0) && (
                <p className="text-slate-500 text-sm text-center py-4">No check-ins today</p>
              )}
            </div>
          </div>
        )}

        {/* Top Absentees */}
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <h2 className="text-white font-semibold mb-4">Top Absentees (This Month)</h2>
          <div className="space-y-3">
            {absentees.map((a, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-slate-500 text-sm w-5">{i + 1}.</span>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{a.name}</p>
                  <p className="text-slate-400 text-xs">{a.department}</p>
                </div>
                <span className="text-red-400 font-bold text-sm">{a.absentDays} days</span>
              </div>
            ))}
            {absentees.length === 0 && <p className="text-slate-500 text-sm text-center py-4">Perfect attendance this month! 🎉</p>}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { to: '/users', icon: '👥', label: 'Manage Users' },
          { to: '/reports', icon: '📊', label: 'View Reports' },
          { to: '/geofence', icon: '📍', label: 'Set Geofence' },
          { to: '/attendance', icon: '✅', label: 'My Attendance' },
        ].map((link, i) => (
          <Link key={i} to={link.to} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl p-4 text-center transition-colors">
            <div className="text-2xl mb-2">{link.icon}</div>
            <p className="text-slate-300 text-sm font-medium">{link.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
