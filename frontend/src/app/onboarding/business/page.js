'use client';

import { useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function CreateBusinessPage() {
  const [formData, setFormData] = useState({ 
    name: '', 
    description: '',
    address: '',
    city: '',
    googleMapsUrl: '',
    latitude: '',
    longitude: '',
    geofenceRadius: 100
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fetchingCoords, setFetchingCoords] = useState(false);

  const handleFetchCoords = async () => {
    if (!formData.googleMapsUrl) {
      toast.error('Please enter a Google Maps URL first');
      return;
    }
    setFetchingCoords(true);
    try {
      const res = await api.post('/utils/expand-maps-url', { url: formData.googleMapsUrl });
      if (res.data && res.data.lat && res.data.lng) {
        setFormData(prev => ({
          ...prev,
          latitude: res.data.lat,
          longitude: res.data.lng
        }));
        toast.success('Coordinates extracted successfully!');
      }
    } catch (err) {
      toast.error('Failed to extract coordinates from URL. Ensure the backend is running and the URL is valid.');
    } finally {
      setFetchingCoords(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...formData,
        latitude: parseFloat(formData.latitude) || null,
        longitude: parseFloat(formData.longitude) || null,
        geofenceRadius: parseInt(formData.geofenceRadius, 10) || 100,
      };
      const res = await api.post('/businesses', payload);
      
      // Setup complete! Go straight to the dashboard for this new business
      if (res.data && res.data.id) {
        window.location.href = `/dashboard/setup-complete?businessId=${res.data.id}`;
      } else {
        throw new Error('No business ID returned');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create business');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-slate-300 flex flex-col">
      <div className="flex-1 flex flex-col justify-center py-5 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-5xl mx-auto">
          <div className="flex justify-center mb-10">
            <span className="text-5xl font-black text-red-500 tracking-tighter">Queue</span>
            <span className="text-5xl font-black text-black tracking-tighter">Wise</span>
          </div>
          <h2 className="mt-10 text-center text-3xl font-extrabold text-gray-900">
            Set Up Your Location
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Tell us about your organization and where it is located.
          </p>
        </div>

        <div className="mt-8 w-full max-w-150 mx-auto">
          <div className="bg-white w-full py-8 px-4 sm:px-6 lg:px-10 shadow-xl shadow-blue-900/5 rounded-xl border border-gray-300">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}
            <form className="space-y-6" onSubmit={handleSubmit}>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700">Organization Name <span className="text-red-500">*</span></label>
                  <input
                    required
                    placeholder="e.g. City General Hospital"
                    className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700">City <span className="text-red-500">*</span></label>
                  <input
                    required
                    placeholder="e.g. New Delhi"
                    className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description (Optional)</label>
                <div className="mt-1">
                  <textarea
                    rows={2}
                    placeholder="This will be displayed to customers."
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Full Address <span className="text-red-500">*</span></label>
                <textarea
                  required
                  rows={2}
                  className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Google Maps URL</label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="url"
                    placeholder="https://maps.app.goo.gl/..."
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                    value={formData.googleMapsUrl}
                    onChange={(e) => setFormData({...formData, googleMapsUrl: e.target.value})}
                  />
                  <button
                    type="button"
                    onClick={handleFetchCoords}
                    disabled={fetchingCoords}
                    className="inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-200"
                  >
                    {fetchingCoords ? 'Fetching...' : 'Fetch Coordinates'}
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Geofencing Configuration</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Latitude <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="e.g. 28.6139"
                      className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 bg-gray-50"
                      value={formData.latitude}
                      onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Longitude <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="e.g. 77.2090"
                      className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 bg-gray-50"
                      value={formData.longitude}
                      onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">Allowed Check-in Radius (meters) <span className="text-red-500">*</span></label>
                  <p className="text-xs text-gray-500 mb-2">Customers must be within this distance to join the queue.</p>
                  <input
                    type="number"
                    min="10"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                    value={formData.geofenceRadius}
                    onChange={(e) => setFormData({...formData, geofenceRadius: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 transition-colors"
                >
                  {loading ? 'Creating...' : 'Complete Setup'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
