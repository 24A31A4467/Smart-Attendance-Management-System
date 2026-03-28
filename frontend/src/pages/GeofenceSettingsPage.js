import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function GeofenceSettingsPage() {
  const { user } = useAuth();
  const [geofences, setGeofences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [usingMyLocation, setUsingMyLocation] = useState(false);

  const emptyForm = {
    name: 'Main Office', description: '', radius: 100,
    center: { latitude: '', longitude: '' },
    workingHours: { startTime: '09:00', endTime: '17:00', lateThresholdMinutes: 15 },
    isActive: true
  };
  const [form, setForm] = useState(emptyForm);

  const fetchGeofences = async () => {
    try {
      const { data } = await api.get('/geofence');
      setGeofences(data.geofences);
    } catch (err) { toast.error('Failed to load geofences'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchGeofences(); }, []);

  const useMyLocation = () => {
    setUsingMyLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(f => ({ ...f, center: { latitude: pos.coords.latitude.toFixed(6), longitude: pos.coords.longitude.toFixed(6) } }));
        setUsingMyLocation(false);
        toast.success('Location captured!');
      },
      () => { toast.error('Could not get location'); setUsingMyLocation(false); }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.center.latitude || !form.center.longitude) {
      return toast.error('Please set GPS coordinates for the geofence center');
    }
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/geofence/${editId}`, form);
        toast.success('Geofence updated!');
      } else {
        await api.post('/geofence', form);
        toast.success('Geofence created!');
      }
      setShowForm(false);
      setEditId(null);
      setForm(emptyForm);
      fetchGeofences();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this geofence?')) return;
    try {
      await api.delete(`/geofence/${id}`);
      toast.success('Geofence deleted');
      fetchGeofences();
    } catch { toast.error('Failed to delete'); }
  };

  const openEdit = (geo) => {
    setEditId(geo._id);
    setForm({ ...geo, center: { ...geo.center } });
    setShowForm(true);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-white text-2xl font-bold">Geofence Settings</h1>
          <p className="text-slate-400 text-sm">Define allowed areas for attendance marking</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm(emptyForm); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
          {showForm ? 'Cancel' : '+ Add Geofence'}
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="bg-slate-800 rounded-2xl p-6 border border-blue-500/30">
          <h2 className="text-white font-semibold mb-5">{editId ? 'Edit Geofence' : 'New Geofence Zone'}</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="text-slate-300 text-sm mb-1 block">Zone Name *</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required
                  placeholder="Main Office" className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-slate-300 text-sm mb-1 block">Allowed Radius (meters)</label>
                <input type="number" value={form.radius} onChange={e => setForm({...form, radius: parseInt(e.target.value)})} min="10" max="10000"
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
              </div>
            </div>

            {/* GPS Center */}
            <div className="bg-slate-700/50 rounded-xl p-4">
              <div className="flex justify-between items-center mb-3">
                <label className="text-slate-300 text-sm font-medium">Center GPS Coordinates *</label>
                <button type="button" onClick={useMyLocation} disabled={usingMyLocation}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                  {usingMyLocation ? '...' : '📍 Use My Location'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Latitude</label>
                  <input type="number" step="any" value={form.center.latitude}
                    onChange={e => setForm({...form, center: {...form.center, latitude: e.target.value}})}
                    placeholder="17.3850" className="w-full bg-slate-600 border border-slate-500 text-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Longitude</label>
                  <input type="number" step="any" value={form.center.longitude}
                    onChange={e => setForm({...form, center: {...form.center, longitude: e.target.value}})}
                    placeholder="78.4867" className="w-full bg-slate-600 border border-slate-500 text-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
                </div>
              </div>
              <p className="text-slate-500 text-xs mt-2">
                💡 Tip: Open Google Maps, right-click your office location → "What's here?" to get exact coordinates
              </p>
            </div>

            {/* Working Hours */}
            <div>
              <label className="text-slate-300 text-sm font-medium mb-3 block">Working Hours</label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Start Time</label>
                  <input type="time" value={form.workingHours.startTime}
                    onChange={e => setForm({...form, workingHours: {...form.workingHours, startTime: e.target.value}})}
                    className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">End Time</label>
                  <input type="time" value={form.workingHours.endTime}
                    onChange={e => setForm({...form, workingHours: {...form.workingHours, endTime: e.target.value}})}
                    className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Late Grace (mins)</label>
                  <input type="number" value={form.workingHours.lateThresholdMinutes} min="0" max="60"
                    onChange={e => setForm({...form, workingHours: {...form.workingHours, lateThresholdMinutes: parseInt(e.target.value)}})}
                    className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})}
                className="w-4 h-4 rounded" />
              <label htmlFor="isActive" className="text-slate-300 text-sm">Active (employees must be in this zone)</label>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-slate-700 text-white py-2.5 rounded-xl text-sm">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium">
                {saving ? 'Saving...' : (editId ? 'Update Geofence' : 'Create Geofence')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Geofence List */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div></div>
      ) : (
        <div className="space-y-4">
          {geofences.map(geo => (
            <div key={geo._id} className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-white font-semibold">{geo.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${geo.isActive ? 'bg-green-500/20 text-green-400' : 'bg-slate-600/50 text-slate-400'}`}>
                      {geo.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-slate-400 text-xs">Radius</p>
                      <p className="text-white font-medium">{geo.radius}m</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Center</p>
                      <p className="text-white font-medium font-mono text-xs">{geo.center.latitude?.toFixed(4)}, {geo.center.longitude?.toFixed(4)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Hours</p>
                      <p className="text-white font-medium">{geo.workingHours?.startTime} - {geo.workingHours?.endTime}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Late Grace</p>
                      <p className="text-white font-medium">{geo.workingHours?.lateThresholdMinutes} min</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button onClick={() => openEdit(geo)} className="text-xs bg-slate-700 hover:bg-blue-600 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg transition-colors">Edit</button>
                  <button onClick={() => handleDelete(geo._id)} className="text-xs bg-slate-700 hover:bg-red-600 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg transition-colors">Delete</button>
                </div>
              </div>
            </div>
          ))}
          {geofences.length === 0 && (
            <div className="bg-slate-800 rounded-2xl p-12 text-center border border-slate-700 border-dashed">
              <p className="text-4xl mb-3">📍</p>
              <p className="text-slate-400">No geofences configured yet.</p>
              <p className="text-slate-500 text-sm mt-1">Without a geofence, employees can check in from anywhere.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
