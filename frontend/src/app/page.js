"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "../lib/api";
import Link from "next/link";
import Hero from "../components/Hero";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const CITIES = ["Delhi", "Mumbai", "Bangalore", "Pune", "Hyderabad"];

export default function DiscoveryPage() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [city, setCity] = useState("Delhi");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (city) queryParams.append('city', city);
        if (search) queryParams.append('search', search);
        
        const data = await fetchAPI(`/businesses?${queryParams.toString()}`);
        setBusinesses(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    // Debounce search slightly
    const timeoutId = setTimeout(() => {
      loadData();
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [city, search]);

  return (
    <div>
      <Navbar />
      <Hero />
      
      <div id="locations" className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Discover Services</h2>
              <p className="text-gray-600 mt-2">Find a QueueWise partner near you to join the waitlist.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <div className="flex flex-col">
                <label className="text-sm text-gray-500 mb-1 font-medium">City</label>
                <select 
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="border text-gray-700 border-gray-400 rounded-lg px-4 py-2 focus:ring-red-500 focus:border-red-500 outline-none"
                >
                  <option value="">All Cities</option>
                  {CITIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex flex-col w-full sm:w-64">
                <label className="text-sm text-gray-500 mb-1 font-medium">Search</label>
                <input 
                  type="text"
                  placeholder="Business or location name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="border text-gray-700 border-gray-400 rounded-lg px-4 py-2 focus:ring-red-500 focus:border-red-500 outline-none"
                />
              </div>
            </div>
          </div>

          {error && <div className="p-4 bg-red-100 text-red-700 rounded-lg mb-6">Error: {error}</div>}

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
            </div>
          ) : businesses.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
              <p className="text-xl text-gray-500">No businesses found matching your criteria.</p>
              <button 
                onClick={() => {setCity(""); setSearch("");}}
                className="mt-4 text-blue-600 font-medium hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {businesses.map((business) => (
                <div key={business.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <h3 className="text-xl font-bold text-gray-900">{business.name}</h3>
                  <p className="text-gray-600 mt-2 text-sm line-clamp-2">{business.description}</p>
                  
                  <div className="flex gap-2 mt-2">
                    {business.city && (
                      <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                        {business.city}
                      </span>
                    )}
                  </div>

                  <Link 
                    href={`/business/${business.id}`}
                    className="mt-6 w-full inline-block text-center bg-gray-50 hover:bg-gray-100 text-gray-900 font-medium py-2 rounded-lg transition-colors border border-gray-200"
                  >
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
