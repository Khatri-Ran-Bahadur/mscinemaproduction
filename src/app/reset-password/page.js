"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react';
import { auth } from '@/services/api';
import { APIError } from '@/services/api';
import { decryptId } from '@/utils/encryption';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    // Get encrypted userId and token from URL parameters
    const encryptedUserId = searchParams?.get('userId') || searchParams?.get('userID') || searchParams?.get('id');
    const urlToken = searchParams?.get('token') || searchParams?.get('Token');
    
    // Fallback to localStorage if not in URL
    const storedUserId = localStorage.getItem('resetPasswordUserId');
    const storedToken = localStorage.getItem('resetPasswordToken');
    const storedTimestamp = localStorage.getItem('resetPasswordTokenTimestamp');
    
    const finalEncryptedUserId = encryptedUserId || storedUserId;
    const finalToken = urlToken || storedToken;
    const finalTimestamp = storedTimestamp; // Timestamp is only in localStorage, not URL
    
    if (finalEncryptedUserId && finalToken) {
      try {
        // Check if token has expired (1 hour = 3600000 milliseconds)
        const RESET_TOKEN_EXPIRATION_MS = 60 * 60 * 1000; // 1 hour in milliseconds
        const now = Date.now();
        
        // If token is from URL, we need to extract timestamp from token or use stored timestamp
        // For URL tokens, we'll use stored timestamp if available, otherwise check if token contains timestamp
        let tokenTimestamp = null;
        
        if (urlToken && storedTimestamp) {
          // Token from URL, use stored timestamp
          tokenTimestamp = parseInt(storedTimestamp);
        } else if (storedToken && storedTimestamp) {
          // Token from localStorage, use stored timestamp
          tokenTimestamp = parseInt(storedTimestamp);
        } else if (urlToken) {
          // Token from URL but no stored timestamp - try to extract from token
          // Token format: reset_{timestamp}_{random}
          const tokenParts = urlToken.split('_');
          if (tokenParts.length >= 2 && tokenParts[0] === 'reset') {
            tokenTimestamp = parseInt(tokenParts[1]);
          }
        }
        
        // Check expiration
        if (tokenTimestamp) {
          const elapsed = now - tokenTimestamp;
          if (elapsed > RESET_TOKEN_EXPIRATION_MS) {
            // Token expired - clear stored data
            localStorage.removeItem('resetPasswordUserId');
            localStorage.removeItem('resetPasswordToken');
            localStorage.removeItem('resetPasswordTokenTimestamp');
            localStorage.removeItem('resetPasswordEmail');
            setError('This password reset link has expired. Please request a new password reset link.');
            return;
          }
        } else {
          // No timestamp found - for security, treat as expired if token is from URL
          if (urlToken) {
            setError('Invalid reset link. Please request a new password reset.');
            return;
          }
        }
        
        // Decrypt the user ID
        const decryptedUserId = decryptId(finalEncryptedUserId);
        if (decryptedUserId) {
          setUserId(decryptedUserId);
          setToken(finalToken);
        } else {
          setError('Invalid reset link. Unable to decrypt user ID.');
        }
      } catch (err) {
        console.error('Decryption error:', err);
        setError('Invalid reset link. Please request a new password reset.');
      }
    } else {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [searchParams]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.newPassword) {
      setError('Please enter your new password');
      return;
    }

    if (!formData.confirmPassword) {
      setError('Please confirm your new password');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.newPassword.length > 8) {
      setError('Password length must be less than or equal to 8 characters');
      return;
    }

    if (!userId || !token) {
      setError('Invalid reset link. Please request a new password reset.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Call ForgotPassword API with userId, token, and new password
      // The token verifies the reset request, and newPassword is the new password to set
      await auth.forgotPassword(userId, token, formData.newPassword);
      
      // Clear stored data
      localStorage.removeItem('resetPasswordUserId');
      localStorage.removeItem('resetPasswordToken');
      localStorage.removeItem('resetPasswordTokenTimestamp');
      localStorage.removeItem('resetPasswordEmail');
      
      // Redirect to sign-in page after successful password reset
      router.push('/sign-in?passwordReset=success');
    } catch (err) {
      console.error('ForgotPassword error:', err);
      if (err instanceof APIError) {
        setError(err.message || 'Password reset failed. Please try again.');
      } else {
        setError('Password reset failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
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

      {/* Right Side - Reset Password Form (Full width on mobile, 1/3 on desktop) */}
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
            <h1 className="text-3xl md:text-2xl font-bold text-[#FAFAFA] mb-3">Reset password</h1>
            <p className="text-sm text-[#D3D3D3]">
              Enter your new password
            </p>
          </div>

          {/* Error Message - Invalid Link or Expired */}
          {error && !userId && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded">
              <h3 className="text-lg font-semibold text-red-400 mb-2">
                {error.includes('expired') ? 'Link Expired' : 'Invalid Reset Link'}
              </h3>
              <p className="text-sm text-red-300 mb-4">{error}</p>
              <button
                onClick={() => router.push('/forgot-password')}
                className="w-full bg-[#FFCA20] text-black font-semibold py-2 px-4 rounded text-sm hover:bg-[#FFCA20]/90 transition"
              >
                Request New Reset Link
              </button>
            </div>
          )}

          {/* Form */}
          {userId && token && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password Input */}
            <div>
              <label className="block text-sm text-[#D3D3D3] mb-2">New password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded px-4 py-3 text-[#FAFAFA] text-sm focus:outline-none focus:border-[#FFCA20] transition pr-12"
                  placeholder="New password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#D3D3D3] hover:text-[#FAFAFA] transition"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password Input */}
            <div>
              <label className="block text-sm text-[#D3D3D3] mb-2">Confirm new password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded px-4 py-3 text-[#FAFAFA] text-sm focus:outline-none focus:border-[#FFCA20] transition pr-12"
                  placeholder="Confirm new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#D3D3D3] hover:text-[#FAFAFA] transition"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/50 rounded text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !userId || !token}
              className={`w-full bg-[#FFCA20] text-black font-semibold py-3 rounded transition ${
                isLoading || !userId || !token
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-[#FFCA20]/90'
              }`}
            >
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>
          )}
        </div>
      </div>
    </div>
  );
}

