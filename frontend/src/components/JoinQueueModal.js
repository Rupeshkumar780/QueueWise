'use client';

import { useState } from 'react';

export default function JoinQueueModal({ service, isOpen, onClose, onJoin }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({});

  if (!isOpen || !service) return null;

  const handleJoin = async () => {
    setLoading(true);
    setError(null);

    try {
      let locationData = null;
      if (service.locationRequired || true) { // Always fetch for now as it's a core feature
        locationData = await new Promise((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser'));
          } else {
            navigator.geolocation.getCurrentPosition(
              (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
              (err) => reject(new Error('Please enable location services to join the queue.')),
              { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
          }
        });
      }

      await onJoin(service.id, { locationData, formData });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to join queue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>
        
        <h2 className="text-xl font-bold mb-2">Join {service.name}</h2>
        
        <div className="bg-blue-50 text-blue-800 p-3 rounded mb-4 text-sm">
          <p>Current queue: <strong>{service.waiting || 0} waiting</strong></p>
          <p>Estimated wait: <strong>~{service.estimatedWait || 15} min</strong></p>
        </div>

        <div className="mb-4">
          <div className="flex items-center text-sm text-green-700 mb-2">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            Location verification required
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm border border-red-100">
            {error}
          </div>
        )}

        <button 
          onClick={handleJoin} 
          disabled={loading}
          className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Verifying location...' : 'Join Queue'}
        </button>
      </div>
    </div>
  );
}

