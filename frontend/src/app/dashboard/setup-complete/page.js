'use client';

import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SetupCompleteContent() {
  const searchParams = useSearchParams();
  const businessId = searchParams.get('businessId') || '';

  return (
    <div className="flex-1 flex flex-col justify-center items-center py-12 px-4 text-center">
      <div className="bg-green-100 text-green-700 w-24 h-24 rounded-full flex items-center justify-center mb-6">
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
        </svg>
      </div>
      <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Location Setup Complete!</h2>
      <p className="text-lg text-gray-600 max-w-md mb-8">
        Your location has been provisioned. You can now start configuring queues, adding counters, and generating your physical QR codes.
      </p>
      <Link href={`/dashboard/${businessId}`} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg shadow-sm transition-colors text-lg">
        Go to Admin Dashboard
      </Link>
    </div>
  );
}

export default function SetupCompletePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <Suspense fallback={<div>Loading...</div>}>
        <SetupCompleteContent />
      </Suspense>
    </div>
  );
}
