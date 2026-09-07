'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [isBusiness, setIsBusiness] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const type = urlParams.get('type');
      const redirect = urlParams.get('redirect') || localStorage.getItem('redirect_after_login') || '';
      if (type === 'business') setIsBusiness(true);
      if (redirect) setRedirectUrl(redirect);
    }
  }, []);

  // Smart signup link: preserves both the type (business/customer) and the redirect URL
  const getSignupHref = () => {
    const params = new URLSearchParams();
    if (isBusiness) params.set('type', 'business');
    if (redirectUrl) params.set('redirect', redirectUrl);
    const qs = params.toString();
    return `/auth/signup${qs ? `?${qs}` : ''}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', formData);

      if (res.data && res.data.access_token) {
        localStorage.setItem('token', res.data.access_token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        toast.success('Welcome back!');

        const role = res.data.user.role;
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect') || localStorage.getItem('redirect_after_login');

        if (redirect) {
          localStorage.removeItem('redirect_after_login');
          window.location.href = redirect;
          router.push(redirect);
        } else if (role === 'BUSINESS_ADMIN' || role === 'STAFF') {
          try {
            const bizRes = await api.get('/businesses/my');
            if (bizRes.data && bizRes.data.length > 0) {
              window.location.href = `/dashboard/${bizRes.data[0].id}`;
              router.push(`/dashboard/${bizRes.data[0].id}`);
            } else {
              window.location.href = '/onboarding/business';
              router.push('/onboarding/business');
            }
          } catch {
            window.location.href = '/';
            router.push('/');
          }
        } else {
          // CUSTOMER with no specific redirect → Demo page
          window.location.href = '/demo';
          router.push('/demo');
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const [isResetMode, setIsResetMode] = useState(false);
  const [resetData, setResetData] = useState({ email: '', oldPassword: '', newPassword: '' });

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/reset-password', resetData);
      toast.success('Password updated! Please log in with your new password.');
      setIsResetMode(false);
      setFormData({ email: resetData.email, password: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password. Check your current password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-100 flex flex-col">
      <div className="flex-1 flex flex-col justify-center py-5 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md mx-auto">
          <div className="flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-0.5">
              <span className="text-4xl font-black text-red-500 tracking-tighter">Queue</span>
              <span className="text-4xl font-black text-gray-900 tracking-tighter">Wise</span>
            </Link>
          </div>

          {/* Context badge */}
          {isBusiness && (
            <div className="flex justify-center mb-4">
              <span className="inline-flex items-center gap-1.5 bg-gray-900 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                🏢 Business Owner Login
              </span>
            </div>
          )}

          <h2 className="text-center text-2xl font-extrabold text-gray-900">
            {isResetMode ? 'Update Your Password' : 'Sign in to your account'}
          </h2>

          {!isResetMode && (
            <p className="mt-2 text-center text-sm text-gray-600">
              {isBusiness ? "Don't have a business account? " : "New to QueueWise? "}
              <Link href={getSignupHref()} className="font-semibold text-blue-600 hover:text-blue-500">
                {isBusiness ? 'Register your business' : 'Create a free account'}
              </Link>
            </p>
          )}
        </div>

        <div className="mt-6 w-full max-w-md mx-auto">
          <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-blue-900/5 rounded-2xl border border-gray-200">
            {isResetMode ? (
              <form className="space-y-5" onSubmit={handleResetSubmit}>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email address</label>
                  <input type="email" required
                    className="mt-1 appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                    value={resetData.email}
                    onChange={(e) => setResetData({...resetData, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current / Temp Password</label>
                  <input type="password" required
                    className="mt-1 appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                    value={resetData.oldPassword}
                    onChange={(e) => setResetData({...resetData, oldPassword: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">New Password</label>
                  <input type="password" required minLength={6}
                    className="mt-1 appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                    value={resetData.newPassword}
                    onChange={(e) => setResetData({...resetData, newPassword: e.target.value})}
                  />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full flex justify-center py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-gray-900 hover:bg-gray-700 transition disabled:opacity-60">
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
                <div className="text-center">
                  <button type="button" onClick={() => setIsResetMode(false)} className="text-sm font-medium text-blue-600 hover:text-blue-500">
                    ← Back to login
                  </button>
                </div>
              </form>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email address</label>
                  <input type="email" required
                    className="mt-1 appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <button type="button" onClick={() => setIsResetMode(true)} className="text-xs font-medium text-gray-500 hover:text-blue-600">
                      Forgot / Temp password?
                    </button>
                  </div>
                  <input type="password" required
                    className="mt-1 appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full flex justify-center py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-60">
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            )}
          </div>

          {/* Business registration link at bottom */}
          {!isBusiness && !isResetMode && (
            <p className="mt-4 text-center text-xs text-gray-400">
              Are you a business owner?{' '}
              <Link href="/auth/signup?type=business" className="font-semibold text-gray-600 hover:text-gray-900 underline underline-offset-2">
                Register your business →
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
