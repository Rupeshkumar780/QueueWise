import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-6">
          
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="flex items-center gap-0.5 mb-4">
              <span className="text-2xl font-black text-red-500 tracking-tighter">Queue</span>
              <span className="text-2xl font-black text-gray-900 tracking-tighter">Wise</span>
            </Link>
            <p className="text-sm text-gray-500 mb-6 max-w-xs">
              The modern, digital queue management system. Eliminate physical waiting lines and streamline your operations.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Product</h4>
            <ul className="space-y-3 text-sm text-gray-600">
              <li><Link href="/#features" className="relative inline-block hover:text-red-500 transition-colors after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-red-500 after:transition-transform after:duration-500 after:ease-in-out hover:after:scale-x-100">Features</Link></li>
              <li><Link href="/demo" className="relative inline-block hover:text-red-500 transition-colors after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-red-500 after:transition-transform after:duration-500 after:ease-in-out hover:after:scale-x-100">Live Demo</Link></li>
              <li><Link href="/auth/signup?type=business" className="relative inline-block hover:text-red-500 transition-colors after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-red-500 after:transition-transform after:duration-500 after:ease-in-out hover:after:scale-x-100">For Businesses</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Resources</h4>
            <ul className="space-y-3 text-sm text-gray-600">
              <li><Link href="/help" className="relative inline-block hover:text-red-500 transition-colors after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-red-500 after:transition-transform after:duration-500 after:ease-in-out hover:after:scale-x-100">Help Center</Link></li>
              <li><Link href="/terms" className="relative inline-block hover:text-red-500 transition-colors after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-red-500 after:transition-transform after:duration-500 after:ease-in-out hover:after:scale-x-100">Terms of Service</Link></li>
              <li><Link href="/status" className="relative inline-block hover:text-red-500 transition-colors after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-red-500 after:transition-transform after:duration-500 after:ease-in-out hover:after:scale-x-100">System Status</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Company</h4>
            <ul className="space-y-3 text-sm text-gray-600">
              <li><Link href="/about" className="relative inline-block hover:text-red-500 transition-colors after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-red-500 after:transition-transform after:duration-500 after:ease-in-out hover:after:scale-x-100">About Us</Link></li>
              <li><Link href="/privacy" className="relative inline-block hover:text-red-500 transition-colors after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-red-500 after:transition-transform after:duration-500 after:ease-in-out hover:after:scale-x-100">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <hr className="relative left-1/2 w-screen -translate-x-1/2 border-0 border-t border-gray-400 m-0" />
        
        <div className="pt-5 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} QueueWise. All rights reserved.
          </p>
          <div className="flex gap-4">
            {/* Social Icons Placeholder */}
            <a href="https://www.linkedin.com/in/rupesh-kumar-240437287/" className="text-gray-400 hover:text-gray-600 transition" aria-label="LinkedIn">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6.94 8.5A1.56 1.56 0 1 1 6.94 5.38a1.56 1.56 0 0 1 0 3.12ZM5.5 9.84h2.88v8.8H5.5v-8.8Zm4.73 0h2.76v1.2h.04c.38-.72 1.32-1.48 2.72-1.48 2.92 0 3.46 1.92 3.46 4.41v4.67h-2.88v-4.38c0-1.04-.02-2.38-1.45-2.38-1.46 0-1.68 1.13-1.68 2.31v4.45h-2.87V9.84Z"/>
              </svg>
            </a>
            <a href="https://github.com/Rupeshkumar780" className="text-gray-400 hover:text-gray-600 transition">
              <span className="sr-only">GitHub</span>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
