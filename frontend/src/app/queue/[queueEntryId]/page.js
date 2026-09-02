"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { io } from "socket.io-client";
// import { fetchAPI } from "../../../lib/api"; // normally we would fetch the live entry status

export default function LiveQueuePage() {
  const { queueEntryId } = useParams();
  const router = useRouter();
  
  // Mock state for the UI
  const [status, setStatus] = useState("WAITING"); // WAITING, CALLED, SERVING
  const [tokenNumber, setTokenNumber] = useState(47);
  const [peopleAhead, setPeopleAhead] = useState(6);
  const [estimatedWait, setEstimatedWait] = useState(24);
  const [servingToken, setServingToken] = useState(41);
  const [counter, setCounter] = useState("Pending");

  useEffect(() => {
    // Determine backend URL for websocket (strip /api/v1)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const wsUrl = apiUrl.replace(/\/api\/v1$/, '');
    
    const socket = io(wsUrl);

    socket.on('connect', () => {
      console.log('Connected to WebSocket');
      // For a real app, we would join the queue room:
      // socket.emit('join-queue-room', { queueId: 'MOCK_QUEUE_ID' });
    });

    socket.on('queue_updated', (data) => {
      console.log('Queue Updated!', data);
      // In a real app, we would fetch the updated entry details here
      // For this prototype, we'll just simulate the people ahead decreasing
      setPeopleAhead(prev => Math.max(0, prev - 1));
      setServingToken(prev => prev + 1);
      setEstimatedWait(prev => Math.max(0, prev - 4));
    });

    return () => {
      socket.disconnect();
    };
  }, [queueEntryId]);

  const handleLeave = () => {
    if(confirm("Are you sure you want to leave the queue?")) {
      // fetchAPI(`/queue-entries/${queueEntryId}/cancel`, { method: 'POST' });
      router.push('/');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border p-8 mt-12 text-center">
        
        <div className="text-sm font-semibold text-gray-400 tracking-widest uppercase mb-2">Your Token</div>
        <div className="text-7xl font-bold text-gray-900 mb-8">#{tokenNumber}</div>

        <div className="bg-blue-50 text-blue-800 rounded-lg p-4 mb-8">
          <div className="text-sm font-medium mb-1">Status</div>
          <div className="text-xl font-bold">{status}</div>
          {status === 'CALLED' && <div className="mt-2 text-sm">Please proceed to Counter {counter}</div>}
        </div>

        <div className="grid grid-cols-2 gap-4 text-left border-t pt-6 mb-8">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">People Ahead</div>
            <div className="text-xl font-semibold">{peopleAhead}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Estimated Wait</div>
            <div className="text-xl font-semibold">{estimatedWait} min</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Currently Serving</div>
            <div className="text-xl font-semibold">#{servingToken}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Counter</div>
            <div className="text-xl font-semibold">{counter}</div>
          </div>
        </div>

        <div className="space-y-3 text-left bg-gray-50 p-4 rounded-lg text-sm text-gray-600 mb-8">
          <div className="font-semibold text-gray-900 mb-2">Timeline</div>
          <div className="flex items-center text-gray-400">#{servingToken + 1}</div>
          <div className="flex items-center text-gray-400">#{servingToken + 2}</div>
          <div className="flex items-center text-gray-400">...</div>
          <div className="flex items-center font-bold text-blue-600">YOU #{tokenNumber}</div>
        </div>

        <button 
          onClick={handleLeave}
          className="w-full py-3 px-4 border border-red-200 text-red-600 font-medium rounded-lg hover:bg-red-50 transition"
        >
          Leave Queue
        </button>

      </div>
    </div>
  );
}

