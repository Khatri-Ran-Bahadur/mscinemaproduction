"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Phone, CreditCard, Calendar, LogOut, ArrowLeft, Edit, Lock, X } from 'lucide-react';
import { getUserData, removeToken, removeUserData, setUserData as updateUserDataStorage } from '@/utils/storage';
import { auth } from '@/services/api';

export default function ProfilePage() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    passportNo: '',
    membershipNo: '',
    imageURL: ''
  });
  const [passwordFormData, setPasswordFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = () => {
      const user = getUserData();

      if (!user) {
        router.push('/sign-in');
        return;
      }

      setUserData(user);
      setEditFormData({
        name: user?.name || '',
        email: user?.email || '',
        mobile: user?.mobile || '',
        passportNo: user?.passportNo || '',
        membershipNo: user?.membershipNo || '',
        imageURL: user?.imageURL || ''
      });
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleEditClick = () => {
    setIsEditing(true);
    setShowChangePassword(false);
    setErrors({});
    setSuccessMessage('');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData({
      name: userData?.name || '',
      email: userData?.email || '',
      mobile: userData?.mobile || '',
      passportNo: userData?.passportNo || '',
      membershipNo: userData?.membershipNo || '',
      imageURL: userData?.imageURL || ''
    });
    setErrors({});
    setSuccessMessage('');
  };

  const handleEditInputChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleUpdateProfile = async () => {
    setErrors({});
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      // Validate email
      if (!editFormData.email || !editFormData.email.includes('@')) {
        setErrors({ email: 'Please enter a valid email address' });
        setIsSubmitting(false);
        return;
      }

      const profileData = {};
      if (editFormData.name) profileData.name = editFormData.name;
      if (editFormData.passportNo) profileData.PassportNo = editFormData.passportNo;
      if (editFormData.mobile) profileData.Mobile = editFormData.mobile;
      if (editFormData.membershipNo) profileData.MembershipNo = editFormData.membershipNo;
      if (editFormData.imageURL) profileData.ImageURL = editFormData.imageURL;

      await auth.updateUserProfile(userData.userID, profileData);

      // Update local user data
      const updatedUserData = {
        ...userData,
        name: editFormData.name,  
        email: editFormData.email,
        mobile: editFormData.mobile || userData.mobile,
        passportNo: editFormData.passportNo || userData.passportNo,
        membershipNo: editFormData.membershipNo || userData.membershipNo,
        imageURL: editFormData.imageURL || userData.imageURL
      };
      setUserData(updatedUserData);
      // Update localStorage
      updateUserDataStorage(updatedUserData);
      setIsEditing(false);
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Update profile error:', error);
      setErrors({ general: error.message || 'Failed to update profile. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePasswordClick = () => {
    setShowChangePassword(true);
    setIsEditing(false);
    setPasswordFormData({
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setErrors({});
    setSuccessMessage('');
  };

  const handlePasswordInputChange = (field, value) => {
    setPasswordFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error for this field
    if (errors[field] || errors.confirmPassword) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        delete newErrors.confirmPassword;
        return newErrors;
      });
    }
  };

  const handleChangePassword = async () => {
    setErrors({});
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      // Validate password length
      if (passwordFormData.newPassword.length > 8) {
        setErrors({ newPassword: 'Password length less than or equal to 8 characters' });
        setIsSubmitting(false);
        return;
      }

      // Validate password match
      if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
        setErrors({ confirmPassword: 'New passwords do not match' });
        setIsSubmitting(false);
        return;
      }

      // Validate required fields
      if (!passwordFormData.oldPassword || !passwordFormData.newPassword) {
        setErrors({ general: 'Please fill in all password fields' });
        setIsSubmitting(false);
        return;
      }

      await auth.changePassword(userData.userID, passwordFormData.oldPassword, passwordFormData.newPassword);

      setShowChangePassword(false);
      setPasswordFormData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setSuccessMessage('Password changed successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Change password error:', error);
      setErrors({ general: error.message || 'Failed to change password. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    auth.logout();
    router.push('/');
  };

  const getUserInitials = () => {
    if (userData && userData.name) {
      return userData.name.charAt(0).toUpperCase();
    }
    if (userData && userData.email) {
      return userData.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const hasValidImage = () => {
    return userData?.imageURL && 
           userData.imageURL.trim() && 
           userData.imageURL !== ' ' &&
           userData.imageURL !== 'null' &&
           userData.imageURL !== 'undefined';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1c1c1c] flex items-center justify-center">
        <div className="text-[#FFCA20] text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1c1c1c] text-white pt-20 pb-10">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#D3D3D3] hover:text-[#FFCA20] transition mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </Link>

        {/* Profile Header */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 mb-6">
          <div className="flex items-center gap-6">
            {/* User Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FFCA20] to-[#FFD700] flex items-center justify-center text-black font-bold text-3xl flex-shrink-0 shadow-lg border-4 border-[#FFCA20]/30 overflow-hidden relative">
              {hasValidImage() ? (
                <img
                  src={userData.imageURL}
                  alt={userData.name || 'User'}
                  className="w-full h-full rounded-full object-cover"
                  onError={(e) => {
                    // If image fails to load, show initials instead
                    e.target.style.display = 'none';
                    const initialsEl = e.target.nextElementSibling;
                    if (initialsEl) {
                      initialsEl.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <div 
                className={`w-full h-full rounded-full flex items-center justify-center ${hasValidImage() ? 'hidden' : 'flex'}`}
              >
                {getUserInitials()}
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">{userData?.name || 'User'}</h1>
              <p className="text-[#D3D3D3] text-sm mb-4">{userData?.email || 'No email'}</p>
              {userData?.membershipNo && (
                <div className="inline-flex items-center gap-2 bg-[#FFCA20]/10 border border-[#FFCA20]/30 rounded-full px-4 py-2">
                  <CreditCard className="w-4 h-4 text-[#FFCA20]" />
                  <span className="text-sm text-[#FFCA20]">Member #{userData.membershipNo}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 mb-6 text-green-400">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {errors.general && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6 text-red-400">
            {errors.general}
          </div>
        )}

        {/* Profile Details */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <User className="w-5 h-5 text-[#FFCA20]" />
              Profile Information
            </h2>
            {!isEditing && !showChangePassword && (
              <button
                onClick={handleEditClick}
                className="flex items-center gap-2 px-4 py-2 bg-[#FFCA20] text-black rounded-lg hover:bg-[#FFCA20]/90 transition font-medium"
              >
                <Edit className="w-4 h-4" />
                Edit Profile
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4">
              {/* Name */}
              <div className="flex items-start gap-4 pb-4 border-b border-[#2a2a2a]">
                <User className="w-5 h-5 text-[#FFCA20] mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <label className="text-sm text-[#D3D3D3] mb-1 block">Name *</label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => handleEditInputChange('name', e.target.value)}
                    className="w-full bg-[#2a2a2a] border border-[#4a4a4a] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#FFCA20] transition"
                    placeholder="Enter your name"
                  />
                  {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
                </div>
              </div>
              {/* Email */}
              <div className="flex items-start gap-4 pb-4 border-b border-[#2a2a2a]">
                <Mail className="w-5 h-5 text-[#FFCA20] mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <label className="text-sm text-[#D3D3D3] mb-1 block">Email *</label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => handleEditInputChange('email', e.target.value)}
                    className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-[#FAFAFA] focus:outline-none focus:border-[#FFCA20]"
                  />
                  {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
                </div>
              </div>

              {/* Mobile */}
              <div className="flex items-start gap-4 pb-4 border-b border-[#2a2a2a]">
                <Phone className="w-5 h-5 text-[#FFCA20] mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <label className="text-sm text-[#D3D3D3] mb-1 block">Mobile Number</label>
                  <input
                    type="text"
                    value={editFormData.mobile}
                    onChange={(e) => handleEditInputChange('mobile', e.target.value)}
                    className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-[#FAFAFA] focus:outline-none focus:border-[#FFCA20]"
                    placeholder="Optional"
                  />
                </div>
              </div>

              {/* Passport Number */}
              <div className="flex items-start gap-4 pb-4 border-b border-[#2a2a2a]">
                <CreditCard className="w-5 h-5 text-[#FFCA20] mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <label className="text-sm text-[#D3D3D3] mb-1 block">Passport Number</label>
                  <input
                    type="text"
                    value={editFormData.passportNo}
                    onChange={(e) => handleEditInputChange('passportNo', e.target.value)}
                    className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-[#FAFAFA] focus:outline-none focus:border-[#FFCA20]"
                    placeholder="Optional"
                  />
                </div>
              </div>

              {/* Membership Number */}
              <div className="flex items-start gap-4 pb-4 border-b border-[#2a2a2a]">
                <CreditCard className="w-5 h-5 text-[#FFCA20] mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <label className="text-sm text-[#D3D3D3] mb-1 block">Membership Number</label>
                  <input
                    type="text"
                    value={editFormData.membershipNo}
                    onChange={(e) => handleEditInputChange('membershipNo', e.target.value)}
                    className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-[#FAFAFA] focus:outline-none focus:border-[#FFCA20]"
                    placeholder="Optional"
                  />
                </div>
              </div>

              {/* Image URL */}
              <div className="flex items-start gap-4 pb-4 border-b border-[#2a2a2a]">
                <User className="w-5 h-5 text-[#FFCA20] mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <label className="text-sm text-[#D3D3D3] mb-1 block">Profile Image URL</label>
                  <input
                    type="url"
                    value={editFormData.imageURL}
                    onChange={(e) => handleEditInputChange('imageURL', e.target.value)}
                    className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-[#FAFAFA] focus:outline-none focus:border-[#FFCA20]"
                    placeholder="Optional - Enter image URL"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleUpdateProfile}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-[#FFCA20] text-black rounded-lg hover:bg-[#FFCA20]/90 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-[#2a2a2a] border border-[#3a3a3a] text-[#FAFAFA] rounded-lg hover:bg-[#3a3a3a] transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Email */}
              <div className="flex items-start gap-4 pb-4 border-b border-[#2a2a2a]">
                <Mail className="w-5 h-5 text-[#FFCA20] mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <label className="text-sm text-[#D3D3D3] mb-1 block">Email</label>
                  <p className="text-[#FAFAFA]">{userData?.email || 'Not provided'}</p>
                </div>
              </div>

              {/* Mobile */}
              {(userData?.mobile || isEditing) && (
                <div className="flex items-start gap-4 pb-4 border-b border-[#2a2a2a]">
                  <Phone className="w-5 h-5 text-[#FFCA20] mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <label className="text-sm text-[#D3D3D3] mb-1 block">Mobile Number</label>
                    <p className="text-[#FAFAFA]">{userData?.mobile || 'Not provided'}</p>
                  </div>
                </div>
              )}

              {/* Passport Number */}
              {(userData?.passportNo || isEditing) && (
                <div className="flex items-start gap-4 pb-4 border-b border-[#2a2a2a]">
                  <CreditCard className="w-5 h-5 text-[#FFCA20] mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <label className="text-sm text-[#D3D3D3] mb-1 block">Passport Number</label>
                    <p className="text-[#FAFAFA]">{userData?.passportNo || 'Not provided'}</p>
                  </div>
                </div>
              )}

              {/* Last Login */}
              {userData?.lastLogin && (
                <div className="flex items-start gap-4">
                  <Calendar className="w-5 h-5 text-[#FFCA20] mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <label className="text-sm text-[#D3D3D3] mb-1 block">Last Login</label>
                    <p className="text-[#FAFAFA]">{new Date(userData.lastLogin).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Change Password Section */}
        {showChangePassword && (
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#FFCA20]" />
                Change Password
              </h2>
              <button
                onClick={() => {
                  setShowChangePassword(false);
                  setPasswordFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                  setErrors({});
                }}
                className="text-[#D3D3D3] hover:text-[#FAFAFA] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Old Password */}
              <div>
                <label className="text-sm text-[#D3D3D3] mb-1 block">Current Password *</label>
                <input
                  type="password"
                  value={passwordFormData.oldPassword}
                  onChange={(e) => handlePasswordInputChange('oldPassword', e.target.value)}
                  className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-[#FAFAFA] focus:outline-none focus:border-[#FFCA20]"
                  placeholder="Enter current password"
                />
              </div>

              {/* New Password */}
              <div>
                <label className="text-sm text-[#D3D3D3] mb-1 block">New Password *</label>
                <input
                  type="password"
                  value={passwordFormData.newPassword}
                  onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                  className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-[#FAFAFA] focus:outline-none focus:border-[#FFCA20]"
                  placeholder="Enter new password (max 8 characters)"
                />
                {errors.newPassword && <p className="text-red-400 text-sm mt-1">{errors.newPassword}</p>}
                <p className="text-[#D3D3D3] text-xs mt-1">Password must be 8 characters or less</p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="text-sm text-[#D3D3D3] mb-1 block">Confirm New Password *</label>
                <input
                  type="password"
                  value={passwordFormData.confirmPassword}
                  onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                  className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-[#FAFAFA] focus:outline-none focus:border-[#FFCA20]"
                  placeholder="Confirm new password"
                />
                {errors.confirmPassword && <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleChangePassword}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-[#FFCA20] text-black rounded-lg hover:bg-[#FFCA20]/90 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Changing...' : 'Change Password'}
                </button>
                <button
                  onClick={() => {
                    setShowChangePassword(false);
                    setPasswordFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                    setErrors({});
                  }}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-[#2a2a2a] border border-[#3a3a3a] text-[#FAFAFA] rounded-lg hover:bg-[#3a3a3a] transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Account Actions */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-6">Account Actions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/my-tickets"
              className="flex items-center gap-3 p-4 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg transition"
            >
              <CreditCard className="w-5 h-5 text-[#FFCA20] flex-shrink-0" />
              <span>My Tickets</span>
            </Link>

            {!showChangePassword && (
              <button
                onClick={handleChangePasswordClick}
                className="flex items-center gap-3 p-4 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg transition"
              >
                <Lock className="w-5 h-5 text-[#FFCA20] flex-shrink-0" />
                <span>Change Password</span>
              </button>
            )}
          </div>

          {/* Logout Button - Full Width */}
          <div className="mt-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition text-red-400"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

