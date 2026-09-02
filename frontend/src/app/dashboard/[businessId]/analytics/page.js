'use client';

import { useState, useEffect, use } from 'react';
import api from '@/lib/api';

export default function AnalyticsPage({ params }) {
  const resolvedParams = use(params);
  const businessId = resolvedParams.businessId;
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get(`/businesses/${businessId}/dashboard-stats`);
        setStats(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, [businessId]);

  if (!stats) return <div>Loading analytics...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500 uppercase">Customers Served Today</div>
          <div className="text-4xl font-black text-gray-900 mt-2">{stats.servedToday}</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500 uppercase">Currently Waiting</div>
          <div className="text-4xl font-black text-blue-600 mt-2">{stats.waiting}</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500 uppercase">Avg Wait Time</div>
          <div className="text-4xl font-black text-gray-900 mt-2">{stats.avgWaitMins}m</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500 uppercase">Queue Health</div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{stats.queueHealth}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-80 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
          <p>Detailed historical charts will be implemented in Phase 5</p>
        </div>
      </div>
    </div>
  );
}

