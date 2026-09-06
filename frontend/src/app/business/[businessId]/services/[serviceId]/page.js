"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "../../../../../lib/api";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from 'react-hot-toast';
import { socket } from '@/lib/socket';

export default function ServiceDetailsPage() {
  const { businessId, serviceId } = useParams();
  const router = useRouter();
  
  const [activeQueue, setActiveQueue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);

  const loadQueue = async () => {
    try {
      const queues = await fetchAPI(`/queues/business/${businessId}`);
      const queueForService = queues.find(q => q.serviceId === serviceId);
      setActiveQueue(queueForService || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();

    socket.connect();
    socket.emit('join-business-room', { businessId });

    const handleUpdate = () => {
      loadQueue();
    };

    socket.on('business_updated', handleUpdate);
    socket.on('queue_updated', handleUpdate);

    return () => {
      socket.off('business_updated', handleUpdate);
      socket.off('queue_updated', handleUpdate);
      socket.emit('leave-business-room', { businessId });
    };
  }, [businessId, serviceId]);

  const handleJoinQueue = async () => {
    if (!activeQueue || activeQueue.status !== 'OPEN') {
      toast.error('No active queue available for this service right now.');
      return;
    }

    try {
      setJoining(true);
      setError(null);
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          
          try {
            const entry = await fetchAPI(`/queue-entries/${activeQueue.id}/join`, {
              method: 'POST',
              body: JSON.stringify({
                locationData: { lat: latitude, lng: longitude, accuracy }
              })
            });
            
            toast.success('Successfully joined the queue!');
            router.push(`/queue/my-status`);
          } catch (apiErr) {
            setError(apiErr.message || 'Failed to join queue');
            toast.error(apiErr.message || 'Failed to join queue');
            setJoining(false);
          }
        },
        (err) => {
          setError("Location access is required to join this queue.");
          toast.error("Location access is required to join this queue.");
          setJoining(false);
        }
      );
    } catch (err) {
      setError(err.message);
      setJoining(false);
    }
  };

  return (
    <div className="p-8 max-w-xl mx-auto text-center">
      <Link href={`/business/${businessId}`} className="text-sm text-gray-500 hover:underline inline-block mb-8">&larr; Back to Location</Link>
      
      <h1 className="text-3xl font-bold mb-4">Service Details</h1>
      
      {loading ? (
        <p className="text-gray-500">Loading service status...</p>
      ) : activeQueue?.status === 'OPEN' ? (
        <>
          <p className="text-gray-600 mb-8">Join the queue for this service.</p>
          {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm">{error}</div>}

          <div className="bg-white border rounded-xl p-8 shadow-sm">
            <button 
              onClick={handleJoinQueue}
              disabled={joining}
              className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {joining ? "Locating & Joining..." : "Join Live Queue"}
            </button>
            <p className="text-xs text-gray-400 mt-4">Requires location access to verify physical eligibility.</p>
          </div>
        </>
      ) : activeQueue?.status === 'PAUSED' ? (
        <div className="bg-yellow-50 text-yellow-700 p-6 rounded-lg mt-8 border border-yellow-200">
          <p className="font-semibold text-lg">Queue Paused</p>
          <p className="text-sm mt-2">The queue is temporarily paused and not accepting new customers. Please check back shortly.</p>
        </div>
      ) : (
        <div className="bg-red-50 text-red-700 p-6 rounded-lg mt-8 border border-red-200">
          <p className="font-semibold text-lg">Currently Closed</p>
          <p className="text-sm mt-2">The queue for this service is currently closed. Please try again later.</p>
        </div>
      )}
    </div>
  );
}
