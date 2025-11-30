'use client';

import React, { useState, useRef } from 'react';
import { ChevronLeft } from 'lucide-react';

export default function VerifyOTPPage() {
  const [otp, setOtp] = useState(['', '', '', '']);
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  const handleChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next input
      if (value && index < 3) {
        inputRefs[index + 1].current?.focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleVerify = () => {
    const otpValue = otp.join('');
    console.log('OTP submitted:', otpValue);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Promotional Banner with Image */}
      <div className="w-1/2 bg-red-600 relative overflow-hidden">
        <img 
          src="img/sing.jpg"
          alt="Royale Popcorn"
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60"></div>
        
        {/* Text Overlay */}
        <div className="absolute top-8 left-8 z-10">
          {/* <div className="text-white/90 text-xs font-bold mb-2 tracking-widest uppercase">
            GET OUR BEST SELLING
          </div>
          <div className="text-white text-5xl font-black mb-1 leading-tight">
            DOUBLE CARAMEL
          </div>
          <div className="text-white text-xl font-semibold tracking-wide">
            ROYALE POPCORN TODAY!
          </div> */}
        </div>
      </div>

      {/* Right Side - Verify OTP Form */}
      <div className="w-1/2 bg-[#1a1a1a] flex items-center justify-center p-12">
        <div className="w-full max-w-md">
          {/* Back Button */}
          <button className="flex items-center gap-2 text-white/60 hover:text-white mb-8 transition">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>

          {/* Header */}
          <div className="mb-10">
            <h1 className="text-white text-3xl font-bold mb-3">Verify OTP</h1>
            <p className="text-gray-400 text-sm leading-relaxed">
              Enter 4 digit OTP sent to your mobile number
            </p>
          </div>

          {/* OTP Input Fields */}
          <div className="mb-8">
            <div className="flex gap-4 justify-center mb-6">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={inputRefs[index]}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-16 h-16 bg-[#252525] text-white border border-[#3a3a3a] rounded-lg text-center text-2xl font-bold focus:outline-none focus:border-yellow-500 focus:bg-[#2a2a2a] transition"
                />
              ))}
            </div>

            {/* Resend Code */}
            <p className="text-center text-gray-500 text-sm">
              Didn't receive code?{' '}
              <button className="text-yellow-500 hover:text-yellow-400 font-semibold transition">
                Resend
              </button>
            </p>
          </div>

          {/* Verify Button */}
          <button
            onClick={handleVerify}
            className="w-full bg-yellow-500 text-black font-bold py-3.5 rounded-lg hover:bg-yellow-400 transition-all transform hover:scale-[1.02] text-sm shadow-lg shadow-yellow-500/20"
          >
            Verify
          </button>
        </div>
      </div>
    </div>
  );
}