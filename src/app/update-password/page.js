// FILE: app/forgot-password/page.js (App Router)
// OR
// FILE: pages/forgot-password.js (Pages Router)

'use client'; // Only needed for App Router

import React, { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Email submitted:', email);
    // Add your password reset logic here
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Promotional Banner */}
      <div className="w-1/2 bg-gradient-to-br from-red-600 to-red-700 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 p-12 flex flex-col h-full">
          {/* Header Text */}
          <div className="mb-8">
            <div className="text-white/90 text-xs font-bold mb-2 tracking-widest uppercase">
              GET OUR BEST SELLING
            </div>
            <div className="text-white text-5xl font-black mb-1 leading-tight">
              DOUBLE CARAMEL
            </div>
            <div className="text-white text-xl font-semibold tracking-wide">
              ROYALE POPCORN TODAY!
            </div>
          </div>

          {/* Popcorn Products Display */}
          <div className="flex-1 flex items-end justify-center pb-12 relative">
            {/* Scattered Popcorn Background */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-yellow-900/30 to-transparent"></div>

            {/* Product Group */}
            <div className="relative z-20 flex items-end justify-center gap-8">
              {/* Large Popcorn Bucket - Left */}
              <div className="relative transform hover:scale-105 transition-transform duration-300">
                <div className="w-52 h-72 bg-gradient-to-b from-white to-gray-50 rounded-t-3xl rounded-b-lg shadow-2xl relative overflow-visible">
                  {/* Red Stripes */}
                  <div className="absolute inset-0">
                    <div className="absolute inset-x-4 top-16 bottom-4 border-l-4 border-r-4 border-red-600 rounded-t-3xl"></div>
                  </div>
                  
                  {/* ROYALE Branding */}
                  <div className="absolute top-20 left-1/2 transform -translate-x-1/2 text-center z-10">
                    <div className="w-20 h-20 mx-auto mb-2 bg-red-700 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white font-black text-lg">R</span>
                    </div>
                    <div className="text-red-700 text-3xl font-black tracking-wider">ROYALE</div>
                  </div>

                  {/* Overflowing Popcorn */}
                  <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 w-56 h-40 bg-gradient-to-b from-yellow-600 via-yellow-500 to-yellow-600 rounded-full">
                    <div className="absolute inset-0 rounded-full" style={{
                      backgroundImage: 'radial-gradient(circle, #fbbf24 20%, transparent 20%), radial-gradient(circle, #f59e0b 20%, transparent 20%)',
                      backgroundSize: '20px 20px',
                      backgroundPosition: '0 0, 10px 10px'
                    }}></div>
                  </div>
                </div>
              </div>

              {/* Small Popcorn Bucket - Center */}
              <div className="relative mb-6 transform hover:scale-105 transition-transform duration-300">
                <div className="w-36 h-52 bg-gradient-to-b from-white to-gray-50 rounded-t-3xl rounded-b-lg shadow-xl relative overflow-visible">
                  {/* Red Stripes */}
                  <div className="absolute inset-0">
                    <div className="absolute inset-x-3 top-12 bottom-3 border-l-4 border-r-4 border-red-600 rounded-t-3xl"></div>
                  </div>
                  
                  {/* ROYALE Branding */}
                  <div className="absolute top-16 left-1/2 transform -translate-x-1/2 text-center z-10">
                    <div className="w-14 h-14 mx-auto mb-2 bg-red-700 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white font-black text-sm">R</span>
                    </div>
                    <div className="text-red-700 text-xl font-black tracking-wide">ROYALE</div>
                  </div>

                  {/* Overflowing Popcorn */}
                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 w-40 h-32 bg-gradient-to-b from-yellow-600 via-yellow-500 to-yellow-600 rounded-full">
                    <div className="absolute inset-0 rounded-full" style={{
                      backgroundImage: 'radial-gradient(circle, #fbbf24 20%, transparent 20%), radial-gradient(circle, #f59e0b 20%, transparent 20%)',
                      backgroundSize: '15px 15px',
                      backgroundPosition: '0 0, 8px 8px'
                    }}></div>
                  </div>
                </div>
              </div>

              {/* Drink Cup - Right */}
              <div className="relative transform hover:scale-105 transition-transform duration-300">
                <div className="w-32 h-48 bg-gradient-to-b from-red-800 to-red-900 rounded-t-xl rounded-b-lg shadow-xl relative overflow-visible">
                  {/* Cup Design */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center px-4">
                      <div className="w-14 h-14 mx-auto mb-2 bg-white/20 rounded-full flex items-center justify-center">
                        <span className="text-white font-black text-lg">R</span>
                      </div>
                      <div className="text-white text-lg font-black">ROYALE</div>
                      <div className="text-white/70 text-xs mt-1">DRINK</div>
                    </div>
                  </div>

                  {/* Straw */}
                  <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
                    <div className="w-3 h-20 bg-gradient-to-b from-red-300 to-red-400 rounded-full shadow-lg"></div>
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-red-300 rounded-full"></div>
                  </div>

                  {/* Lid */}
                  <div className="absolute -top-2 left-0 right-0 h-4 bg-red-900 rounded-t-xl border-t-2 border-red-700"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Forgot Password Form */}
      <div className="w-1/2 bg-[#1a1a1a] flex items-center justify-center p-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-white text-3xl font-bold mb-3">Forgot Password</h1>
            <p className="text-gray-400 text-sm leading-relaxed">
              Enter your email and we'll send you instructions to reset your password
            </p>
          </div>

          {/* Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Input */}
            <div>
              <label className="block text-gray-400 text-sm mb-2 font-medium">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full bg-[#252525] text-white border border-[#3a3a3a] rounded-lg px-4 py-3.5 text-sm focus:outline-none focus:border-yellow-500 focus:bg-[#2a2a2a] transition placeholder-gray-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-yellow-500 text-black font-bold py-3.5 rounded-lg hover:bg-yellow-400 transition-all transform hover:scale-[1.02] text-sm"
            >
              Send Reset Link
            </button>

            {/* Back to Login Link */}
            <p className="text-center text-gray-400 text-sm mt-6">
              Remember your password?{' '}
              <Link 
                href="/sign-in" 
                className="text-yellow-500 hover:text-yellow-400 font-semibold transition"
              >
                Back to Login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
} 