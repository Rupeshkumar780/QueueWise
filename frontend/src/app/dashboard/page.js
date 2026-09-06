"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function DashboardRootRedirect() {
  const router = useRouter();

  useEffect(() => {
    async function routeUser() {
      try {
        const res = await api.get("/businesses/my");
        if (res.data && res.data.length > 0) {
          router.replace(`/dashboard/${res.data[0].id}`);
        } else {
          router.replace("/onboarding/business");
        }
      } catch (err) {
        console.error("Failed to fetch businesses for routing", err);
        router.replace("/");
      }
    }
    routeUser();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium animate-pulse">Loading your dashboard...</p>
      </div>
    </div>
  );
}

