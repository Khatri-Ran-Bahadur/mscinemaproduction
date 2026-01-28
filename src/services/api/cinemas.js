/**
 * Cinemas API Service
 * Handles cinema location-related API calls
 */

import { get } from './client';

/**
 * Get all cinemas
 * @returns {Promise<Array>} - Array of cinema locations
 */
export const getCinemas = async () => {
  try {
    const response = await get('/CinemaLocation/GetCinemas');
    
    // Handle different response formats
    if (Array.isArray(response)) {
      return response;
    }
    
    if (response && response.data) {
      return response.data;
    }
    
    if (response && response.cinemas) {
      return response.cinemas;
    }
    
    return response || [];
  } catch (error) {
    console.error('Get cinemas error:', error);
    return [];
    throw error;
  }
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

