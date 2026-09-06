'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import api from '@/lib/api';

export default function DashboardLayout({ children, params }) {
  const pathname = usePathname();
  const router = useRouter();
  const resolvedParams = use(params);
  const businessId = resolvedParams.businessId;

  const [business, setBusiness] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsAuthenticated(false);
        return false;
      }
      return true;
    };

    if (!checkAuth()) return;

    async function load() {
      try {
        const res = await api.get(`/businesses/${businessId}`);
        if (res.data) setBusiness(res.data);
      } catch (err) {
        console.error(err);
      }
    }
    load();

    // Cross-tab logout listener
    const handleStorageChange = (e) => {
      if (e.key === 'token' && !e.newValue) {
        // Token was removed in another tab
        setIsAuthenticated(false);
        router.push('/auth/login');
      } else if (!e.key && !localStorage.getItem('token')) {
        // Fallback if key is null (e.g. clear() was called)
        setIsAuthenticated(false);
        router.push('/auth/login');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [businessId, router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  const navItems = [
    { name: 'Dashboard', href: `/dashboard/${businessId}` },
    { name: 'Manage Staff', href: `/dashboard/${businessId}/staff` },
    { name: 'Counters', href: `/dashboard/${businessId}/counters` },
    { name: 'Customers', href: `/dashboard/${businessId}/customers` },
    { name: 'Analytics', href: `/dashboard/${businessId}/analytics` },
    { name: 'QR Gen', href: `/dashboard/${businessId}/qr-gen` },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900 font-sans print:bg-white print:h-auto print:block">
      {/* Top Header */}
      <header className="print:hidden bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between z-20 shadow-sm relative">
        <div className="flex items-center gap-4">
          <button 
            className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate max-w-[200px] sm:max-w-xs">{business ? business.name : 'Loading...'}</h1>
              {business && business.googleMapsUrl && (
                <a 
                  href={business.googleMapsUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center hover:opacity-80 transition-opacity flex-shrink-0"
                  title="Open in Google Maps"
                >
                  <img
                    src="/google-maps-icon.png"
                    alt="Open in Google Maps"
                    className="w-8 h-8"
                  />
                </a>
              )}
            </div>
            {business && (
              <div className="flex items-center text-xs sm:text-sm text-gray-500 mt-0.5 truncate max-w-[250px] sm:max-w-sm">
                <span className="hidden md:inline">{business.address}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4 relative">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold text-gray-900">{isAuthenticated ? 'Admin Profile' : 'Guest'}</div>
            <div className="text-xs text-gray-500">{isAuthenticated ? 'Business Owner' : 'Not logged in'}</div>
          </div>
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {isAuthenticated ? 'A' : '?'}
          </button>
          
          {isProfileOpen && (
            <div className="absolute top-12 right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
              {isAuthenticated ? (
                <>
                  <Link 
                    href={`/dashboard/${businessId}/profile`} 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    My Profile
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium border-t border-gray-100"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <Link 
                  href="/auth/login" 
                  className="w-full text-left block px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 font-medium"
                >
                  Log in
                </Link>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative print:block print:overflow-visible">
        {!isAuthenticated ? (
          <main className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center print:hidden">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center max-w-md w-full mx-4">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
              <p className="text-gray-500 mb-8">You need to log in to access this business dashboard.</p>
              <Link href="/auth/login" className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors">
                Go to Login
              </Link>
            </div>
          </main>
        ) : (
          <>
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
              <div 
                className="fixed inset-0 bg-black/50 z-20 md:hidden print:hidden" 
                onClick={() => setIsSidebarOpen(false)}
              ></div>
            )}

            {/* Sidebar */}
            <aside className={`
              print:hidden
              absolute md:relative z-30 h-full w-64 bg-gradient-to-b from-slate-800 via-slate-600 to-slate-800 text-white flex flex-col flex-shrink-0 transition-transform duration-300 ease-in-out
              ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
              <div className="p-4 border-b border-slate-800">
                <p className="text-s font-semibold text-slate-300 uppercase tracking-wider">Queue Operations</p>
                <p className="text-xs text-slate-300 mt-1">Powered by QueueWise</p>
              </div>
              
              <nav className="flex-1 py-4 overflow-y-auto">
                <ul className="space-y-1 px-3">
                  {navItems.map(item => {
                    const isActive = pathname === item.href;
                    return (
                      <li key={item.name}>
                        <Link 
                          href={item.href}
                          onClick={() => setIsSidebarOpen(false)}
                          className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                        >
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
              
              <div className="p-4 border-t border-slate-800">
                <Link href="/" className="text-sm text-slate-400 hover:text-white flex items-center gap-2">
                  <span>&larr;</span> Exit Dashboard
                </Link>
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-gray-50 print:bg-white print:overflow-visible print:block">
              <div className="p-4 sm:p-8 max-w-7xl mx-auto print:p-0 print:m-0 print:max-w-none">
                {children}
              </div>
            </main>
          </>
        )}
      </div>
    </div>
  );
}
