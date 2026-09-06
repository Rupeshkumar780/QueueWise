"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { fetchAPI } from "../../../../../../lib/api";
import { toast } from "react-hot-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function JoinQueuePage() {
  const { businessId, serviceId } = useParams();
  const router = useRouter();
  
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationStatus, setLocationStatus] = useState("idle"); // idle, requesting, success, error
  const [locationData, setLocationData] = useState(null);
  
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [userContext, setUserContext] = useState(null);

  useEffect(() => {
    async function init() {
      try {
        // 1. Fetch user context (Check if logged in)
        const token = localStorage.getItem("token");
        if (!token) {
          // Deferred login
          localStorage.setItem("redirect_after_login", window.location.pathname);
          router.push("/auth/login");
          return;
        }

        const userRes = await fetchAPI("/auth/me");
        setUserContext(userRes);

        // 2. Fetch service configuration
        const serviceData = await fetchAPI(`/services/${serviceId}`);
        setService(serviceData);

        // Check if user already has an active entry for this queue
        // (Assuming active queue for this service is serviceData.queues[0])
        if (serviceData.queues && serviceData.queues.length > 0) {
           const queueId = serviceData.queues[0].id;
           // We can check if they have an active ticket by trying to find it,
           // but the backend will throw an error on POST anyway. 
           // For better UX, we could call a specific endpoint, but let's handle the POST error gracefully.
        }

      } catch (err) {
        console.error(err);
        toast.error("Failed to load service details or authentication.");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [businessId, serviceId, router]);

  const requestLocation = () => {
    setLocationStatus("requesting");
    if (!navigator.geolocation) {
      setLocationStatus("error");
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationData({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLocationStatus("success");
      },
      (error) => {
        console.error("Location error", error);
        setLocationStatus("error");
        toast.error("Failed to get location. Please enable GPS permissions.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (service?.requiresLocation && locationStatus !== "success") {
      toast.error("Please share your location to join.");
      return;
    }
    
    // Check if required form fields are filled
    const schema = service?.formTemplate?.schema;
    if (schema && Array.isArray(schema)) {
      for (const field of schema) {
        if (field.required && !formData[field.label]) {
          toast.error(`${field.label} is required.`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const activeQueue = service.queues.find(q => q.status === 'OPEN');
      if (!activeQueue) throw new Error("No open queue found for this service.");

      const payload = {
        locationData: locationStatus === "success" ? { ...locationData, formData } : { formData }
      };

      const result = await fetchAPI(`/queue-entries/${activeQueue.id}/join`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      toast.success("Joined queue successfully!");
      router.push(`/queue/${result.id}`);
    } catch (err) {
      console.error(err);
      if (err.message?.includes("already in this queue")) {
        toast.error("You already have an active ticket for this queue.");
        // Customers can manage their active tickets from My Tickets.
        router.push("/my-tickets");
      } else {
        toast.error(err.message || "Failed to join queue");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!service) return <div className="p-8 text-center">Service not found.</div>;

  const schema = service.formTemplate?.schema || [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex grow pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full mx-auto bg-white rounded-2xl shadow-xl shadow-gray-200/40 border border-gray-100 overflow-hidden">
          <div className="bg-linear-to-br from-gray-800 via-gray-600 to-gray-800 px-6 py-6 text-white relative">
            <button 
              onClick={() => router.back()} 
              className="absolute left-4 top-4 text-gray-400 hover:text-white transition flex items-center gap-1 text-sm font-medium"
            >
              &larr; Back
            </button>
            <div className="mt-4">
              <span className="text-xs mt-10 font-bold text-blue-400 uppercase tracking-widest mb-1 block">Join Queue</span>
              <h1 className="text-2xl font-black">{service.name}</h1>
              <p className="text-gray-400 text-sm mt-1">Estimated wait: ~{service.estimatedDuration} min</p>
            </div>
          </div>

          <div className="p-6 sm:p-8">
          {/* Pre-requisites */}
          {service.description && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-100 rounded-xl text-sm text-yellow-800">
              <h3 className="font-bold mb-1 flex items-center gap-2">
                ⚠️ Before joining
              </h3>
              <p className="whitespace-pre-wrap">{service.description}</p>
            </div>
          )}

          {/* Location Verification */}
          {service.requiresLocation && locationStatus !== "success" && (
            <div className="mb-6 p-5 border-2 border-dashed border-gray-200 rounded-xl text-center">
              <div className="text-3xl mb-2">📍</div>
              <h3 className="font-bold text-gray-900 mb-1">Location Verification Required</h3>
              <p className="text-xs text-gray-500 mb-4">You must be physically present at the location to join the queue.</p>
              <button 
                type="button"
                onClick={requestLocation}
                disabled={locationStatus === "requesting"}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition"
              >
                {locationStatus === "requesting" ? "Locating..." : "Verify My Location"}
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-4">
              {/* Default User Data */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={userContext?.name || ''} 
                  disabled 
                  className="w-full bg-gray-100 border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                />
              </div>
              
              {/* Dynamic Form Render */}
              {Array.isArray(schema) && schema.map((field, idx) => (
                <div key={idx}>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  
                  {field.type === 'text' && (
                    <input 
                      type="text"
                      className="w-full border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      onChange={(e) => handleInputChange(field.label, e.target.value)}
                      required={field.required}
                    />
                  )}

                  {field.type === 'number' && (
                    <input 
                      type="number"
                      className="w-full border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder={`Enter number`}
                      onChange={(e) => handleInputChange(field.label, e.target.value)}
                      required={field.required}
                    />
                  )}

                  {field.type === 'select' && field.options && (
                    <select
                      className="w-full border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      onChange={(e) => handleInputChange(field.label, e.target.value)}
                      required={field.required}
                    >
                      <option value="">Select...</option>
                      {field.options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}

                  {field.type === 'radio' && field.options && (
                    <div className="space-y-2 mt-2">
                      {field.options.map(opt => (
                        <label key={opt} className="flex items-center gap-2">
                          <input 
                            type="radio" 
                            name={field.label}
                            value={opt}
                            onChange={(e) => handleInputChange(field.label, e.target.value)}
                            required={field.required}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {field.type === 'checkbox' && (
                    <label className="flex items-center gap-2 mt-2">
                      <input 
                        type="checkbox"
                        onChange={(e) => handleInputChange(field.label, e.target.checked)}
                        required={field.required}
                        className="text-blue-600 focus:ring-blue-500 rounded"
                      />
                      <span className="text-sm text-gray-700">Yes, I confirm</span>
                    </label>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting || (service.requiresLocation && locationStatus !== "success")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Joining..." : "Confirm & Join Queue"}
              </button>
            </div>
            
          </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
