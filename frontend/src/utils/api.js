/**
 * API Utility
 * Axios instance configured with base URL and JWT authentication
 * Automatically adds the token to every request
 */

import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
// Adds JWT token to every outgoing request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
// Handles 401 (session expired) globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - log out
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Don't redirect if already on login page
      if (!window.location.pathname.includes('/login')) {
        toast.error('Session expired. Please log in again.');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
