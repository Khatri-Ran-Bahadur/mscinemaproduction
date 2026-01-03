"use client";

import Image from 'next/image';

/**
 * Professional Loader Component with Logo
 * Displays animated logo while content is loading
 */
export default function Loader({ 
  fullScreen = false, 
  message = '',
  size = 'default' // 'small', 'default', 'large'
}) {
  const sizeClasses = {
    small: 'w-16 h-16',
    default: 'w-24 h-24',
    large: 'w-32 h-32'
  };

  const containerClasses = fullScreen
    ? 'min-h-screen bg-[#0a0a0a] flex items-center justify-center'
    : 'flex items-center justify-center py-16';

  return (
    <div className={containerClasses}>
      <div className="text-center">
        {/* Animated Logo */}
        <div className={`relative ${message ? 'mb-6' : ''} flex justify-center`}>
          <div className={`${sizeClasses[size]} relative`}>
            {/* Pulsing background circle */}
            <div className="absolute inset-0 rounded-full bg-[#FFCA20]/20 animate-ping"></div>
            <div className="absolute inset-0 rounded-full bg-[#FFCA20]/10 animate-pulse"></div>
            
            {/* Logo with rotation animation */}
            <div className="relative w-full h-full animate-spin-slow">
              <Image
                src="/img/logo.png"
                alt="MS Cinemas Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>

        {/* Loading Text - Only show if message is provided */}
        {message && (
          <div className="space-y-2">
            <p className="text-[#FFCA20] text-sm font-medium animate-pulse">
              {message}
            </p>
            
            {/* Loading Dots Animation */}
            <div className="flex justify-center gap-1">
              <div className="w-2 h-2 bg-[#FFCA20] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-[#FFCA20] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-[#FFCA20] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
}

