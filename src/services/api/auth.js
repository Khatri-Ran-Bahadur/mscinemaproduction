/**
 * Authentication API Service
 * Handles user authentication, registration, and token management
 */

import { get, post } from './client';
import { setToken, removeToken, setUserData, removeUserData } from '@/utils/storage';

/**
 * Get user token (Login)
 * @param {string} username - Username
 * @param {string} password - User password
 * @returns {Promise<{user: object, token: string, expiration: string}>} - User data, token and expiration
 */
export const login = async (username, password) => {
  try {
    // Validate required fields
    if (!username || !password) {
      throw new Error('Username and password are required');
    }
    
    // Encode values for URL path
    const encodedUsername = encodeURIComponent(username);
    const encodedPassword = encodeURIComponent(password);
    
    // Build endpoint with path parameters
    // Format: /User/LoginUser/{UserName}/{UserPassword}
    const endpoint = `/User/LoginUser/${encodedUsername}/${encodedPassword}`;
    
    // POST request with empty body (as shown in curl example)
    // Note: The 'post' function automatically includes the guest token 
    // (Admin/Admin@11 for test, ONlineMS/cMSol@81 for live) 
    // in the Authorization header via getAuthHeaders() -> ensurePublicToken()
    const response = await post(endpoint, {});

    // Check login status
    // Status: 1 = Valid User, 2 = Invalid User, 3 = User not activated, 4 = Password Mismatch
    const status = response?.status || response?.Status;
    const remarks = response?.remarks || response?.Remarks || '';

    if (status === 1) {
      // Valid User - Extract user data from login response
      // Token management is handled automatically by client.js using Admin credentials
      const userData = {
        userID: response?.userID || response?.userId || response?.UserID,
        name: response?.name || response?.Name,
        email: response?.email || response?.Email,
        membershipNo: response?.membershipNo || response?.MembershipNo,
        passportNo: response?.passportNo || response?.PassportNo,
        mobile: response?.mobile || response?.Mobile,
        lastLogin: response?.lastLogin || response?.LastLogin,
        imageURL: response?.imageURL || response?.ImageURL,
        status: status,
        remarks: remarks
      };

      // Store user data using storage utility
      setUserData(userData);

      return {
        user: userData,
      };
    } else if (status === 2) {
      throw new Error('Invalid user. Please check your credentials.');
    } else if (status === 3) {
      throw new Error('User account is not activated. Please check your email for activation link.');
    } else if (status === 4) {
      throw new Error('Password mismatch. Please check your password.');
    } else {
      throw new Error(remarks || 'Login failed. Please try again.');
    }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Register a new user
 * @param {object} userData - User registration data
 * @param {string} userData.Name - User name
 * @param {string} userData.Email - User email
 * @param {string} userData.Password - User password
 * @param {string} userData.PassportNo - Passport number (optional)
 * @param {string} userData.Mobile - Mobile number (optional)
 * @param {string} userData.ImageURL - Image URL (optional)
 * @returns {Promise<object>} - Registration response
 */
export const registerUser = async (userData) => {
  try {
    const { Name, Email, Password, PassportNo = '', Mobile = '', ImageURL = '' } = userData;
    
    // Validate required fields (only Name, Email, Password are required)
    if (!Name || !Email || !Password) {
      throw new Error('Name, Email, and Password are required');
    }
    
    // Validate password length (API requires <= 8 characters)
    if (Password.length > 8) {
      throw new Error('Password length less than or equal to 8 characters');
    }

    
    
    // Encode required values for URL path
    const encodedName = encodeURIComponent(Name);
    const encodedEmail = encodeURIComponent(Email);
    const encodedPassword = encodeURIComponent(Password);
    
    // Build endpoint with path parameters
    // Format: /User/RegisterUser/{Name}/{Email}/{Password}/PassportNo/Mobile/ImageURL
    // Note: PassportNo, Mobile, ImageURL are literal strings in the path, actual values go in query params
    let endpoint = `/User/RegisterUser/${encodedName}/${encodedEmail}/${encodedPassword}/PassportNo/Mobile/ImageURL`;
    
    // Add optional parameters as query parameters if they're provided
    // Format: ?PassportNo={PassportNo}&Mobile={Mobile}&ImageURL={ImageURL}
    const queryParams = new URLSearchParams();
    if (PassportNo && PassportNo.trim()) {
      queryParams.append('PassportNo', PassportNo.trim());
    }
    if (Mobile && Mobile.trim()) {
      queryParams.append('Mobile', Mobile.trim());
    }
    if (ImageURL && ImageURL.trim()) {
      queryParams.append('ImageURL', ImageURL.trim());
    }
    
    if (queryParams.toString()) {
      endpoint += `?${queryParams.toString()}`;
    }
    
    // POST request with empty body (parameters are in the path and query)
    // Pass null to ensure no body is sent (not even "{}")
    const response = await post(endpoint, null);
    
    return response;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

/**
 * Activate user account
 * @param {number|string} userId - User ID
 * @returns {Promise<object>} - Activation response
 */
export const activateUser = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    // Endpoint: /User/ActivateUser/{UserID}
    const endpoint = `/User/ActivateUser/${userId}`;
    
    const response = await post(endpoint, {});
    return response;
  } catch (error) {
    console.error('Activate user error:', error);
    throw error;
  }
};

/**
 * Check if user email is valid
 * @param {string} email - User email
 * @returns {Promise<object>} - Validation response (should contain userID if valid)
 */
export const isValidUser = async (email) => {
  try {
    if (!email) {
      throw new Error('Email is required');
    }
    
    // Encode email for URL
    const encodedEmail = encodeURIComponent(email);
    
    // Endpoint: /User/IsValidUser/{Email}
    const endpoint = `/User/IsValidUser/${encodedEmail}`;
    
    const response = await get(endpoint);
    return response;
  } catch (error) {
    console.error('IsValidUser error:', error);
    throw error;
  }
};

/**
 * Forgot password - reset password for user
 * @param {number|string} userId - User ID
 * @param {string} newPassword - New password
 * @returns {Promise<object>} - Reset password response
 */
export const forgotPassword = async (userId, newPassword) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    if (!newPassword) {
      throw new Error('New password is required');
    }
    
    // Encode password for URL
    const encodedPassword = encodeURIComponent(newPassword);
    
    // Endpoint: /User/ForgotPassword/{UserID}/{NewPassword}
    const endpoint = `/User/ForgotPassword/${userId}/${encodedPassword}`;
    
    const response = await post(endpoint, {});
    return response;
  } catch (error) {
    console.error('Forgot password error:', error);
    throw error;
  }
};

