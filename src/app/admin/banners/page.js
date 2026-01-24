"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Image as ImageIcon, Plus, Edit, Trash2, X, Save, Film, Link as LinkIcon, Type } from 'lucide-react';
import { getMovies } from '@/services/api/movies';

export default function BannersPage() {
  const router = useRouter();
  const [banners, setBanners] = useState([]);
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentBanner, setCurrentBanner] = useState(null); // specific banner for edit/delete
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    image: '',
    type: 'normal',
    movieId: '',
// 1. Initial State
    description: '',
    link: '',
    order: 0,
    isActive: true,
    startDate: '',
    endDate: ''
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
      // Fetch banners
      const bannersRes = await fetch('/api/admin/banners');
      const bannersData = await bannersRes.json();
      
      if (bannersData.success) {
        setBanners(bannersData.banners);
      }

      // Fetch movies for dropdown
      const moviesList = await getMovies();
      setMovies(moviesList || []);

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
      type: 'normal',
      movieId: '',
      description: '',
      link: '',
      order: 0,
      isActive: true,
      startDate: '',
      endDate: ''
    });
    setCurrentBanner(null);
    setPreviewImage(null);
  };

// 3. Handle Open Modal
  const handleOpenModal = (banner = null) => {
    if (banner) {
      setCurrentBanner(banner);
      setFormData({
        title: banner.title || '',
        image: banner.image || '',
        type: banner.type || 'normal',
        movieId: banner.movieId || '',
        description: banner.description || '',
        link: banner.link || '',
        order: banner.order || 0,
        isActive: banner.isActive,
        startDate: banner.startDate ? new Date(banner.startDate).toISOString().slice(0, 16) : '',
        endDate: banner.endDate ? new Date(banner.endDate).toISOString().slice(0, 16) : ''
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

  const handleDeleteClick = (banner) => {
    setCurrentBanner(banner);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentBanner) return;
    
    try {
      const res = await fetch(`/api/admin/banners/${currentBanner.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      
      if (data.success) {
        setBanners(banners.filter(b => b.id !== currentBanner.id));
        setIsDeleteModalOpen(false);
        setCurrentBanner(null);
      } else {
        alert('Failed to delete banner: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting banner:', error);
      alert('An error occurred while deleting the banner');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    // Basic validation
    if (!formData.image) {
      alert('Image URL is required');
      return;
    }
    if (formData.type === 'movie' && !formData.movieId) {
      alert('Please select a movie');
      return;
    }

    const payload = {
      ...formData,
      // Ensure numeric values are sent as numbers where expected
      order: parseInt(formData.order) || 0,
    };

    try {
      setIsSubmitting(true);
      let res;
      if (currentBanner) {
        // Update
        res = await fetch(`/api/admin/banners/${currentBanner.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        // Create
        res = await fetch('/api/admin/banners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      
      if (data.success) {
        fetchInitialData(); // Refresh list
        handleCloseModal();
      } else {
        alert('Failed to save banner: ' + (data.error || data.message));
      }
    } catch (error) {
      console.error('Error saving banner:', error);
      alert('An error occurred while saving the banner');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('file', file);
    
    // Set immediate preview
    setPreviewImage(URL.createObjectURL(file));

    try {
      setIsUploading(true);
      const res = await fetch('/api/upload', {
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

  const handleTypeChange = (e) => {

    const newType = e.target.value;
    setFormData(prev => ({
      ...prev, 
      type: newType,
      movieId: newType === 'normal' ? '' : prev.movieId // Clear movie selection if switching to normal
    }));
  };

  // Helper to find movie name
  const getMovieName = (id) => {
    const movie = movies.find(m => m.movieID === id || m.id === id);
    return movie ? (movie.movieName || movie.title) : 'Unknown Movie';
  };

  const getValidImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http') || imagePath.startsWith('https')) return imagePath;

    // Remove trailing slash from baseUrl if present
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    // Ensure imagePath starts with slash
    const cleanImagePath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;

    return `${cleanBaseUrl}${cleanImagePath}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#FFCA20] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70">Loading Banners...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#FFCA20] mb-2">Banner Management</h1>
            <p className="text-[#D3D3D3]">Manage your homepage banners</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-6 py-3 bg-[#FFCA20] text-black font-semibold rounded hover:bg-[#FFCA20]/90 transition shadow-lg shadow-[#FFCA20]/20"
          >
            <Plus className="w-5 h-5" />
            <span>Add New Banner</span>
          </button>
        </div>

        {/* Banners List */}
        <div className="grid gap-6">
          {banners.length === 0 ? (
            <div className="bg-[#2a2a2a] rounded-lg p-12 text-center border border-[#3a3a3a]">
              <ImageIcon className="w-16 h-16 text-[#4a4a4a] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Banners Found</h3>
              <p className="text-[#D3D3D3]">Start by adding a new banner to your homepage</p>
            </div>
          ) : (
            banners.map((banner) => (
              <div 
                key={banner.id} 
                className="bg-[#2a2a2a] rounded-lg p-4 border border-[#3a3a3a] flex flex-col md:flex-row gap-6 items-center hover:border-[#FFCA20]/50 transition duration-300"
              >
                {/* Banner Image */}
                <div className="w-full md:w-64 h-32 relative bg-[#1a1a1a] rounded overflow-hidden flex-shrink-0">
                  <img 
                    src={getValidImageUrl(banner.image)} 
                    alt={banner.title || 'Banner'} 
                    className="w-full h-full object-cover"
                    
                  />
                  <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 rounded text-xs text-white capitalize">
                    {banner.type === 'normal' ? 'Promotion and Concessions' : banner.type === 'movie' ? 'Movie Banner' : banner.type}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-bold text-white mb-1">
                    {banner.title || (banner.type === 'movie' ? getMovieName(banner.movieId) : 'Untitled Banner')}
                  </h3>
                  <p className="text-[#D3D3D3] text-sm mb-2 line-clamp-2">
                    {banner.description || 'No description provided'}
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    {banner.type === 'movie' && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded border border-blue-500/30">
                        <Film className="w-3 h-3" /> Movie Linked
                      </span>
                    )}
                    {banner.link && (
                      <a href={banner.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded border border-green-500/30 hover:bg-green-500/30">
                        <LinkIcon className="w-3 h-3" /> External Link
                      </a>
                    )}
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded border ${banner.isActive ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                      {banner.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenModal(banner)}
                    className="p-2 bg-[#3a3a3a] text-white rounded hover:bg-[#FFCA20] hover:text-black transition"
                    title="Edit Banner"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(banner)}
                    className="p-2 bg-[#3a3a3a] text-red-400 rounded hover:bg-red-500 hover:text-white transition"
                    title="Delete Banner"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#2a2a2a] rounded-xl w-full max-w-2xl border border-[#3a3a3a] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#3a3a3a] flex justify-between items-center sticky top-0 bg-[#2a2a2a] z-10">
              <h2 className="text-2xl font-bold text-white">
                {currentBanner ? 'Edit Banner' : 'Add New Banner'}
              </h2>
              <button onClick={handleCloseModal} className="text-[#D3D3D3] hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#D3D3D3] mb-1">Banner Name</label>
                    <div className="relative">
                      <Type className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        className="w-full bg-[#1a1a1a] border border-[#3a3a3a] text-white rounded-lg py-2.5 pl-10 pr-4 focus:outline-none focus:border-[#FFCA20] focus:ring-1 focus:ring-[#FFCA20]"
                        placeholder="Enter banner name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#D3D3D3] mb-1">Banner Type</label>
                    <select
                      value={formData.type}
                      onChange={handleTypeChange}
                      className="w-full bg-[#1a1a1a] border border-[#3a3a3a] text-white rounded-lg py-2.5 px-4 focus:outline-none focus:border-[#FFCA20]"
                    >
                      <option value="normal">Promotion and Concessions</option>
                      <option value="movie">Movie Banner</option>
                    </select>
                  </div>

                  {formData.type === 'movie' && (
                    <div>
                      <label className="block text-sm font-medium text-[#D3D3D3] mb-1">Select Movie</label>
                      <select
                        value={formData.movieId}
                        onChange={(e) => setFormData({...formData, movieId: e.target.value})}
                        className="w-full bg-[#1a1a1a] border border-[#3a3a3a] text-white rounded-lg py-2.5 px-4 focus:outline-none focus:border-[#FFCA20]"
                        required={formData.type === 'movie'}
                      >
                        <option value="">-- Start typing or select movie --</option>
                        {movies.map(movie => (
                          <option key={movie.movieID || movie.id} value={movie.movieID || movie.id}>
                            {movie.movieName || movie.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                   <div>
                    <label className="block text-sm font-medium text-[#D3D3D3] mb-1">Order Priority</label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({...formData, order: e.target.value})}
                      className="w-full bg-[#1a1a1a] border border-[#3a3a3a] text-white rounded-lg py-2.5 px-4 focus:outline-none focus:border-[#FFCA20]"
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
                  </div>

                  <div className="w-full grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#D3D3D3] mb-1">Start Date</label>
                      <input
                        type="datetime-local"
                        value={formData.startDate}
                        onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                        className="w-full bg-[#1a1a1a] border border-[#3a3a3a] text-white rounded-lg py-2.5 px-4 focus:outline-none focus:border-[#FFCA20]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#D3D3D3] mb-1">End Date</label>
                      <input
                        type="datetime-local"
                        value={formData.endDate}
                        onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                        className="w-full bg-[#1a1a1a] border border-[#3a3a3a] text-white rounded-lg py-2.5 px-4 focus:outline-none focus:border-[#FFCA20]"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#D3D3D3] mb-1">Banner Image</label>
                    <div className="space-y-3">
                      {/* File Upload */}
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="w-full bg-[#1a1a1a] border border-[#3a3a3a] text-white rounded-lg py-2 pl-2 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#FFCA20] file:text-black hover:file:bg-[#FFCA20]/90"
                          disabled={isUploading}
                        />
                        {isUploading && (
                          <div className="absolute right-3 top-2.5">
                            <div className="w-5 h-5 border-2 border-[#FFCA20] border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                      
                      {/* URL Fallback removed as per request */}
                    </div>
                  </div>

                  {/* Image Preview */}
                  <div className="w-full h-32 bg-[#1a1a1a] rounded-lg border border-[#3a3a3a] flex items-center justify-center overflow-hidden">
                    {previewImage || formData.image ? (
                      <img 
                        src={previewImage || getValidImageUrl(formData.image)} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                        onError={(e) => {e.target.style.display='none'}}
                      />
                    ) : (
                      <span className="text-gray-600 text-sm">Image Preview</span>
                    )}
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
                    placeholder="External link URL (e.g. for promotions)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#D3D3D3] mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-[#3a3a3a] text-white rounded-lg py-2.5 px-4 focus:outline-none focus:border-[#FFCA20] min-h-[100px]"
                  placeholder="Enter banner description..."
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
                  className={`px-6 py-2 bg-[#FFCA20] text-black font-semibold rounded transition shadow-lg shadow-[#FFCA20]/20 flex items-center gap-2 ${(isSubmitting || isUploading) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#FFCA20]/90'}`}
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSubmitting ? 'Saving...' : (currentBanner ? 'Update Banner' : 'Create Banner')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#2a2a2a] rounded-xl w-full max-w-md border border-[#3a3a3a] p-6 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Delete Banner?</h2>
            <p className="text-[#D3D3D3] mb-6">
              Are you sure you want to delete this banner? This action cannot be undone.
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
