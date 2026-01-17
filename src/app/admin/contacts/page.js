
"use client";

import React, { useState, useEffect } from 'react';
import { Mail, Phone, Calendar, Search, Loader2 } from 'lucide-react';

export default function AdminContactsPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/admin/contacts');
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMessages = messages.filter(msg => 
    msg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-white">
        <Loader2 className="w-8 h-8 animate-spin text-[#FFCA20]" />
      </div>
    );
  }

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
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-[#222] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-[#FFCA20] focus:outline-none w-full md:w-64"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
        </div>
      </div>

      <div className="bg-[#222] rounded-xl border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#1a1a1a] border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">User Details</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">Subject & Message</th>
                {/* <th className="px-6 py-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">Action</th> */}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredMessages.length > 0 ? (
                filteredMessages.map((msg) => (
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
                    {/* <td className="px-6 py-4 whitespace-nowrap align-top">
                      <button className="text-sm text-gray-400 hover:text-white hover:underline">
                        Reply
                      </button>
                    </td> */}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colspan="3" className="px-6 py-12 text-center text-gray-500">
                    {searchTerm ? 'No messages found matching your search.' : 'No messages received yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
