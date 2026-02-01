/**
 * Shows API Service
 * Handles show times, seat layouts, and ticket pricing
 */

import { get } from './client';

// Access or initialize global storage to share across module instances
const globalScope = typeof window !== 'undefined' ? window : global;
if (!globalScope._ms_api_cache) {
  globalScope._ms_api_cache = {};
}
if (!globalScope._ms_api_cache.showTimesPromises) {
  globalScope._ms_api_cache.showTimesPromises = new Map();
}

const getCache = () => globalScope._ms_api_cache;

/**
 * Get show dates
 * @returns {Promise<Array>} - Array of show dates with movieID and cinemaID
 */
export const getShowDates = async () => {
  const cache = getCache();
  // If a request is already in progress, return the existing promise
  if (cache.showDatesPromise) {
    return cache.showDatesPromise;
  }

  cache.showDatesPromise = (async () => {
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
      setTimeout(() => {
        cache.showDatesPromise = null;
      }, 5000);
      throw error;
    }
  })();

  return cache.showDatesPromise;
};

/**
 * Get show times for a cinema
 * @param {number|string} cinemaId - Cinema ID
 * @returns {Promise<Array>} - Array of show times
 */
export const getShowTimes = async (cinemaId) => {
  // 1. Validate cinemaId - prevent calls to /undefined or /null (including string versions)
  if (!cinemaId || cinemaId === 'undefined' || cinemaId === 'null') {
    console.warn('[Shows Service] getShowTimes blocked an invalid call without a proper cinemaId:', cinemaId);
    return [];
  }

  // 2. Normalize to string for Map key consistency
  const cid = String(cinemaId);
  const cache = getCache();

  // 3. Return existing promise if available (Deduplication)
  if (cache.showTimesPromises.has(cid)) {
    console.log(`[Shows Service] Returning cached promise for cinema: ${cid}`);
    return cache.showTimesPromises.get(cid);
  }

  const promise = (async () => {
    try {
      console.log(`[Shows Service] Fetching show times for cinema: ${cid}`);
      const response = await get(`/ShowDetails/GetShowTimes/${cid}`);
      
      // Handle different response formats
      let data = [];
      if (Array.isArray(response)) {
        data = response;
      } else if (response && response.data) {
        data = response.data;
      } else if (response && response.showTimes) {
        data = response.showTimes;
      } else {
        data = response || [];
      }
      return data;
    } catch (error) {
      console.error(`[Shows Service] Error fetching show times for ${cid}:`, error);
      // Reset promise after a bit so next call can retry
      setTimeout(() => {
        cache.showTimesPromises.delete(cid);
      }, 5000);
      throw error;
    }
  })();

  // SET IMMEDIATELY to prevent race conditions from simultaneous calls
  cache.showTimesPromises.set(cid, promise);
  return promise;
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

