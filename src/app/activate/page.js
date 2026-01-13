"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/services/api';
import { APIError } from '@/services/api';
import { decryptId } from '@/utils/encryption';
import Loader from '@/components/Loader';

export default function ActivatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const encryptedUserId = searchParams?.get('userId') || searchParams?.get('userID') || searchParams?.get('id');
  
  const [isActivating, setIsActivating] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const handleActivation = async () => {
    if (!encryptedUserId) {
      setError('Invalid activation link.');
      setIsLoading(false);
      return;
    }

    setIsActivating(true);
    setError('');

    try {
      // Decrypt the user ID from the URL
      const userId = decryptId(encryptedUserId);
      
      if (!userId) {
        throw new Error('Invalid activation link. Unable to decrypt user ID.');
      }

      // Call the activation API with decrypted user ID
      await auth.activateUser(userId);
      setIsActivated(true);
    } catch (err) {
      console.error('Activation error:', err);
      if (err instanceof APIError) {
        setError(err.message || 'Activation failed. The link may be invalid or expired.');
      } else {
        setError(err.message || 'Activation failed. Please try again or contact support.');
      }
    } finally {
      setIsActivating(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Auto-activate if encryptedUserId is present in URL
    if (encryptedUserId) {
      handleActivation();
    } else {
      setError('Invalid activation link. User ID is missing.');
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encryptedUserId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <Loader fullScreen={false} size="large" />
      </div>
    );
  }

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

      {/* Right Side - Activation Form (Full width on mobile, 1/3 on desktop) */}
      <div className="w-full md:w-1/3 bg-[#1a1a1a] flex items-center justify-center p-6 md:p-8 min-h-screen">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <h2 className="text-3xl md:text-2xl font-bold text-[#FAFAFA] mb-3">
              {isActivated ? 'Account Activated!' : 'Activating Account'}
            </h2>
            <p className="text-sm text-[#D3D3D3]">
              {isActivated 
                ? 'Your account has been successfully activated. You can now sign in.'
                : 'Please wait while we activate your account...'
              }
            </p>
          </div>

          {/* Loading State */}
          {isActivating && (
            <div className="text-center py-8">
              <Loader fullScreen={false} size="medium" />
              <p className="text-[#D3D3D3] mt-4">Activating your account...</p>
            </div>
          )}

          {/* Success Message */}
          {isActivated && !isActivating && (
            <div className="mb-4 p-4 bg-green-500/10 border border-green-500/50 rounded">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-green-400 mb-2">Activation Successful!</h3>
                <p className="text-sm text-green-300">
                  Your account has been successfully activated. You can now sign in to continue.
                </p>
              </div>
              <Link
                href="/sign-in"
                className="block w-full bg-[#FFCA20] text-black font-semibold py-3 rounded text-center hover:bg-[#FFCA20]/90 transition"
              >
                Go to Sign In
              </Link>
            </div>
          )}

          {/* Error Message */}
          {error && !isActivating && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded">
              <h3 className="text-lg font-semibold text-red-400 mb-2">Activation Failed</h3>
              <p className="text-sm text-red-300 mb-4">{error}</p>
              <div className="flex gap-3">
                <Link
                  href="/sign-in"
                  className="flex-1 bg-[#2a2a2a] border border-[#3a3a3a] text-[#FAFAFA] font-semibold py-2 px-4 rounded text-center text-sm hover:bg-[#3a3a3a] transition"
                >
                  Go to Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="flex-1 bg-[#FFCA20] text-black font-semibold py-2 px-4 rounded text-center text-sm hover:bg-[#FFCA20]/90 transition"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

