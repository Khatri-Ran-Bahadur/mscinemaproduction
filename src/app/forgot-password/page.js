"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { auth } from '@/services/api';
import { APIError } from '@/services/api';
import { encryptId } from '@/utils/encryption';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Call IsValidUser API to validate email
      const response = await auth.isValidUser(email);
      
      // Extract userId from response
      const userId = response?.userID || response?.userId || response?.UserID || response?.id;
      
      if (!userId) {
        setError('Email not found. Please check your email address or sign up.');
        setIsLoading(false);
        return;
      }

      // Generate a reset token (in production, this should come from the backend API)
      // For now, we'll generate a simple token - backend should provide this
      const resetToken = `reset_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      const tokenTimestamp = Date.now(); // Store timestamp for expiration check (1 hour = 3600000ms)
      
      // Store encrypted userId, token, and timestamp in localStorage as fallback
      const encryptedUserId = encryptId(userId);
      localStorage.setItem('resetPasswordUserId', encryptedUserId);
      localStorage.setItem('resetPasswordToken', resetToken);
      localStorage.setItem('resetPasswordTokenTimestamp', tokenTimestamp.toString());
      localStorage.setItem('resetPasswordEmail', email);
      
      // Call API to send forgot password email
      try {
        const emailResponse = await fetch('/api/auth/send-forgot-password-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userId,
            email: email,
            token: resetToken,
          }),
        });

        const emailData = await emailResponse.json();

        if (!emailResponse.ok) {
          console.error('Failed to send password reset email:', emailData.error || emailData.message);
          // Show error to user if email fails
          setError('Registration was successful, but we could not send the activation email. Please contact support or try again later.');
          setIsLoading(false);
          return;
        } else {
          console.log('Password reset email sent successfully:', emailData.messageId);
        }
      } catch (emailError) {
        console.error('Error sending password reset email:', emailError);
        setError('Failed to send password reset email. Please try again or contact support.');
        setIsLoading(false);
        return;
      }
      
      // Show success message
      setSuccess(true);
    } catch (err) {
      console.error('IsValidUser error:', err);
      if (err instanceof APIError) {
        setError(err.message || 'Email not found. Please check your email address or sign up.');
      } else {
        setError('Email not found. Please check your email address or sign up.');
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

      {/* Right Side - Forgot Password Form (Full width on mobile, 1/3 on desktop) */}
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
          <div className="mb-6 md:mb-8">
            <h1 className="text-3xl md:text-2xl font-bold text-[#FAFAFA] mb-3">Forgot Password</h1>
            <p className="text-sm text-[#D3D3D3]">
              Enter your registered email address
            </p>
          </div>

          {success ? (
            <div className="bg-green-500/10 border border-green-500/50 rounded p-4">
              <h3 className="text-lg font-semibold text-green-400 mb-2">Email Sent!</h3>
              <p className="text-sm text-green-300 mb-4">
                A password reset link has been sent to <strong>{email}</strong>. 
                Please check your email and follow the instructions to reset your password.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => router.push('/sign-in')}
                  className="flex-1 bg-[#FFCA20] text-black font-semibold py-2 px-4 rounded text-sm hover:bg-[#FFCA20]/90 transition"
                >
                  Go to Sign In
                </button>
                <button
                  onClick={() => {
                    setSuccess(false);
                    setEmail('');
                  }}
                  className="flex-1 bg-[#2a2a2a] border border-[#3a3a3a] text-[#FAFAFA] font-semibold py-2 px-4 rounded text-sm hover:bg-[#3a3a3a] transition"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div>
                <label className="block text-sm text-[#D3D3D3] mb-2">Email address</label>
                  <input
                  type="email"
                  value={email}
                      onChange={(e) => {
                    setEmail(e.target.value);
                        setError('');
                      }}
                      className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded px-4 py-3 text-[#FAFAFA] text-sm focus:outline-none focus:border-[#FFCA20] transition"
                  placeholder="Enter your email address"
                      required
                    />
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
                disabled={isLoading}
                className={`w-full bg-[#FFCA20] text-black font-semibold py-3 rounded transition ${
                  isLoading 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:bg-[#FFCA20]/90'
                }`}
              >
                {isLoading ? 'Verifying...' : 'Send Reset Link'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
