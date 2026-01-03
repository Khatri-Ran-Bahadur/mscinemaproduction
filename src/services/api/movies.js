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

/**
 * Get all movies
 * @returns {Promise<Array<Movie>>} - Array of movies
 */
export const getMovies = async () => {
  try {
    const response = await get('/MovieDetails/GetMovies');
    
    // Handle different response formats
    if (Array.isArray(response)) {
      return response;
    }
    
    if (response && response.data) {
      return response.data;
    }
    
    if (response && response.movies) {
      return response.movies;
    }
    
    return response || [];
  } catch (error) {
    console.error('Get movies error:', error);
    throw error;
  }
};

export default {
  getMovies,
};

