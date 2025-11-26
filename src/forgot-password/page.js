import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function LotusPopcornPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = () => {
    console.log('Form submitted:', formData);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Section - Hero with demo image */}
      <div className="w-full md:w-1/2 bg-red-600 relative overflow-hidden min-h-screen">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=800&q=80')`,
            filter: 'brightness(0.7)'
          }}
        ></div>
        
        {/* Red overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/80 via-red-700/70 to-red-800/80"></div>
        
        <div className="relative z-10 p-8 md:p-12 h-full flex flex-col">
          {/* Header Text */}
          <div className="mb-8">
            <div className="inline-block bg-red-800/70 px-4 py-1.5 rounded text-white text-xs md:text-sm font-medium mb-3 backdrop-blur-sm">
              GET OUR BEST SELLING
            </div>
            <h1 className="text-white text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-2">
              DOUBLE CARAMEL
            </h1>
            <p className="text-white text-lg md:text-xl font-medium">
              ROYALE POPCORN TODAY, AT
            </p>
          </div>

          {/* Product Image placeholder - Real image will show through background */}
          <div className="flex-1 flex items-center justify-center relative">
            <div className="text-white/20 text-center">
              <p className="text-sm">Product Image Overlay Area</p>
            </div>
          </div>

          {/* Scattered popcorn at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-32 overflow-hidden">
            <div className="relative w-full h-full">
              {[...Array(40)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 md:w-3 md:h-3 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full shadow-md"
                  style={{
                    left: `${Math.random() * 100}%`,
                    bottom: `${Math.random() * 100}%`,
                    opacity: 0.5 + Math.random() * 0.5,
                    transform: `scale(${0.5 + Math.random() * 1})`
                  }}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="w-full md:w-1/2 bg-gradient-to-br from-gray-900 via-gray-800 to-amber-900 flex items-center justify-center p-8 md:p-12 min-h-screen">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <button className="text-white/70 hover:text-white flex items-center gap-2 text-sm mb-8 transition-colors">
              ← Back
            </button>
            <h2 className="text-white text-3xl md:text-4xl font-bold mb-2">
              Forgot Password
            </h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 transition-all"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 pr-12 text-white placeholder-white/30 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 transition-all"
                  placeholder="Enter new password"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-white/70 cursor-pointer hover:text-white transition-colors">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-white/10 bg-white/5 text-yellow-500 focus:ring-yellow-500 cursor-pointer"
                />
                <span>Remember Me</span>
              </label>
              <a href="#" className="text-yellow-500 hover:text-yellow-400 font-medium transition-colors">
                Forgot Password?
              </a>
            </div>

            <button
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 font-bold py-3.5 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              Next
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-white/50 text-sm">
              Don't have an account?{' '}
              <a href="#" className="text-yellow-500 hover:text-yellow-400 font-medium transition-colors">
                Sign Up
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}