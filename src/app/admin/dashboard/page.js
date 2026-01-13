"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Image, FileText, LogOut, Plus, Edit, Trash2, Settings } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const router = useRouter();
  const [adminData, setAdminData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    banners: 0,
    aboutSections: 0,
  });

  useEffect(() => {
    // Check admin authentication
    const token = localStorage.getItem('adminToken');
    const admin = localStorage.getItem('adminData');

    if (!token || !admin) {
      router.push('/admin/login');
      return;
    }

    try {
      setAdminData(JSON.parse(admin));
    } catch (e) {
      router.push('/admin/login');
      return;
    }

    // Load stats
    loadStats();
    setIsLoading(false);
  }, [router]);

  const loadStats = async () => {
    try {
      const [bannersRes, aboutRes] = await Promise.all([
        fetch('/api/admin/banners'),
        fetch('/api/admin/about')
      ]);

      const bannersData = await bannersRes.json();
      const aboutData = await aboutRes.json();

      setStats({
        banners: bannersData.banners?.length || 0,
        aboutSections: aboutData.sections?.length || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };



  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#FFCA20] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-[#FFCA20] mb-8">Dashboard Overview</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-[#2a2a2a] rounded-lg p-6 border border-[#3a3a3a]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#D3D3D3] mb-1">Total Banners</p>
                <p className="text-3xl font-bold text-[#FFCA20]">{stats.banners}</p>
              </div>
              <div className="w-12 h-12 bg-[#FFCA20]/10 rounded-full flex items-center justify-center">
                <Image className="w-6 h-6 text-[#FFCA20]" />
              </div>
            </div>
          </div>

          <div className="bg-[#2a2a2a] rounded-lg p-6 border border-[#3a3a3a]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#D3D3D3] mb-1">About Sections</p>
                <p className="text-3xl font-bold text-[#FFCA20]">{stats.aboutSections}</p>
              </div>
              <div className="w-12 h-12 bg-[#FFCA20]/10 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-[#FFCA20]" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Banner Management */}
          <div className="bg-[#2a2a2a] rounded-lg p-6 border border-[#3a3a3a]">
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
          <div className="bg-[#2a2a2a] rounded-lg p-6 border border-[#3a3a3a]">
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
          <div className="bg-[#2a2a2a] rounded-lg p-6 border border-[#3a3a3a]">
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

