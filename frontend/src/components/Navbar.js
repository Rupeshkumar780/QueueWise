"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [customerDashboardUrl, setCustomerDashboardUrl] = useState("/demo");
  const pathname = usePathname();

  // If we are on a business page, don't show "For Businesses"
  const isBusinessPage = pathname?.startsWith('/business/');

  useEffect(() => {
    const handleScroll = () => { setIsScrolled(window.scrollY > 80); };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const loadUser = () => {
      try {
        const stored = localStorage.getItem("user");
        setUser(stored ? JSON.parse(stored) : null);
      } catch { setUser(null); }
    };
    loadUser();
    const lastBiz = localStorage.getItem("lastVisitedBusinessId");
    if (lastBiz) { setCustomerDashboardUrl(`/business/${lastBiz}`); }
    window.addEventListener("storage", loadUser);
    return () => window.removeEventListener("storage", loadUser);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setDropdownOpen(false);
    window.location.href = "/";
  };

  const handleDashboardRedirect = (e) => {
    e.preventDefault();
    if (user.role === "BUSINESS_ADMIN" || user.role === "STAFF") {
      window.location.href = "/dashboard";
    } else {
      window.location.href = "/demo";
    }
  };

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 bg-white border-b ${isScrolled ? "shadow-lg border-gray-200" : "shadow-none border-transparent"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">

          <Link href="/" className="flex items-center gap-0.5">
            <span className="text-2xl font-black text-red-500 tracking-tighter">Queue</span>
            <span className="text-2xl font-black text-gray-900 tracking-tighter">Wise</span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <Link href="/#how-it-works" className="text-gray-600 hover:text-red-500 text-sm font-medium transition">
              How it works
            </Link>
            
            <Link href="/#features" className="text-gray-600 hover:text-red-500 text-sm font-medium transition">
              Features
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition">
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm select-none">
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[100px] truncate">{user.name?.split(" ")[0]}</span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs text-gray-400">Signed in as</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.email}</p>
                    </div>
                    {user.role === "BUSINESS_ADMIN" || user.role === "STAFF" ? (
                      <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setDropdownOpen(false)}>
                        My Dashboard
                      </Link>
                    ) : (
                      <>
                        <Link href={customerDashboardUrl} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setDropdownOpen(false)}>
                          My Dashboard
                        </Link>
                        <Link href="/my-tickets" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setDropdownOpen(false)}>
                          My Tickets
                        </Link>
                      </>
                    )}
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/auth/login" className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2 rounded-xl text-sm font-semibold transition shadow-sm">
                Login
              </Link>
            )}

            <button className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-1">
            <Link href="/#how-it-works" className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">How it works</Link>
            <Link href="/#features" className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">Features</Link>
            {!user && (
              <Link href="/auth/login" className="block px-4 py-2 text-sm font-bold text-gray-900 hover:bg-gray-50 rounded-lg">Login</Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

