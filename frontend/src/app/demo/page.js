"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function DemoCustomerPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <Navbar />

      <main className="flex-grow pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* DEMO BANNER */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8 text-center shadow-sm">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-full mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome to your QueueWise Account</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            This is a global dashboard view. To join a real queue, please scan the specific QR code provided by the business you are visiting. 
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gray-900 px-5 py-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Global Network Intelligence
                </h2>
                <span className="ml-auto text-xs text-gray-500">Live Demo Data</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-y sm:divide-y-0 divide-gray-100">
                <div className="p-6 flex flex-col items-center justify-center text-center">
                  <span className="text-4xl font-black text-blue-600">42</span>
                  <span className="text-xs font-bold text-gray-400 uppercase mt-2 tracking-wide">Active Businesses</span>
                </div>
                <div className="p-6 flex flex-col items-center justify-center text-center">
                  <span className="text-4xl font-black text-orange-500">1,204</span>
                  <span className="text-xs font-bold text-gray-400 uppercase mt-2 tracking-wide">People in Queues</span>
                </div>
                <div className="p-6 flex flex-col items-center justify-center text-center col-span-2 sm:col-span-1">
                  <span className="text-4xl font-black text-green-500">12m</span>
                  <span className="text-xs font-bold text-gray-400 uppercase mt-2 tracking-wide">Avg Global Wait</span>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
               <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                 <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                 </svg>
               </div>
               <h3 className="text-lg font-bold text-gray-900 mb-2">No Active Tickets</h3>
               <p className="text-gray-500">You haven't joined any queues recently. Scan a business QR code to get started.</p>
            </section>
          </div>

          <div className="space-y-8">
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">How to join a queue</h3>
              </div>
              <div className="p-5 space-y-4 text-sm text-gray-600">
                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0 mt-0.5">1</div>
                  <p>Walk up to any business powered by QueueWise.</p>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0 mt-0.5">2</div>
                  <p>Scan their unique QR code displayed at the entrance or counter.</p>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0 mt-0.5">3</div>
                  <p>Select your required service and hit "Join Queue".</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

