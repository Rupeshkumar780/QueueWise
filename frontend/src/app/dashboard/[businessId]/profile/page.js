'use client';

import { useState, useEffect, use } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function ProfilePage({ params }) {
  const resolvedParams = use(params);
  const businessId = resolvedParams.businessId;

  const [profile, setProfile] = useState(null);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    googleMapsUrl: '',
    latitude: '',
    longitude: '',
    geofenceRadius: 100,
    isOpen: true
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, bizRes] = await Promise.all([
          api.get('/auth/me'),
          api.get(`/businesses/${businessId}`)
        ]);
        
        setProfile(profileRes.data);
        setBusiness(bizRes.data);
        
        const b = bizRes.data;
        setFormData({
          name: b.name || '',
          description: b.description || '',
          address: b.address || '',
          city: b.city || '',
          googleMapsUrl: b.googleMapsUrl || '',
          latitude: b.latitude || '',
          longitude: b.longitude || '',
          geofenceRadius: b.geofenceRadius || 100,
          isOpen: b.isOpen !== undefined ? b.isOpen : true
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [businessId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/businesses/${businessId}/update`, {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        city: formData.city,
        googleMapsUrl: formData.googleMapsUrl,
        latitude: parseFloat(formData.latitude) || null,
        longitude: parseFloat(formData.longitude) || null,
        geofenceRadius: parseInt(formData.geofenceRadius),
        isOpen: formData.isOpen
      });
      toast.success('Profile and Settings updated successfully!');
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('You are not authorized to perform this action.');
      } else {
        toast.error('Failed to update settings');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-gray-500">Loading profile...</div>;
  if (!profile || !business) return <div className="text-red-500">Failed to load data.</div>;

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">My Profile & Settings</h2>
        <p className="text-gray-500 text-sm mt-1">Manage your account information and business configuration.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        
        {/* Personal Details (Read Only) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-6">Personal Details</h3>
          <div className="flex items-center gap-6 mb-6">
            <div className="w-16 h-16 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-2xl font-bold">
              {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{profile.name}</h3>
              <p className="text-gray-500">{profile.email}</p>
              <span className="inline-block mt-1 bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                {profile.role.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Operational Controls */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
          <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Operational Controls</h3>
          
          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input 
                type="checkbox" 
                name="isOpen" 
                checked={formData.isOpen} 
                onChange={handleChange}
                className="w-5 h-5 text-blue-600 rounded cursor-pointer"
              />
              <span className="font-semibold text-gray-900 text-lg">Business is currently Open</span>
            </label>
            <p className="text-sm text-gray-500 mt-1 ml-8">When closed, the business is completely offline and no customers can join any queues.</p>
          </div>
        </div>

        {/* Business Profile */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
          <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Business Profile</h3>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Business Name</label>
            <input 
              type="text" required
              name="name" 
              value={formData.name} 
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description / Tagline</label>
            <input 
              type="text" 
              name="description" 
              value={formData.description} 
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Full Address</label>
              <textarea 
                name="address" required
                rows="3"
                value={formData.address} 
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              ></textarea>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">City</label>
              <input 
                type="text" required
                name="city" 
                value={formData.city} 
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Location & Geofencing */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-2">Location Config</h3>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Google Maps Link</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input 
                  type="url" 
                  name="googleMapsUrl" 
                  value={formData.googleMapsUrl} 
                  onChange={handleChange}
                  placeholder="https://maps.app.goo.gl/..."
                  className="w-full flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none text-blue-600"
                />
                <button 
                  type="button"
                  onClick={async () => {
                    if (!formData.googleMapsUrl) {
                      toast.error('Please enter a maps link first');
                      return;
                    }
                    try {
                      const res = await api.post('/utils/expand-maps-url', { url: formData.googleMapsUrl });
                      if (res.data && res.data.lat && res.data.lng) {
                        setFormData(prev => ({...prev, latitude: res.data.lat, longitude: res.data.lng}));
                        toast.success('Coordinates fetched!');
                      }
                    } catch (err) {
                      toast.error('Could not extract coordinates from link');
                    }
                  }}
                  className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap text-sm"
                >
                  Fetch Coordinates
                </button>
              </div>
            </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Latitude</label>
              <input 
                type="number" step="any"
                name="latitude" 
                value={formData.latitude} 
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Longitude</label>
              <input 
                type="number" step="any"
                name="longitude" 
                value={formData.longitude} 
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Geofence Radius (meters)</label>
            <p className="text-xs text-gray-500 mb-2">Maximum distance a customer can be from your coordinates to join a queue.</p>
            <input 
              type="number" 
              name="geofenceRadius" 
              value={formData.geofenceRadius} 
              onChange={handleChange}
              disabled={profile.role === 'STAFF'}
              className="w-full sm:w-1/2 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>
        </div>
        </div>

        {profile.role !== 'STAFF' && (
          <div className="flex justify-end pb-12">
            <button 
              type="submit" 
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 px-8 rounded-lg shadow-md transition-colors"
            >
              {saving ? 'Saving...' : 'Save All Changes'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
