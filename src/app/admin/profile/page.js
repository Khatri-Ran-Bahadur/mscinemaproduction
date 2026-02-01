"use client";

import React, { useState, useEffect } from 'react';
import { User, Lock, Save, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { adminFetch } from '@/utils/admin-api';

export default function AdminProfilePage() {
  const router = useRouter();
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    // Load initial data from local storage (or could fetch from API if we had a GET endpoint)
    const storedAdmin = localStorage.getItem('adminData');
    if (storedAdmin) {
        const data = JSON.parse(storedAdmin);
        setFormData(prev => ({
            ...prev,
            name: data.name || '',
            email: data.email || ''
        }));
    } else {
        router.push('/admin/login');
    }
  }, [router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            router.push('/admin/login');
            return;
        }

        const res = await adminFetch('/api/admin/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: formData.name,
                email: formData.email
                // No password needed for profile update as per new logic
            })
        });

        const data = await res.json();
        
        if (data.success) {
            setSuccessMsg('Profile Info updated successfully!');
            // Update local storage
            localStorage.setItem('adminData', JSON.stringify(data.admin));
        } else {
            setErrorMsg(data.error || 'Failed to update profile');
        }
    } catch (err) {
        setErrorMsg('An unexpected error occurred');
        console.error(err);
    } finally {
        setProfileLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    if (formData.newPassword !== formData.confirmPassword) {
        setErrorMsg("New passwords don't match");
        setPasswordLoading(false);
        return;
    }

    try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            router.push('/admin/login');
            return;
        }

        const res = await adminFetch('/api/admin/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword
            })
        });

        const data = await res.json();
        
        if (data.success) {
            setSuccessMsg('Password updated successfully!');
            // Clear passwords
            setFormData(prev => ({ 
                ...prev, 
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            }));
        } else {
            setErrorMsg(data.error || 'Failed to update password');
        }
    } catch (err) {
        setErrorMsg('An unexpected error occurred');
        console.error(err);
    } finally {
        setPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-[#FFCA20] mb-8">Admin Profile</h1>

            {/* Success/Error Messages */}
            {successMsg && (
                <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded text-green-400 flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    {successMsg}
                </div>
            )}

            {errorMsg && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded text-red-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {errorMsg}
                </div>
            )}

            <div className="space-y-8">
                {/* Form 1: Basic Information */}
                <form onSubmit={handleProfileUpdate} className="bg-[#2a2a2a] p-6 rounded-xl border border-[#3a3a3a]">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-6 border-b border-[#3a3a3a] pb-4">
                        <User className="w-5 h-5 text-[#FFCA20]" />
                        Update Profile Info
                    </h2>
                    
                    <div className="grid gap-4 mb-6">
                        <div>
                            <label className="block text-[#ccc] text-sm mb-1">Display Name</label>
                            <input 
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full bg-[#1a1a1a] border border-[#3a3a3a] text-white p-3 rounded focus:border-[#FFCA20] outline-none transition"
                            />
                        </div>
                        <div>
                            <label className="block text-[#ccc] text-sm mb-1">Email Address</label>
                            <input 
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full bg-[#1a1a1a] border border-[#3a3a3a] text-white p-3 rounded focus:border-[#FFCA20] outline-none transition"
                                required
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={profileLoading}
                        className={`bg-[#FFCA20] text-black font-bold px-6 py-2 rounded hover:bg-[#FFCA20]/90 transition ${profileLoading ? 'opacity-50' : ''}`}
                    >
                        {profileLoading ? 'Saving...' : 'Update Details'}
                    </button>
                </form>

                {/* Form 2: Change Password */}
                <form onSubmit={handlePasswordUpdate} className="bg-[#2a2a2a] p-6 rounded-xl border border-[#3a3a3a]">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-6 border-b border-[#3a3a3a] pb-4">
                        <Lock className="w-5 h-5 text-[#FFCA20]" />
                        Change Password
                    </h2>
                    
                    <div className="grid gap-4 mb-6">
                         <div>
                            <label className="block text-[#ccc] text-sm mb-1">Current Password</label>
                            <input 
                                type="password"
                                name="currentPassword"
                                value={formData.currentPassword}
                                onChange={handleChange}
                                className="w-full bg-[#1a1a1a] border border-[#3a3a3a] text-white p-3 rounded focus:border-[#FFCA20] outline-none transition"
                                required
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[#ccc] text-sm mb-1">New Password</label>
                                <input 
                                    type="password"
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    className="w-full bg-[#1a1a1a] border border-[#3a3a3a] text-white p-3 rounded focus:border-[#FFCA20] outline-none transition"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[#ccc] text-sm mb-1">Confirm New Password</label>
                                <input 
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full bg-[#1a1a1a] border border-[#3a3a3a] text-white p-3 rounded focus:border-[#FFCA20] outline-none transition"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={passwordLoading}
                        className={`bg-white text-black font-bold px-6 py-2 rounded hover:bg-gray-200 transition ${passwordLoading ? 'opacity-50' : ''}`}
                    >
                        {passwordLoading ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </div>
      </div>
    </div>
  );
}
