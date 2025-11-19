"use client"
import { useState } from 'react';
import { Eye, EyeOff, ChevronDown } from 'lucide-react';

export default function Signin() {
  const [showPassword, setShowPassword] = useState(false);
  const [countryCode, setCountryCode] = useState('+60');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = () => {
    console.log('Login attempt:', { countryCode, mobileNumber, password });
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Promotional Banner */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-red-600 to-red-700 relative overflow-hidden">
        <div className="absolute inset-0 flex flex-col justify-center items-start p-16 z-10">
          <h1 className="text-white text-5xl font-bold mb-2">
            GET OUR BEST SELLING
          </h1>
          <h2 className="text-white text-6xl font-bold mb-4">
            DOUBLE CARAMEL
          </h2>
          <p className="text-white text-4xl font-semibold">
            ROYALE POPCORN TODAY!
          </p>
        </div>
        
        {/* Popcorn Image Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Popcorn bucket */}
            <div className="relative z-20">
              <div className="w-64 h-80 bg-red-600 rounded-t-3xl relative shadow-2xl">
                <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-white text-center">
                  <div className="text-sm mb-2">❄️</div>
                  <div className="text-5xl font-bold">ROYALE</div>
                  <div className="text-2xl italic">popcorn</div>
                  <div className="text-xs mt-2">MALAYSIA'S FAVOURITE CINEMA POPCORN</div>
                </div>
              </div>
              {/* Caramel popcorn on top */}
              <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 w-72 h-32 bg-yellow-700 rounded-full"></div>
            </div>
            
            {/* Drink cup */}
            <div className="relative z-20 ml-8">
              <div className="w-48 h-64 bg-red-600 rounded-t-2xl relative shadow-2xl">
                <div className="absolute top-12 left-1/2 transform -translate-x-1/2 text-white text-center">
                  <div className="text-4xl font-bold italic">Royale</div>
                </div>
              </div>
              {/* Lid */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-48 h-8 bg-red-700 rounded-full"></div>
            </div>
          </div>
        </div>
        
        {/* Scattered popcorn at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-yellow-800/50 to-transparent"></div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-black p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-white text-4xl font-bold mb-3">Sign in</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Sign in to continue your theatre journey—book shows,<br />
              track reservations, and enjoy exclusive member perks.
            </p>
          </div>

          <div className="space-y-6">
            {/* Mobile Number with Country Code */}
            <div className="flex gap-3">
              {/* Country Code Dropdown */}
              <div className="relative">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="appearance-none bg-zinc-900 text-white px-4 py-4 pr-10 rounded-lg border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent cursor-pointer w-28"
                >
                  <option value="+60">+60</option>
                  <option value="+91">+91</option>
                  <option value="+1">+1</option>
                  <option value="+44">+44</option>
                  <option value="+65">+65</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                <label className="absolute -top-2 left-3 bg-black px-1 text-gray-400 text-xs">
                  Code
                </label>
              </div>

              {/* Mobile Number Input */}
              <div className="relative flex-1">
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="Mobile number"
                  className="w-full bg-zinc-900 text-white px-4 py-4 rounded-lg border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent placeholder-gray-600"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-zinc-900 text-white px-4 py-4 pr-12 rounded-lg border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent placeholder-gray-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <button className="text-yellow-500 text-sm hover:text-yellow-400 transition-colors">
                Forgot Password?
              </button>
            </div>

            {/* Sign In Button */}
            <button
              onClick={handleSubmit}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-4 rounded-lg transition-colors duration-200"
            >
              Sign in
            </button>

            {/* Sign Up Link */}
            <div className="text-center text-gray-400 text-sm">
              Don't have an account?{' '}
              <button className="text-yellow-500 hover:text-yellow-400 transition-colors">
                Sign up
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}