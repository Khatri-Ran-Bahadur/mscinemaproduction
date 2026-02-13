/**
 * Authentication API Service
 * Handles user authentication, registration, and token management
 */

import { get, post, APIError } from './client';
import { setToken, removeToken, setUserData, removeUserData, getStorageItem, setStorageItem } from '@/utils/storage';

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
      throw new APIError('Username and password are required', 400);
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
      throw new APIError('Invalid user. Please check your credentials.', 2, response);
    } else if (status === 3) {
      throw new APIError('User account is not activated. Please check your email for activation link.', 3, response);
    } else if (status === 4) {
      throw new APIError('Password mismatch. Please check your password.', 4, response);
    } else {
      throw new APIError(remarks || 'Login failed. Please try again.', status || 400, response);
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
      throw new APIError('Name, Email, and Password are required', 400);
    }
    
    // Validate password length (API requires <= 8 characters)
    if (Password.length > 8) {
      throw new APIError('Password length less than or equal to 8 characters', 400);
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
    
    // Check registration status
    // Status: 1 - Success / 2 - Already registered / 3 - Already registered but not Activated
    const status = response?.status || response?.Status;
    const remarks = response?.remarks || response?.Remarks || '';
    
    if (status === 1) {
      return response;
    } else if (status === 2) {
      throw new APIError('User already registered. Please sign in instead.', 2, response);
    } else if (status === 3) {
      throw new APIError('User already registered but not activated. Please check your email for activation link.', 3, response);
    } else {
       // If no status or unknown status, but assuming success if no explicit failure
       // Or strictly check for status 1?
       // Based on login logic, if not 1, it's failed.
       if (status) {
          throw new APIError(remarks || 'Registration failed. Please try again.', status, response);
       }
       // If status is missing but we got a response, it might be legacy or error in response format
       return response;
    }
    
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
 * Resend activation email
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @param {string} name - User name
 * @returns {Promise<object>} - API response
 */
export const resendActivationEmail = async (userId, email, name = '') => {
  try {
    const { API_CONFIG } = await import('@/config/api');
    const response = await fetch('/api/auth/send-activation-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_CONFIG.API_SECRET_KEY,
      },
      body: JSON.stringify({ userId, email, name }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to resend activation email');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Resend activation email error:', error);
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
 * @param {string} token - Reset token from email
 * @param {string} newPassword - New password to set
 * @returns {Promise<object>} - Reset password response
 */
export const forgotPassword = async (userId, token, newPassword) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    if (!token) {
      throw new Error('Reset token is required');
    }
    if (!newPassword) {
      throw new Error('New password is required');
    }
    
    // Encode token and newPassword for URL
    const encodedPassword = encodeURIComponent(newPassword);
    console.log('Encoded password:', encodedPassword);
    console.log('User ID:', userId);
    
    // Endpoint: /User/ForgotPassword/{UserID}/{NewPassword}
    // Based on API: http://cinemaapi5.ddns.net/api/User/ForgotPassword/5/testet
    // The curl example shows empty body (-d ''), so newPassword should be in URL path
    const endpoint = `/User/ForgotPassword/${userId}/${encodedPassword}`;
    
    // POST request with empty body (as shown in curl example: -d '')
    const response = await post(endpoint, null);
    console.log('Forgot password response:', response);
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
    const CACHE_KEY = `maintenance_mode_${id}`;
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    
    // Check localStorage cache
    const cachedItem = getStorageItem(CACHE_KEY);
    if (cachedItem) {
      try {
        const { data, timestamp } = JSON.parse(cachedItem);
        const now = Date.now();
        
        // Return cached data if valid (less than 3 minutes old)
        if (now - timestamp < CACHE_DURATION) {
          return data;
        }
      } catch (e) {
        // Invalid cache format, ignore
        console.warn('Invalid maintenance cache', e);
      }
    }

    // Call API
    const response = await get(`/WebSettings/GetMaintenanceModeAndAppVersion/${id}`);
    
    // Cache successful response
    const cacheData = {
      data: response,
      timestamp: Date.now()
    };
    setStorageItem(CACHE_KEY, JSON.stringify(cacheData));

    return response;
  } catch (error) {
    console.error('Get maintenance mode by ID error:', error);
    
    const CACHE_KEY = `maintenance_mode_${id}`;
    let dataToReturn = { maintenanceMode: true }; // Default fallback

    // Check for stale cache
    const cachedItem = getStorageItem(CACHE_KEY);
    if (cachedItem) {
      try {
        const parsed = JSON.parse(cachedItem);
        if (parsed && parsed.data) {
            dataToReturn = parsed.data;
        }
      } catch (e) {
        console.warn('Failed to parse stale cache', e);
      }
    }
    
    // Update cache timestamp to prevent immediate retry
    // This respects the user's request to ensure 3 minute difference between calls
    const cacheData = {
      data: dataToReturn,
      timestamp: Date.now()
    };
    setStorageItem(CACHE_KEY, JSON.stringify(cacheData));
    
    return dataToReturn;
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
export const updateUserProfile = async (userId, profileData = {}) => {
  try {
    const { name, PassportNo, Mobile, MembershipNo, ImageURL } = profileData;

    // Build endpoint with path parameters
    let endpoint = `/User/UpdateUserProfile/${userId}/${encodeURIComponent(name)}/PassportNo/Mobile/MembershipNo/ImageURL`;

    // Build query parameters for optional fields
    const queryParams = [];
    if (name) {
      queryParams.push(`Name=${encodeURIComponent(name)}`);
    }
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
  resendActivationEmail,
  isValidUser,
  forgotPassword,
  logout,
  updateUserProfile,
  changePassword,
  getMaintenanceModeAndAppVersion,
  getMaintenanceModeAndAppVersionById,
};

