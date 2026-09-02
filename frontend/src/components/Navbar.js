"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show navbar after scrolling 100px
      if (window.scrollY > 100) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-transform duration-300 ${
        isScrolled ? "translate-y-0" : "-translate-y-full"
      } bg-white shadow-md border-b`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-2xl font-bold text-red-500 tracking-wide">
              Queue<span className="text-black">Wise</span>
              <div className="h-1 w-full bg-red-500 mt-1 rounded"></div>
            </Link>
          </div>
          <div className="hidden md:flex space-x-8">
            <Link href="#about" className="text-gray-700 hover:text-red-500 px-3 py-2 text-sm font-medium">
              About
            </Link>
            <Link href="#locations" className="text-gray-700 hover:text-red-500 px-3 py-2 text-sm font-medium">
              Services/Locations
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">profile</span>
            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold cursor-pointer hover:bg-blue-700 transition">
              U
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

