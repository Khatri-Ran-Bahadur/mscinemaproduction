"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

export default function VerifyOTPPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(90); // 90 seconds = 01:30
  const [canResend, setCanResend] = useState(false);
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

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

  const handleResend = () => {
    if (canResend) {
      setTimeLeft(90);
      setCanResend(false);
      // Add resend OTP logic here
      console.log('Resending OTP...');
    }
  };

  const handleVerify = () => {
    const otpValue = otp.join('');
    if (otpValue.length === 4) {
      console.log('OTP submitted:', otpValue);
      // Add verify OTP logic here
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Side - Image (2/3 width on desktop, hidden on mobile) */}
      <div className="hidden md:block md:w-2/3 relative overflow-hidden">
        <img
          src="/img/sing.jpg"
          alt="Popcorn"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Right Side - Verify OTP Form (Full width on mobile, 1/3 on desktop) */}
      <div className="w-full md:w-1/3 bg-[#1a1a1a] flex items-center justify-center p-6 md:p-8 min-h-screen">
        <div className="w-full max-w-sm">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="mb-6 md:mb-8 text-[#FAFAFA] hover:text-[#FFCA20] flex items-center gap-2 transition"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          {/* Header */}
          <div className="mb-8 md:mb-10">
            <h1 className="text-3xl md:text-2xl font-bold text-[#FAFAFA] mb-3">Verify OTP</h1>
            <p className="text-sm text-[#D3D3D3]">
              Enter OTP sent on your registered number
            </p>
          </div>

          {/* OTP Input Fields */}
          <div className="mb-8">
            <div className="flex gap-2 md:gap-3 justify-center mb-6">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={inputRefs[index]}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 md:w-14 md:h-14 bg-[#2a2a2a] text-[#FAFAFA] border border-[#3a3a3a] rounded text-center text-lg md:text-xl font-semibold focus:outline-none focus:border-[#FFCA20] transition"
                  placeholder="0"
                />
              ))}
            </div>

            {/* Timer and Resend */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-[#D3D3D3]">
                {formatTime(timeLeft)}
              </div>
              <button
                onClick={handleResend}
                disabled={!canResend}
                className={`text-sm transition ${
                  canResend
                    ? 'text-[#FFCA20] hover:underline cursor-pointer'
                    : 'text-[#D3D3D3]/50 cursor-not-allowed'
                }`}
              >
                Resend OTP
              </button>
            </div>
          </div>

          {/* Verify Button */}
          <button
            onClick={handleVerify}
            className="w-full bg-[#FFCA20] text-black font-semibold py-3 rounded transition hover:bg-[#FFCA20]/90"
          >
            Verify
          </button>
        </div>
      </div>
    </div>
  );
}
