"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Image as ImageIcon, Plus, Edit, Trash2, X, Save, Type, FileText } from 'lucide-react';
import { adminFetch } from '@/utils/admin-api';

export default function ExperiencesPage() {
  const router = useRouter();
  const [experiences, setExperiences] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentExperience, setCurrentExperience] = useState(null); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    image: '',
    fallbackImage: '',
    description: '',
    order: 0,
    isActive: true
  });

  useEffect(() => {
    // Check admin authentication
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    fetchInitialData();
  }, [router]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const res = await adminFetch('/api/admin/experiences');
      const data = await res.json();
      
      if (data.success) {
        setExperiences(data.experiences);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      image: '',
      fallbackImage: '',
      description: '',
      order: 0,
      isActive: true
    });
    setCurrentExperience(null);
    setPreviewImage(null);
  };

  const handleOpenModal = (experience = null) => {
    if (experience) {
      setCurrentExperience(experience);
      setFormData({
        title: experience.title || '',
        image: experience.image || '',
        fallbackImage: experience.fallbackImage || '',
        description: experience.description || '',
        order: experience.order || 0,
        isActive: experience.isActive
      });
      setPreviewImage(null);
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleDeleteClick = (experience) => {
    setCurrentExperience(experience);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentExperience) return;
    
    try {
      const res = await adminFetch(`/api/admin/experiences/${currentExperience.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      
      if (data.success) {
        setExperiences(experiences.filter(e => e.id !== currentExperience.id));
        setIsDeleteModalOpen(false);
        setCurrentExperience(null);
      } else {
        alert('Failed to delete experience: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting experience:', error);
      alert('An error occurred while deleting');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    if (!formData.image) {
      alert('Image URL is required');
      return;
    }
    if (!formData.title || !formData.description) {
      alert('Title and description are required');
      return;
    }

    const payload = {
      ...formData,
      order: parseInt(formData.order) || 0,
    };

    try {
      setIsSubmitting(true);
      let res;
      if (currentExperience) {
        // Update
        res = await adminFetch(`/api/admin/experiences/${currentExperience.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        // Create
        res = await adminFetch('/api/admin/experiences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      
      if (data.success) {
        fetchInitialData();
        handleCloseModal();
      } else {
        alert('Failed to save experience: ' + (data.error || data.message));
      }
    } catch (error) {
      console.error('Error saving experience:', error);
      alert('An error occurred while saving');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('file', file);
    
    setPreviewImage(URL.createObjectURL(file));

    try {
      setIsUploading(true);
      const res = await adminFetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });
      const data = await res.json();
      
      if (data.success) {
        setFormData(prev => ({ ...prev, image: data.url }));
      } else {
        alert('Upload failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('An error occurred during upload');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#FFCA20] mb-2">Experiences Management</h1>
            <p className="text-[#D3D3D3]">Manage "Experience our hall" section</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-6 py-3 bg-[#FFCA20] text-black font-semibold rounded hover:bg-[#FFCA20]/90 transition shadow-lg shadow-[#FFCA20]/20"
          >
            <Plus className="w-5 h-5" />
            <span>Add New Experience</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {experiences.length === 0 ? (
            <div className="col-span-full bg-[#2a2a2a] rounded-lg p-12 text-center border border-[#3a3a3a]">
              <FileText className="w-16 h-16 text-[#4a4a4a] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Experiences Found</h3>
              <p className="text-[#D3D3D3]">Add content to your "Experience our hall" section</p>
            </div>
          ) : (
            experiences.map((exp) => (
              <div 
                key={exp.id} 
                className="bg-[#2a2a2a] rounded-lg overflow-hidden border border-[#3a3a3a] flex flex-col group hover:border-[#FFCA20]/50 transition duration-300"
              >
                <div className="relative h-48 bg-[#1a1a1a]">
                  <img 
                    src={exp.image} 
                    alt={exp.title} 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 rounded text-xs text-white">
                    {exp.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-white mb-2">{exp.title}</h3>
                  <p className="text-[#D3D3D3] text-sm mb-4 line-clamp-3 flex-1">
                    {exp.description}
                  </p>
                  <div className="flex justify-between items-center pt-4 border-t border-[#3a3a3a] mt-auto">
                    <span className="text-xs text-[#888]">Order: {exp.order}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenModal(exp)}
                        className="p-2 bg-[#3a3a3a] text-white rounded hover:bg-[#FFCA20] hover:text-black transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(exp)}
                        className="p-2 bg-[#3a3a3a] text-red-400 rounded hover:bg-red-500 hover:text-white transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#2a2a2a] rounded-xl w-full max-w-2xl border border-[#3a3a3a] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#3a3a3a] flex justify-between items-center sticky top-0 bg-[#2a2a2a] z-10">
              <h2 className="text-2xl font-bold text-white">
                {currentExperience ? 'Edit Experience' : 'Add New Experience'}
              </h2>
              <button onClick={handleCloseModal} className="text-[#D3D3D3] hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#D3D3D3] mb-1">Title</label>
                    <div className="relative">
                      <Type className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        className="w-full bg-[#1a1a1a] border border-[#3a3a3a] text-white rounded-lg py-2.5 pl-10 pr-4 focus:outline-none focus:border-[#FFCA20]"
                        placeholder="e.g. INDULGE"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#D3D3D3] mb-1">Order Priority</label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({...formData, order: e.target.value})}
                      className="w-full bg-[#1a1a1a] border border-[#3a3a3a] text-white rounded-lg py-2.5 px-4 focus:outline-none focus:border-[#FFCA20]"
                    />
                  </div>

                   <div>
                    <label className="block text-sm font-medium text-[#D3D3D3] mb-1">Status</label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={formData.isActive}
                          onChange={() => setFormData({...formData, isActive: true})}
                          className="w-4 h-4 text-[#FFCA20] focus:ring-[#FFCA20]"
                        />
                        <span className="text-white">Active</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={!formData.isActive}
                          onChange={() => setFormData({...formData, isActive: false})}
                          className="w-4 h-4 text-[#FFCA20] focus:ring-[#FFCA20]"
                        />
                        <span className="text-white">Inactive</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                   <div>
                    <label className="block text-sm font-medium text-[#D3D3D3] mb-1">Experience Image</label>
                    <div className="space-y-3">
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="w-full bg-[#1a1a1a] border border-[#3a3a3a] text-white rounded-lg py-2 pl-2 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#FFCA20] file:text-black hover:file:bg-[#FFCA20]/90"
                          disabled={isUploading}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="w-full h-32 bg-[#1a1a1a] rounded-lg border border-[#3a3a3a] flex items-center justify-center overflow-hidden">
                    {previewImage || formData.image ? (
                      <img 
                        src={previewImage || formData.image} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-600 text-sm">Image Preview</span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#D3D3D3] mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-[#3a3a3a] text-white rounded-lg py-2.5 px-4 focus:outline-none focus:border-[#FFCA20] min-h-[100px]"
                  placeholder="Enter experience description..."
                  required
                ></textarea>
              </div>

              <div className="flex justify-end gap-4 mt-8 pt-4 border-t border-[#3a3a3a]">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2 bg-transparent border border-[#3a3a3a] text-[#D3D3D3] rounded hover:bg-[#3a3a3a] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  className="px-6 py-2 bg-[#FFCA20] text-black font-semibold rounded hover:bg-[#FFCA20]/90 transition"
                >
                  {isSubmitting ? 'Saving...' : (currentExperience ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#2a2a2a] rounded-xl w-full max-w-md border border-[#3a3a3a] p-6 text-center">
             <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Delete Experience?</h2>
            <p className="text-[#D3D3D3] mb-6">
              Are you sure you want to delete? This cannot be undone.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-6 py-2 bg-transparent border border-[#3a3a3a] text-[#D3D3D3] rounded hover:bg-[#3a3a3a] transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-6 py-2 bg-red-500 text-white font-semibold rounded hover:bg-red-600 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
