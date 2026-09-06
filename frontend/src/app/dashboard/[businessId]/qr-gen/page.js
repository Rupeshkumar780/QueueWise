'use client';

import { useState, useEffect, use } from 'react';
import api from '@/lib/api';
import { QRCodeSVG } from 'qrcode.react';

export default function QRGeneratorPage({ params }) {
  const resolvedParams = use(params);
  const businessId = resolvedParams.businessId;
  const [business, setBusiness] = useState(null);

  useEffect(() => {
    const fetchBiz = async () => {
      try {
        const res = await api.get(`/businesses/${businessId}`);
        setBusiness(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchBiz();
  }, [businessId]);

  if (!business) return <div>Loading...</div>;

  // This URL points to the public queue joining page for this business
  const joinUrl = `${window.location.origin}/business/${businessId}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="print:hidden">
        <h2 className="text-2xl font-bold text-gray-900">QR Code Generator</h2>
        <p className="text-gray-500 text-sm mt-1">Print this QR code and place it at your entrance. Customers can scan it to join the queue without downloading any app.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start print:hidden">
        
        {/* Preview Panel */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col items-center text-center">
          <h3 className="text-2xl font-black text-gray-900 mb-2">{business.name}</h3>
          <p className="text-gray-500 mb-8 font-medium">Scan to join the live queue!</p>
          
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-8">
            <QRCodeSVG value={joinUrl} size={256} level="H" includeMargin={true} />
          </div>
          
          <div className="text-sm font-medium text-blue-600 bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
            {joinUrl}
          </div>
        </div>

        {/* Actions Panel */}
        <div className="w-full md:w-72 space-y-4">
          <button 
            onClick={handlePrint}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
            Print Poster
          </button>
          <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm border border-blue-100">
            <p className="font-bold mb-1">Tip:</p>
            <p>If you have Geofencing enabled, customers must physically be within the radius of your location for the QR code to let them join.</p>
          </div>
        </div>
      </div>

      {/* Print-Only View */}
      <div className="hidden print:flex flex-col items-center justify-center min-h-screen text-center p-12">
        <h1 className="text-6xl font-black text-gray-900 mb-4">{business.name}</h1>
        <h2 className="text-3xl font-bold text-gray-600 mb-16">Scan below to join our live queue</h2>
        
        <div className="border-8 border-gray-900 p-8 rounded-3xl mb-16">
          <QRCodeSVG value={joinUrl} size={400} level="H" includeMargin={false} />
        </div>
        
        <p className="text-xl text-gray-500 font-medium">No app download required. Just use your camera!</p>
        <p className="text-lg text-gray-400 mt-4">{joinUrl}</p>
      </div>
    </div>
  );
}

