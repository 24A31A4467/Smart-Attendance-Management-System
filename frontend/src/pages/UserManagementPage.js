import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
    <div className="bg-slate-800 rounded-2xl w-full max-w-lg border border-slate-700 max-h-screen overflow-y-auto">
      <div className="flex justify-between items-center p-6 border-b border-slate-700">
        <h3 className="text-white font-bold text-lg">{title}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">×</button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

const emptyUser = { name: '', email: '', password: '', role: 'employee', department: '', employeeId: '', phone: '' };

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState(emptyUser);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterRole) params.append('role', filterRole);
      const { data } = await api.get(`/users?${params}`);
      setUsers(data.users);
    } catch (err) { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [search, filterRole]);

  const openCreate = () => { setEditUser(null); setForm(emptyUser); setShowModal(true); };
  const openEdit = (user) => { setEditUser(user); setForm({ ...user, password: '' }); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editUser) {
        await api.put(`/users/${editUser._id}`, form);
        toast.success('User updated!');
      } else {
        await api.post('/users', form);
        toast.success('User created!');
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save user');
    } finally { setSaving(false); }
  };

  const handleDelete = async (userId) => {
    try {
      await api.delete(`/users/${userId}`);
      toast.success('User deactivated');
      setDeleteConfirm(null);
      fetchUsers();
    } catch (err) { toast.error('Failed to deactivate user'); }
  };

  const Field = ({ label, name, type = 'text', placeholder }) => (
    <div>
      <label className="text-slate-300 text-sm font-medium mb-1 block">{label}</label>
      <input
        type={type} value={form[name] || ''}
        onChange={e => setForm({...form, [name]: e.target.value})}
        placeholder={placeholder}
        className="w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-white text-2xl font-bold">User Management</h1>
          <p className="text-slate-400 text-sm">{users.length} users found</p>
        </div>
        <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
          + Add User
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text" placeholder="Search by name, email, or ID..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
        />
        <select
          value={filterRole} onChange={e => setFilterRole(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="">All Roles</option>
          <option value="employee">Employee</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* User Table */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div></div>
      ) : (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  {['User', 'ID', 'Department', 'Role', 'Face', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left text-slate-400 text-xs font-semibold uppercase tracking-wider px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {users.map(user => (
                  <tr key={user._id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {user.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{user.name}</p>
                          <p className="text-slate-400 text-xs">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-sm">{user.employeeId || '—'}</td>
                    <td className="px-4 py-3 text-slate-400 text-sm">{user.department || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full capitalize font-medium ${
                        user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' :
                        user.role === 'manager' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-slate-600/50 text-slate-300'
                      }`}>{user.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs ${user.faceRegistered ? 'text-green-400' : 'text-slate-500'}`}>
                        {user.faceRegistered ? '✅' : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${user.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(user)} className="text-xs bg-slate-700 hover:bg-blue-600 text-slate-300 hover:text-white px-2 py-1 rounded-lg transition-colors">Edit</button>
                        <button onClick={() => setDeleteConfirm(user._id)} className="text-xs bg-slate-700 hover:bg-red-600 text-slate-300 hover:text-white px-2 py-1 rounded-lg transition-colors">Deactivate</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={7} className="text-center text-slate-500 py-12">No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <Modal title={editUser ? 'Edit User' : 'Create New User'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Full Name" name="name" placeholder="John Smith" />
              <Field label="Email" name="email" type="email" placeholder="john@company.com" />
              <Field label="Employee ID" name="employeeId" placeholder="EMP001" />
              <Field label="Phone" name="phone" placeholder="+1 234 567" />
              <Field label="Department" name="department" placeholder="Engineering" />
              <div>
                <label className="text-slate-300 text-sm font-medium mb-1 block">Role</label>
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none">
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            {!editUser && <Field label="Password" name="password" type="password" placeholder="Min 6 characters" />}
            {editUser && (
              <div>
                <label className="text-slate-300 text-sm font-medium mb-1 block">Status</label>
                <select value={form.isActive ? 'true' : 'false'} onChange={e => setForm({...form, isActive: e.target.value === 'true'})}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none">
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-xl text-sm transition-colors">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition-colors">
                {saving ? 'Saving...' : (editUser ? 'Update User' : 'Create User')}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <Modal title="Confirm Deactivation" onClose={() => setDeleteConfirm(null)}>
          <p className="text-slate-300 mb-6">Are you sure you want to deactivate this user? They will no longer be able to log in.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteConfirm(null)} className="flex-1 bg-slate-700 text-white py-2.5 rounded-xl text-sm">Cancel</button>
            <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-sm font-medium">Deactivate</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
