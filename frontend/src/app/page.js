"use client";

import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-16">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden bg-white pt-24 pb-32">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-red-50 blur-3xl opacity-50"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-blue-50 blur-3xl opacity-50"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tighter mb-6 leading-tight">
              Don't make your <br className="hidden md:block"/> customers <span className="text-red-500 relative inline-block">wait blindly.
                <svg className="absolute w-full h-3 -bottom-1 left-0 text-red-200" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 50 10 100 5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              </span>
            </h1>
            <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto mb-10">
              The modern, digital queue management system for businesses of all sizes. 
              Let your customers check-in via QR and wait anywhere.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/auth/login" className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-xl text-lg font-bold transition-all shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:-translate-y-1">
                Get Started Free
              </Link>
              <Link href="/auth/signup?type=business" className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 px-8 py-4 rounded-xl text-lg font-bold transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2">
                For Businesses 
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* HOW QUEUEWISE WORKS */}
        <section id="how-it-works" className="py-15 bg-linear-to-br from-gray-800 via-gray-500 to-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-sm font-bold text-red-300 tracking-widest uppercase mb-2">The Process</h2>
              <h3 className="text-3xl md:text-4xl font-black text-white tracking-tight">How QueueWise Works</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gray-300/40 border-t-2 border-dashed border-gray-300/70 -z-0"></div>
              
              {/* Step 1 */}
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-white rounded-2xl shadow-xl shadow-gray-200/50 flex items-center justify-center mb-6 border border-gray-300">
                  <span className="text-3xl font-black text-gray-500">01</span>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Find & Scan</h4>
                <p className="text-gray-200">Customers arrive and scan your business's unique QR code to access your live queue.</p>
              </div>

              {/* Step 2 */}
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-blue-600 rounded-2xl shadow-xl shadow-blue-600/30 flex items-center justify-center mb-6 text-white transform scale-110">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Join Queue</h4>
                <p className="text-gray-200">They check-in digitally, select their required service, and get an instant digital token.</p>
              </div>

              {/* Step 3 */}
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-white rounded-2xl shadow-xl shadow-gray-200/50 flex items-center justify-center mb-6 border border-gray-300">
                  <span className="text-3xl font-black text-gray-500">03</span>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Get Notified</h4>
                <p className="text-gray-200">Customers wait freely and receive live updates. They arrive exactly when it's their turn.</p>
              </div>
            </div>
          </div>
        </section>

        {/* WHY BUSINESSES USE QUEUEWISE */}
        <section id="features" className="py-24 bg-white border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-sm font-bold text-blue-500 tracking-widest uppercase mb-2">Features</h2>
              <h3 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Why Businesses Use QueueWise</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6">
                  <span className="text-2xl">👥</span>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">Queues Managed</h4>
                <p className="text-gray-500">Eliminate crowded waiting areas. Serve more customers without the chaos of physical lines.</p>
              </div>
              <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6">
                  <span className="text-2xl">👨‍💼</span>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">Staff Managed</h4>
                <p className="text-gray-500">Distribute workload efficiently across multiple counters. Keep your team organized and focused.</p>
              </div>
              <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6">
                  <span className="text-2xl">📊</span>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">Insights Provided</h4>
                <p className="text-gray-500">Access real-time analytics on wait times, service durations, and peak hours to optimize operations.</p>
              </div>
            </div>
          </div>
        </section>

        {/* LIVE QUEUE INTELLIGENCE (Showcase) */}
        <section className="py-15 bg-linear-to-br from-gray-800 via-gray-500 to-gray-800 relative overflow-hidden">
          <div className="absolute inset-0  opacity-10"></div>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-4">Live Queue Intelligence</h2>
              <p className="text-gray-300">Live status updates and real-time wait estimates. Total clarity for your customers.</p>
            </div>

            <div className="bg-gray-800 rounded-3xl border border-gray-700 shadow-2xl overflow-hidden">
              <div className="bg-gray-900 px-6 py-4 flex items-center gap-3 border-b border-gray-700">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="ml-4 text-xs font-mono text-gray-400">queuewise.app/live</div>
              </div>
              <div className="grid grid-cols-2 divide-x divide-y divide-gray-700/50">
                <div className="p-8 flex flex-col items-center text-center">
                  <span className="text-5xl font-black text-blue-400 mb-2">21</span>
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-wide">Queue Length</span>
                </div>
                <div className="p-8 flex flex-col items-center text-center">
                  <span className="text-5xl font-black text-orange-400 mb-2">18m</span>
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-wide">Avg Wait</span>
                </div>
                <div className="p-8 flex flex-col items-center text-center">
                  <span className="text-5xl font-black text-purple-400 mb-2">3 / 4</span>
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-wide">Counters Active</span>
                </div>
                <div className="p-8 flex flex-col items-center text-center">
                  <span className="text-5xl font-black text-green-400 mb-2">● Normal</span>
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-wide">Queue Health</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CLOSING STATEMENT */}
        <section className="py-24 bg-white border-t border-gray-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-12">
              <p className="text-sm font-bold text-red-500 tracking-widest uppercase mb-3">A better way to wait</p>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight mb-5">
                Keep the line moving. Keep people informed.
              </h2>
              <p className="text-lg text-gray-500 leading-relaxed">
                QueueWise gives your team a clear view of every customer journey, while customers stay informed from check-in to service.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-gray-200 pt-8">
              <div>
                <p className="text-2xl font-black text-gray-900 mb-2">Less crowding</p>
                <p className="text-gray-500">Customers can step away without losing their place.</p>
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900 mb-2">Clearer service</p>
                <p className="text-gray-500">Your team sees what needs attention, at a glance.</p>
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900 mb-2">Better experiences</p>
                <p className="text-gray-500">Every visit feels more considered, from start to finish.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
