'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { use } from 'react';

export default function DashboardLayout({ children, params }) {
  const pathname = usePathname();
  const resolvedParams = use(params);
  const businessId = resolvedParams.businessId;

  const navItems = [
    { name: 'Live Operations', href: `/dashboard/${businessId}` },
    { name: 'Analytics', href: `/dashboard/${businessId}/analytics` },
    { name: 'Settings', href: `/dashboard/${businessId}/settings` },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <h1 className="text-xl font-bold tracking-wider">QueueWise Admin</h1>
          <p className="text-xs text-slate-400 mt-1">Location Dashboard</p>
        </div>
        
        <nav className="flex-1 py-4">
          <ul className="space-y-1 px-3">
            {navItems.map(item => {
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link 
                    href={item.href}
                    className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                  >
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <Link href="/" className="text-sm text-slate-400 hover:text-white flex items-center gap-2">
            <span>&larr;</span> Back to Home
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

