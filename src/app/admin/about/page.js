"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Phone, Mail, MapPin, Image as ImageIcon, Type, FileText } from 'lucide-react';
import dynamic from 'next/dynamic';
import { adminFetch } from '@/utils/admin-api';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';

export default function AboutContentPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Consolidated form state
  const [formData, setFormData] = useState({
    title: '',
    email: '',
    phone: '',
    address: '',
    description: '',
    image: '',
    map_iframe: '',
  });

  useEffect(() => {
    // Check admin authentication
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    fetchData();
  }, [router]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await adminFetch('/api/admin/about/general');
      const data = await res.json();
      if (data.success) {
        setFormData({
          title: data.data.title || '',
          email: data.data.email || '',
          phone: data.data.phone || '',
          address: data.data.address || '',
          description: data.data.description || '',
          image: data.data.image || '',
          map_iframe: data.data.map_iframe || '',
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      setIsUploading(true);
      const res = await adminFetch('/api/upload', { method: 'POST', body: uploadData });
      const data = await res.json();
      if (data.success) {
        setFormData(prev => ({ ...prev, image: data.url }));
      } else {
        alert('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await adminFetch('/api/admin/about/general', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (data.success) {
        alert('Saved successfully!');
        fetchData(); // Refresh to be sure
      } else {
        alert('Save failed: ' + (data.error || data.message));
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center text-white">
        <div className="text-center">
            <div className="w-8 h-8 border-2 border-[#FFCA20] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-[#3a3a3a] pb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#FFCA20] mb-2">About Page Settings</h1>
            <p className="text-[#D3D3D3]">Manage all About Us content and contact info in one place.</p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-[#FFCA20] text-black font-semibold rounded hover:bg-[#FFCA20]/90 transition shadow-lg shadow-[#FFCA20]/10 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* General Info Card */}
            <div className="bg-[#2a2a2a] rounded-xl p-6 border border-[#3a3a3a]">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#FFCA20]" />
                    General Information
                </h2>
                
                <div className="grid grid-cols-1 gap-6">
                     <div>
                        <label className="block text-[#D3D3D3] text-sm mb-1">Page Title</label>
                         <div className="relative">
                            <Type className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                            <input
                            type="text"
                            value={formData.title}
                            onChange={e => setFormData({...formData, title: e.target.value})}
                            className="w-full bg-[#1a1a1a] border border-[#3a3a3a] text-white rounded-lg p-2.5 pl-10 focus:border-[#FFCA20] outline-none"
                            placeholder="e.g. About MS Cinemas"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[#D3D3D3] text-sm mb-1">Main Image</label>
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                            <div className="w-full md:w-2/3">
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-[#3a3a3a] border-dashed rounded-lg cursor-pointer hover:bg-[#3a3a3a]/50 transition bg-[#1a1a1a]">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        {isUploading ? (
                                             <div className="w-6 h-6 border-2 border-[#FFCA20] border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                                                <p className="text-sm text-gray-500"><span className="font-semibold text-[#FFCA20]">Click to upload</span> or drag and drop</p>
                                            </>
                                        )}
                                    </div>
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        disabled={isUploading}
                                    />
                                </label>
                            </div>
                            
                            {formData.image && (
                                <div className="w-full md:w-1/3 relative group">
                                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-[#3a3a3a]">
                                        <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                    <p className="text-center text-xs text-gray-500 mt-2">Current Preview</p>
                                </div>
                            )}
                        </div>
                    </div>

                     <div>
                        <label className="block text-[#D3D3D3] text-sm mb-1">Description</label>
                        <div className="bg-white text-black rounded overflow-hidden">
                            <ReactQuill 
                                theme="snow"
                                value={formData.description}
                                onChange={content => setFormData({...formData, description: content})}
                                className="h-64 mb-12"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Contact Info Card */}
            <div className="bg-[#2a2a2a] rounded-xl p-6 border border-[#3a3a3a]">
                 <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-[#FFCA20]" />
                    Contact Details
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-[#D3D3D3] text-sm mb-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                            <input
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                                className="w-full bg-[#1a1a1a] border border-[#3a3a3a] text-white rounded-lg p-2.5 pl-10 focus:border-[#FFCA20] outline-none"
                                placeholder="contact@example.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[#D3D3D3] text-sm mb-1">Contact Number</label>
                         <div className="relative">
                            <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                            <input
                                type="text"
                                value={formData.phone}
                                onChange={e => setFormData({...formData, phone: e.target.value})}
                                className="w-full bg-[#1a1a1a] border border-[#3a3a3a] text-white rounded-lg p-2.5 pl-10 focus:border-[#FFCA20] outline-none"
                                placeholder="+1 234 567 890"
                            />
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-[#D3D3D3] text-sm mb-1">Physical Address</label>
                         <div className="relative">
                            <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                            <textarea
                                value={formData.address}
                                onChange={e => setFormData({...formData, address: e.target.value})}
                                className="w-full bg-[#1a1a1a] border border-[#3a3a3a] text-white rounded-lg p-2.5 pl-10 focus:border-[#FFCA20] outline-none min-h-[100px]"
                                placeholder="Enter full address..."
                            />
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-[#D3D3D3] text-sm mb-1">Google Map Iframe</label>
                         <div className="relative">
                            <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                            <textarea
                                value={formData.map_iframe}
                                onChange={e => setFormData({...formData, map_iframe: e.target.value})}
                                className="w-full bg-[#1a1a1a] border border-[#3a3a3a] text-white rounded-lg p-2.5 pl-10 focus:border-[#FFCA20] outline-none min-h-[100px] font-mono text-sm"
                                placeholder='<iframe src="https://www.google.com/maps/embed?..." ...></iframe>'
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Paste the Embed HTML code from Google Maps here.</p>
                    </div>
                </div>
            </div>

        </form>
      </div>
    </div>
  );
}
