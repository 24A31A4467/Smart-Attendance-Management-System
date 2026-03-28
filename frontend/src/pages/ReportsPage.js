import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    department: '',
    format: 'xlsx'
  });
  const [summary, setSummary] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(true);

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const [deptRes, summaryRes] = await Promise.all([
          api.get('/users/departments'),
          api.get('/reports/monthly-summary')
        ]);
        setDepartments(deptRes.data.departments);
        setSummary(summaryRes.data.summary);
      } catch (err) { console.error(err); }
      finally { setSummaryLoading(false); }
    };
    fetchInitial();
  }, []);

  const handleExport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/reports/export?${params}`, { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_report.${filters.format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Report downloaded!');
    } catch (err) {
      toast.error('Failed to export report');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white text-2xl font-bold">Reports & Analytics</h1>
        <p className="text-slate-400 text-sm">Export attendance data and view summaries</p>
      </div>

      {/* Export Card */}
      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
        <h2 className="text-white font-semibold mb-5 flex items-center gap-2">
          <span>📥</span> Export Attendance Report
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          <div>
            <label className="text-slate-400 text-xs mb-1 block">Start Date</label>
            <input type="date" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1 block">End Date</label>
            <input type="date" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1 block">Department</label>
            <select value={filters.department} onChange={e => setFilters({...filters, department: e.target.value})}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-3 py-2 text-sm focus:outline-none">
              <option value="">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1 block">Format</label>
            <select value={filters.format} onChange={e => setFilters({...filters, format: e.target.value})}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-3 py-2 text-sm focus:outline-none">
              <option value="xlsx">Excel (.xlsx)</option>
              <option value="csv">CSV (.csv)</option>
            </select>
          </div>
        </div>
        <button onClick={handleExport} disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
          {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>Exporting...</> : '📥 Download Report'}
        </button>
      </div>

      {/* Monthly Summary Table */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-white font-semibold">Monthly Summary — {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
        </div>
        {summaryLoading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-700/30">
                  {['Name', 'Dept', 'Present', 'Late', 'Absent', 'Hours', 'Rate'].map(h => (
                    <th key={h} className="text-left text-slate-400 text-xs font-semibold uppercase tracking-wider px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {summary.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white text-sm font-medium">{row.name}</p>
                      <p className="text-slate-500 text-xs">{row.employeeId}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-sm">{row.department}</td>
                    <td className="px-4 py-3 text-green-400 text-sm font-medium">{row.presentDays}</td>
                    <td className="px-4 py-3 text-yellow-400 text-sm font-medium">{row.lateDays}</td>
                    <td className="px-4 py-3 text-red-400 text-sm font-medium">{row.absentDays}</td>
                    <td className="px-4 py-3 text-slate-300 text-sm">{row.totalHours}h</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-700 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${row.attendanceRate >= 80 ? 'bg-green-500' : row.attendanceRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${row.attendanceRate || 0}%` }} />
                        </div>
                        <span className="text-slate-300 text-xs">{row.attendanceRate || 0}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {summary.length === 0 && (
                  <tr><td colSpan={7} className="text-center text-slate-500 py-12">No attendance data for this month</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
