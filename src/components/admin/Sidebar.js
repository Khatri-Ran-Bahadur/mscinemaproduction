"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Image as ImageIcon, 
  FileText, 
  Settings, 
  LogOut,
  CreditCard,
  Clock,
  Mail,
  Shield
} from 'lucide-react';

export default function AdminSidebar() {
  const pathname = usePathname();

  const menuItems = [
    {
      title: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      href: '/admin/dashboard'
    },
    
    {
      title: 'Orders',
      icon: <CreditCard className="w-5 h-5" />, // Use a relevant icon
      href: '/admin/orders'
    },
    {
      title: 'Half Way Bookings',
      icon: <Clock className="w-5 h-5" />,
      href: '/admin/half-way-bookings'
    },
    {
      title: 'Banners',
      icon: <ImageIcon className="w-5 h-5" />,
      href: '/admin/banners'
    },
    {
      title: 'About Content',
      icon: <FileText className="w-5 h-5" />,
      href: '/admin/about'
    },
    {
      title: 'Pages',
      icon: <FileText className="w-5 h-5" />,
      href: '/admin/pages'
    },


    {
      title: 'Contact Messages',
      icon: <Mail className="w-5 h-5" />,
      href: '/admin/contacts'
    },
    {
      title: 'Promotions',
      icon: <ImageIcon className="w-5 h-5" />,
      href: '/admin/promotions'
    },
    {
      title: 'Experiences',
      icon: <FileText className="w-5 h-5" />, 
      href: '/admin/experiences'
    },
    {
      title: 'Settings',
      icon: <Settings className="w-5 h-5" />,
      href: '/admin/settings'
    },
    {
      title: 'Payment Logs',
      icon: <Shield className="w-5 h-5" />,
      href: '/admin/payment-logs'
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    window.location.href = '/admin/login';
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#2a2a2a] border-r border-[#3a3a3a] flex flex-col z-40">
      {/* Brand */}
      <div className="p-2 border-b border-[#3a3a3a] flex flex-col items-center gap-3">
        <img 
          src="/img/logo.png" 
          alt="MS Cinemas" 
          className="h-16 w-auto"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                isActive 
                  ? 'bg-[#FFCA20] text-black font-semibold shadow-lg shadow-[#FFCA20]/20' 
                  : 'text-[#D3D3D3] hover:bg-[#3a3a3a] hover:text-white'
              }`}
            >
              <span className={isActive ? 'text-black' : 'text-[#888] group-hover:text-white'}>
                {item.icon}
              </span>
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / User Info */}
      <div className="p-4 border-t border-[#3a3a3a] bg-[#252525]">
        <Link href="/admin/profile" className="flex items-center gap-3 mb-4 px-2 hover:bg-[#3a3a3a] p-2 rounded transition cursor-pointer group">
          <div className="w-10 h-10 rounded-full bg-[#3a3a3a] flex items-center justify-center border border-[#4a4a4a] group-hover:border-[#FFCA20] transition">
             <span className="text-[#FFCA20] font-bold">A</span>
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-white truncate group-hover:text-[#FFCA20] transition">Administrator</p>
            <p className="text-xs text-[#888] truncate">admin@mscinema.com</p>
          </div>
        </Link>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
