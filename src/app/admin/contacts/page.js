
"use client";

import React, { useState, useEffect } from 'react';
import { Mail, Phone, Calendar, Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminFetch } from '@/utils/admin-api';

export default function AdminContactsPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMessages, setTotalMessages] = useState(0);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchMessages();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [page, limit, searchTerm]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: searchTerm
      });
      const res = await adminFetch(`/api/admin/contacts?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setMessages(data.messages);
          setTotalPages(data.pagination.totalPages);
          setTotalMessages(data.pagination.total);
        } else {
             // Fallback if API changed but structured differently?
             // But I updated API to return success: true
             setMessages([]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      timeZone: 'Asia/Kuala_Lumpur',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-8 text-white max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
           <h1 className="text-3xl font-bold text-[#FFCA20] mb-2">Contact Messages</h1>
           <p className="text-gray-400">View and manage inquiries from the contact form.</p>
        </div>
        
        <div className="relative">
          <input
            type="text"
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1); // Reset to page 1
            }}
            className="bg-[#222] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-[#FFCA20] focus:outline-none w-full md:w-64"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
        </div>
      </div>

      <div className="bg-[#222] rounded-xl border border-white/10 overflow-hidden shadow-xl flex flex-col">
          {loading && messages.length === 0 ? (
             <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-[#FFCA20]" />
             </div>
          ) : (
            <>
                <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-[#1a1a1a] border-b border-white/10">
                    <tr>
                        <th className="px-6 py-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">User Details</th>
                        <th className="px-6 py-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">Subject & Message</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                    {messages.length > 0 ? (
                        messages.map((msg) => (
                        <tr key={msg.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap align-top">
                            <div className="flex items-center gap-2 text-gray-300">
                                <Calendar className="w-4 h-4 text-[#FFCA20]" />
                                <span className="text-sm">{formatDate(msg.createdAt)}</span>
                            </div>
                            </td>
                            <td className="px-6 py-4 align-top w-1/4">
                            <div className="space-y-1">
                                <div className="font-semibold text-white">{msg.name}</div>
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                <Mail className="w-3 h-3" />
                                {msg.email}
                                </div>
                                {msg.phone && (
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <Phone className="w-3 h-3" />
                                    {msg.phone}
                                </div>
                                )}
                            </div>
                            </td>
                            <td className="px-6 py-4 align-top">
                            <div className="mb-1 font-medium text-[#FFCA20]">{msg.subject}</div>
                            <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap max-w-2xl">
                                {msg.message}
                            </div>
                            </td>
                        </tr>
                        ))
                    ) : (
                        <tr>
                        <td colSpan="3" className="px-6 py-12 text-center text-gray-500">
                            {searchTerm ? 'No messages found matching your search.' : 'No messages received yet.'}
                        </td>
                        </tr>
                    )}
                    </tbody>
                </table>
                </div>

                {/* Pagination Controls */}
                <div className="p-4 border-t border-white/10 flex items-center justify-between bg-[#1a1a1a]">
                    <div className="text-xs text-gray-400">
                        Showing <span className="text-white">{(page - 1) * limit + 1}</span> to <span className="text-white">{Math.min(page * limit, totalMessages)}</span> of <span className="text-white">{totalMessages}</span> messages
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Rows per page selector */}
                        <div className="flex items-center gap-2 mr-4">
                            <span className="text-xs text-gray-400">Rows per page:</span>
                            <select
                                value={limit}
                                onChange={(e) => {
                                    setLimit(Number(e.target.value));
                                    setPage(1);
                                }}
                                className="bg-[#333] border border-[#444] text-white text-xs rounded px-2 py-1 focus:border-[#FFCA20] outline-none cursor-pointer"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                        </div>

                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                            className="p-2 rounded bg-[#333] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#444] transition"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        
                        <div className="flex items-center gap-1">
                            {/* Page Numbers */}
                            {(() => {
                                let startPage = Math.max(1, page - 2);
                                let endPage = Math.min(totalPages, startPage + 4);
                                if (endPage - startPage < 4) {
                                    startPage = Math.max(1, endPage - 4);
                                }
                                const pages = [];
                                for (let i = startPage; i <= endPage; i++) {
                                    pages.push(i);
                                }
                                return pages.map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={`w-8 h-8 rounded text-xs font-medium transition ${
                                            p === page 
                                                ? 'bg-[#FFCA20] text-black font-bold' 
                                                : 'bg-[#333] text-white hover:bg-[#444]'
                                        }`}
                                    >
                                        {p}
                                    </button>
                                ));
                            })()}
                        </div>

                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || loading}
                            className="p-2 rounded bg-[#333] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#444] transition"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </>
          )}
      </div>
    </div>
  );
}
