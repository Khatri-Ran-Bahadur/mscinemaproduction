
"use client";

import React, { useState, useEffect } from 'react';
import { toast, Toaster } from 'react-hot-toast';

export default function AdminSettings() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.contact_recipient_email) {
          setEmail(data.contact_recipient_email);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact_recipient_email: email }),
      });

      if (res.ok) {
        toast.success('Settings updated successfully');
      } else {
        throw new Error('Failed to update');
      }
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-white">Loading...</div>;
  }

  return (
    <div className="p-8 text-white max-w-4xl mx-auto">
      <Toaster position="top-right" />
      <h1 className="text-3xl font-bold mb-8 text-[#FFCA20]">Global Settings</h1>
      
      <div className="bg-[#222] p-8 rounded-xl border border-white/10 shadow-xl">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          Contact Form Configuration
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
             <label className="block text-sm font-medium text-gray-400">Recipient Email(s)</label>
             <div className="text-xs text-gray-500 mb-2">
                This email address will receive all notifications from the "Contact Us" page.
             </div>
             <input
               type="email"
               multiple
               value={email}
               onChange={(e) => setEmail(e.target.value)}
               placeholder="admin@example.com"
               className="w-full bg-[#1a1a1a] border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#FFCA20] transition-colors"
             />
             <p className="text-xs text-[#FFCA20]">
               To add multiple recipients, verify if your email provider supports comma-separated values or create a distribution list.
               (Currently single email supported by validation logic, but field allows input).
             </p>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#FFCA20] text-black font-bold py-3 px-8 rounded-lg hover:bg-[#ffda50] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
