'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [isBusiness, setIsBusiness] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('type') === 'business') {
        setIsBusiness(true);
      }
      // Store redirect param for use after signup
      const redirect = urlParams.get('redirect');
      if (redirect) {
        localStorage.setItem('redirect_after_login', redirect);
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: isBusiness ? 'BUSINESS_ADMIN' : 'CUSTOMER'
      });
      
      if (res.data && res.data.access_token) {
        localStorage.setItem('token', res.data.access_token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        toast.success('Account created successfully!');
        
        if (isBusiness) {
          window.location.href = '/onboarding/business';
          router.push('/onboarding/business');
        } else {
          // Customers return to their business page, or use the demo page when no business was saved.
          const redirect = typeof window !== 'undefined'
            ? localStorage.getItem('redirect_after_login')
              || localStorage.getItem('customer_dashboard_url')
              || (localStorage.getItem('lastVisitedBusinessId')
                ? `/business/${localStorage.getItem('lastVisitedBusinessId')}`
                : null)
            : null;
          if (redirect) {
            localStorage.removeItem('redirect_after_login');
            window.location.href = redirect;
            router.push(redirect);
          } else {
            window.location.href = '/demo';
            router.push('/demo');
          }
        }
      } else {
        throw new Error('Registration succeeded but no token was returned.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex flex-col">
      <div className="flex-1 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md mx-auto">
          <div className="flex justify-center mb-8">
            <span className="text-4xl font-black text-red-500 tracking-tighter">Queue</span>
            <span className="text-4xl font-black text-gray-900 tracking-tighter">Wise</span>
          </div>
          
          {isBusiness && (
            <div className="flex justify-center mb-4">
              <span className="inline-flex items-center gap-1.5 bg-gray-900 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                🏢 Business Registration
              </span>
            </div>
          )}

          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            {isBusiness ? 'Create your Owner Account' : 'Create a Customer Account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/auth/login" className="font-semibold text-blue-600 hover:text-blue-500">
              sign in to your existing account
            </Link>
          </p>
        </div>

        <div className="mt-8 w-full max-w-md mx-auto">
          <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-gray-200/50 rounded-2xl border border-gray-200">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text" required
                  className="mt-1 appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email address</label>
                <input
                  type="email" required
                  className="mt-1 appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password" required minLength={6}
                  className="mt-1 appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 rounded-lg shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-60"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

