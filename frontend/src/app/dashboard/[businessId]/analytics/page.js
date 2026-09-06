'use client';

import { useState, useEffect, use } from 'react';
import api from '@/lib/api';

export default function AnalyticsPage({ params }) {
  const resolvedParams = use(params);
  const businessId = resolvedParams.businessId;

  // Mock data for charts
  const queueCrowd = [12, 25, 42, 38, 20, 15, 30, 45, 35, 18];
  const timeLabels = ['9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM'];
  
  const dailyActivity = [
    { day: 'Mon', count: 145 },
    { day: 'Tue', count: 162 },
    { day: 'Wed', count: 132 },
    { day: 'Thu', count: 185 },
    { day: 'Fri', count: 156 },
  ];

  const distribution = [
    { name: 'General Checkup', value: 42, color: 'bg-blue-500' },
    { name: 'Pharmacy', value: 31, color: 'bg-purple-500' },
    { name: 'Billing', value: 17, color: 'bg-green-500' },
    { name: 'Other', value: 10, color: 'bg-gray-400' },
  ];

  const performance = [
    { name: 'Counter 1', avg: 5.2 },
    { name: 'Counter 2', avg: 7.4 },
    { name: 'Counter 3', avg: 5.7 },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Business Analytics</h2>
        <p className="text-gray-500 text-sm mt-1">Review your queue performance and customer distribution.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Queue Crowd */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-6">Queue Crowd Today</h3>
          <div className="h-48 flex items-end gap-2 px-2">
            {queueCrowd.map((val, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-blue-100 rounded-t-md relative group">
                  <div 
                    className="absolute bottom-0 w-full bg-blue-500 rounded-t-md transition-all" 
                    style={{ height: `${(val / 50) * 100}%` }}
                  ></div>
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded">
                    {val}
                  </div>
                </div>
                <div className="text-[10px] text-gray-500 font-medium -rotate-45 origin-top-left mt-2">{timeLabels[idx]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-6">Daily Activity (Served)</h3>
          <div className="space-y-4">
            {dailyActivity.map((day) => (
              <div key={day.day} className="flex items-center gap-4">
                <div className="w-8 text-sm font-semibold text-gray-600">{day.day}</div>
                <div className="flex-1 bg-gray-100 h-6 rounded-full overflow-hidden">
                  <div 
                    className="bg-purple-500 h-full rounded-full" 
                    style={{ width: `${(day.count / 200) * 100}%` }}
                  ></div>
                </div>
                <div className="w-10 text-right text-sm font-bold text-gray-800">{day.count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-6">Customer Distribution</h3>
          <div className="space-y-4">
            {distribution.map((item) => (
              <div key={item.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{item.name}</span>
                  <span className="font-bold text-gray-900">{item.value}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className={`${item.color} h-2 rounded-full`} style={{ width: `${item.value}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Counter Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-6">Counter Performance (Avg Wait)</h3>
          <div className="grid gap-4">
            {performance.map((c) => (
              <div key={c.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="font-semibold text-gray-800">{c.name}</div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-green-600">{c.avg}</span>
                  <span className="text-sm text-gray-500 font-medium">min/customer</span>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 opacity-60">
              <div className="font-semibold text-gray-800">Counter 4</div>
              <div className="text-sm text-gray-500 font-medium uppercase tracking-wider">Offline</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
