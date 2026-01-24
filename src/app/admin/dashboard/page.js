"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Image, 
  FileText, 
  Settings, 
  DollarSign, 
  ShoppingBag, 
  Ticket, 
  TrendingUp, 
  BarChart3,
  Calendar
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check admin authentication
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    fetchDashboardData();
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/admin/dashboard');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setDashboardData(data.stats);
        }
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#FFCA20] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  // Fallback if data fetch failed
  const stats = dashboardData || {
    today: { sales: 0, orders: 0, tickets: 0 },
    week: { sales: 0, orders: 0, tickets: 0 },
    month: { sales: 0, orders: 0, tickets: 0 },
    chart: []
  };

  // Helper to format currency
  const fmtMoney = (amount) => `RM ${parseFloat(amount || 0).toFixed(2)}`;

  // Calculate chart max for scaling
  const maxChartValue = Math.max(...(stats.chart.map(d => d.amount) || [0]), 100);

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-[#FFCA20] mb-8">Dashboard Overview</h1>

        {/* Sales Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Today */}
          <div className="bg-[#2a2a2a] rounded-xl p-6 border border-[#3a3a3a] shadow-lg relative overflow-hidden group hover:border-[#FFCA20]/50 transition duration-300">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition">
              <DollarSign className="w-24 h-24 text-[#FFCA20]" />
            </div>
            <h3 className="text-gray-400 font-medium mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Today's Sales
            </h3>
            <div className="text-3xl font-bold text-white mb-4">{fmtMoney(stats.today.sales)}</div>
            <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1 text-[#FFCA20]">
                    <ShoppingBag className="w-4 h-4" />
                    <span>{stats.today.orders} Orders</span>
                </div>
                <div className="flex items-center gap-1 text-blue-400">
                    <Ticket className="w-4 h-4" />
                    <span>{stats.today.tickets} Tickets</span>
                </div>
            </div>
          </div>

          {/* This Week */}
          <div className="bg-[#2a2a2a] rounded-xl p-6 border border-[#3a3a3a] shadow-lg relative overflow-hidden group hover:border-[#FFCA20]/50 transition duration-300">
             <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition">
              <TrendingUp className="w-24 h-24 text-blue-500" />
            </div>
            <h3 className="text-gray-400 font-medium mb-2 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> This Week
            </h3>
            <div className="text-3xl font-bold text-white mb-4">{fmtMoney(stats.week.sales)}</div>
            <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1 text-gray-300">
                    <ShoppingBag className="w-4 h-4" />
                    <span>{stats.week.orders} Orders</span>
                </div>
                 <div className="flex items-center gap-1 text-gray-300">
                    <Ticket className="w-4 h-4" />
                    <span>{stats.week.tickets} Tickets</span>
                </div>
            </div>
          </div>

          {/* This Month */}
          <div className="bg-[#2a2a2a] rounded-xl p-6 border border-[#3a3a3a] shadow-lg relative overflow-hidden group hover:border-[#FFCA20]/50 transition duration-300">
             <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition">
              <LayoutDashboard className="w-24 h-24 text-green-500" />
            </div>
            <h3 className="text-gray-400 font-medium mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> This Month
            </h3>
            <div className="text-3xl font-bold text-white mb-4">{fmtMoney(stats.month.sales)}</div>
             <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1 text-gray-300">
                    <ShoppingBag className="w-4 h-4" />
                    <span>{stats.month.orders} Orders</span>
                </div>
                 <div className="flex items-center gap-1 text-gray-300">
                    <Ticket className="w-4 h-4" />
                    <span>{stats.month.tickets} Tickets</span>
                </div>
            </div>
          </div>
        </div>

        {/* Sales Chart (Last 30 Days) */}
        <div className="bg-[#2a2a2a] rounded-xl p-6 border border-[#3a3a3a] shadow-lg mb-8">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#FFCA20]" />
                Sales Summary (Last 30 Days)
            </h3>
            
            <div className="w-full h-64 flex items-end gap-1 sm:gap-2">
                {stats.chart.length > 0 ? stats.chart.map((day, i) => {
                    const heightPercent = (day.amount / maxChartValue) * 100;
                    const isToday = i === stats.chart.length - 1;
                    return (
                        <div key={day.date} className="flex-1 flex flex-col justify-end group relative h-full">
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black border border-[#3a3a3a] text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10">
                                <div className="font-bold">{day.label}</div>
                                <div>{fmtMoney(day.amount)}</div>
                            </div>
                            
                            {/* Bar */}
                            <div 
                                className={`w-full rounded-t transition-all duration-500 hover:brightness-110 ${isToday ? 'bg-[#FFCA20]' : 'bg-[#333]'}`}
                                style={{ height: `${Math.max(heightPercent, 2)}%` }} // Min 2% height visibility
                            ></div>
                            
                            {/* X-axis Label (Show roughly every 5 days to avoid clutter) */}
                            {i % 5 === 0 && (
                                <div className="text-[10px] text-gray-500 text-center mt-2 absolute top-full w-full">
                                    {day.label}
                                </div>
                            )}
                        </div>
                    );
                }) : (
                     <div className="w-full h-full flex items-center justify-center text-gray-500">
                        No Data Available
                     </div>
                )}
            </div>
        </div>

        {/* Quick Actions */}
        <h2 className="text-xl font-bold text-white mb-4 mt-12">Quick Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Banner Management */}
          <div className="bg-[#2a2a2a] rounded-lg p-6 border border-[#3a3a3a] hover:border-[#FFCA20]/30 transition">
            <div className="flex items-center gap-3 mb-4">
              <Image className="w-6 h-6 text-[#FFCA20]" />
              <h2 className="text-xl font-bold text-[#FAFAFA]">Banner Management</h2>
            </div>
            <p className="text-sm text-[#D3D3D3] mb-4">
              Manage homepage banners. Add, edit, or delete banners with images and links.
            </p>
            <Link
              href="/admin/banners"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFCA20] text-black font-semibold rounded hover:bg-[#FFCA20]/90 transition"
            >
              <Settings className="w-4 h-4" />
              <span>Manage Banners</span>
            </Link>
          </div>

          {/* About Page Management */}
          <div className="bg-[#2a2a2a] rounded-lg p-6 border border-[#3a3a3a] hover:border-[#FFCA20]/30 transition">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-[#FFCA20]" />
              <h2 className="text-xl font-bold text-[#FAFAFA]">About Page Content</h2>
            </div>
            <p className="text-sm text-[#D3D3D3] mb-4">
              Manage about page content sections. Edit hero, mission, vision, and other sections.
            </p>
            <Link
              href="/admin/about"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFCA20] text-black font-semibold rounded hover:bg-[#FFCA20]/90 transition"
            >
              <Settings className="w-4 h-4" />
              <span>Manage Content</span>
            </Link>
          </div>

          {/* Dynamic Pages Management */}
          <div className="bg-[#2a2a2a] rounded-lg p-6 border border-[#3a3a3a] hover:border-[#FFCA20]/30 transition">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-[#FFCA20]" />
              <h2 className="text-xl font-bold text-[#FAFAFA]">Dynamic Pages</h2>
            </div>
            <p className="text-sm text-[#D3D3D3] mb-4">
              Manage extra pages like Privacy Policy, Terms & Conditions, etc.
            </p>
            <Link
              href="/admin/pages"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFCA20] text-black font-semibold rounded hover:bg-[#FFCA20]/90 transition"
            >
              <Settings className="w-4 h-4" />
              <span>Manage Pages</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

