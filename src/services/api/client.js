/**
 * API Client - Centralized HTTP client for all API requests
 * Handles authentication, error handling, and request/response interceptors
 */

import { getToken, isTokenExpired, removeToken, getPublicToken, isTokenExpired as isPublicTokenExpired, setPublicToken, removePublicToken, setToken } from '@/utils/storage';
import { API_CONFIG } from '@/config/api';

// API Configuration from centralized config
const {
  USE_LIVE_API,
  API_BASE_URL: BASE_URL,
  GUEST_CREDENTIALS,
  USE_PROXY,
  PROXY_URL,
} = API_CONFIG;

// Cache for public token promise to avoid multiple simultaneous requests
let publicTokenPromise = null;

/**
 * Custom API Error class
 */
export class APIError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Get public token if needed
 * @returns {Promise<string|null>} - Public token or null
 */
const ensurePublicToken = async () => {
  // Check if user token exists and is valid
  const userToken = getToken();
  if (userToken && !isTokenExpired()) {
    return userToken;
  }

  // Check if public token exists and is valid
  let publicToken = getPublicToken();
  if (publicToken && !isPublicTokenExpired(true)) {
    return publicToken;
  }

  // Fetch new public token (using guest credentials)
  try {
    // Prevent multiple simultaneous requests
    if (!publicTokenPromise) {
      const tokenUrl = USE_PROXY 
        ? `${PROXY_URL}?endpoint=/APIUser/GetToken`
        : `${BASE_URL}/APIUser/GetToken`;
      
      publicTokenPromise = fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(GUEST_CREDENTIALS),
      })
        .then(async (response) => {
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to get public token: ${response.status} ${errorText}`);
          }
          const data = await response.json();
          // Handle different response formats
          const token = data?.token || data?.Token || data?.accessToken || data?.access_token;
          const expiration = data?.expiration || data?.Expiration || data?.expiresIn || data?.expires_in;
          
          if (token) {
            // If no expiration provided, set to 1 hour from now (default token expiry)
            let tokenExpiration = expiration;
            if (!tokenExpiration) {
              const oneHourFromNow = new Date();
              oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);
              tokenExpiration = oneHourFromNow.toISOString();
            }
            // Store as public token (guest token)
            setPublicToken(token, tokenExpiration);
            return token;
          }
          throw new Error('Token not found in response');
        })
        .finally(() => {
          // Clear promise after completion
          publicTokenPromise = null;
        });
    }
    
    publicToken = await publicTokenPromise;
    return publicToken;
  } catch (error) {
    console.error('Error fetching public token:', error);
    publicTokenPromise = null;
    return null;
  }
};

/**
 * Get authorization header
 * @returns {Promise<object>} - Headers object with authorization
 */
const getAuthHeaders = async () => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  // Get token (user token if available, otherwise public token)
  const token = await ensurePublicToken();
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

/**
 * Get user-friendly error message based on HTTP status code
 * @param {number} status - HTTP status code
 * @param {any} responseData - Response data from API (optional)
 * @returns {string} - User-friendly error message
 */
const getUserFriendlyErrorMessage = (status, responseData = null) => {
  // Try to extract error message from response data first
  if (responseData) {
    // Check various common error message fields
    const errorMessage = 
      responseData.message || 
      responseData.Message ||
      responseData.remarks ||
      responseData.Remarks ||
      responseData.error || 
      responseData.Error ||
      responseData.errorMessage ||
      responseData.ErrorMessage ||
      responseData.error_description ||
      (typeof responseData === 'string' ? responseData : null);
    
    if (errorMessage && errorMessage.trim()) {
      return errorMessage;
    }
  }

  // Fall back to user-friendly messages based on status code
  switch (status) {
    case 400:
      return 'Invalid request. Please check your input and try again.';
    case 401:
      return 'Authentication failed. Please log in and try again.';
    case 403:
      return 'Access denied. You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found. Please check your information and try again.';
    case 409:
      return 'This action conflicts with existing data. Please check and try again.';
    case 422:
      return 'Validation error. Please check your input and try again.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'Server error. Please try again later or contact support if the problem persists.';
    case 502:
      return 'Service temporarily unavailable. Please try again in a few moments.';
    case 503:
      return 'Service is currently under maintenance. Please try again later.';
    case 504:
      return 'Request timeout. Please try again.';
    default:
      if (status >= 400 && status < 500) {
        return 'Request error. Please check your information and try again.';
      } else if (status >= 500) {
        return 'Server error. Please try again later or contact support.';
      }
      return 'An error occurred. Please try again.';
  }
};

/**
 * Handle API response
 * @param {Response} response - Fetch response object
 * @returns {Promise} - Parsed response data
 */
const handleResponse = async (response) => {
  // Handle empty responses
  if (response.status === 204 || response.status === 201) {
    return null;
  }

  const contentType = response.headers.get('content-type');
  
  // Handle different content types
  if (contentType && contentType.includes('application/json')) {
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      // If JSON parsing fails, treat as text response
      const text = await response.text();
      if (!response.ok) {
        const errorMessage = text && text.trim() 
          ? text 
          : getUserFriendlyErrorMessage(response.status);
        throw new APIError(
          errorMessage,
          response.status
        );
      }
      return text;
    }
    
    // Check for error in response
    if (!response.ok) {
      const errorMessage = getUserFriendlyErrorMessage(response.status, data);
      throw new APIError(
        errorMessage,
        response.status,
        data || null
      );
    }
    
    return data;
  } else {
    // Handle non-JSON responses
    const text = await response.text();
    if (!response.ok) {
      const errorMessage = text && text.trim() 
        ? text 
        : getUserFriendlyErrorMessage(response.status);
      throw new APIError(
        errorMessage,
        response.status
      );
    }
    return text;
  }
};

/**
 * Handle API errors
 * @param {Error} error - Error object
 * @throws {APIError} - Formatted API error
 */
const handleError = (error) => {
  if (error instanceof APIError) {
    throw error;
  }
  
  // Network errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    throw new APIError(
      'Network error. Please check your internet connection.',
      0
    );
  }
  
  // Unknown errors
  throw new APIError(
    error.message || 'An unexpected error occurred',
    500
  );
};

/**
 * Make API request
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {object} options - Fetch options
 * @returns {Promise} - API response data
 */
export const apiRequest = async (endpoint, options = {}) => {
  // Choose between proxy or direct API call based on configuration
  const fullEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = USE_PROXY
    ? `${PROXY_URL}?endpoint=${encodeURIComponent(fullEndpoint)}`
    : `${BASE_URL}${fullEndpoint}`;
  
  // Get auth headers (will ensure token exists)
  const authHeaders = await getAuthHeaders();
  
  const config = {
    method: options.method || 'GET',
    headers: {
      ...authHeaders,
      ...options.headers,
    },
  };

  // Add body for POST/PUT requests
  if (options.body) {
    config.body = options.body;
  }

  // Handle user token expiration (public token will be auto-refreshed)
  if (isTokenExpired() && getToken()) {
    removeToken();
  }

  try {
    const response = await fetch(url, config);
    
    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      // Clear user token if it exists (automatically switch to guest mode)
      removeToken();
      // Clear public token to force refresh from GetToken API
      removePublicToken();
      // Clear the promise cache to allow new token fetch
      publicTokenPromise = null;
      
      // Automatically get fresh guest token from GetToken API and retry
      // This ensures seamless transition to guest mode without showing error to user
      try {
      const freshToken = await ensurePublicToken();
      if (freshToken) {
          // Retry the original request with fresh guest token
        const retryConfig = {
          method: options.method || 'GET',
          headers: {
              'Content-Type': 'application/json',
            'Authorization': `Bearer ${freshToken}`,
            ...options.headers,
          },
        };
        if (options.body) {
          retryConfig.body = options.body;
        }
          
        const retryResponse = await fetch(url, retryConfig);
          
          // If retry succeeds (even if it's a different error, not 401), return it
          // This allows the app to continue in guest mode
          if (retryResponse.status !== 401) {
            return await handleResponse(retryResponse);
          }
          
          // If we still get 401, the endpoint might require authentication
          // In this case, we'll let handleResponse process it (it might be a valid error)
          // But we've already switched to guest mode, so user can continue
        return await handleResponse(retryResponse);
      }
      } catch (tokenError) {
        console.error('Error refreshing guest token:', tokenError);
        // If token refresh fails, try to continue anyway
        // The ensurePublicToken should have logged the error
      }
      
      // If we couldn't get a fresh token, try one final retry
      // This handles edge cases where token refresh had issues
      try {
        publicTokenPromise = null; // Clear cache again
        const finalToken = await ensurePublicToken();
        if (finalToken) {
          const finalRetryConfig = {
            method: options.method || 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${finalToken}`,
              ...options.headers,
            },
          };
          if (options.body) {
            finalRetryConfig.body = options.body;
          }
          const finalRetryResponse = await fetch(url, finalRetryConfig);
          return await handleResponse(finalRetryResponse);
        }
      } catch (finalError) {
        console.error('Final token refresh attempt failed:', finalError);
      }
      
      // If all retries fail, the API might be down or there's a real issue
      // But we've already switched to guest mode, so throw a generic error
      // The calling code can handle this appropriately
      throw new APIError(
        'Unable to complete request. Please try again.',
        401
      );
    }
    
    return await handleResponse(response);
  } catch (error) {
    handleError(error);
    throw error;
  }
};

