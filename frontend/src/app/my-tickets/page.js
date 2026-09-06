"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import api from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerDashboardUrl, setCustomerDashboardUrl] = useState("/demo");
  const router = useRouter();

  useEffect(() => {
    async function fetchTickets() {
      try {
        const res = await api.get("/queue-entries/my-tickets");
        setTickets(res.data || []);
      } catch (err) {
        if (err.response?.status === 401) {
          router.push("/auth/login");
        }
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchTickets();
    const lastBiz = localStorage.getItem("lastVisitedBusinessId");
    if (lastBiz) { setCustomerDashboardUrl(`/business/${lastBiz}`); }
  }, [router]);

  const activeTickets = tickets.filter(t => ['WAITING', 'CALLED'].includes(t.status));
  const pastTickets = tickets.filter(t => !['WAITING', 'CALLED'].includes(t.status));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-grow pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-gray-900">My Tickets</h1>
            <p className="text-gray-500 mt-1">Manage your active and past queue reservations.</p>
          </div>
          <Link href={customerDashboardUrl} className="hidden sm:inline-flex bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition">
            Join a New Queue
          </Link>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 mx-auto border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500 font-medium animate-pulse">Loading your tickets...</p>
          </div>
        ) : (
          <div className="space-y-12">
            
            {/* Active Tickets */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                Active Tickets
              </h2>
              
              {activeTickets.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center shadow-sm">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                  </div>
                  <h3 className="text-gray-900 font-bold mb-1">No Active Tickets</h3>
                  <p className="text-sm text-gray-500 mb-6">You are not currently waiting in any queues.</p>
                  <Link href="/business/demo" className="inline-flex bg-gray-100 hover:bg-gray-200 text-gray-800 px-5 py-2 rounded-xl text-sm font-semibold transition">
                    Checkout the Business
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeTickets.map(ticket => (
                    <Link href={`/queue/${ticket.id}`} key={ticket.id} className="block group">
                      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-1">
                              {ticket.queue.business.name}
                            </span>
                            <h3 className="font-bold text-gray-900">{ticket.queue.service.name}</h3>
                          </div>
                          <div className={`px-2.5 py-1 rounded-md text-xs font-bold ${ticket.status === 'CALLED' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {ticket.status}
                          </div>
                        </div>
                        <div className="flex items-end justify-between mt-6">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Your Token</p>
                            <p className="text-2xl font-black text-gray-900">#{ticket.tokenNumber}</p>
                          </div>
                          <div className="text-blue-600 group-hover:translate-x-1 transition-transform">
                            &rarr;
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Past Tickets */}
            {pastTickets.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Past Tickets</h2>
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="divide-y divide-gray-100">
                    {pastTickets.map(ticket => (
                      <div key={ticket.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-gray-50 transition">
                        <div>
                          <h4 className="font-bold text-gray-900">{ticket.queue.business.name}</h4>
                          <p className="text-sm text-gray-500">{ticket.queue.service.name} &bull; Token #{ticket.tokenNumber}</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className={`text-xs font-bold px-2 py-1 rounded ${
                            ticket.status === 'COMPLETED' ? 'bg-gray-100 text-gray-600' : 
                            ticket.status === 'CANCELLED' ? 'bg-red-50 text-red-600' : 
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {ticket.status}
                          </span>
                          <span className="text-xs text-gray-400 mt-1">
                            {new Date(ticket.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}


