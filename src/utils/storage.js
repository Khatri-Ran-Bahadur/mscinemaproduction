/**
 * Storage utility for managing token and user data
 * Uses localStorage with error handling
 */

const STORAGE_KEYS = {
  TOKEN: 'ms_cinema_token',
  TOKEN_EXPIRATION: 'ms_cinema_token_expiration',
  PUBLIC_TOKEN: 'ms_cinema_public_token',
  PUBLIC_TOKEN_EXPIRATION: 'ms_cinema_public_token_expiration',
  USER_DATA: 'ms_cinema_user_data',
};

/**
 * Get item from localStorage
 * @param {string} key - Storage key
 * @returns {string|null} - Stored value or null
 */
export const getStorageItem = (key) => {
  try {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Error getting storage item ${key}:`, error);
    return null;
  }
};

/**
 * Set item in localStorage
 * @param {string} key - Storage key
 * @param {string} value - Value to store
 */
export const setStorageItem = (key, value) => {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, value);
  } catch (error) {
    console.error(`Error setting storage item ${key}:`, error);
  }
};

/**
 * Remove item from localStorage
 * @param {string} key - Storage key
 */
export const removeStorageItem = (key) => {
  try {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing storage item ${key}:`, error);
  }
};

/**
 * Clear all storage items
 */
export const clearStorage = () => {
  try {
    if (typeof window === 'undefined') return;
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
};

/**
 * Get stored token
 * @returns {string|null} - Token or null
 */
export const getToken = () => {
  return getStorageItem(STORAGE_KEYS.TOKEN);
};

/**
 * Set token and expiration
 * @param {string} token - JWT token
 * @param {string} expiration - Token expiration date
 */
export const setToken = (token, expiration) => {
  setStorageItem(STORAGE_KEYS.TOKEN, token);
  if (expiration) {
    setStorageItem(STORAGE_KEYS.TOKEN_EXPIRATION, expiration);
  }
};

/**
 * Remove token
 */
export const removeToken = () => {
  removeStorageItem(STORAGE_KEYS.TOKEN);
  removeStorageItem(STORAGE_KEYS.TOKEN_EXPIRATION);
};

/**
 * Check if token is expired
 * @param {boolean} isPublic - Check public token instead of user token
 * @returns {boolean} - True if token is expired or missing
 */
export const isTokenExpired = (isPublic = false) => {
  const expirationKey = isPublic 
    ? STORAGE_KEYS.PUBLIC_TOKEN_EXPIRATION 
    : STORAGE_KEYS.TOKEN_EXPIRATION;
  const expiration = getStorageItem(expirationKey);
  if (!expiration) return true;
  
  try {
    const expirationDate = new Date(expiration);
    return expirationDate < new Date();
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};

/**
 * Get stored public token
 * @returns {string|null} - Public token or null
 */
export const getPublicToken = () => {
  return getStorageItem(STORAGE_KEYS.PUBLIC_TOKEN);
};

/**
 * Set public token and expiration
 * @param {string} token - JWT token
 * @param {string} expiration - Token expiration date
 */
export const setPublicToken = (token, expiration) => {
  setStorageItem(STORAGE_KEYS.PUBLIC_TOKEN, token);
  if (expiration) {
    setStorageItem(STORAGE_KEYS.PUBLIC_TOKEN_EXPIRATION, expiration);
  }
};

/**
 * Remove public token
 */
export const removePublicToken = () => {
  removeStorageItem(STORAGE_KEYS.PUBLIC_TOKEN);
  removeStorageItem(STORAGE_KEYS.PUBLIC_TOKEN_EXPIRATION);
};

/**
 * Get user data
 * @returns {object|null} - User data or null
 */
export const getUserData = () => {
  const userData = getStorageItem(STORAGE_KEYS.USER_DATA);
  if (!userData) return null;
  
  try {
    return JSON.parse(userData);
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

/**
 * Set user data
 * @param {object} userData - User data object
 */
export const setUserData = (userData) => {
  setStorageItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
};

/**
 * Remove user data
 */
export const removeUserData = () => {
  removeStorageItem(STORAGE_KEYS.USER_DATA);
};

export { STORAGE_KEYS };

