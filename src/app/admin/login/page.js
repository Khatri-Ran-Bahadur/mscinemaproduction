"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';

export default function AdminLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleCaptchaChange = (token) => {
    setRecaptchaToken(token);
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      setError('Please enter both username and password');
      return;
    }

    if (process.env.NEXT_PUBLIC_ADMIN_LOGIN_CAPTCHA === 'true' && !recaptchaToken) {
      setError('Please verify you are not a robot');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          recaptchaToken: recaptchaToken
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed. Please check your credentials.');
        setIsLoading(false);
        // Reset Captcha if needed, but simple alert is enough usually.
        return;
      }

      // Store admin session
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminData', JSON.stringify(data.admin));

      // Redirect to dashboard
      router.push('/admin/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <img 
            src="/img/logo.png" 
            alt="MS Cinemas" 
            className="h-24 w-auto mb-4"
          />
          <h2 className="text-xl text-[#FAFAFA]">Admin Panel</h2>
        </div>

        {/* Login Card */}
        <div className="bg-[#2a2a2a] rounded-lg p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label className="block text-sm text-[#D3D3D3] mb-2">
                Username or Email
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#D3D3D3]">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded px-4 py-3 pl-10 text-[#FAFAFA] text-sm focus:outline-none focus:border-[#FFCA20] transition"
                  placeholder="Enter username or email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm text-[#D3D3D3] mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#D3D3D3]">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded px-4 py-3 pl-10 pr-10 text-[#FAFAFA] text-sm focus:outline-none focus:border-[#FFCA20] transition"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#D3D3D3] hover:text-[#FAFAFA] transition"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            {/* ReCAPTCHA */}
            {process.env.NEXT_PUBLIC_ADMIN_LOGIN_CAPTCHA === 'true' && (
            <div className="flex justify-center">
                <ReCAPTCHA
                    sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                    onChange={handleCaptchaChange}
                    theme="dark"
                />
            </div>
            )}
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/50 rounded text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-[#FFCA20] text-black font-semibold py-3 rounded transition ${
                isLoading 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-[#FFCA20]/90'
              }`}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-[#D3D3D3] mt-6">
          © {new Date().getFullYear()} MS Cinema. All rights reserved.
        </p>
      </div>
    </div>
  );
}

