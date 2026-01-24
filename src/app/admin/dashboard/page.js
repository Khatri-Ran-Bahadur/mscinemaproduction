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
  Calendar,
  CreditCard,
  Target
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
    allTime: { sales: 0, orders: 0 },
    chart: []
  };

  // Helper to format currency
  const fmtMoney = (amount) => `RM ${parseFloat(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Chart Logic
  const Chart = () => {
      if (!stats.chart || stats.chart.length === 0) return <div className="h-64 flex items-center justify-center text-gray-500">No Data</div>;

      const data = stats.chart;
      const values = data.map(d => d.amount);
      const maxVal = Math.max(...values, 100) * 1.2; // Add 20% headroom
      const height = 300;
      const width = 1000; // viewBox width

      const points = data.map((d, i) => {
          const x = (i / (data.length - 1)) * width;
          const y = height - (d.amount / maxVal) * height;
          return `${x},${y}`;
      }).join(' ');

      const fillPath = `M 0,${height} ${points} L ${width},${height} Z`;
      const strokePath = `M ${points.replace(/ /g, ' L ')}`; // Basic line

      return (
          <div className="w-full h-80 relative">
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                  <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="chartLine" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#60a5fa" />
                          <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                  </defs>
                  
                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((p) => (
                      <line 
                          key={p} 
                          x1="0" 
                          y1={height * p} 
                          x2={width} 
                          y2={height * p} 
                          stroke="#333" 
                          strokeWidth="1" 
                          strokeDasharray="4 4"
                      />
                  ))}

                  <path d={fillPath} fill="url(#chartGradient)" />
                  <path d={strokePath} fill="none" stroke="#60a5fa" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              
              {/* Labels (X-Axis) */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 mt-2">
                 {data.filter((_, i) => i % 5 === 0).map((d, i) => (
                     <span key={i}>{d.label}</span>
                 ))}
              </div>
          </div>
      );
  };

  const Card = ({ title, amount, subtext, icon: Icon, colorClass, bgClass }) => (
      <div className="bg-[#222] rounded-xl p-6 border border-white/5 relative overflow-hidden group">
          <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${colorClass}`}>
              <Icon className="w-24 h-24" />
          </div>
          <div className="relative z-10">
              <h3 className="text-gray-400 text-sm font-medium mb-3">{title}</h3>
              <div className="flex items-center justify-between mb-4">
                  <span className={`text-2xl lg:text-3xl font-bold text-white`}>{amount}</span>
                  <div className={`p-2 rounded-lg ${bgClass}`}>
                      <Icon className={`w-5 h-5 ${colorClass.replace('text-', '')}`} /> 
                      {/* Note: colorClass prop handles text color, but for icon inside bg we assume matching text color or white? Ref image has colored icon */}
                  </div>
              </div>
              <div className="text-xs text-gray-500 flex justify-between border-t border-white/10 pt-3 mt-2">
                  <span>{subtext.label}</span>
                  <span className="text-white font-mono">{subtext.value}</span>
              </div>
          </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-[#111] p-6 text-white font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-[#FFCA20] mb-8">Dashboard Overview</h1>

        {/* 1. Metrics Cards (4 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card 
                title="Today's Sales" 
                amount={fmtMoney(stats.today.sales)} 
                subtext={{ label: 'Total Orders', value: stats.today.orders }}
                icon={DollarSign}
                colorClass="text-blue-500"
                bgClass="bg-blue-500/10 text-blue-500"
            />
            <Card 
                title="This Week" 
                amount={fmtMoney(stats.week.sales)} 
                subtext={{ label: 'Total Orders', value: stats.week.orders }}
                icon={BarChart3}
                colorClass="text-pink-500"
                bgClass="bg-pink-500/10 text-pink-500"
            />
            <Card 
                title="This Month" 
                amount={fmtMoney(stats.month.sales)} 
                subtext={{ label: 'Total Orders', value: stats.month.orders }}
                icon={Calendar}
                colorClass="text-orange-500"
                bgClass="bg-orange-500/10 text-orange-500"
            />
            <Card 
                title="All Time Sales" 
                amount={fmtMoney(stats.allTime.sales)} 
                subtext={{ label: 'Total Orders', value: stats.allTime.orders }}
                icon={Target}
                colorClass="text-yellow-500"
                bgClass="bg-yellow-500/10 text-yellow-500"
            />
        </div>

        {/* 2. Main Chart Section */}
        <div className="bg-[#222] rounded-xl border border-white/5 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                     <h3 className="text-lg font-bold text-white">Sales Trend</h3>
                     <p className="text-xs text-gray-500">Daily sales performance over the last 30 days</p>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-white/5 rounded text-xs text-gray-300">Sales Amount</span>
                </div>
            </div>
            
            <Chart />
        </div>

        {/* 3. Quick Actions */}
        <div>
            <h2 className="text-xl font-bold text-white mb-6">Quick Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link href="/admin/banners" className="bg-[#222] p-6 rounded-xl border border-white/5 hover:border-[#FFCA20]/50 transition group">
                   <div className="flex items-center gap-3 mb-2">
                       <Image className="w-5 h-5 text-[#FFCA20]" />
                       <h3 className="font-bold">Banners</h3>
                   </div>
                   <p className="text-sm text-gray-500 group-hover:text-gray-300 transition">Manage homepage slides</p>
                </Link>
                <Link href="/admin/about" className="bg-[#222] p-6 rounded-xl border border-white/5 hover:border-[#FFCA20]/50 transition group">
                   <div className="flex items-center gap-3 mb-2">
                       <FileText className="w-5 h-5 text-[#FFCA20]" />
                       <h3 className="font-bold">About Content</h3>
                   </div>
                   <p className="text-sm text-gray-500 group-hover:text-gray-300 transition">Edit website sections</p>
                </Link>
                <Link href="/admin/pages" className="bg-[#222] p-6 rounded-xl border border-white/5 hover:border-[#FFCA20]/50 transition group">
                   <div className="flex items-center gap-3 mb-2">
                       <Settings className="w-5 h-5 text-[#FFCA20]" />
                       <h3 className="font-bold">Settings</h3>
                   </div>
                   <p className="text-sm text-gray-500 group-hover:text-gray-300 transition">System configuration</p>
                </Link>
            </div>
        </div>
      </div>
    </div>
  );
}

