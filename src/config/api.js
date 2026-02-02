/**
 * Centralized API Configuration
 * All API URLs and settings are managed from environment variables
 */

// API Environment (test or live)
export const USE_LIVE_API = process.env.NEXT_PUBLIC_USE_LIVE_API === 'true' || process.env.USE_LIVE_API === 'true';

// API URLs
export const TEST_API_URL = process.env.NEXT_PUBLIC_TEST_API_URL || process.env.TEST_API_URL || 'http://cinemaapi5.ddns.net/api';
export const LIVE_API_URL = process.env.NEXT_PUBLIC_LIVE_API_URL || process.env.LIVE_API_URL || 'https://apiv5.mscinemas.my/api';
export const API_BASE_URL = USE_LIVE_API ? LIVE_API_URL : TEST_API_URL;

// Guest Token Credentials
export const TEST_GUEST_CREDENTIALS = {
  UserName: process.env.NEXT_PUBLIC_TEST_USERNAME || process.env.TEST_USERNAME || 'Admin',
  UserPassword: process.env.NEXT_PUBLIC_TEST_PASSWORD || process.env.TEST_PASSWORD || 'Admin@11'
};

export const LIVE_GUEST_CREDENTIALS = {
  UserName: process.env.NEXT_PUBLIC_LIVE_USERNAME || process.env.LIVE_USERNAME || 'ONlineMS',
  UserPassword: process.env.NEXT_PUBLIC_LIVE_PASSWORD || process.env.LIVE_PASSWORD || 'cMSol@81'
};

export const GUEST_CREDENTIALS = USE_LIVE_API ? LIVE_GUEST_CREDENTIALS : TEST_GUEST_CREDENTIALS;

// Proxy Configuration
// IMPORTANT: Default to false (direct calls) for better performance
// Only use proxy if explicitly set to 'true' in environment variables
const useProxyEnv = process.env.NEXT_PUBLIC_USE_PROXY || process.env.USE_PROXY;
// Explicitly default to false if not set or not 'true'
export const USE_PROXY = useProxyEnv === 'true';
export const PROXY_URL = process.env.NEXT_PUBLIC_PROXY_URL || process.env.PROXY_URL || '/api/proxy';

// Debug logging (only in development)
// if (process.env.NODE_ENV === 'development') {
//   const isServer = typeof window === 'undefined';
//   const logPrefix = isServer ? '[API Config - Server]' : '[API Config - Client]';
//   console.log(logPrefix, {
//     USE_LIVE_API,
//     API_BASE_URL,
//     USE_PROXY,
//     PROXY_URL,
//     'Using Proxy?': USE_PROXY,
//     'Direct Calls?': !USE_PROXY,
//     env: {
//       NEXT_PUBLIC_USE_PROXY: process.env.NEXT_PUBLIC_USE_PROXY,
//       USE_PROXY: process.env.USE_PROXY,
//       'Raw Value': useProxyEnv,
//     }
//   });
// }

// Export configuration object for easy access
export const API_CONFIG = {
  USE_LIVE_API,
  TEST_API_URL,
  LIVE_API_URL,
  API_BASE_URL,
  TEST_GUEST_CREDENTIALS,
  LIVE_GUEST_CREDENTIALS,
  GUEST_CREDENTIALS,
  USE_PROXY,
  PROXY_URL,
  API_SECRET_KEY: process.env.NEXT_PUBLIC_API_SECRET_KEY
};

export default API_CONFIG;
