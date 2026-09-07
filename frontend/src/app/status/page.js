'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function StatusPage() {
  const [apiStatus, setApiStatus] = useState('checking'); // checking, online, offline

  useEffect(() => {
    // Ping the backend to check if it's alive
    api.get('/health') // or a similar light endpoint, we'll just hit root or a dummy to check connection
      .then(() => setApiStatus('online'))
      .catch((err) => {
        // Even if it's a 404, the server is responding. Network errors = offline.
        if (err.response) {
          setApiStatus('online');
        } else {
          setApiStatus('offline');
        }
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">System Status</h1>
              <p className="text-gray-500">Real-time status of QueueWise services.</p>
            </div>
            
            {apiStatus === 'checking' && (
              <div className="px-6 py-3 bg-gray-100 text-gray-600 rounded-full font-bold flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-gray-400 animate-pulse"></span>
                Checking Systems...
              </div>
            )}
            {apiStatus === 'online' && (
              <div className="px-6 py-3 bg-green-50 text-green-700 border border-green-200 rounded-full font-bold flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                All Systems Operational
              </div>
            )}
            {apiStatus === 'offline' && (
              <div className="px-6 py-3 bg-red-50 text-red-700 border border-red-200 rounded-full font-bold flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
                System Degradation
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            {/* Frontend App */}
            <div className="flex items-center justify-between p-5 border border-gray-100 rounded-xl bg-gray-50">
              <div>
                <h3 className="font-bold text-gray-900">Web Application</h3>
                <p className="text-sm text-gray-500">Customer and Admin interfaces</p>
              </div>
              <div className="text-green-600 font-bold flex items-center gap-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                Operational
              </div>
            </div>

            {/* API Services */}
            <div className="flex items-center justify-between p-5 border border-gray-100 rounded-xl bg-gray-50">
              <div>
                <h3 className="font-bold text-gray-900">API & Backend Services</h3>
                <p className="text-sm text-gray-500">Core database and queuing logic</p>
              </div>
              <div className={`${apiStatus === 'online' ? 'text-green-600' : (apiStatus === 'checking' ? 'text-gray-400' : 'text-red-600')} font-bold flex items-center gap-1`}>
                {apiStatus === 'online' ? (
                  <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Operational</>
                ) : apiStatus === 'checking' ? (
                  <>Checking...</>
                ) : (
                  <>Degraded</>
                )}
              </div>
            </div>

            {/* Realtime Socket */}
            <div className="flex items-center justify-between p-5 border border-gray-100 rounded-xl bg-gray-50">
              <div>
                <h3 className="font-bold text-gray-900">Real-time Sockets</h3>
                <p className="text-sm text-gray-500">Live queue updates and events</p>
              </div>
              <div className={`${apiStatus === 'online' ? 'text-green-600' : (apiStatus === 'checking' ? 'text-gray-400' : 'text-red-600')} font-bold flex items-center gap-1`}>
                {apiStatus === 'online' ? (
                  <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Operational</>
                ) : apiStatus === 'checking' ? (
                  <>Checking...</>
                ) : (
                  <>Degraded</>
                )}
              </div>
            </div>
          </div>
          
        </div>
      </main>
      <Footer />
    </div>
  );
}

