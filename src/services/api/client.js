import { 
  getToken, 
  isTokenExpired, 
  removeToken, 
  getPublicToken, 
  isTokenExpired as isPublicTokenExpired, 
  setPublicToken, 
  removePublicToken, 
  setToken,
  getStorageItem,
  STORAGE_KEYS
} from '@/utils/storage';
import { API_CONFIG } from '@/config/api';

// API Configuration from centralized config
const {
  USE_LIVE_API,
  API_BASE_URL: BASE_URL,
  GUEST_CREDENTIALS,
  USE_PROXY,
  PROXY_URL,
} = API_CONFIG;

// Access or initialize global storage to share across module instances
const globalScope = typeof window !== 'undefined' ? window : global;
if (!globalScope._ms_api_cache) {
  globalScope._ms_api_cache = {};
}

// Ensure the specific keys exist for token management
const cache = globalScope._ms_api_cache;
if (cache.publicTokenPromise === undefined) cache.publicTokenPromise = null;
if (cache.memoizedPublicToken === undefined) cache.memoizedPublicToken = null;
if (cache.memoizedTokenExpiration === undefined) cache.memoizedTokenExpiration = null;

const getCache = () => globalScope._ms_api_cache;

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
  const cache = getCache();

  // 1. Check user token (stored in localStorage)
  const userToken = getToken();
  if (userToken && !isTokenExpired()) {
    return userToken;
  }

  // 2. Check in-memory memoization (shared globally)
  if (cache.memoizedPublicToken && cache.memoizedTokenExpiration) {
    const expirationDate = new Date(cache.memoizedTokenExpiration);
    // Add 30s buffer for safety
    if (expirationDate > new Date(Date.now() + 30000)) {
      return cache.memoizedPublicToken;
    }
  }

  // 3. Check localStorage fallback (in case of page refresh)
  let publicToken = getPublicToken();
  if (publicToken && !isPublicTokenExpired(true)) {
    cache.memoizedPublicToken = publicToken;
    cache.memoizedTokenExpiration = getStorageItem(STORAGE_KEYS.PUBLIC_TOKEN_EXPIRATION);
    return publicToken;
  }

  // 4. Fetch new public token
  try {
    // Only fetch if a promise is not already in progress
    if (!cache.publicTokenPromise) {
      const tokenUrl = USE_PROXY 
        ? `${PROXY_URL}?endpoint=/APIUser/GetToken`
        : `${BASE_URL}/APIUser/GetToken`;
      
      // Requesting fresh public token...
      
      cache.publicTokenPromise = (async () => {
        try {
          const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(GUEST_CREDENTIALS),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to get public token: ${response.status} ${errorText}`);
          }

          const data = await response.json();
          const token = data?.token || data?.Token || data?.accessToken || data?.access_token;
          const expiration = data?.expiration || data?.Expiration || data?.expiresIn || data?.expires_in;
          
          if (token) {
            let tokenExpiration = expiration;
            if (!tokenExpiration) {
              const oneHourFromNow = new Date();
              oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);
              tokenExpiration = oneHourFromNow.toISOString();
            }
            // Update global cache and localStorage
            setPublicToken(token, tokenExpiration);
            cache.memoizedPublicToken = token;
            cache.memoizedTokenExpiration = tokenExpiration;
            return token;
          }
          throw new Error('Token not found in response');
        } catch (err) {
          console.error('[API Client] Token fetch error:', err);
          throw err;
        } finally {
          // Keep promise for a bit to deduplicate near-simultaneous calls
          setTimeout(() => {
            cache.publicTokenPromise = null;
          }, 2000);
        }
      })();
    } else {
        // Awaiting existing token promise...
    }
    
    return await cache.publicTokenPromise;
  } catch (error) {
    console.error('[API Client] Error in ensurePublicToken:', error);
    cache.publicTokenPromise = null;
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
    'x-api-key': API_CONFIG.API_SECRET_KEY,
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

// Keep track of all pending API requests by their full URL and options
// Initialize pendingRequests map if it doesn't exist in the cache
if (cache.pendingRequests === undefined) {
  cache.pendingRequests = new Map();
}

/**
 * Make API request
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {object} options - Fetch options
 * @returns {Promise} - API response data
 */
export const apiRequest = async (endpoint, options = {}) => {
  const currentCache = getCache();

  // Choose between proxy or direct API call based on configuration
  const fullEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = USE_PROXY
    ? `${PROXY_URL}?endpoint=${encodeURIComponent(fullEndpoint)}`
    : `${BASE_URL}${fullEndpoint}`;
  
  const method = options.method || 'GET';
  // Stringify body for consistent key generation, especially for objects
  const body = options.body ? (typeof options.body === 'object' ? JSON.stringify(options.body) : options.body) : '';
  
  // Create a unique key for this request based on URL, method and body
  const requestKey = `${method}:${url}:${body}`;
  
  // If an identical request is already pending, return its promise (Deduplication)
  if (currentCache.pendingRequests.has(requestKey)) {
    // console.log(`[API Client] Deduplicating pending request: ${method} ${fullEndpoint}`);
    return currentCache.pendingRequests.get(requestKey);
  }

  const requestPromise = (async () => {
    try {
      // Get auth headers (will ensure token exists)
      const authHeaders = await getAuthHeaders();
      
      const config = {
        method,
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

      const response = await fetch(url, config);
      
      // Handle 401 Unauthorized - token expired or invalid
      if (response.status === 401) {
        console.warn(`[API Client] 401 Unauthorized for ${fullEndpoint}. Refreshing token and retrying...`);
        // Clear tokens to force refresh
        removeToken();
        removePublicToken();
        currentCache.publicTokenPromise = null;
        currentCache.memoizedPublicToken = null;
        
        // Automatically get fresh guest token and retry
        const freshToken = await ensurePublicToken();
        if (freshToken) {
          const retryConfig = {
            method,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${freshToken}`,
              ...options.headers,
            },
          };
          if (options.body) retryConfig.body = options.body;
          
          const retryResponse = await fetch(url, retryConfig);
          return await handleResponse(retryResponse);
        }
      }
      
      return await handleResponse(response);
    } catch (error) {
      // handleError throws APIError
      return handleError(error);
    } finally {
      // Clear from pending requests after a small buffer to handle rapid sequential calls
      setTimeout(() => {
        currentCache.pendingRequests.delete(requestKey);
      }, 500);
    }
  })();

  currentCache.pendingRequests.set(requestKey, requestPromise);
  return requestPromise;
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

