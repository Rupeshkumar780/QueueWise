"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { fetchAPI } from "../lib/api";
import { toast } from "react-hot-toast";

export default function GlobalNotification() {
  const [activeTickets, setActiveTickets] = useState([]);
  
  useEffect(() => {
    // 1. Fetch active tickets from localStorage (saved when joining)
    // Actually, it's better to fetch from the server based on token
    const token = localStorage.getItem("token");
    if (!token) return;

    let socket;
    
    const loadAndListen = async () => {
      try {
        const res = await fetchAPI('/queue-entries/my-tickets');
        if (res && Array.isArray(res)) {
          const active = res.filter(t => t.status === 'WAITING' || t.status === 'CALLED');
          setActiveTickets(active);
          
          if (active.length > 0) {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
            const wsUrl = apiUrl.replace(/\/api\/v1$/, '');
            socket = io(wsUrl);
            
            active.forEach(ticket => {
              socket.emit('join-queue-room', { queueId: ticket.queueId });
            });

            socket.on('queue_updated', async () => {
              // Re-fetch to see if status changed
              const newRes = await fetchAPI('/queue-entries/my-tickets');
              const newActive = newRes.filter(t => t.status === 'WAITING' || t.status === 'CALLED');
              
              // Compare
              newActive.forEach(newTicket => {
                const oldTicket = active.find(t => t.id === newTicket.id);
                if (oldTicket && oldTicket.status === 'WAITING' && newTicket.status === 'CALLED') {
                  // TICKET WAS CALLED!
                  toast.success(`It's your turn! Ticket #${newTicket.tokenNumber} has been called.`, {
                    duration: 10000,
                    icon: '🔔'
                  });
                  if (typeof navigator !== "undefined" && navigator.vibrate) {
                    navigator.vibrate([300, 100, 300, 100, 300]); // 3 strong vibrations
                  }
                }
                
                // If they are next in line (e.g., current token is just 1 behind theirs)
                if (newTicket.status === 'WAITING' && newTicket.queue.currentToken === newTicket.tokenNumber - 1) {
                  // Only notify once per ticket (check localstorage flag to prevent spam)
                  const flag = `notified_next_${newTicket.id}`;
                  if (!localStorage.getItem(flag)) {
                    localStorage.setItem(flag, 'true');
                    toast(`Get ready! You are next in line (Ticket #${newTicket.tokenNumber})`, {
                      icon: '👀'
                    });
                    if (typeof navigator !== "undefined" && navigator.vibrate) {
                      navigator.vibrate([150, 50, 150]);
                    }
                  }
                }
              });
              
              setActiveTickets(newActive);
            });
          }
        }
      } catch (err) {
        console.error("Global notification sync failed", err);
      }
    };

    loadAndListen();

    // Check periodically in case they joined a new queue in another tab
    const interval = setInterval(loadAndListen, 60000);

    return () => {
      if (socket) socket.disconnect();
      clearInterval(interval);
    };
  }, []);

  return null; // This is a headless component!
}

