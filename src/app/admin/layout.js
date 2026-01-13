"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import AdminSidebar from '@/components/admin/Sidebar';

export default function AdminLayout({ children }) {
  const pathname = usePathname();

  // Exclude login page from sidebar layout
  if (pathname === '/admin/login') {
    return <div className="min-h-screen bg-[#1a1a1a]">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex">
      {/* Sidebar - fixed width */}
      <AdminSidebar />

      {/* Main Content Area */}
      <main className="flex-1 ml-64 min-h-screen bg-[#1a1a1a]">
        {/* We can add a top header here if needed, or just let pages handle their content */}
        {children}
      </main>
    </div>
  );
}
