// AttendanceHistoryPage.js
import React, { useState, useEffect } from 'react';
import api from '../utils/api';

export function AttendanceHistoryPage() {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const [histRes, sumRes] = await Promise.all([
          api.get(`/attendance/my-history?month=${month}&year=${year}&limit=31`),
          api.get(`/attendance/summary?month=${month}&year=${year}`)
        ]);
        setRecords(histRes.data.records);
        setSummary(sumRes.data.summary);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, [month, year]);

  const statusColor = (status) => {
    const map = { present: 'text-green-400 bg-green-500/10', late: 'text-yellow-400 bg-yellow-500/10', absent: 'text-red-400 bg-red-500/10', 'half-day': 'text-orange-400 bg-orange-500/10', 'on-leave': 'text-blue-400 bg-blue-500/10' };
    return map[status] || 'text-slate-400 bg-slate-600/20';
  };

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  return (
    <div className="space-y-6">
      <h1 className="text-white text-2xl font-bold">Attendance History</h1>

      {/* Month/Year Selector */}
      <div className="flex gap-3">
        <select value={month} onChange={e => setMonth(Number(e.target.value))}
          className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none">
          {months.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
        </select>
        <select value={year} onChange={e => setYear(Number(e.target.value))}
          className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none">
          {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Present', value: summary.present, color: 'text-green-400' },
            { label: 'Late', value: summary.late, color: 'text-yellow-400' },
            { label: 'Absent', value: summary.absent, color: 'text-red-400' },
            { label: 'Rate', value: `${summary.attendanceRate}%`, color: 'text-blue-400' },
          ].map((s, i) => (
            <div key={i} className="bg-slate-800 rounded-xl p-4 border border-slate-700 text-center">
              <p className="text-slate-400 text-xs mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Records */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div></div>
      ) : (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-700/30">
                  {['Date', 'Check-In', 'Check-Out', 'Hours', 'Status', 'Method', 'Location'].map(h => (
                    <th key={h} className="text-left text-slate-400 text-xs font-semibold uppercase tracking-wider px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {records.map(r => (
                  <tr key={r._id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-4 py-3 text-white text-sm">
                      {new Date(r.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-sm">
                      {r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-sm">
                      {r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-sm">{r.totalHoursWorked ? `${r.totalHoursWorked}h` : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full capitalize ${statusColor(r.status)}`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs capitalize">{r.verificationMethod}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {r.checkInLocation?.latitude ? `${r.checkInLocation.latitude.toFixed(3)}, ${r.checkInLocation.longitude.toFixed(3)}` : '—'}
                    </td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr><td colSpan={7} className="text-center text-slate-500 py-12">No records for this period</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AttendanceHistoryPage;
