'use client';

import { useState, useEffect, use } from 'react';
import api from '@/lib/api';
import { socket } from '@/lib/socket';

export default function LiveOperationsPage({ params }) {
  const resolvedParams = use(params);
  const businessId = resolvedParams.businessId;

  const [liveData, setLiveData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [liveRes, statsRes] = await Promise.all([
        api.get(`/businesses/${businessId}/live-operations`),
        api.get(`/businesses/${businessId}/dashboard-stats`)
      ]);
      setLiveData(liveRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    socket.connect();
    socket.emit('join-business-room', { businessId });

    const handleUpdate = () => fetchData();
    socket.on('business_updated', handleUpdate);

    return () => {
      socket.off('business_updated', handleUpdate);
      socket.emit('leave-business-room', { businessId });
    };
  }, [businessId]);

  const handleCallNext = async (queueId, counterId) => {
    try {
      await api.post(`/queue-entries/queue/${queueId}/call-next`, { counterId });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error calling next');
    }
  };

  const handleComplete = async (entryId, counterId) => {
    try {
      await api.post(`/queue-entries/${entryId}/complete`, { counterId });
      fetchData();
    } catch (err) {
      alert('Error completing service');
    }
  };

  const handleNoShow = async (entryId, counterId) => {
    if (!confirm('Mark as No-Show?')) return;
    try {
      await api.post(`/queue-entries/${entryId}/no-show`, { counterId });
      fetchData();
    } catch (err) {
      alert('Error updating status');
    }
  };

  const toggleCounterStatus = async (counter) => {
    const newStatus = counter.status === 'OFFLINE' ? 'AVAILABLE' : 'OFFLINE';
    try {
      await api.post(`/counters/${counter.id}/status`, { status: newStatus });
      fetchData(); // Socket might not broadcast counter-only changes yet, so manual fetch
    } catch (err) {
      alert('Error updating counter status');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-600 font-medium">Loading Live Operations...</p>
      </div>
    );
  }
  
  if (!liveData) return <div className="p-8 text-red-600 font-medium">Error loading data.</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Live Operations</h2>
        <div className="flex gap-4 text-sm font-medium">
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
            Wait list: <span className="text-blue-600 ml-1">{stats?.waiting || 0}</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
            Served: <span className="text-green-600 ml-1">{stats?.servedToday || 0}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Counters & Now Serving */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Counters</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {liveData.counters.map(counter => {
              const servingEntry = liveData.nowServing.find(e => e.counterId === counter.id);
              
              return (
                <div key={counter.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gray-100 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                    <span className="font-bold text-gray-700">{counter.name}</span>
                    <button 
                      onClick={() => toggleCounterStatus(counter)}
                      className={`text-xs font-semibold px-2 py-1 rounded ${counter.status === 'OFFLINE' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
                    >
                      {counter.status}
                    </button>
                  </div>
                  
                  <div className="p-4">
                    {servingEntry ? (
                      <div className="space-y-4">
                        <div>
                          <div className="text-xs text-gray-700 font-medium uppercase tracking-wider mb-1">Serving</div>
                          <div className="flex items-end gap-2">
                            <span className="text-4xl font-black text-gray-900">#{servingEntry.tokenNumber}</span>
                            <span className="text-sm text-gray-600 mb-1">{servingEntry.serviceName}</span>
                          </div>
                          <div className="text-sm font-medium text-gray-800 mt-2">{servingEntry.customerName}</div>
                        </div>
                        
                        {servingEntry.formData && Object.keys(servingEntry.formData).length > 0 && (
                          <div className="bg-yellow-50 p-3 rounded-lg text-xs border border-yellow-100">
                            <p className="font-semibold text-yellow-800 mb-1">Customer Details</p>
                            {Object.entries(servingEntry.formData).map(([k, v]) => (
                              <div key={k}><span className="text-gray-700 font-medium">{k}:</span> {v}</div>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          <button onClick={() => handleComplete(servingEntry.id, counter.id)} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded transition-colors text-sm">
                            Complete
                          </button>
                          <button onClick={() => handleNoShow(servingEntry.id, counter.id)} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 rounded transition-colors text-sm">
                            No Show
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="h-32 flex flex-col items-center justify-center text-center">
                        <span className="text-gray-600 font-semibold mb-3">Available</span>
                        {/* Simplistic call next: grab the first available queue. A real app would have a queue selector if multiple */}
                        <button 
                          disabled={counter.status === 'OFFLINE' || liveData.nextUp.length === 0}
                          onClick={() => liveData.nextUp[0] && handleCallNext(liveData.nextUp[0].queueId, counter.id)} 
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium py-2 px-6 rounded-lg transition-colors text-sm"
                        >
                          Call Next
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Up Next List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Up Next</h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
            {liveData.nextUp.length === 0 ? (
              <div className="p-8 text-center text-gray-700 font-medium text-sm">Queue is empty</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {liveData.nextUp.map((entry, idx) => (
                  <li key={entry.id} className="p-3 flex items-center justify-between hover:bg-gray-100 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-200 text-gray-800 font-bold w-10 h-10 flex items-center justify-center rounded-full">
                        #{entry.tokenNumber}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{entry.customerFirstName}</div>
                        <div className="text-xs text-gray-700 font-medium">{entry.serviceName}</div>
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-gray-600 font-semibold">
                      {idx === 0 ? 'Next' : `In ${idx}`}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}

