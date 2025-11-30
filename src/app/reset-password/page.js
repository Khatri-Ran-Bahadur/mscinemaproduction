'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberPassword, setRememberPassword] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-800">
          {/* Banner Text */}
          <div className="absolute top-8 left-8 z-10">
            {/* <div className="bg-red-700/90 text-white px-6 py-3 rounded-lg inline-block shadow-xl backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wide font-medium">Get Our Best Selling</p>
              <h2 className="text-3xl font-bold my-1">DOUBLE CARAMEL</h2>
              <p className="text-sm uppercase font-medium">Royale Popcorn Today!</p>
            </div> */}
          </div>
          
          {/* Popcorn Image - Full Cover */}
          <div className="absolute inset-0 flex items-center justify-center">
            <img 
              src="img/sing.jpg" 
              alt="Popcorn"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Gradient Overlay for better text visibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-red-900/50 via-transparent to-red-800/30"></div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-zinc-900 p-8">
        <div className="w-full max-w-md">
          {/* Logo/Back Button */}
          <div className="mb-8">
            <button className="text-white flex items-center gap-2 hover:text-gray-300 transition">
              <span>←</span>
              <span className="text-sm">Back</span>
            </button>
          </div>

          {/* Login Form */}
          <div className="space-y-6">
            <div>
              <h1 className="text-white text-3xl font-bold mb-2">Reset password</h1>
              <p className="text-gray-400 text-sm">Enter your new password</p>
            </div>

            <form className="space-y-4">
              {/* New Password Input */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  New password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full bg-zinc-800 text-white px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 border border-zinc-700"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Confirm new password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full bg-zinc-800 text-white px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 border border-zinc-700"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Remember Password Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberPassword}
                  onChange={(e) => setRememberPassword(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-yellow-500 focus:ring-yellow-500"
                />
                <label htmlFor="remember" className="text-gray-400 text-sm cursor-pointer">
                  couldn't remember password?
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-3 rounded-md transition duration-200"
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}