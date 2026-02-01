"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Image as ImageIcon, Plus, Edit, Trash2, X, Save, Link as LinkIcon } from 'lucide-react';
import { adminFetch } from '@/utils/admin-api';

export default function PromotionsPage() {
  const router = useRouter();
  const [promotions, setPromotions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentPromotion, setCurrentPromotion] = useState(null); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    image: '',
    link: '',
    description: '',
    order: 0,
    isActive: true
  });

  useEffect(() => {
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
      const res = await adminFetch('/api/admin/promotions');
      const data = await res.json();
      if (data.success) {
        setPromotions(data.promotions);
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
      link: '',
      description: '',
      order: 0,
      isActive: true
    });
    setCurrentPromotion(null);
    setPreviewImage(null);
  };

  const handleOpenModal = (promotion = null) => {
    if (promotion) {
      setCurrentPromotion(promotion);
      setFormData({
        title: promotion.title || '',
        image: promotion.image || '',
        link: promotion.link || '',
        description: promotion.description || '',
        order: promotion.order || 0,
        isActive: promotion.isActive
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

  const handleDeleteClick = (promotion) => {
    setCurrentPromotion(promotion);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentPromotion) return;
    try {
      const res = await adminFetch(`/api/admin/promotions/${currentPromotion.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setPromotions(promotions.filter(p => p.id !== currentPromotion.id));
        setIsDeleteModalOpen(false);
        setCurrentPromotion(null);
      } else {
        alert('Failed to delete: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert('An error occurred');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    if (!formData.image) {
      alert('Image URL is required');
      return;
    }

    const payload = {
      ...formData,
      order: parseInt(formData.order) || 0,
    };

    try {
      setIsSubmitting(true);
      let res;
      if (currentPromotion) {
        res = await adminFetch(`/api/admin/promotions/${currentPromotion.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await adminFetch('/api/admin/promotions', {
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
        alert('Failed to save: ' + (data.error || data.message));
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('An error occurred');
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
      alert('An error occurred');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#FFCA20] mb-2">Promotions Management</h1>
            <p className="text-[#D3D3D3]">Manage homepage promotions</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-6 py-3 bg-[#FFCA20] text-black font-semibold rounded hover:bg-[#FFCA20]/90 transition shadow-lg shadow-[#FFCA20]/20"
          >
            <Plus className="w-5 h-5" />
            <span>Add New Promotion</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {promotions.length === 0 ? (
            <div className="col-span-full bg-[#2a2a2a] rounded-lg p-12 text-center border border-[#3a3a3a]">
              <ImageIcon className="w-16 h-16 text-[#4a4a4a] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Promotions Found</h3>
              <p className="text-[#D3D3D3]">Add your first promotion</p>
            </div>
          ) : (
            promotions.map((promo) => (
              <div 
                key={promo.id} 
                className="bg-[#2a2a2a] rounded-lg overflow-hidden border border-[#3a3a3a] flex flex-col group hover:border-[#FFCA20]/50 transition duration-300"
              >
                <div className="relative aspect-[4/3] bg-[#1a1a1a]">
                  <img 
                    src={promo.image} 
                    alt={promo.title || 'Promotion'} 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 rounded text-xs text-white">
                    {promo.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  {promo.title && <h3 className="text-xl font-bold text-white mb-1">{promo.title}</h3>}
                  {promo.link && (
                    <a href={promo.link} target="_blank" className="text-xs text-[#FFCA20] hover:underline mb-2 flex items-center gap-1">
                      <LinkIcon className="w-3 h-3" /> {promo.link}
                    </a>
                  )}
                  {promo.description && (
                    <p className="text-[#D3D3D3] text-sm mb-4 line-clamp-2">
                       {promo.description}
                    </p>
                  )}
                  <div className="flex justify-between items-center pt-4 border-t border-[#3a3a3a] mt-auto">
                    <span className="text-xs text-[#888]">Order: {promo.order}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenModal(promo)}
                        className="p-2 bg-[#3a3a3a] text-white rounded hover:bg-[#FFCA20] hover:text-black transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(promo)}
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
                {currentPromotion ? 'Edit Promotion' : 'Add New Promotion'}
              </h2>
              <button onClick={handleCloseModal} className="text-[#D3D3D3] hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#D3D3D3] mb-1">Title (Optional)</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full bg-[#1a1a1a] border border-[#3a3a3a] text-white rounded-lg py-2.5 px-4 focus:outline-none focus:border-[#FFCA20]"
                    />
                  </div>

                  <div>
                     <label className="block text-sm font-medium text-[#D3D3D3] mb-1">Target Link (Optional)</label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                      <input
                        type="url"
                        value={formData.link}
                        onChange={(e) => setFormData({...formData, link: e.target.value})}
                        className="w-full bg-[#1a1a1a] border border-[#3a3a3a] text-white rounded-lg py-2.5 pl-10 pr-4 focus:outline-none focus:border-[#FFCA20]"
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
                    <label className="block text-sm font-medium text-[#D3D3D3] mb-1">Promotion Image</label>
                    <div className="space-y-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="w-full bg-[#1a1a1a] border border-[#3a3a3a] text-white rounded-lg py-2 pl-2 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#FFCA20] file:text-black hover:file:bg-[#FFCA20]/90"
                        disabled={isUploading}
                      />
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
                <label className="block text-sm font-medium text-[#D3D3D3] mb-1">Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-[#3a3a3a] text-white rounded-lg py-2.5 px-4 focus:outline-none focus:border-[#FFCA20] min-h-[100px]"
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
                  {isSubmitting ? 'Saving...' : (currentPromotion ? 'Update' : 'Create')}
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
            <h2 className="text-xl font-bold text-white mb-2">Delete Promotion?</h2>
            <p className="text-[#D3D3D3] mb-6">
              Are you sure you want to delete this promotion?
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
