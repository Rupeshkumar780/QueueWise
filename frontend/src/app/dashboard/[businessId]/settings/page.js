'use client';

import { useState, useEffect, use } from 'react';
import api from '@/lib/api';

export default function SettingsPage({ params }) {
  const resolvedParams = use(params);
  const businessId = resolvedParams.businessId;
  
  const [branch, setBranch] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    geofenceRadius: 100,
    isOpen: false,
    googleMapsUrl: ''
  });

  useEffect(() => {
    // In a real app we'd have a clean GET /businesses/:id for admins. 
    // We can fetch from customer-landing for now and map the data.
    api.get(`/businesses/${businessId}/customer-landing`).then(res => {
      setBranch(res.data);
      setFormData({
        name: res.data.branchName,
        address: res.data.address,
        geofenceRadius: res.data.geofenceRadius || 100,
        isOpen: res.data.isOpen,
        googleMapsUrl: res.data.googleMapsUrl || ''
      });
    });
  }, [businessId]);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/businesses/${businessId}/update`, {
        name: formData.name,
        address: formData.address,
        geofenceRadius: parseInt(formData.geofenceRadius),
        isOpen: formData.isOpen,
        googleMapsUrl: formData.googleMapsUrl
      });
      alert('Settings saved successfully');
    } catch (err) {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (!branch) return <div>Loading settings...</div>;

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Branch Settings</h2>
      
      <form onSubmit={handleSave} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
        <div>
          <label className="flex items-center space-x-3">
            <input 
              type="checkbox" 
              name="isOpen" 
              checked={formData.isOpen} 
              onChange={handleChange}
              className="w-5 h-5 text-blue-600 rounded"
            />
            <span className="font-medium text-gray-900">Branch is currently Open</span>
          </label>
          <p className="text-sm text-gray-500 mt-1 ml-8">When closed, customers cannot join queues.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Geofence Radius (meters)</label>
            <input 
              type="number" 
              name="geofenceRadius" 
              value={formData.geofenceRadius} 
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">Customers must be within this distance to join.</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input 
            type="text" 
            name="address" 
            value={formData.address} 
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Google Maps URL</label>
          <input 
            type="text" 
            name="googleMapsUrl" 
            value={formData.googleMapsUrl} 
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button 
            type="submit" 
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

