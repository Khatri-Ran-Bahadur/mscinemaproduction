/**
 * Shows API Service
 * Handles show times, seat layouts, and ticket pricing
 */

import { get } from './client';

// Module-level cache for show dates promise
let showDatesPromise = null;

/**
 * Get show dates
 * @returns {Promise<Array>} - Array of show dates with movieID and cinemaID
 */
export const getShowDates = async () => {
  // If a request is already in progress, return the existing promise
  if (showDatesPromise) {
    return showDatesPromise;
  }

  showDatesPromise = (async () => {
    try {
      const response = await get('/ShowDetails/GetShowDates');
      
      // Handle different response formats
      let data = [];
      if (Array.isArray(response)) {
        data = response;
      } else if (response && response.data) {
        data = response.data;
      } else if (response && response.showDates) {
        data = response.showDates;
      } else {
        data = response || [];
      }
      return data;
    } catch (error) {
      console.error('Get show dates error:', error);
      // Reset promise so next call can retry
      showDatesPromise = null;
      throw error;
    }
  })();

  return showDatesPromise;
};

/**
 * Get show times for a cinema
 * @param {number|string} cinemaId - Cinema ID
 * @returns {Promise<Array>} - Array of show times
 */
export const getShowTimes = async (cinemaId) => {
  try {
    const response = await get(`/ShowDetails/GetShowTimes/${cinemaId}`);
    
    // Handle different response formats
    if (Array.isArray(response)) {
      return response;
    }
    
    if (response && response.data) {
      return response.data;
    }
    
    if (response && response.showTimes) {
      return response.showTimes;
    }
    
    return response || [];
  } catch (error) {
    console.error('Get show times error:', error);
    throw error;
  }
};

/**
 * Get configuration and ticket price for a show
 * @param {number|string} cinemaId - Cinema ID
 * @param {number|string} showId - Show ID
 * @returns {Promise<object>} - Configuration and ticket prices
 */
export const getConfigAndTicketPrice = async (cinemaId, showId) => {
  try {
    const response = await get(`/ShowDetails/GetConfiqAndTicketPrice/${cinemaId}/${showId}`);
    return response;
  } catch (error) {
    console.error('Get config and ticket price error:', error);
    throw error;
  }
};

/**
 * Get seat layout and properties for a show
 * @param {number|string} cinemaId - Cinema ID
 * @param {number|string} showId - Show ID
 * @returns {Promise<object>} - Seat layout and properties
 */
export const getSeatLayoutAndProperties = async (cinemaId, showId) => {
  try {
    const response = await get(`/ShowDetails/GetSeatLayoutAndProperties/${cinemaId}/${showId}`);
    return response;
  } catch (error) {
    console.error('Get seat layout error:', error);
    throw error;
  }
};

export default {
  getShowDates,
  getShowTimes,
  getConfigAndTicketPrice,
  getSeatLayoutAndProperties,
};

