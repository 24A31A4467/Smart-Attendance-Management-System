/**
 * App.js - Main Application Component
 * Sets up routing for all pages with role-based access control
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AttendancePage from './pages/AttendancePage';
import ReportsPage from './pages/ReportsPage';
import UserManagementPage from './pages/UserManagementPage';
import GeofenceSettingsPage from './pages/GeofenceSettingsPage';
import ProfilePage from './pages/ProfilePage';
import AttendanceHistoryPage from './pages/AttendanceHistoryPage';

// Components
import Layout from './components/common/Layout';
import LoadingSpinner from './components/common/LoadingSpinner';

// ─── Protected Route Component ────────────────────────────────────────────────
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// ─── Public Route: Redirect if already logged in ──────────────────────────────
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      {/* Employee/Manager Routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="history" element={<AttendanceHistoryPage />} />
        <Route path="profile" element={<ProfilePage />} />
        
        {/* Admin/Manager Routes */}
        <Route path="admin" element={
          <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <AdminDashboardPage />
          </ProtectedRoute>
        } />
        <Route path="reports" element={
          <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <ReportsPage />
          </ProtectedRoute>
        } />
        <Route path="users" element={
          <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <UserManagementPage />
          </ProtectedRoute>
        } />
        <Route path="geofence" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <GeofenceSettingsPage />
          </ProtectedRoute>
        } />
      </Route>

      {/* 404 Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid #334155',
            },
          }}
        />
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
