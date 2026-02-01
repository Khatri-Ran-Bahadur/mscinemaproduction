/**
 * Cinemas API Service
 * Handles cinema location-related API calls
 */

import { get } from './client';

// Access or initialize global storage to share across module instances
const globalScope = typeof window !== 'undefined' ? window : global;
if (!globalScope._ms_api_cache) {
  globalScope._ms_api_cache = {};
}

/**
 * Get all cinemas
 * @returns {Promise<Array>} - Array of cinema locations
 */
export const getCinemas = async () => {
  const cache = globalScope._ms_api_cache;
  
  // If a request is already in progress, return the existing promise
  if (cache.cinemasPromise) {
    return cache.cinemasPromise;
  }

  cache.cinemasPromise = (async () => {
    try {
      const response = await get('/CinemaLocation/GetCinemas');
      
      // Handle different response formats
      let data = [];
      if (Array.isArray(response)) {
        data = response;
      } else if (response && response.data) {
        data = response.data;
      } else if (response && response.cinemas) {
        data = response.cinemas;
      } else {
        data = response || [];
      }
      return data;
    } catch (error) {
      console.error('Get cinemas error:', error);
      // Reset promise so next call can retry
      setTimeout(() => {
        cache.cinemasPromise = null;
      }, 5000);
      return [];
    }
  })();

  return cache.cinemasPromise;
};

/**
 * Get cinema by ID
 * @param {number|string} cinemaId - Cinema ID
 * @returns {Promise<object>} - Cinema details
 */
export const getCinemaById = async (cinemaId) => {
  try {
    const response = await get(`/CinemaLocation/GetCinema/${cinemaId}`);
    return response;
  } catch (error) {
    console.error('Get cinema by ID error:', error);
    throw error;
  }
};

export default {
  getCinemas,
  getCinemaById,
};

