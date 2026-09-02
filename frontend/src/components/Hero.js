"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const images = [
  "/Queuewise main page photos (0).png",
  "/Queuewise main page photos (1).png",
  "/Queuewise main page photos (2).png",
  "/Queuewise main page photos (3).png",
  "/Queuewise main page photos (4).png",
  "/Queuewise main page photos (5).png",
  "/Queuewise main page photos (6).png",
  "/Queuewise main page photos (7).png",
];

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 4000); // Change image every 4 seconds
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-white py-5 md:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Title */}
        <div className="text-center mb-5">
          <h1 className="text-4xl text-red-500 md:text-6xl font-bold tracking-tight mb-2">
            Queue<span className="text-black">Wise</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-700">
            Smart Appointment & Waitlist Optimization System
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center sm:gap-8 md:gap-16 mt-12">
          {/* Left: Slideshow (4:3 aspect ratio) */}
          <div className="w-full md:w-1/2">
            <div className="relative w-full aspect-[4/3] bg-transparent">
              {images.map((src, index) => (
                <div 
                  key={src} 
                  className={`absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ${
                    index === currentSlide ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`Slide ${index + 1}`}
                    className="max-w-full max-h-full rounded-xl shadow-xl"
                  />
                </div>
              ))}
            </div>
            
            {/* Slide indicators */}
            <div className="flex justify-center mt-4 space-x-2">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    idx === currentSlide ? "bg-red-500" : "bg-gray-300 hover:bg-gray-400"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Right: Description & CTA */}
          <div className="w-full md:w-1/2 flex flex-col justify-center text-center md:text-left">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Skip the Waiting Room
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              QueueWise allows you to discover nearby services, join virtual waitlists from anywhere, and track your live queue status right from your phone. Don't waste another minute standing in line—arrive exactly when it's your turn.
            </p>
            <div>
              <a
                href="#locations"
                className="inline-block bg-blue-600 text-white font-semibold px-8 py-4 rounded-full shadow-lg hover:bg-blue-700 transition transform hover:-translate-y-1"
              >
                Discover Services
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

