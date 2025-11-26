"use client";

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function SignInPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState('email');
  const [formData, setFormData] = useState({
    email: '',
    mobile: '',
    password: ''
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = () => {
    console.log('Login data:', formData);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Popcorn Banner */}
      <div className="w-1/2 bg-gradient-to-br from-red-600 to-red-700 relative overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1585647347384-2593bc35786b?w=800&h=1000&fit=crop&q=80" 
            alt="Popcorn"
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/80 to-transparent"></div>
        </div>
        
        {/* Text Content */}
        <div className="relative z-10 p-12 text-white">
          <div className="mb-2">
            <p className="text-sm font-medium tracking-wide">GET OUR BEST SELLING</p>
            <h1 className="text-5xl font-bold leading-tight">DOUBLE CARAMEL</h1>
            <p className="text-xl mt-1">ROYALE POPCORN TODAY! 🍿</p>
          </div>
        </div>

        {/* Popcorn Image */}
        <div className="absolute bottom-0 left-0 right-0">
          <img 
            src="https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=600&h=400&fit=crop&q=80" 
            alt="Popcorn buckets"
            className="w-full object-cover"
          />
        </div>
      </div>

      {/* Right Side - Sign In Form */}
      <div className="w-1/2 bg-[#1a1a1a] flex items-center justify-center p-12">
        <div className="w-full max-w-md">
          {/* Sign In Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Sign In</h2>
            <p className="text-sm text-gray-400">
              Use your email or mobile number. Don't have an account yet?{' '}
              <a href="#" className="text-[#f5c118] hover:underline">Sign up</a>
            </p>
          </div>

          {/* Login Method Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setLoginMethod('email')}
              className={`flex-1 py-2 rounded text-sm font-medium transition ${
                loginMethod === 'email'
                  ? 'bg-[#2a2a2a] text-white'
                  : 'bg-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              Email
            </button>
            <button
              onClick={() => setLoginMethod('mobile')}
              className={`flex-1 py-2 rounded text-sm font-medium transition ${
                loginMethod === 'mobile'
                  ? 'bg-[#2a2a2a] text-white'
                  : 'bg-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              Mobile number
            </button>
          </div>

          {/* Form Fields */}
          <div>
            {/* Email/Mobile Input */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">
                {loginMethod === 'email' ? 'Email' : 'Mobile number'}
              </label>
              <input
                type={loginMethod === 'email' ? 'email' : 'tel'}
                name={loginMethod}
                value={formData[loginMethod]}
                onChange={handleInputChange}
                className="w-full bg-[#2a2a2a] border border-gray-700 rounded px-4 py-3 text-white text-sm focus:outline-none focus:border-[#f5c118] transition"
                placeholder={loginMethod === 'email' ? 'Enter your email' : 'Enter mobile number'}
              />
            </div>

            {/* Password Input */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full bg-[#2a2a2a] border border-gray-700 rounded px-4 py-3 text-white text-sm focus:outline-none focus:border-[#f5c118] transition pr-12"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="text-right mb-6">
              <a href="#" className="text-sm text-[#f5c118] hover:underline">
                Forgot password?
              </a>
            </div>

            {/* Sign In Button */}
            <button
              onClick={handleSubmit}
              className="w-full bg-[#f5c118] text-black font-semibold py-3 rounded hover:bg-[#f5c118]/90 transition"
            >
              Sign In
            </button>

            {/* Sign Up Link */}
            <p className="text-center text-sm text-gray-400 mt-6">
              Don't have an account?{' '}
              <a href="#" className="text-[#f5c118] hover:underline font-medium">
                Sign up
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}