/**
 * Logout user
 * Removes token and user data from storage
 */
export const logout = () => {
  removeToken();
  removeUserData();
};

/**
 * Get maintenance mode and app version
 * @returns {Promise<object>} - Maintenance mode and version info
 */
export const getMaintenanceModeAndAppVersion = async () => {
  try {
    const response = await get('/GetMaintenanceModeAndAppVersion');
    return response;
  } catch (error) {
    console.error('Get maintenance mode error:', error);
    throw error;
  }
};

/**
 * Get maintenance mode and app version by ID
 * @param {number} id - Version ID (default: 1)
 * @returns {Promise<object>} - Maintenance mode and version info
 */
export const getMaintenanceModeAndAppVersionById = async (id = 1) => {
  try {
    const response = await get(`/WebSettings/GetMaintenanceModeAndAppVersion/${id}`);
    return response;
  } catch (error) {
    console.error('Get maintenance mode by ID error:', error);
    throw error;
  }
};

/**
 * Get public token (for non-logged in users)
 * Uses the default API credentials (different for test and live)
 * @returns {Promise<{token: string, expiration: string}>} - Token and expiration
 */
export const getPublicToken = async () => {
  try {
    // Import centralized config for credentials
    const { GUEST_CREDENTIALS } = await import('@/config/api');
    const credentials = GUEST_CREDENTIALS;
    
    const response = await post('/APIUser/GetToken', credentials);

    // Handle different response formats
    const token = response?.token || response?.Token || response?.accessToken || response?.access_token;
    let expiration = response?.expiration || response?.Expiration || response?.expiresIn || response?.expires_in;
    
    if (token) {
      // If no expiration provided, set to 1 hour from now (default token expiry)
      if (!expiration) {
        const oneHourFromNow = new Date();
        oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);
        expiration = oneHourFromNow.toISOString();
      }
      // Store public token and expiration
      const { setPublicToken } = await import('@/utils/storage');
      setPublicToken(token, expiration);
      return {
        token: token,
        expiration: expiration,
      };
    }

    throw new Error('Invalid response from server: Token not found');
  } catch (error) {
    console.error('Get public token error:', error);
    throw error;
  }
};

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @param {object} profileData - Profile data with optional PassportNo, Mobile, MembershipNo, ImageURL
 * @returns {Promise<object>} Updated user data
 */
export const updateUserProfile = async (userId, email, profileData = {}) => {
  try {
    const { PassportNo, Mobile, MembershipNo, ImageURL } = profileData;

    // Build endpoint with path parameters
    let endpoint = `/User/UpdateUserProfile/${userId}/${encodeURIComponent(email)}/PassportNo/Mobile/MembershipNo/ImageURL`;

    // Build query parameters for optional fields
    const queryParams = [];
    if (PassportNo) {
      queryParams.push(`PassportNo=${encodeURIComponent(PassportNo)}`);
    }
    if (Mobile) {
      queryParams.push(`Mobile=${encodeURIComponent(Mobile)}`);
    }
    if (MembershipNo) {
      queryParams.push(`MembershipNo=${encodeURIComponent(MembershipNo)}`);
    }
    if (ImageURL) {
      queryParams.push(`ImageURL=${encodeURIComponent(ImageURL)}`);
    }

    if (queryParams.length > 0) {
      endpoint += `?${queryParams.join('&')}`;
    }

    const response = await post(endpoint, {});

    return response;
  } catch (error) {
    console.error('Update user profile error:', error);
    throw error;
  }
};

/**
 * Change user password
 * @param {string} userId - User ID
 * @param {string} oldPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<object>} Response from server
 */
export const changePassword = async (userId, oldPassword, newPassword) => {
  try {
    // Validate password length (<= 8 characters)
    if (newPassword.length > 8) {
      throw new Error('Password length less than or equal to 8 characters');
    }

    const endpoint = `/User/ChangePassword/${userId}/${encodeURIComponent(oldPassword)}/${encodeURIComponent(newPassword)}`;
    const response = await post(endpoint, {});

    return response;
  } catch (error) {
    console.error('Change password error:', error);
    throw error;
  }
};

export default {
  login,
  registerUser,
  activateUser,
  isValidUser,
  forgotPassword,
  logout,
  updateUserProfile,
  changePassword,
  getMaintenanceModeAndAppVersion,
  getMaintenanceModeAndAppVersionById,
};

