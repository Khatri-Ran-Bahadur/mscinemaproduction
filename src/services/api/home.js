/**
 * Home API Service
 * Handles banners, promotions, and experiences for the homepage
 */

// Access or initialize global storage to share across module instances
const globalScope = typeof window !== 'undefined' ? window : global;
if (!globalScope._ms_home_cache) {
  globalScope._ms_home_cache = new Map();
}

const getCache = () => globalScope._ms_home_cache;

/**
 * Generic fetcher with promise caching
 * @param {string} endpoint - API endpoint
 * @returns {Promise<any>}
 */
const fetchWithCache = async (endpoint) => {
  const cache = getCache();
  if (cache.has(endpoint)) {
    return cache.get(endpoint);
  }

  const promise = (async () => {
    try {
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${endpoint}: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      // Reset promise after a bit so next call can retry
      setTimeout(() => {
        cache.delete(endpoint);
      }, 5000);
      throw error;
    }
  })();

  cache.set(endpoint, promise);
  return promise;
};

/**
 * Get active banners
 */
export const getBanners = () => fetchWithCache('/api/banners');

/**
 * Get promotions
 */
export const getPromotions = () => fetchWithCache('/api/admin/promotions');

/**
 * Get experiences
 */
export const getExperiences = () => fetchWithCache('/api/admin/experiences');

/**
 * Get contact info
 */
export const getContactInfo = () => fetchWithCache('/api/contact-info');

export default {
  getBanners,
  getPromotions,
  getExperiences,
  getContactInfo
};
