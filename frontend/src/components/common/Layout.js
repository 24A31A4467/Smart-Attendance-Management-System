/**
 * Layout Component
 * Provides the sidebar + header shell that wraps all authenticated pages
 */

import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Icons as SVG components for no-dependency approach
const Icon = ({ path, className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
  </svg>
);

const ICONS = {
  dashboard: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  attendance: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  history: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  admin: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  users: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
  reports: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  geofence: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z",
  profile: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  logout: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "M6 18L18 6M6 6l12 12",
};

const NavItem = ({ to, icon, label, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
        isActive
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
          : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
      }`
    }
  >
    <Icon path={ICONS[icon]} />
    <span>{label}</span>
  </NavLink>
);

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isAdmin = user?.role === 'admin';
  const isAdminOrManager = ['admin', 'manager'].includes(user?.role);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-white font-bold text-sm">SmartAttend</p>
            <p className="text-slate-400 text-xs capitalize">{user?.role} Panel</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="px-4 py-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-700/30">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
            <p className="text-slate-400 text-xs truncate">{user?.department}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {isAdminOrManager && (
          <>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-4 pb-2 pt-2">Admin</p>
            <NavItem to="/admin" icon="admin" label="Admin Dashboard" onClick={() => setSidebarOpen(false)} />
            <NavItem to="/users" icon="users" label="User Management" onClick={() => setSidebarOpen(false)} />
            <NavItem to="/reports" icon="reports" label="Reports" onClick={() => setSidebarOpen(false)} />
            {isAdmin && <NavItem to="/geofence" icon="geofence" label="Geofence Settings" onClick={() => setSidebarOpen(false)} />}
            <div className="border-t border-slate-700/50 my-3" />
          </>
        )}
        
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-4 pb-2">My Space</p>
        <NavItem to="/dashboard" icon="dashboard" label="My Dashboard" onClick={() => setSidebarOpen(false)} />
        <NavItem to="/attendance" icon="attendance" label="Mark Attendance" onClick={() => setSidebarOpen(false)} />
        <NavItem to="/history" icon="history" label="My History" onClick={() => setSidebarOpen(false)} />
        <NavItem to="/profile" icon="profile" label="Profile" onClick={() => setSidebarOpen(false)} />
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-700/50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
        >
          <Icon path={ICONS.logout} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-slate-800 border-r border-slate-700/50 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 bg-slate-800 flex flex-col shadow-2xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="bg-slate-800 border-b border-slate-700/50 px-4 lg:px-6 py-4 flex items-center justify-between flex-shrink-0">
          <button
            className="lg:hidden p-2 text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(true)}
          >
            <Icon path={ICONS.menu} />
          </button>
          
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-slate-400 text-sm hidden sm:block">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
