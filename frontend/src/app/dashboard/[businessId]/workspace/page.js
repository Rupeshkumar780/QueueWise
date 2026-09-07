'use client';

import { useEffect, useState, use } from 'react';
import api from '@/lib/api';
import { socket } from '@/lib/socket';
import toast from 'react-hot-toast';

export default function StaffWorkspacePage({ params }) {
  const resolvedParams = use(params);
  const businessId = resolvedParams.businessId;

  const [liveData, setLiveData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCounterId, setSelectedCounterId] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(null);

  const fetchData = async () => {
    try {
      const liveRes = await api.get(`/businesses/${businessId}/live-operations`);
      setLiveData(liveRes.data);
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
    setActionInProgress('callNext');
    try {
      await api.post(`/queue-entries/queue/${queueId}/call-next`, { counterId });
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error calling next');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleComplete = async (entryId, counterId) => {
    setActionInProgress('complete');
    try {
      await api.post(`/queue-entries/${entryId}/complete`, { counterId });
      await fetchData();
    } catch (err) {
      toast.error('Error completing service');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleSkip = async (entryId, counterId) => {
    setActionInProgress('skip');
    try {
      await api.post(`/queue-entries/${entryId}/no-show`, { counterId });
      await fetchData();
    } catch (err) {
      toast.error('Error skipping customer');
    } finally {
      setActionInProgress(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-600 font-medium">Loading Workspace...</p>
      </div>
    );
  }

  if (!liveData) return <div className="p-8 text-red-600 font-medium">Error loading data.</div>;

  if (!selectedCounterId) {
    return (
      <div className="max-w-2xl mx-auto mt-12 bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Your Counter</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {liveData.counters.map(counter => (
            <button
              key={counter.id}
              onClick={() => setSelectedCounterId(counter.id)}
              className="p-6 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left flex flex-col items-center justify-center"
            >
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className="font-bold text-gray-900">{counter.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const selectedCounter = liveData.counters.find(c => c.id === selectedCounterId);
  const servingEntry = liveData.nowServing?.find(e => e.assignedCounterId === selectedCounterId);
  
  // Filter next up to only show those waiting for queues this counter supports
  // In our simplified setup, the counter supports all queues it was assigned.
  // Actually, queue has a serviceId, and counter has supportedServices[].
  const supportedQueues = liveData.queues.filter(q => selectedCounter.supportedServices.includes(q.serviceId));
  const supportedQueueIds = supportedQueues.map(q => q.id);
  
  const relevantNextUp = (liveData.nextUp || []).filter(entry => supportedQueueIds.includes(entry.queueId));

  const getCustomerName = (formData, user) => {
    let formName = null;
    if (formData) {
      const nameEntry = Object.entries(formData).find(([key]) => key.toLowerCase().includes('name'));
      if (nameEntry) {
        formName = nameEntry[1];
      }
    }
    return formName || user?.name || (formData ? Object.values(formData)[0] : 'Anonymous');
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workspace: {selectedCounter.name}</h1>
          <p className="text-gray-500 text-sm">Managing {supportedQueues.length} queue(s)</p>
        </div>
        <button 
          onClick={() => setSelectedCounterId(null)}
          className="text-sm font-semibold text-gray-500 hover:text-gray-800"
        >
          Change Counter
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Pane: Up Next List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-bold text-gray-800">Up Next ({relevantNextUp.length})</h2>
          </div>
          <div className="p-4 space-y-3">
            {relevantNextUp.length === 0 ? (
              <div className="text-center text-gray-400 py-8 text-sm">No one is currently waiting.</div>
            ) : (
              relevantNextUp.map((entry, idx) => (
                <div key={entry.id} className={`p-4 rounded-lg border ${idx === 0 ? 'border-blue-300 bg-blue-50/50' : 'border-gray-200 bg-white'}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <div className={`text-xl font-black ${idx === 0 ? 'text-blue-600' : 'text-gray-500'}`}>
                        #{entry.tokenNumber}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{getCustomerName(entry.formData, entry.user)}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{entry.queue?.name}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Pane: Currently Serving */}
        <div className="lg:col-span-2 flex flex-col">
          {servingEntry ? (
            <div className="bg-white rounded-xl shadow-sm border-2 border-blue-200 flex flex-col overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-2 bg-blue-500 animate-pulse"></div>
              
              <div className="p-8">
                <div className="text-center mb-10">
                  <span className="px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 font-bold text-sm tracking-wider uppercase mb-6 inline-block">
                    Currently Serving
                  </span>
                  <div className="text-7xl font-black text-gray-900 mb-2">#{servingEntry.tokenNumber}</div>
                  <div className="text-3xl font-bold text-gray-600">{getCustomerName(servingEntry.formData, servingEntry.user)}</div>
                </div>

                {servingEntry.formData && Object.keys(servingEntry.formData).length > 0 && (
                  <div className="max-w-md mx-auto">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">Customer Details</h3>
                    <div className="space-y-4">
                      {Object.entries(servingEntry.formData).map(([key, value]) => {
                        if (key.toLowerCase().includes('name')) return null;
                        return (
                          <div key={key}>
                            <div className="text-sm font-semibold text-gray-500">{key}</div>
                            <div className="text-lg font-medium text-gray-900 break-words">{value}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-200 grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleSkip(servingEntry.id, selectedCounterId)}
                  disabled={actionInProgress !== null}
                  className="py-4 text-center rounded-xl border-2 border-gray-300 text-gray-600 font-bold hover:bg-gray-100 hover:text-gray-800 transition-colors text-lg disabled:opacity-50 disabled:cursor-wait"
                >
                  {actionInProgress === 'skip' ? 'SKIPPING...' : 'SKIP / NO SHOW'}
                </button>
                <button
                  onClick={() => handleComplete(servingEntry.id, selectedCounterId)}
                  disabled={actionInProgress !== null}
                  className="py-4 text-center rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold shadow-md transition-colors text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-wait"
                >
                  {actionInProgress === 'complete' ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      COMPLETING...
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                      COMPLETE
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center p-8">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-6">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Ready to Serve</h2>
              <p className="text-gray-500 mb-8 text-center max-w-sm">No customer is currently being served at this counter. Call the next person in line when you're ready.</p>
              
              <button
                onClick={() => handleCallNext(relevantNextUp[0].queueId, selectedCounterId)}
                disabled={relevantNextUp.length === 0 || actionInProgress !== null}
                className="w-full max-w-xs py-5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-black text-xl shadow-lg transition-colors flex flex-col items-center justify-center gap-1"
              >
                {actionInProgress === 'callNext' ? (
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    CALLING...
                  </div>
                ) : (
                  <>
                    CALL NEXT PERSON
                    {relevantNextUp.length > 0 && <span className="text-sm font-semibold text-blue-200 block uppercase tracking-wider">#{relevantNextUp[0].tokenNumber} - {getCustomerName(relevantNextUp[0].formData, relevantNextUp[0].user)}</span>}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

