/**
 * Attendance Page
 * Real face verification using face-api.js
 * Compares live face with stored face descriptor from database
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import Webcam from 'react-webcam';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

// Distance between two GPS points in meters (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat/2)**2 +
    Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

export default function AttendancePage() {
  const { user } = useAuth();
  const webcamRef = useRef(null);

  const [todayAttendance, setTodayAttendance] = useState(null);
  const [geofenceInfo, setGeofenceInfo] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  // GPS state
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [distance, setDistance] = useState(null);

  // Face verification state
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [faceVerified, setFaceVerified] = useState(false);
  const [faceVerifying, setFaceVerifying] = useState(false);
  const [faceMatchScore, setFaceMatchScore] = useState(null);

  // Submit state
  const [loading, setLoading] = useState(false);

  // Load today's attendance and geofence info
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [attendRes, geoRes] = await Promise.all([
          api.get('/attendance/today'),
          api.get('/geofence/active')
        ]);
        setTodayAttendance(attendRes.data.attendance);
        setGeofenceInfo(geoRes.data.geofence);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  // Load face-api.js models
  const loadFaceModels = async () => {
    if (modelsLoaded) return true;
    setLoadingModels(true);
    toast('Loading face recognition models...', { duration: 3000 });
    try {
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
      return true;
    } catch (err) {
      toast.error('Failed to load face models. Check internet connection.');
      return false;
    } finally {
      setLoadingModels(false);
    }
  };

  // Get GPS location
  const getLocation = useCallback(() => {
    setLocationError(null);
    setLocation(null);
    setDistance(null);
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported by your browser');
      return;
    }
    toast('📍 Getting your location...', { duration: 2000 });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        };
        setLocation(coords);
        if (geofenceInfo) {
          const dist = calculateDistance(
            coords.latitude, coords.longitude,
            geofenceInfo.center.latitude, geofenceInfo.center.longitude
          );
          setDistance(Math.round(dist));
        }
        toast.success('📍 Location detected!');
      },
      () => setLocationError('Location access denied. Please enable location in browser settings.'),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [geofenceInfo]);

  // Open camera for face verification
  const openCamera = async () => {
    // Check if face is registered first
    if (!user?.faceRegistered) {
      toast.error('❌ You have not registered your face yet! Go to Profile → Register My Face first.');
      return;
    }
    const loaded = await loadFaceModels();
    if (loaded) setShowCamera(true);
  };

  // ── CORE: Real face verification ─────────────────────────────────────
  // This compares the live face with the face saved in the database
  const verifyFace = async () => {
    if (!webcamRef.current) return;
    setFaceVerifying(true);
    toast('🔍 Scanning your face...', { duration: 2000 });

    try {
      const video = webcamRef.current.video;

      // Step 1: Detect face in live camera
      const liveDetection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!liveDetection) {
        toast.error('❌ No face detected! Make sure your face is clearly visible.');
        setFaceVerifying(false);
        return;
      }

      // Step 2: Get the stored face descriptor from backend
      const { data } = await api.get('/auth/my-face-descriptor');

      if (!data.faceDescriptor || data.faceDescriptor.length === 0) {
        toast.error('❌ No face registered. Go to Profile → Register My Face first.');
        setFaceVerifying(false);
        setShowCamera(false);
        return;
      }

      // Step 3: Compare live face with stored face
      // Convert stored array back to Float32Array for face-api.js
      const storedDescriptor = new Float32Array(data.faceDescriptor);
      const liveDescriptor = liveDetection.descriptor;

      // Calculate Euclidean distance between two face descriptors
      // Lower distance = more similar faces
      // Distance < 0.5 = same person (strict)
      // Distance < 0.6 = same person (normal)
      const distance = faceapi.euclideanDistance(liveDescriptor, storedDescriptor);
      const matchScore = Math.max(0, Math.round((1 - distance) * 100));
      const THRESHOLD = 0.6; // 60% similarity required

      console.log('Face distance:', distance, 'Match score:', matchScore + '%');

      if (distance < THRESHOLD) {
        // ✅ FACE MATCHED
        setFaceVerified(true);
        setFaceMatchScore(matchScore);
        setShowCamera(false);
        toast.success(`✅ Face verified! Match: ${matchScore}%`);
      } else {
        // ❌ FACE DID NOT MATCH
        setFaceVerified(false);
        setFaceMatchScore(matchScore);
        toast.error(`❌ Face does not match! Score: ${matchScore}%. This is not your registered face.`);
      }

    } catch (err) {
      console.error('Face verification error:', err);
      if (err.response?.status === 404) {
        toast.error('No face registered. Go to Profile → Register My Face.');
      } else {
        toast.error('Face verification failed. Please try again.');
      }
    } finally {
      setFaceVerifying(false);
    }
  };

  // Check In
  const handleCheckIn = async () => {
    if (!location) return toast.error('❌ Please get your GPS location first');

    if (geofenceInfo && distance !== null && distance > geofenceInfo.radius) {
      return toast.error(`❌ You are outside the classroom! You are ${distance}m away. Max allowed: ${geofenceInfo.radius}m`);
    }

    if (!faceVerified) {
      return toast.error('❌ Face verification required before checking in');
    }

    setLoading(true);
    try {
      const { data } = await api.post('/attendance/check-in', {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        verificationMethod: 'face',
        faceMatchScore: faceMatchScore / 100
      });
      setTodayAttendance(data.attendance);
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  // Check Out
  const handleCheckOut = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/attendance/check-out', {
        latitude: location?.latitude,
        longitude: location?.longitude
      });
      setTodayAttendance(data.attendance);
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-out failed');
    } finally {
      setLoading(false);
    }
  };

  const isCheckedIn = todayAttendance?.checkInTime;
  const isCheckedOut = todayAttendance?.checkOutTime;
  const isInsideGeofence = geofenceInfo && distance !== null ? distance <= geofenceInfo.radius : !geofenceInfo;
  const step1Done = location !== null && isInsideGeofence;
  const step2Done = faceVerified;
  const canCheckIn = step1Done && step2Done;

  if (loadingData) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-white text-2xl font-bold">Mark Attendance</h1>
        <p className="text-slate-400 text-sm mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Today's Status */}
      <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">Today's Status</h2>
          {todayAttendance && (
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
              todayAttendance.status === 'present' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
              todayAttendance.status === 'late' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
              'bg-red-500/20 text-red-400 border-red-500/30'
            }`}>
              {todayAttendance.status?.charAt(0).toUpperCase() + todayAttendance.status?.slice(1)}
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            ['Check-In', isCheckedIn ? new Date(todayAttendance.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--'],
            ['Check-Out', isCheckedOut ? new Date(todayAttendance.checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--'],
            ['Hours', todayAttendance?.totalHoursWorked ? `${todayAttendance.totalHoursWorked}h` : '--']
          ].map(([l, v]) => (
            <div key={l} className="bg-slate-700/50 rounded-xl p-3 text-center">
              <p className="text-slate-400 text-xs mb-1">{l}</p>
              <p className="text-white font-bold text-sm">{v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Face not registered warning */}
      {!user?.faceRegistered && !isCheckedIn && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <p className="text-red-400 font-semibold text-sm">⚠️ Face Not Registered!</p>
          <p className="text-slate-300 text-xs mt-1">
            You must register your face before marking attendance.
            Go to <strong>Profile → Register My Face</strong>
          </p>
        </div>
      )}

      {/* Steps required */}
      {!isCheckedIn && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <p className="text-blue-400 font-semibold text-sm mb-2">✅ Complete both steps to check in:</p>
          <p className={`text-sm flex items-center gap-2 ${step1Done ? 'text-green-400' : 'text-slate-400'}`}>
            {step1Done ? '✅' : '⬜'} Step 1: GPS must be inside classroom
          </p>
          <p className={`text-sm flex items-center gap-2 ${step2Done ? 'text-green-400' : 'text-slate-400'}`}>
            {step2Done ? '✅' : '⬜'} Step 2: Face must match your registered face
          </p>
        </div>
      )}

      {/* STEP 1: GPS */}
      {!isCheckedIn && (
        <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold ${step1Done ? 'bg-green-500 text-white' : 'bg-slate-600 text-slate-300'}`}>1</span>
              📍 GPS Location
            </h2>
            <button onClick={getLocation}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-xl">
              {location ? '🔄 Refresh' : 'Get Location'}
            </button>
          </div>

          {locationError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 text-sm mb-3">
              {locationError}
            </div>
          )}

          {location ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-700/50 rounded-lg p-2">
                  <p className="text-slate-400 text-xs">Latitude</p>
                  <p className="text-white text-xs font-mono">{location.latitude.toFixed(6)}</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-2">
                  <p className="text-slate-400 text-xs">Longitude</p>
                  <p className="text-white text-xs font-mono">{location.longitude.toFixed(6)}</p>
                </div>
              </div>
              {geofenceInfo ? (
                <div className={`rounded-xl p-3 border ${isInsideGeofence ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-sm font-semibold ${isInsideGeofence ? 'text-green-400' : 'text-red-400'}`}>
                      {isInsideGeofence ? '✅ Inside classroom' : '❌ Outside classroom!'}
                    </span>
                    <span className="text-slate-400 text-xs">{distance}m away</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${isInsideGeofence ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(100, (distance / geofenceInfo.radius) * 100)}%` }} />
                  </div>
                  <p className="text-slate-500 text-xs mt-1">{geofenceInfo.name} · Allowed: {geofenceInfo.radius}m radius</p>
                </div>
              ) : (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                  <p className="text-yellow-400 text-xs">⚠️ No classroom zone set. Ask admin to set geofence.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-500">
              <div className="text-3xl mb-2">🗺️</div>
              <p className="text-sm">Click "Get Location" to detect your position</p>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: Real Face Verification */}
      {!isCheckedIn && (
        <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
          <h2 className="text-white font-semibold flex items-center gap-2 mb-3">
            <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold ${step2Done ? 'bg-green-500 text-white' : 'bg-slate-600 text-slate-300'}`}>2</span>
            🤖 Face Verification
            <span className="text-red-400 text-xs font-normal">(Required)</span>
          </h2>

          {faceVerified ? (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
              <p className="text-green-400 font-bold text-lg">✅ Face Verified!</p>
              <p className="text-slate-300 text-sm mt-1">Match Score: <strong className="text-green-400">{faceMatchScore}%</strong></p>
              <p className="text-slate-400 text-xs mt-1">Your identity has been confirmed</p>
              <button onClick={() => { setFaceVerified(false); setFaceMatchScore(null); }}
                className="mt-2 text-xs text-slate-400 hover:text-white underline">
                Verify again
              </button>
            </div>
          ) : showCamera ? (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden border-2 border-blue-500/40">
                <Webcam
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className="w-full rounded-xl"
                  videoConstraints={{ facingMode: 'user', width: 480, height: 360 }}
                />
                {/* Oval face guide */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-44 h-52 border-4 border-blue-400/70 rounded-full"></div>
                </div>
                <div className="absolute bottom-3 left-0 right-0 text-center">
                  <span className="bg-black/60 text-white text-xs px-3 py-1 rounded-full">
                    Center your face in the oval
                  </span>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
                <p className="text-blue-400 text-xs">
                  System will compare your live face with your registered face
                </p>
              </div>

              <div className="flex gap-3">
                <button onClick={verifyFace} disabled={faceVerifying}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2">
                  {faceVerifying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Comparing faces...
                    </>
                  ) : '🔍 Verify My Face'}
                </button>
                <button onClick={() => setShowCamera(false)}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-4 rounded-xl transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {!user?.faceRegistered && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  <p className="text-red-400 text-sm">❌ Face not registered! Go to Profile first.</p>
                </div>
              )}
              <button
                onClick={openCamera}
                disabled={loadingModels || !user?.faceRegistered}
                className="w-full py-6 border-2 border-dashed border-slate-600 hover:border-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-400 hover:text-blue-400 rounded-xl transition-colors flex flex-col items-center gap-2"
              >
                {loadingModels ? (
                  <>
                    <div className="w-6 h-6 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
                    <span className="text-sm">Loading face models...</span>
                  </>
                ) : (
                  <>
                    <span className="text-3xl">📸</span>
                    <span className="text-sm font-medium">Open Camera to Verify Face</span>
                    <span className="text-xs">Your face will be compared with registered face</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Check In / Out Buttons */}
      <div className="space-y-3">
        {!isCheckedIn ? (
          <button onClick={handleCheckIn} disabled={loading || !canCheckIn}
            className={`w-full font-bold py-4 rounded-2xl text-lg flex items-center justify-center gap-2 transition-all ${
              canCheckIn
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}>
            {loading
              ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              : canCheckIn ? '✅ Check In Now' : '🔒 Complete both steps to check in'}
          </button>
        ) : !isCheckedOut ? (
          <button onClick={handleCheckOut} disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white font-bold py-4 rounded-2xl text-lg flex items-center justify-center gap-2">
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : '🚪'}
            Check Out
          </button>
        ) : (
          <div className="w-full bg-slate-700 text-slate-300 font-bold py-4 rounded-2xl text-center text-lg">
            ✅ Attendance completed for today!
          </div>
        )}
      </div>

      {geofenceInfo && (
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 text-center">
          <p className="text-slate-400 text-sm">
            Class Hours: <span className="text-white">{geofenceInfo.workingHours?.startTime} - {geofenceInfo.workingHours?.endTime}</span>
            &nbsp;·&nbsp; Late after: <span className="text-yellow-400">+{geofenceInfo.workingHours?.lateThresholdMinutes} min</span>
          </p>
        </div>
      )}
    </div>
  );
}