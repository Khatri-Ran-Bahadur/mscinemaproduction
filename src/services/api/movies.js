/**
 * Movies API Service
 * Handles movie-related API calls
 */

import { get } from './client';

/**
 * Movie interface structure from API
 * @typedef {Object} Movie
 * @property {number} movieID - Movie ID
 * @property {string} movieName - Movie name
 * @property {string} language - Movie language
 * @property {string} rating - Age rating
 * @property {string} type - Movie type (2D, 3D, ATMOS, etc.)
 * @property {string} duration - Movie duration
 * @property {string} genre - Movie genre
 * @property {string} cast - Movie cast
 * @property {string} director - Movie director
 * @property {string} synopsis - Movie synopsis
 * @property {string} releaseDate - Release date
 * @property {string} officialUrl - Official URL
 * @property {string} imageURL - Movie poster image URL
 * @property {string} trailerUrl - Trailer YouTube URL
 * @property {string} showType - Show type
 * @property {string} remarks - Additional remarks
 */

// Module-level cache for movies promise
let moviesPromise = null;

/**
 * Get all movies
 * @returns {Promise<Array<Movie>>} - Array of movies
 */
export const getMovies = async () => {
  // If a request is already in progress, return the existing promise
  if (moviesPromise) {
    return moviesPromise;
  }

  moviesPromise = (async () => {
    try {
      const response = await get('/MovieDetails/GetMovies');
      
      // Handle different response formats
      let data = [];
      if (Array.isArray(response)) {
        data = response;
      } else if (response && response.data) {
        data = response.data;
      } else if (response && response.movies) {
        data = response.movies;
      } else {
        data = response || [];
      }
      return data;
    } catch (error) {
      console.error('Get movies error:', error);
      // Reset promise so next call can retry
      moviesPromise = null;
      return [];
    }
  })();

  return moviesPromise;
};

export default {
  getMovies,
};