/**
 * GET request
 * @param {string} endpoint - API endpoint
 * @param {object} params - Query parameters
 * @returns {Promise} - API response data
 */
export const get = async (endpoint, params = {}) => {
  // Build endpoint with query parameters
  let fullEndpoint = endpoint;
  const queryString = new URLSearchParams(params).toString();
  if (queryString) {
    fullEndpoint = `${endpoint}${endpoint.includes('?') ? '&' : '?'}${queryString}`;
  }
  
  return apiRequest(fullEndpoint, {
    method: 'GET',
  });
};

/**
 * POST request
 * @param {string} endpoint - API endpoint
 * @param {object} data - Request body data
 * @returns {Promise} - API response data
 */
export const post = async (endpoint, data = {}) => {
  const options = {
    method: 'POST',
  };
  
  // Only include body if data is provided and not empty
  // Some APIs (like RegisterUser) expect empty body (not "{}")
  if (data !== null && data !== undefined) {
    if (typeof data === 'object' && Object.keys(data).length > 0) {
      options.body = JSON.stringify(data);
    } else if (typeof data !== 'object') {
      // For non-object data (string, number, etc.), stringify it
      options.body = JSON.stringify(data);
    }
    // If data is an empty object {} or null/undefined, don't include body
  }
  
  return apiRequest(endpoint, options);
};

/**
 * PUT request
 * @param {string} endpoint - API endpoint
 * @param {object} data - Request body data
 * @returns {Promise} - API response data
 */
export const put = async (endpoint, data = {}) => {
  return apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * DELETE request
 * @param {string} endpoint - API endpoint
 * @returns {Promise} - API response data
 */
export const del = async (endpoint) => {
  return apiRequest(endpoint, {
    method: 'DELETE',
  });
};

export default {
  get,
  post,
  put,
  delete: del,
  BASE_URL,
};

