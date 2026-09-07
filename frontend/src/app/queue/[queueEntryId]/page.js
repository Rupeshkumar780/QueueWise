"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { fetchAPI } from "../../../lib/api";
import { toast } from "react-hot-toast";

export default function LiveQueuePage() {
  const { queueEntryId } = useParams();
  const router = useRouter();
  
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const notify = (msg) => {
    // Basic toast notification
    toast(msg, { icon: '🔔', duration: 5000 });
    
    // Vibrate device if supported
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }

    // Web Push Notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("QueueWise Update", { body: msg });
    }
  };

  const fetchEntry = async () => {
    try {
      const data = await fetchAPI(`/queue-entries/${queueEntryId}`);
      setEntry(data);
      
      // Dynamic Notification Logic
      if (data.status === 'CALLED') {
        notify("Your turn has arrived. Proceed to Counter " + (data.assignedCounter?.name || ""));
      } else if (data.status === 'WAITING') {
        if (data.peopleAhead === 1) {
          notify("You're next. Please return to the service area.");
        } else if (data.peopleAhead === 3) {
          notify(`You're getting close. Estimated wait: ${data.estimatedWaitMins} min.`);
        } else if (data.peopleAhead === 5) {
          notify("Queue is moving normally.");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch queue ticket.");
    } finally {
      setLoading(false);
    }
  };

  const [socket, setSocket] = useState(null);

  useEffect(() => {
    fetchEntry();

    // Setup WebSocket
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const wsUrl = apiUrl.replace(/\/api\/v1$/, '');
    
    const newSocket = io(wsUrl);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    newSocket.on('queue_updated', () => {
      console.log('Queue Updated! Refreshing entry...');
      fetchEntry();
    });

    return () => {
      newSocket.disconnect();
    };
  }, [queueEntryId]); // fetchEntry is safe because it only depends on queueEntryId

  useEffect(() => {
    if (socket && entry?.queueId) {
      socket.emit('join-queue-room', { queueId: entry.queueId });
      
      return () => {
        socket.emit('leave-queue-room', { queueId: entry.queueId });
      };
    }
  }, [socket, entry?.queueId]);

  const requestNotificationPermission = () => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          toast.success("Push notifications enabled!");
        }
      });
    }
  };

  const handleLeave = async () => {
    if (cancelling) return;

    setCancelling(true);
    try {
      await fetchAPI(`/queue-entries/${queueEntryId}/cancel`, { method: 'POST' });
      toast.success("Ticket cancelled successfully.");
      router.push('/my-tickets');
    } catch (err) {
      toast.error(err.message || "Failed to cancel ticket");
      setCancelling(false);
      setShowCancelConfirm(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!entry) return <div className="p-8 text-center text-gray-500">Ticket not found.</div>;

  const getTimelineStatus = () => {
    if (entry.status === 'COMPLETED') return 5;
    if (entry.status === 'SERVING') return 4;
    if (entry.status === 'CALLED') return 3;
    if (entry.peopleAhead === 0) return 2; // almost your turn
    return 1; // in queue
  };

  const step = getTimelineStatus();

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-700 to-gray-900 p-4 sm:p-6 flex flex-col items-center justify-center font-sans">
            {/* Back Button */}
      <div className="w-full max-w-md mb-4">
        <button onClick={() => router.push('/my-tickets')} className="text-white/80 hover:text-white flex items-center gap-2 text-sm font-medium transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to My Tickets
        </button>
      </div>
      
      {/* Enable notifications banner */}
      {typeof window !== 'undefined' && "Notification" in window && Notification.permission !== "granted" && (
        <div className="w-full max-w-md bg-blue-600 text-white rounded-xl p-4 mb-6 flex justify-between items-center shadow-lg">
          <span className="text-sm">Get notified when your turn is ready</span>
          <button onClick={requestNotificationPermission} className="bg-white text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider">Enable</button>
        </div>
      )}

      {/* Main Ticket */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden relative">
        {/* Ticket Header */}
        <div className="bg-gray-50 p-6 border-b border-dashed border-gray-300 relative text-center">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-gray-900 rounded-full"></div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-8 h-8 bg-gray-900 rounded-full"></div>
          
          <h2 className="text-sm font-bold text-gray-500 tracking-widest uppercase mb-1">{entry.queue?.business?.name}</h2>
          <h3 className="text-xs text-gray-400 font-medium">{entry.queue?.service?.name}</h3>
        </div>

        {/* Ticket Body */}
        <div className="p-8 text-center bg-white">
          <div className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-2">Token</div>
          <div className="text-7xl font-black text-gray-900 mb-8 tracking-tighter">
            {entry.queue?.tokenPrefix || ''}{entry.tokenNumber}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="flex flex-col p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <span className="text-3xl font-black text-gray-800">{entry.peopleAhead || 0}</span>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1">People Ahead</span>
            </div>
            <div className="flex flex-col p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <span className="text-3xl font-black text-blue-600">~{entry.estimatedWaitMins || 0}</span>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mt-1">Minutes</span>
            </div>
          </div>

          <div className="space-y-3 bg-gray-50 p-5 rounded-2xl border border-gray-100">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-medium">Currently serving:</span>
              <span className="font-bold text-gray-900">{entry.queue?.tokenPrefix || ''}{entry.nowServingToken || '--'}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-medium">Counter:</span>
              <span className={`font-bold ${entry.assignedCounter ? 'text-green-600' : 'text-gray-900'}`}>
                {entry.assignedCounter ? entry.assignedCounter.name : 'Not assigned'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Queue Status Timeline */}
      <div className="w-full max-w-md mt-8 bg-white rounded-3xl p-6 shadow-xl">
        <h3 className="text-sm font-bold text-gray-900 tracking-wider uppercase mb-5">Queue Status</h3>
        <div className="space-y-4">
          <div className={`flex items-center gap-3 ${step >= 1 ? 'text-gray-900' : 'text-gray-300'}`}>
            <span className="text-xl">{step >= 1 ? '✓' : '○'}</span>
            <span className="font-medium">Joined</span>
          </div>
          <div className={`flex items-center gap-3 ${step >= 1 ? 'text-gray-900' : 'text-gray-300'}`}>
            <span className="text-xl">{step >= 1 ? '✓' : '○'}</span>
            <span className="font-medium">In Queue</span>
          </div>
          <div className={`flex items-center gap-3 ${step >= 2 ? (step > 2 ? 'text-gray-900' : 'text-blue-600 font-bold') : 'text-gray-300'}`}>
            <span className="text-xl">{step > 2 ? '✓' : (step === 2 ? '●' : '○')}</span>
            <span className="font-medium">Almost Your Turn</span>
          </div>
          <div className={`flex items-center gap-3 ${step >= 3 ? (step > 3 ? 'text-gray-900' : 'text-green-600 font-bold animate-pulse') : 'text-gray-300'}`}>
            <span className="text-xl">{step > 3 ? '✓' : (step === 3 ? '●' : '○')}</span>
            <span className="font-medium">Called</span>
          </div>
          <div className={`flex items-center gap-3 ${step >= 4 ? 'text-gray-900' : 'text-gray-300'}`}>
            <span className="text-xl">{step > 4 ? '✓' : (step === 4 ? '●' : '○')}</span>
            <span className="font-medium">Serving</span>
          </div>
          <div className={`flex items-center gap-3 ${step >= 5 ? 'text-gray-900' : 'text-gray-300'}`}>
            <span className="text-xl">{step >= 5 ? '✓' : '○'}</span>
            <span className="font-medium">Completed</span>
          </div>
        </div>
      </div>

      {(entry.status === 'WAITING' || entry.status === 'CALLED') && (
        <button 
          onClick={() => setShowCancelConfirm(true)}
          className="mt-8 text-gray-400 font-medium text-sm hover:text-white transition-colors"
        >
          Cancel Ticket
        </button>
      )}

      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-gray-900">Cancel this ticket?</h2>
            <p className="mt-2 text-sm text-gray-600">
              You will leave the queue and lose your current position.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                disabled={cancelling}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                Keep Ticket
              </button>
              <button
                type="button"
                onClick={handleLeave}
                disabled={cancelling}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-wait disabled:opacity-60"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
