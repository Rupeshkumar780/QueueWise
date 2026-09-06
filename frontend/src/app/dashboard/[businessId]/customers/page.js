'use client';

import { useEffect, useState, use } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function CustomersPage({ params }) {
  const resolvedParams = use(params);
  const businessId = resolvedParams.businessId;

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('WAITING'); // WAITING, SERVED, ALL

  const loadEntries = async () => {
    try {
      const res = await api.get(`/queue-entries/business/${businessId}`);
      if (res.data) setEntries(res.data);
    } catch (err) {
      console.error('Failed to load customers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
    
    // Auto refresh every 10 seconds to keep live
    const interval = setInterval(loadEntries, 10000);
    return () => clearInterval(interval);
  }, [businessId]);

  const [ticketToCancel, setTicketToCancel] = useState(null);
  const [isCanceling, setIsCanceling] = useState(false);

  const handleAction = async (id, action) => {
    try {
      if (action === 'cancel') {
        const entry = entries.find(e => e.id === id);
        if (entry) setTicketToCancel(entry);
        return;
      } else if (action === 'complete') {
        await api.post(`/queue-entries/${id}/complete`);
        toast.success('Customer marked as completed');
      } else if (action === 'no-show') {
        await api.post(`/queue-entries/${id}/no-show`);
        toast.success('Customer marked as skipped (no-show)');
      }
      loadEntries();
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('You are not authorized to perform this action.');
      } else {
        toast.error(err.response?.data?.message || 'Action failed');
      }
    }
  };

  if (loading) return <div className="text-gray-500">Loading customers...</div>;

  const getFiltered = (fType) => entries.filter(e => {
    if (fType === 'ALL') return true;
    if (fType === 'WAITING') return e.status === 'WAITING' || e.status === 'SERVING';
    if (fType === 'SERVED') return e.status === 'COMPLETED';
    return true;
  });

  const filteredEntries = getFiltered(filter);

  // Helper to safely extract name from dynamic form data
  const extractName = (formData, user) => {
    if (formData) {
      const keys = Object.keys(formData);
      const nameKey = keys.find(k => k.toLowerCase().includes('name'));
      const formName = nameKey ? formData[nameKey] : formData[keys[0]];
      if (formName) return formName;
    }
    return user?.name || 'Anonymous Walk-in';
  };

  return (
    <div className="space-y-8 max-w-7xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Customers & Tickets</h2>
        <p className="text-gray-500 text-sm mt-1">View and manage all customer tickets for today.</p>
      </div>

      {/* Filters with Counts */}
      <div className="flex gap-2">
        {[
          { id: 'WAITING', label: `Waiting & Serving (${getFiltered('WAITING').length})` },
          { id: 'SERVED', label: `Completed (${getFiltered('SERVED').length})` },
          { id: 'ALL', label: `All Tickets (${getFiltered('ALL').length})` }
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${filter === f.id ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Token</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer Info</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Line</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEntries.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500 font-medium">No customers found for this filter.</td></tr>
              ) : (
                filteredEntries.map(entry => {
                  const joinTime = new Date(entry.joinedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                  
                  return (
                    <tr key={entry.id} className={`hover:bg-gray-50 transition-colors ${entry.status === 'SERVING' ? 'bg-yellow-50/30' : ''}`}>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-black text-gray-900 text-xl">{entry.queue?.tokenPrefix || ''}{entry.tokenNumber}</span>
                          <span className="text-xs text-gray-500 mt-1">Joined {joinTime}</span>
                        </div>
                      </td>
                      
                      {/* Privacy-focused Customer Info */}
                      <td className="px-6 py-5 text-sm text-gray-700">
                        {entry.status === 'SERVING' && entry.formData ? (
                          <div className="flex flex-col gap-2 max-w-sm">
                            <span className="font-bold text-gray-900 border-b border-gray-200 pb-1 mb-1">Full Customer Details:</span>
                            {Object.entries(entry.formData).map(([k,v]) => (
                              <div key={k} className="grid grid-cols-3 gap-2">
                                <span className="font-semibold text-gray-600 truncate">{k}:</span> 
                                <span className="col-span-2 text-gray-900 break-words">{v}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="font-bold text-gray-800 text-base">{extractName(entry.formData, entry.user)}</span>
                        )}
                      </td>
                      
                      <td className="px-6 py-5 whitespace-nowrap text-sm font-semibold text-gray-600">
                        {entry.queue?.name}
                      </td>
                      
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                          entry.status === 'WAITING' ? 'bg-blue-100 text-blue-800' :
                          entry.status === 'SERVING' ? 'bg-yellow-100 text-yellow-800 ring-2 ring-yellow-400' :
                          entry.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          entry.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {entry.status === 'SERVING' ? 'NOW SERVING' : entry.status}
                        </span>
                      </td>
                      
                      <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                        {entry.status === 'WAITING' && (
                          <button onClick={() => handleAction(entry.id, 'cancel')} className="text-red-500 hover:text-red-700 font-semibold px-3 py-1 rounded hover:bg-red-50 transition-colors">
                            Cancel Ticket
                          </button>
                        )}
                        
                        {entry.status === 'SERVING' && (
                          <div className="flex flex-col items-end gap-2">
                            <button 
                              onClick={() => handleAction(entry.id, 'complete')} 
                              className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-colors w-32 text-center"
                            >
                              ✓ COMPLETE
                            </button>
                            <button 
                              onClick={() => handleAction(entry.id, 'no-show')} 
                              className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 text-xs font-bold px-4 py-2 rounded-lg transition-colors w-32 text-center"
                            >
                              SKIP / NO SHOW
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {ticketToCancel && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Cancel Ticket?</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to cancel the ticket for <span className="font-semibold text-gray-900">
              {(ticketToCancel.formData && (Object.values(ticketToCancel.formData)[0])) || 'Anonymous'}
              </span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setTicketToCancel(null)}
                disabled={isCanceling}
                className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                No, Keep
              </button>
              <button 
                onClick={async () => {
                  setIsCanceling(true);
                  try {
                    await api.post(`/queue-entries/${ticketToCancel.id}/admin-cancel`);
                    toast.success('Ticket cancelled');
                    setTicketToCancel(null);
                    loadEntries();
                  } catch (err) {
                    if (err.response?.status === 403) {
                      toast.error('You are not authorized to perform this action.');
                    } else {
                      toast.error(err.response?.data?.message || 'Action failed');
                    }
                  } finally {
                    setIsCanceling(false);
                  }
                }}
                disabled={isCanceling}
                className="px-4 py-2 bg-red-600 text-white font-medium hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {isCanceling ? 'Canceling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
