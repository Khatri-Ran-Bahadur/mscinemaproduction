/**
 * Cinemas API Service
 * Handles cinema location-related API calls
 */

import { get } from './client';

// Module-level cache for cinemas promise
let cinemasPromise = null;

/**
 * Get all cinemas
 * @returns {Promise<Array>} - Array of cinema locations
 */
export const getCinemas = async () => {
  // If a request is already in progress, return the existing promise
  if (cinemasPromise) {
    return cinemasPromise;
  }

  cinemasPromise = (async () => {
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
      cinemasPromise = null;
      return [];
    }
  })();

  return cinemasPromise;
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

