'use client';

import { useEffect, useState, use } from 'react';
import api from '@/lib/api';
import { socket } from '@/lib/socket';

export default function DashboardOverview({ params }) {
  const resolvedParams = use(params);
  const businessId = resolvedParams.businessId;

  const [liveData, setLiveData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState(null);

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
      if (err.response?.status === 403) {
        setErrorStatus(403);
      } else {
        setErrorStatus(500);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    socket.connect();
    socket.emit('join-business-room', { businessId });

    const handleUpdate = () => {
      fetchData();
    };

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-600 font-medium">Loading Dashboard...</p>
      </div>
    );
  }
  
  if (errorStatus === 403) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-6">
        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-black text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500 max-w-md mx-auto">
            You do not have permission to view the dashboard for this business. You must be the owner or an assigned staff member.
          </p>
        </div>
        <button 
          onClick={() => window.location.href = '/'}
          className="px-6 py-3 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 transition"
        >
          Return to Home
        </button>
      </div>
    );
  }

  if (errorStatus === 500 || !liveData || !stats) {
    return (
      <div className="p-8 text-center text-red-600 font-medium">
        Error loading data. Please try again later.
      </div>
    );
  }

  const getHealthStatus = () => {
    if (stats.currentWaiting > 20) return { label: 'Busy', color: 'text-red-600', dot: '🔴' };
    if (stats.currentWaiting > 10) return { label: 'Moderate', color: 'text-yellow-600', dot: '🟡' };
    return { label: 'Normal', color: 'text-green-600', dot: '🟢' };
  };
  const health = getHealthStatus();

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Queue operations</h2>
          <p className="text-sm text-gray-500 mt-1">Monitor counters, customer flow, and today&apos;s service activity.</p>
        </div>
        <a 
          href={`/dashboard/${businessId}/workspace`} 
          className="bg-gray-900 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          Open Staff Workspace
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="text-4xl font-black text-blue-600">{stats.currentWaiting}</div>
          <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mt-1">Waiting</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="text-4xl font-black text-purple-600">{stats.avgWaitTime}m</div>
          <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mt-1">Avg Wait</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="text-4xl font-black text-gray-800">{stats.activeCounters}/{stats.totalCounters}</div>
          <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mt-1">Counters Active</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="text-4xl font-black text-green-600">{stats.totalServedToday}</div>
          <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mt-1">Served Today</div>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Health & Performance */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Queue Health</h3>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{health.dot}</span>
              <span className={`text-xl font-bold ${health.color}`}>{health.label}</span>
            </div>
            <p className="text-gray-600 text-sm">
              <span className="font-semibold text-gray-900">{stats.currentWaiting}</span> people currently waiting.
            </p>
            <p className="text-gray-600 text-sm mt-1">
              Estimated wait time is <span className="font-semibold text-gray-900">{stats.avgWaitTime} minutes</span>.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Counter Performance</h3>
            <ul className="space-y-3">
              {liveData.counterPerformance?.map(c => (
                <li key={c.id} className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-gray-800">{c.name}</span>
                  {c.status === 'OFFLINE' ? (
                    <span className="text-gray-400 font-medium">Offline</span>
                  ) : c.status === 'BUSY' ? (
                    <span className="text-amber-600 font-medium">Busy</span>
                  ) : (
                    <span className="text-green-600 font-medium">{c.avgTime}m avg</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column: Live Operations */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">Live Operations</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {liveData.counters?.map(counter => {
                const servingEntry = liveData.nowServing?.find(e => (
                  e.assignedCounterId === counter.id || e.counterId === counter.id
                ));
                const formName = servingEntry?.formData
                  ? (
                      Object.entries(servingEntry.formData).find(([key]) =>
                        key.toLowerCase().includes('name')
                      )?.[1] || Object.values(servingEntry.formData)[0]
                    )
                  : null;
                const customerName = formName || servingEntry?.user?.name || 'Anonymous';

                return (
                  <div
                    key={counter.id}
                    className="border border-blue-100 bg-blue-50/30 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between"
                  >
                    <div className="p-4 flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">{counter.name}</div>
                        {servingEntry && (
                          <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse ${servingEntry.status === 'CALLED' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {servingEntry.status === 'CALLED' ? 'CALLED' : 'SERVING'}
                          </div>
                        )}
                      </div>

                      {servingEntry ? (
                        <div className="space-y-2">
                          <div className="flex items-end gap-2">
                            <div className="text-3xl font-black text-gray-900 leading-none">
                              #{servingEntry.tokenNumber}
                            </div>
                            <div className="text-sm font-bold text-gray-700 truncate pb-1">
                              {customerName}
                            </div>
                          </div>

                          {servingEntry.calledAt && (
                            <div className="text-xs font-medium text-gray-500 flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Called at {new Date(servingEntry.calledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}

                          {servingEntry.formData && Object.keys(servingEntry.formData).length > 1 && (
                            <div className="mt-3 pt-3 border-t border-blue-100/50">
                              <div className="text-[10px] font-bold text-blue-400 uppercase mb-1">Details</div>
                              <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                                {Object.entries(servingEntry.formData).map(([key, value]) => {
                                  if (key.toLowerCase().includes('name')) return null;
                                  return (
                                    <div key={key} className="text-xs">
                                      <span className="text-gray-500">{key}:</span>{' '}
                                      <span className="font-semibold text-gray-800 truncate block">{value}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-6">
                          <div className="text-gray-400 mb-2">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          <div className="text-sm font-bold text-gray-500">
                            {counter.status === 'OFFLINE'
                              ? 'Offline'
                              : counter.status === 'BUSY'
                                ? 'Customer called, waiting to be served'
                                : 'Waiting for customer...'}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="bg-white border-t border-blue-100 p-3">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Up Next</div>
                      {(() => {
                        // Find the queue(s) supported by this counter
                        const supportedQueues = liveData.queues.filter(q => (
                          counter.supportedServices?.includes(q.serviceId)
                        ));
                        const supportedQueueIds = supportedQueues.map(q => q.id);
                        const nextUpForCounter = (liveData.nextUp || []).filter(e => supportedQueueIds.includes(e.queueId)).slice(0, 3);
                        
                        if (nextUpForCounter.length === 0) {
                          return <div className="text-xs text-gray-400 italic">Queue is empty</div>;
                        }
                        
                        return (
                          <div className="space-y-1.5">
                            {nextUpForCounter.map(e => {
                              const formName = e.formData ? (Object.entries(e.formData).find(([k]) => k.toLowerCase().includes('name'))?.[1] || Object.values(e.formData)[0]) : null;
                              const name = formName || e.user?.name || 'Anonymous';
                              return (
                                <div key={e.id} className="flex justify-between items-center text-xs">
                                  <span className="font-semibold text-gray-700 truncate mr-2">{name}</span>
                                  <span className="font-mono text-gray-500 bg-gray-50 px-1.5 rounded border border-gray-100">
                                    {e.queue?.tokenPrefix || ''}{e.tokenNumber}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

};