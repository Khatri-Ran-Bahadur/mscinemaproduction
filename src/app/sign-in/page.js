"use client";

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/services/api';
import { APIError } from '@/services/api';

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPasswordResetSuccess, setShowPasswordResetSuccess] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  useEffect(() => {
    // Check if password reset was successful
    if (searchParams?.get('passwordReset') === 'success') {
      setShowPasswordResetSuccess(true);
      // Remove query param from URL
      router.replace('/sign-in', { scroll: false });
    }
  }, [searchParams, router]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user types
    if (error) setError('');
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.email) {
      setError('Please enter your email');
      return;
    }

    if (!formData.password) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await auth.login(formData.email, formData.password);
      // Redirect to home page after successful login
      router.push('/');
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message || 'Login failed. Please check your credentials.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      console.error('Login error:', err);
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

      {/* Right Side - Sign In Form (Full width on mobile, 1/3 on desktop) */}
      <div className="w-full md:w-1/3 bg-[#1a1a1a] flex items-center justify-center p-6 md:p-8 min-h-screen">
        <div className="w-full max-w-sm">
          {/* Sign In Header */}
          <div className="mb-6 md:mb-8">
            <h2 className="text-3xl md:text-2xl font-bold text-[#FAFAFA] mb-3">Sign in</h2>
            <p className="text-sm text-[#D3D3D3] leading-relaxed">
              Sign in to continue your theatre journey—book shows, track reservations, and enjoy exclusive member perks.
            </p>
          </div>

          {/* Password Reset Success Message */}
          {showPasswordResetSuccess && (
            <div className="mb-4 p-4 bg-green-500/10 border border-green-500/50 rounded">
              <p className="text-sm text-green-400">
                Password reset successful! Please sign in with your new password.
              </p>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Username Input */}
            <div>
              <label className="block text-sm text-[#D3D3D3] mb-2">Email</label>
                  <input
                type="email"
                name="email"
                value={formData.email}
                    onChange={handleInputChange}
                    className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded px-4 py-3 text-[#FAFAFA] text-sm focus:outline-none focus:border-[#FFCA20] transition"
                placeholder="Email"
                  />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm text-[#D3D3D3] mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded px-4 py-3 text-[#FAFAFA] text-sm focus:outline-none focus:border-[#FFCA20] transition pr-12"
                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#D3D3D3] hover:text-[#FAFAFA] transition"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/50 rounded text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Forgot Password */}
            <div className="text-right">
              <Link href="/forgot-password" className="text-sm text-[#FFCA20] hover:underline">
                Forgot Password?
              </Link>
            </div>

            {/* Sign In Button */}
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className={`w-full bg-[#FFCA20] text-black font-semibold py-3 rounded transition ${
                isLoading 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-[#FFCA20]/90'
              }`}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>

            {/* Separator */}
            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-[#3a3a3a]"></div>
              <span className="px-4 text-sm text-[#D3D3D3]">or</span>
              <div className="flex-1 border-t border-[#3a3a3a]"></div>
            </div>

            {/* Sign in with Google Button */}
            <button
              className="w-full bg-[#2a2a2a] border border-[#3a3a3a] text-[#FAFAFA] font-medium py-3 rounded flex items-center justify-center gap-3 hover:bg-[#2a2a2a]/80 transition"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Sign in with Google</span>
            </button>

            {/* Sign Up Link */}
            <p className="text-center text-sm text-[#D3D3D3] mt-6">
              Don't have an account?{' '}
              <Link href="/sign-up" className="text-[#FFCA20] hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}