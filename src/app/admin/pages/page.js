"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Plus, Edit, Trash2, X, Save, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { adminFetch } from '@/utils/admin-api';
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';

export default function PagesManagementPage() {
  const router = useRouter();
  const [pages, setPages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(null);

  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    content: '',
    isActive: true
  });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    fetchPages();
  }, [router]);

  const fetchPages = async () => {
    setIsLoading(true);
    try {
      const res = await adminFetch('/api/admin/pages');
      const data = await res.json();
      if (data.success) {
        setPages(data.pages || []);
      }
    } catch (error) {
      console.error('Error fetching pages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (page = null) => {
    if (page) {
      setCurrentPage(page);
      setFormData({
        slug: page.slug || '',
        title: page.title || '',
        content: page.content || '',
        isActive: page.isActive
      });
    } else {
      setCurrentPage(null);
      setFormData({
        slug: '',
        title: '',
        content: '',
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentPage(null);
  };

  const handleDeleteClick = (page) => {
    setCurrentPage(page);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentPage) return;
    try {
      const res = await adminFetch(`/api/admin/pages/${currentPage.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setPages(pages.filter(p => p.id !== currentPage.id));
        setIsDeleteModalOpen(false);
        setCurrentPage(null);
      } else {
        alert('Failed: ' + data.error);
      }
    } catch (e) {
      alert('Error deleting page');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = currentPage ? `/api/admin/pages/${currentPage.id}` : '/api/admin/pages';
      const method = currentPage ? 'PUT' : 'POST';
      
      const res = await adminFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        fetchPages();
        handleCloseModal();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (e) {
      alert('Failed to save page');
    }
  };

  if (isLoading) return <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#FFCA20] mb-2">Dynamic Pages</h1>
            <p className="text-[#D3D3D3]">Create generic pages like Privacy Policy, Terms, etc.</p>
          </div>
          <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-6 py-3 bg-[#FFCA20] text-black font-semibold rounded hover:bg-[#FFCA20]/90 transition">
            <Plus className="w-5 h-5" />
            <span>Create Page</span>
          </button>
        </div>

        <div className="grid gap-4">
          {pages.map(page => (
            <div key={page.id} className="bg-[#2a2a2a] p-4 rounded border border-[#3a3a3a] flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    {page.title}
                    <Link href={`/${page.slug}`} target="_blank" className="text-xs text-blue-400 hover:text-blue-300">
                        <ExternalLink className="w-3 h-3" />
                    </Link>
                </h3>
                <p className="text-[#888] text-sm">/{page.slug}</p>
              </div>
              <div className="flex gap-2">
                 <button onClick={() => handleOpenModal(page)} className="p-2 bg-[#3a3a3a] text-white hover:bg-[#FFCA20] hover:text-black rounded">
                    <Edit className="w-4 h-4" />
                 </button>
                 <button onClick={() => handleDeleteClick(page)} className="p-2 bg-[#3a3a3a] text-red-400 hover:bg-red-500 hover:text-white rounded">
                    <Trash2 className="w-4 h-4" />
                 </button>
              </div>
            </div>
          ))}
          {pages.length === 0 && <div className="text-center text-[#888] py-8">No pages found.</div>}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#2a2a2a] rounded-xl w-full max-w-2xl border border-[#3a3a3a] p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl text-white font-bold mb-4">{currentPage ? 'Edit Page' : 'Create Page'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-[#ccc] mb-1">Title</label>
                    <input 
                        type="text" 
                        value={formData.title} 
                        onChange={e => setFormData({...formData, title: e.target.value})}
                        className="w-full bg-[#1a1a1a] border border-[#3a3a3a] text-white p-2 rounded"
                        required 
                    />
                </div>
                <div>
                    <label className="block text-[#ccc] mb-1">Slug (URL)</label>
                    <input 
                        type="text" 
                        value={formData.slug} 
                        onChange={e => setFormData({...formData, slug: e.target.value})}
                        className="w-full bg-[#1a1a1a] border border-[#3a3a3a] text-white p-2 rounded"
                        placeholder="e.g. privacy-policy"
                        required 
                    />
                </div>
                <div>
                    <label className="block text-[#ccc] mb-1">Content</label>
                    <div className="bg-white text-black rounded">
                        <ReactQuill 
                            theme="snow"
                            value={formData.content} 
                            onChange={value => setFormData({...formData, content: value})}
                            className="h-64 mb-12"
                            modules={{
                                toolbar: [
                                    [{ 'header': [1, 2, 3, false] }],
                                    ['bold', 'italic', 'underline', 'strike'],
                                    [{'list': 'ordered'}, {'list': 'bullet'}],
                                    ['link', 'clean']
                                ],
                            }}
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-[#3a3a3a]">
                    <button type="button" onClick={handleCloseModal} className="text-[#ccc] px-4 py-2">Cancel</button>
                    <button type="submit" className="bg-[#FFCA20] text-black px-6 py-2 rounded font-bold">Save</button>
                </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
              <div className="bg-[#2a2a2a] p-6 rounded text-center">
                  <h3 className="text-white text-xl font-bold mb-4">Delete Page?</h3>
                  <div className="flex gap-4 justify-center">
                      <button onClick={() => setIsDeleteModalOpen(false)} className="text-[#ccc]">Cancel</button>
                      <button onClick={confirmDelete} className="bg-red-500 text-white px-4 py-2 rounded">Delete</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
