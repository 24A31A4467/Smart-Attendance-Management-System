import React from 'react';

export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-400 text-sm">{message}</p>
      </div>
    </div>
  );
}
