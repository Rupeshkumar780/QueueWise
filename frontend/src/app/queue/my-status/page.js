'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import toast from 'react-hot-toast';

import { socket } from '@/lib/socket';

export default function MyStatusPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const prevEntriesRef = useRef();

  useEffect(() => {
    fetchStatus();

    socket.connect();
    
    return () => {
      socket.disconnect();
    };
  }, []);

  // When entries change, join their rooms and compare for toasts
  useEffect(() => {
    const prevEntries = prevEntriesRef.current;
    
    // Check for changes and trigger toasts
    if (prevEntries) {
      entries.forEach(newEntry => {
        const oldEntry = prevEntries.find(e => e.id === newEntry.id);
        if (oldEntry) {
          if (oldEntry.status === 'WAITING' && newEntry.status === 'CALLED') {
            toast.success(`It's your turn! Proceed to counter.`, { duration: 5000, icon: '🎉' });
          } else if (oldEntry.peopleAhead !== newEntry.peopleAhead && newEntry.peopleAhead > 0) {
            toast(`Queue moved! ${newEntry.peopleAhead} people ahead.`, { icon: '🚶' });
          } else if (oldEntry.peopleAhead > 0 && newEntry.peopleAhead === 0 && newEntry.status === 'WAITING') {
            toast(`You are next in line!`, { icon: '⚡' });
          }
        }
      });
    }
    
    prevEntriesRef.current = entries;

    entries.forEach(entry => {
      socket.emit('join-queue-room', { queueId: entry.queueId });
    });

    const handleUpdate = (data) => {
      // If we got an update for a queue we're in, refetch
      if (entries.some(e => e.queueId === data.queueId)) {
        fetchStatus();
      }
    };

    socket.on('queue_updated', handleUpdate);

    return () => {
      socket.off('queue_updated', handleUpdate);
      entries.forEach(entry => {
        socket.emit('leave-queue-room', { queueId: entry.queueId });
      });
    }
  }, [entries]);

  const fetchStatus = async () => {
    try {
      const res = await api.get('/queue-entries/my-status');
      setEntries(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        window.location.href = '/login?redirect=/queue/my-status';
      } else {
        setError('Failed to load queue status');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to leave this queue?')) return;
    try {
      await api.post(`/queue-entries/${id}/cancel`);
      fetchStatus();
    } catch (err) {
      alert('Failed to cancel queue entry');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navbar />
      
      <div className="max-w-md mx-auto p-4 space-y-6 pt-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Queues</h1>
        
        {entries.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-gray-200 shadow-sm">
            <p className="text-gray-500 mb-4">You are not in any active queues.</p>
            <Link href="/" className="text-blue-600 font-medium hover:underline">
              Find a branch
            </Link>
          </div>
        ) : (
          entries.map(entry => (
            <div key={entry.id} className="bg-white rounded-2xl shadow-lg border-t-4 border-blue-600 overflow-hidden">
              <div className="p-6">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                  {entry.queue.branch.business.name}
                </div>
                <div className="text-lg font-bold text-gray-900 mb-6">
                  {entry.queue.branch.name}
                </div>
                
                <div className="text-center mb-8">
                  <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Token</div>
                  <div className="text-6xl font-black text-gray-900">#{entry.tokenNumber}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{entry.peopleAhead || 0}</div>
                    <div className="text-xs font-medium text-gray-500 uppercase mt-1">People Ahead</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">~{entry.estimatedWaitMins || 0}m</div>
                    <div className="text-xs font-medium text-gray-500 uppercase mt-1">Est. Wait</div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm font-medium mb-1">
                      <span className="text-gray-600">Queue Progress</span>
                      <span className="text-blue-600">{entry.status}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                        style={{ width: entry.status === 'WAITING' ? '30%' : entry.status === 'CALLED' ? '80%' : '100%' }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm font-medium flex items-center justify-between">
                    <span>
                      {entry.status === 'WAITING' ? 'Counter: Pending' : 
                       entry.status === 'CALLED' ? `Proceed to Counter ${entry.assignedCounterId?.substring(0,4)}` :
                       'Being Served'}
                    </span>
                    {entry.status === 'WAITING' && (
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-between">
                <Link href={`/business/${entry.queue.businessId}`} className="text-gray-600 font-medium text-sm hover:text-gray-900">
                  {entry.queue.service.name} &rarr;
                </Link>
                {entry.status === 'WAITING' && (
                  <button onClick={() => handleCancel(entry.id)} className="text-red-600 font-medium text-sm hover:text-red-800">
                    Leave Queue
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
