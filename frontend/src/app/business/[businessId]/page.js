"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "../../../lib/api";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function BusinessDetailsPage() {
  const { businessId } = useParams();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const bizData = await fetchAPI(`/businesses/${businessId}`);
        setBusiness(bizData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [businessId]);

  if (loading) return <div className="p-8">Loading location...</div>;
  if (!business) return <div className="p-8">Location not found.</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link href="/" className="text-sm text-gray-500 hover:underline">&larr; Back to Directory</Link>
      <h1 className="text-3xl font-bold mt-4 mb-2">{business.name}</h1>
      <p className="text-gray-600 mb-2">{business.description}</p>
      {business.address && (
        <p className="text-gray-500 text-sm mb-8">{business.address}, {business.city}</p>
      )}

      <h2 className="text-2xl font-semibold mb-4">Available Services</h2>
      <BusinessServices businessId={businessId} />
    </div>
  );
}

function BusinessServices({ businessId }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAPI(`/services/business/${businessId}`)
      .then(setServices)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [businessId]);

  if (loading) return <p className="text-sm text-gray-500">Loading services...</p>;
  if (services.length === 0) return <p className="text-sm text-gray-500">No services available.</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
      {services.map(service => (
        <Link 
          key={service.id}
          href={`/business/${businessId}/services/${service.id}`}
          className="block p-3 border rounded hover:border-blue-500 hover:shadow-sm transition"
        >
          <div className="font-semibold text-blue-600">{service.name}</div>
          <div className="text-xs text-gray-500 mt-1">Est. {service.estimatedDuration} min</div>
        </Link>
      ))}
    </div>
  );
}
