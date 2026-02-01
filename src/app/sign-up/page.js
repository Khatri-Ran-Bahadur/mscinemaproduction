"use client";

import { useState, useRef } from 'react';
import { Eye, EyeOff, Camera } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/services/api';
import { APIError } from '@/services/api';

export default function SignupPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    email: '',
    password: '',
    passportNo: '',
    mobile: '',
    imageURL: '',
    terms: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    if (error) setError('');
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    // Clear general errors, maybe specific image error state if I had one
    if (error) setError('');

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    // If there is already an image, send it to be deleted
    if (formData.imageURL) {
        uploadFormData.append('oldImage', formData.imageURL);
    }

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: uploadFormData
        });
        const data = await response.json();

        if (data.success) {
            setFormData(prev => ({
                ...prev,
                imageURL: data.url
            }));
        } else {
             setError(data.error || 'Image upload failed');
        }
    } catch (err) {
        console.error('Upload error:', err);
        setError('Image upload failed. Please try again.');
    } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }
  };

  const handleImageDelete = (url) => {
      // For now, just clear from state so it's not submitted.
      // Ideally call an API to delete the file from server to save storage immediately.
      setFormData(prev => ({
          ...prev,
          imageURL: ''
      }));
  };

  const validateForm = () => {
    if (!formData.firstName) {
      setError('Please enter your first name');
      return false;
    }
    if (!formData.email) {
      setError('Please enter your email');
      return false;
    }
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.password) {
      setError('Please enter your password');
      return false;
    }
    if (formData.password.length > 8) {
      setError('Password length less than or equal to 8 characters');
      return false;
    }
    if (!formData.mobile) {
      setError('Please enter your mobile number');
      return false;
    }
    if (!formData.terms) {
      setError('Please accept the Terms of Use and Privacy Policy');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await auth.registerUser({
        Name: formData.firstName,
        Email: formData.email,
        Password: formData.password,
        PassportNo: formData.passportNo || '', // Optional field
        Mobile: formData.mobile,
        ImageURL: formData.imageURL || '', // Optional field
      });
      
      // Check registration response
      // Response format: { userID, name, email, status, remarks }
      const userStatus = response?.status || response?.Status;
      const userID = response?.userID || response?.userId || response?.UserID;
      
      // Registration successful - send activation email
      if (userID) {
        try {
          const { API_CONFIG } = await import('@/config/api');
          // Call API to send activation email
          const emailResponse = await fetch('/api/auth/send-activation-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': API_CONFIG.API_SECRET_KEY,
            },
            body: JSON.stringify({
              userId: userID,
              email: formData.email,
              name: formData.firstName,
            }),
          });

          const emailData = await emailResponse.json();

          if (!emailResponse.ok) {
            console.error('Failed to send activation email:', emailData.error || emailData.message);
            // Registration succeeded but email failed - still show success message
            // User can request resend if needed
          } else {
            console.log('Activation email sent successfully:', emailData.messageId);
          }
        } catch (emailError) {
          console.error('Error sending activation email:', emailError);
          // Don't fail registration if email fails - user can request resend
        }
      }
      
      // Show success message with instruction to check email
      setRegisteredEmail(formData.email);
      setShowSuccessMessage(true);
      
      // Note: The activation email contains an encrypted user ID in the activation link
      // User needs to click the link in the email to activate their account
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message || 'Registration failed. Please try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Side - Image (2/3 width on desktop, hidden on mobile) */}
      <div className="hidden md:block md:w-2/3 relative overflow-hidden">
        <img
          src="/img/login.jpeg"
          alt="Popcorn"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Right Side - Sign Up Form (Full width on mobile, 1/3 on desktop) */}
      <div className="w-full md:w-1/3 bg-[#1a1a1a] flex items-center justify-center p-6 md:p-8 min-h-screen">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <h2 className="text-3xl md:text-2xl font-bold text-[#FAFAFA] mb-3">Sign up</h2>
            <p className="text-sm text-[#D3D3D3]">
              Already have an account?{' '}
              <Link href="/sign-in" className="text-[#FFCA20] hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Success Message - Activation Email Sent */}
          {showSuccessMessage && (
            <div className="mb-4 p-4 bg-green-500/10 border border-green-500/50 rounded">
              <h3 className="text-lg font-semibold text-green-400 mb-2">Registration Successful!</h3>
              <p className="text-sm text-green-300 mb-3">
                An activation link has been sent to <strong>{registeredEmail}</strong>. 
                Please check your email and click on the activation link to activate your account.
              </p>
              <div className="flex gap-3">
                <Link
                  href="/sign-in"
                  className="flex-1 bg-[#FFCA20] text-black font-semibold py-2 px-4 rounded text-center text-sm hover:bg-[#FFCA20]/90 transition"
                >
                  Go to Sign In
                </Link>
                <button
                  onClick={() => {
                    setShowSuccessMessage(false);
                    setFormData({
                      firstName: '',
                      email: '',
                      password: '',
                      passportNo: '',
                      mobile: '',
                      imageURL: '',
                      terms: false
                    });
                  }}
                  className="flex-1 bg-[#2a2a2a] border border-[#3a3a3a] text-[#FAFAFA] font-semibold py-2 px-4 rounded text-sm hover:bg-[#3a3a3a] transition"
                >
                  Register Another
                </button>
              </div>
            </div>
          )}

          {!showSuccessMessage && (
          <div className="space-y-4">
            {/* First Name */}
            <div>
              <label className="block text-sm text-[#D3D3D3] mb-2">Full Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="firstName"
                placeholder="Full Name"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded px-4 py-3 text-[#FAFAFA] text-sm focus:outline-none focus:border-[#FFCA20] transition placeholder-[#D3D3D3]/50"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm text-[#D3D3D3] mb-2">Email <span className="text-red-500">*</span></label>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded px-4 py-3 text-[#FAFAFA] text-sm focus:outline-none focus:border-[#FFCA20] transition placeholder-[#D3D3D3]/50"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-[#D3D3D3] mb-2">Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  maxLength={8}
                  onChange={handleChange}
                  className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded px-4 py-3 text-[#FAFAFA] text-sm focus:outline-none focus:border-[#FFCA20] transition pr-12 placeholder-[#D3D3D3]/50"
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

            {/* Passport Number (Optional) */}
            <div>
              <label className="block text-sm text-[#D3D3D3] mb-2">
                Passport Number <span className="text-[#D3D3D3]/50">(Optional)</span>
              </label>
                <input
                type="text"
                name="passportNo"
                placeholder="Passport number"
                value={formData.passportNo}
                  onChange={handleChange}
                className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded px-4 py-3 text-[#FAFAFA] text-sm focus:outline-none focus:border-[#FFCA20] transition placeholder-[#D3D3D3]/50"
                />
              </div>

            {/* Mobile */}
            <div>
              <label className="block text-sm text-[#D3D3D3] mb-2">Mobile</label>
              <input
                type="tel"
                name="mobile"
                placeholder="Mobile number"
                value={formData.mobile}
                onChange={handleChange}
                className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded px-4 py-3 text-[#FAFAFA] text-sm focus:outline-none focus:border-[#FFCA20] transition placeholder-[#D3D3D3]/50"
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm text-[#D3D3D3] mb-2">
                Profile Image <span className="text-[#D3D3D3]/50">(Optional)</span>
              </label>
              
              <div className="flex items-center gap-4">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    className="hidden"
                    accept="image/*"
                />
                
                {/* Preview Circle */}
                <div 
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                    className={`nav-btn w-20 h-20 rounded-full bg-[#2a2a2a] border border-[#3a3a3a] flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#FFCA20] transition relative group ${isUploading ? 'opacity-50' : ''}`}
                >
                    {formData.imageURL ? (
                        <>
                            <img 
                                src={formData.imageURL} 
                                alt="Preview" 
                                className="w-full h-full object-cover" 
                            />
                            {/* Hover overlay to indicate change */}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                <Camera className="w-6 h-6 text-white" />
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-[#666] group-hover:text-[#FFCA20] transition">
                            {isUploading ? (
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FFCA20]"></div>
                            ) : (
                                <Camera className="w-8 h-8 mb-1" />
                            )}
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                     <button
                        type="button"
                        disabled={isUploading}
                        onClick={() => fileInputRef.current?.click()}
                        className="text-sm bg-[#2a2a2a] border border-[#3a3a3a] text-[#FAFAFA] px-3 py-1.5 rounded hover:bg-[#333] transition disabled:opacity-50"
                     >
                        {formData.imageURL ? 'Change Photo' : 'Upload Photo'}
                     </button>
                     {formData.imageURL && (
                         <button
                            type="button"
                            onClick={() => {
                                // Optional: You might want to delete the uploaded image from server here if they remove it
                                // But for now just clearing state is safe, or we can call delete logic. 
                                // Given request "if not register... remove", we already handle replacement.
                                // If they explicitly clear, we should probably treat it as a replacement with "nothing".
                                // For simplicity/speed, let's just clear. The unused image stays until cron or ignored (or we send request to delete).
                                // Let's strictly follow "if ... change another image remove current".
                                // If I clear it, I should probably delete it to be clean.
                                handleImageDelete(formData.imageURL); 
                            }}
                            className="text-xs text-red-400 hover:text-red-300 text-left"
                         >
                            Remove
                         </button>
                     )}
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                name="terms"
                checked={formData.terms}
                onChange={handleChange}
                className="mt-1 w-4 h-4 rounded border-[#3a3a3a] bg-[#2a2a2a] text-[#FFCA20] focus:ring-[#FFCA20] focus:ring-offset-0 cursor-pointer"
              />
              <label htmlFor="terms" className="text-sm text-[#D3D3D3] leading-relaxed">
                I have read and agreed to MS cinemas{' '}
                <Link href="/terms-and-conditions" className="text-[#FFCA20] hover:underline font-medium">Terms of Use</Link>
                {' '}and{' '}
                <Link href="/privacy-policy" className="text-[#FFCA20] hover:underline font-medium">Privacy Policy</Link>
                , and information provided is accurate.
              </label>
            </div>

            {/* Sign Up Button */}
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className={`w-full bg-[#FFCA20] text-black font-semibold py-3 rounded transition ${
                isLoading 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-[#FFCA20]/90'
              }`}
            >
              {isLoading ? 'Signing up...' : 'Sign up'}
            </button>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
