'use client';

import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', formData);
      
      if (res.data && res.data.access_token) {
        localStorage.setItem('token', res.data.access_token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        toast.success('Welcome back!');
        
        // Check if there's a redirect in URL
        const urlParams = new URLSearchParams(window.location.search);
        const redirectUrl = urlParams.get('redirect');
        
        if (redirectUrl) {
          window.location.href = redirectUrl;
        } else if (res.data.user.role === 'BUSINESS_ADMIN' || res.data.user.role === 'STAFF') {
          // Fetch businesses to find where to redirect
          try {
            const bizRes = await api.get('/businesses/my');
            if (bizRes.data && bizRes.data.length > 0) {
              window.location.href = `/dashboard/${bizRes.data[0].id}`;
            } else {
              window.location.href = '/onboarding/business';
            }
          } catch (err) {
            window.location.href = '/';
          }
        } else {
          window.location.href = '/';
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-slate-300 flex flex-col">
      <div className="flex-1 flex flex-col justify-center py-5 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md mx-auto">
          <div className="flex justify-center mb-10">
            <span className="text-5xl font-black text-red-500 tracking-tighter">Queue</span>
            <span className="text-5xl font-black text-black tracking-tighter">Wise</span>
          </div>
          <h2 className="mt-20 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/auth/signup" className="font-medium text-blue-600 hover:text-blue-500">
              create a new organization account
            </Link>
          </p>
        </div>

        <div className="mt-8 w-full max-w-md mx-auto">
          <div className="bg-white py-8 px-4 sm:px-10 shadow-xl shadow-blue-900/5 rounded-xl border border-gray-300">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email address</label>
                <div className="mt-1">
                  <input
                    type="email"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <div className="mt-1">
                  <input
                    type="password"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 transition-colors"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

