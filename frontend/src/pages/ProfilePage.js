import React, { useState, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import Webcam from 'react-webcam';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const webcamRef = useRef(null);

  // Profile form
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [saving, setSaving] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);

  // Face registration
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [showFaceCamera, setShowFaceCamera] = useState(false);
  const [faceCapturing, setFaceCapturing] = useState(false);
  const [faceRegistered, setFaceRegistered] = useState(user?.faceRegistered || false);
  const [captureCount, setCaptureCount] = useState(0); // capture multiple angles

  // Load face-api.js models from CDN
  const loadModels = async () => {
    setLoadingModels(true);
    toast('Loading face recognition models... (first time takes 30 seconds)', { duration: 5000 });
    try {
      // Models are loaded from a public CDN
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
      toast.success('Face recognition ready!');
    } catch (err) {
      console.error('Model load error:', err);
      toast.error('Failed to load face models. Check internet connection.');
    } finally {
      setLoadingModels(false);
    }
  };

  // Open camera for face registration
  const startFaceRegistration = async () => {
    if (!modelsLoaded) {
      await loadModels();
    }
    setShowFaceCamera(true);
    setCaptureCount(0);
  };

  // Capture face and extract descriptor
  const captureFace = async () => {
    if (!webcamRef.current) return;
    setFaceCapturing(true);

    try {
      const video = webcamRef.current.video;

      // Detect face in the video frame
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        toast.error('No face detected! Make sure your face is clearly visible and well lit.');
        setFaceCapturing(false);
        return;
      }

      // Get the 128-number face descriptor
      const descriptor = Array.from(detection.descriptor);

      // Save to backend
      await api.post('/auth/save-face', { faceDescriptor: descriptor });

      setFaceRegistered(true);
      setShowFaceCamera(false);
      updateUser({ ...user, faceRegistered: true });
      toast.success('✅ Face registered successfully! You can now use face verification for attendance.');

    } catch (err) {
      console.error('Face capture error:', err);
      toast.error('Face capture failed. Please try again with better lighting.');
    } finally {
      setFaceCapturing(false);
    }
  };

  // Update profile
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/auth/update-profile', { name, phone, department });
      updateUser(data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  };

  // Change password
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return toast.error('New passwords do not match');
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setChangingPass(true);
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally { setChangingPass(false); }
  };

  const roleColor = {
    admin: 'bg-purple-500/20 text-purple-400',
    manager: 'bg-green-500/20 text-green-400',
    employee: 'bg-blue-500/20 text-blue-400'
  };
  const roleLabel = {
    admin: 'Administrator',
    manager: 'Faculty',
    employee: 'Student'
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-white text-2xl font-bold">My Profile</h1>

      {/* Profile Card */}
      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
        <div className="flex items-center gap-5 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-white text-xl font-bold">{user?.name}</h2>
            <p className="text-slate-400 text-sm">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full ${roleColor[user?.role] || ''}`}>
                {roleLabel[user?.role] || user?.role}
              </span>
              {user?.employeeId && (
                <span className="text-slate-500 text-xs">
                  {user.role === 'employee' ? '🎓' : '👨‍🏫'} {user.employeeId}
                </span>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <h3 className="text-slate-300 font-semibold">Update Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 text-xs mb-1 block">Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block">Phone</label>
              <input value={phone} onChange={e => setPhone(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <button type="submit" disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* ── FACE REGISTRATION SECTION ─────────────────────────── */}
      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
        <h3 className="text-white font-semibold mb-1 flex items-center gap-2">
          🤖 Face Registration
          {faceRegistered && (
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
              ✅ Registered
            </span>
          )}
        </h3>
        <p className="text-slate-400 text-sm mb-4">
          Register your face so the system can verify your identity during attendance.
          <br />
          <span className="text-yellow-400 text-xs">⚠️ You must register your face before marking attendance.</span>
        </p>

        {/* How it works */}
        <div className="bg-slate-700/30 rounded-xl p-4 mb-4 space-y-2">
          <p className="text-slate-300 text-xs font-semibold">How it works:</p>
          <p className="text-slate-400 text-xs">1️⃣ Click "Register My Face" below</p>
          <p className="text-slate-400 text-xs">2️⃣ Allow camera access</p>
          <p className="text-slate-400 text-xs">3️⃣ Look directly at the camera</p>
          <p className="text-slate-400 text-xs">4️⃣ Click "Capture Face" — system saves 128 unique face points</p>
          <p className="text-slate-400 text-xs">5️⃣ During attendance, live face is compared with saved face</p>
          <p className="text-slate-400 text-xs">6️⃣ If match score &gt; 60% → ✅ verified | If not → ❌ blocked</p>
        </div>

        {/* Camera for face registration */}
        {showFaceCamera ? (
          <div className="space-y-3">
            {/* Live camera feed */}
            <div className="relative rounded-xl overflow-hidden border-2 border-blue-500/40">
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="w-full rounded-xl"
                videoConstraints={{ facingMode: 'user', width: 480, height: 360 }}
              />
              {/* Face guide overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-56 border-4 border-blue-400/60 rounded-full"></div>
              </div>
              <div className="absolute bottom-3 left-0 right-0 text-center">
                <span className="bg-black/60 text-white text-xs px-3 py-1 rounded-full">
                  Position your face inside the oval
                </span>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
              <p className="text-blue-400 text-xs text-center">
                💡 Tips for best results: Good lighting · Face the camera directly · Remove glasses if possible
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={captureFace}
                disabled={faceCapturing}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {faceCapturing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Analyzing face...
                  </>
                ) : '📸 Capture & Register Face'}
              </button>
              <button
                onClick={() => setShowFaceCamera(false)}
                className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {faceRegistered && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                <p className="text-green-400 font-semibold">✅ Face Already Registered!</p>
                <p className="text-slate-400 text-xs mt-1">
                  Your face data is saved. You can re-register if your appearance changed significantly.
                </p>
              </div>
            )}

            <button
              onClick={startFaceRegistration}
              disabled={loadingModels}
              className={`w-full py-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${
                faceRegistered
                  ? 'bg-slate-700 hover:bg-slate-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              } disabled:opacity-50`}
            >
              {loadingModels ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Loading face models...
                </>
              ) : faceRegistered ? (
                '🔄 Re-register Face'
              ) : (
                '📸 Register My Face'
              )}
            </button>

            {!modelsLoaded && !loadingModels && (
              <p className="text-slate-500 text-xs text-center">
                Requires internet connection to load face recognition models (~5MB)
              </p>
            )}
          </div>
        )}
      </div>

      {/* Change Password */}
      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
        <h3 className="text-white font-semibold mb-4">🔒 Change Password</h3>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="text-slate-400 text-xs mb-1 block">Current Password</label>
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1 block">New Password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1 block">Confirm New Password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <button type="submit" disabled={changingPass}
            className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors">
            {changingPass ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Account Info */}
      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
        <h3 className="text-white font-semibold mb-4">📋 Account Details</h3>
        <div className="space-y-3">
          {[
            ['Email', user?.email],
            ['Role', roleLabel[user?.role] || user?.role],
            [user?.role === 'employee' ? 'Roll Number' : 'Employee ID', user?.employeeId || 'Not set'],
            ['Department', user?.department || 'Not set'],
            ['Face Registered', user?.faceRegistered ? '✅ Yes' : '❌ No'],
            ['Last Login', user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'],
            ['Member Since', user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'],
          ].map(([label, value], i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-slate-700/50">
              <span className="text-slate-400 text-sm">{label}</span>
              <span className="text-white text-sm font-medium">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}