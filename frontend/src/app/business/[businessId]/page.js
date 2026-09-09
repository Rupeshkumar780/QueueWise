"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchAPI } from "../../../lib/api";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import Footer from "../../../components/Footer";
import io from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1$/, "") ||
  "http://localhost:3001";

export default function BusinessDetailsPage() {
  const { businessId } = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Load auth state
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const bizData = await fetchAPI(
        `/businesses/${businessId}/customer-landing`
      );
      setData(bizData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  // Initial load
  useEffect(() => {
    if (businessId) {
      localStorage.setItem("lastVisitedBusinessId", businessId);
      localStorage.setItem("customer_dashboard_url", `/business/${businessId}`);
    }
    fetchData();
  }, [fetchData, businessId]);

  // Real-time WebSocket for live updates
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socket.emit("join-business-room", { businessId });
    socket.on("business_updated", () => {
      fetchData();
    });
    socket.on("queue_updated", () => {
      fetchData();
    });
    return () => {
      socket.emit("leave-business-room", { businessId });
      socket.disconnect();
    };
  }, [businessId, fetchData]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Loading queue info...</p>
        </div>
      </div>
    );
  }

  if (!data || !data.business) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full">
          <div className="text-red-400 mb-4">
            <svg className="w-14 h-14 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Location Not Found</h2>
          <p className="text-gray-500 mb-6">This queue link is invalid or the business no longer exists.</p>
          <Link href="/" className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 w-full transition">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const { business, services, intelligence, currentActivity, chartData } = data;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ─── Sticky Top Navbar ─── */}
      <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex items-center gap-0.5">
              <span className="text-xl font-black text-red-500 tracking-tighter">Queue</span>
              <span className="text-xl font-black text-gray-900 tracking-tighter">Wise</span>
            </Link>

            <div className="flex items-center gap-3">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition"
                  >
                    <div className="h-8 w-8 rounded-full bg-linear-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[100px] truncate">
                      {user.name?.split(" ")[0]}
                    </span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-xs text-gray-500">Signed in as</p>
                        <p className="text-sm font-semibold text-gray-900 truncate">{user.email}</p>
                      </div>
                      <Link href="/my-tickets" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setDropdownOpen(false)}>
                        🎫 My Tickets
                      </Link>
                      <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                        ↩ Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    href={`/auth/login?redirect=${encodeURIComponent(`/business/${businessId}`)}`}
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
                  >
                    Login
                  </Link>
                  <Link
                    href={`/auth/signup?redirect=${encodeURIComponent(`/business/${businessId}`)}`}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm"
                  >
                    Sign Up Free
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ─── Business Header Banner ─── */}
      <div className="relative bg-linear-to-br from-gray-800 via-gray-600 to-gray-800 text-white px-4 pb-12 pt-6 sm:px-6 sm:pb-12 lg:px-8 lg:py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
            <div className="flex-1 order-last sm:order-first">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">📍</span>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{business.name}</h1>
              </div>
              <p className="text-gray-300 text-sm mt-1">{business.address}</p>
              
              <div className="flex flex-wrap items-center gap-3 pr-24 mt-4 lg:pr-0">
                {business.isOpen ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    Open Now
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                    Closed
                  </span>
                )}
                {business.googleMapsUrl && (
                  <a
                    href={business.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition"
                  >
                    🗺️ View on Maps
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-4 right-4 text-right text-[10px] text-white/55 sm:right-6 lg:bottom-auto lg:right-8 lg:top-1/2 lg:-translate-y-1/2">
          Powered by{" "}
          <span className="font-bold text-red-400">Queue</span>
          <span className="font-bold text-white/80">Wise</span>
        </div>
      </div>

      {/* ─── Main Two-Column Grid Content ─── */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ═══ LEFT COLUMN (spans 2/3 on large screens) ═══ */}
          <div className="order-2 space-y-6 lg:col-span-2 lg:col-start-1 lg:row-start-1 lg:order-none">

            {/* Live Queue Intelligence 2x2 grid */}
            {intelligence && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-linear-to-r from-gray-950 via-blue-950 to-teal-950 px-5 py-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Live Queue Intelligence
                  </h2>
                  <span className="ml-auto text-xs text-slate-200/75">Updates live</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100">
                  <div className="p-5 flex flex-col items-center justify-center text-center">
                    <span className="text-3xl font-black text-blue-600">{intelligence.queueLength}</span>
                    <span className="text-xs font-medium text-gray-500 uppercase mt-1 leading-tight">Total Customers Waiting</span>
                  </div>
                  <div className="p-5 flex flex-col items-center justify-center text-center">
                    <span className="text-3xl font-black text-orange-500">{intelligence.averageWait}</span>
                    <span className="text-xs font-medium text-gray-500 uppercase mt-1">Avg Wait (min)</span>
                  </div>
                  <div className="p-5 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-black text-gray-800">{intelligence.countersActive}</span>
                    <span className="text-xs font-medium text-gray-500 uppercase mt-1">Counters Active</span>
                  </div>
                  <div className="p-5 flex flex-col items-center justify-center text-center">
                    <span className="text-base font-black text-gray-800">{intelligence.queueHealth}</span>
                    <span className="text-xs font-medium text-gray-500 uppercase mt-1">Queue Health</span>
                  </div>
                </div>
              </div>
            )}

            {/* Available Services */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Available Services
              </h2>
              {services && services.length > 0 ? (
                <div className="space-y-3">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col sm:flex-row group hover:shadow-md transition-shadow"
                    >
                      <div className="p-5 flex-1">
                        <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {service.name}
                        </h3>
                        {service.description && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-1">{service.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2.5 flex-wrap">
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            ~{service.estimatedDuration} min
                          </span>
                          {/* Status badge with multiple states */}
                          {service.queueStatus === "OPEN" && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                              Accepting Now
                            </span>
                          )}
                          {service.queueStatus === "BUSY" && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                              Counters Busy
                            </span>
                          )}
                          {service.queueStatus === "PAUSED" && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-200">
                              <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
                              Temporarily Paused
                            </span>
                          )}
                          {(service.queueStatus === "CLOSED" || service.queueStatus === "OFFLINE") && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                              <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                              {service.queueStatus === "OFFLINE" ? "All Counters Offline" : "Closed"}
                            </span>
                          )}
                          {/* Counter summary chip */}
                          {service.counterSummary && (
                            <span className="text-xs text-gray-400 font-medium">
                              {service.counterSummary.activeCounters}/{service.counterSummary.total} counters active
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="bg-gray-50 border-t sm:border-t-0 sm:border-l border-gray-100 flex items-center justify-center p-4 sm:w-44">
                        <button
                          onClick={() => router.push(`/business/${businessId}/services/${service.id}/join`)}
                          disabled={service.queueStatus !== "OPEN"}
                          className={`w-full px-4 py-2.5 text-sm font-bold rounded-xl transition-all ${
                            service.queueStatus === "OPEN"
                              ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md"
                              : service.queueStatus === "BUSY"
                              ? "bg-orange-100 text-orange-500 cursor-not-allowed"
                              : service.queueStatus === "PAUSED"
                              ? "bg-yellow-100 text-yellow-600 cursor-not-allowed"
                              : "bg-gray-200 text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          {service.queueStatus === "OPEN" ? "Join Queue →"
                            : service.queueStatus === "BUSY" ? "Counters Busy"
                            : service.queueStatus === "PAUSED" ? "Paused"
                            : "Unavailable"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
                  <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-gray-500 text-sm">No services are currently available.</p>
                </div>
              )}
            </div>
          </div>

          {/* ═══ RIGHT COLUMN (spans 1/3 on large screens) ═══ */}
          <div className="contents lg:col-start-3 lg:row-start-1 lg:block lg:space-y-4">

            {/* Business description */}
            {business.description?.trim() && (
              <section className="order-first h-fit w-full overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm lg:order-none">
                <div className="h-1 bg-linear-to-r from-blue-800 via-cyan-600 to-emerald-800" />
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">About this place</p>
                      <h2 className="mt-1 text-lg font-black tracking-tight text-gray-900">Good to know</h2>
                    </div>
                  </div>
                  <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-gray-600">
                    {business.description}
                  </p>
                </div>
              </section>
            )}

            {/* Current Service Activity */}
            {currentActivity && (
              <div className="order-3 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden lg:order-none">
                <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                  <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                    Current Activity
                  </h2>
                </div>
                <div className="p-5 space-y-5">
                  {/* Now Serving */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Now Serving</p>
                    {currentActivity.nowServing && currentActivity.nowServing.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {currentActivity.nowServing.map((entry, idx) => (
                          <div
                            key={idx}
                            className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 flex flex-col items-center min-w-[64px]"
                          >
                            <span className="text-xl font-black text-green-700">
                              {entry.queue?.tokenPrefix || ""}{entry.tokenNumber}
                            </span>
                            <span className="text-xs text-green-600 font-medium mt-0.5">
                              {entry.queue?.name || "Counter"}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No one being served right now.</p>
                    )}
                  </div>
                  {/* Next Up */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Up Next</p>
                    {currentActivity.nextUp && currentActivity.nextUp.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {currentActivity.nextUp.map((entry, idx) => (
                          <div
                            key={idx}
                            className="bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 flex items-center"
                          >
                            <span className="text-sm font-bold text-gray-600">
                              {entry.queue?.tokenPrefix || ""}{entry.tokenNumber}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">Queue is empty.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tickets Issued Chart */}
            {chartData && chartData.length > 0 && (
              <div className="order-4 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden lg:order-none">
                <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                  <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                    Tickets Issued — Last 2 Hours
                  </h2>
                </div>
                <div className="p-4">
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 9, fill: "#9CA3AF" }} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", fontSize: 12 }}
                          labelStyle={{ fontWeight: "bold", color: "#111827" }}
                          formatter={(value) => [value, "Tickets"]}
                        />
                        <Line
                          type="monotone"
                          dataKey="waiting"
                          stroke="#3B82F6"
                          strokeWidth={2.5}
                          dot={{ r: 3, fill: "#3B82F6", strokeWidth: 2, stroke: "#fff" }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
