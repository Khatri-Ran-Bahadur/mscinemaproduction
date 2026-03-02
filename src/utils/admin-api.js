/**
 * Admin API Helper
 * Automatically handles token injection for admin requests
 */

export const adminFetch = async (url, options = {}) => {
  const token = localStorage.getItem('adminToken');
  
  // Don't set Content-Type if we're sending FormData (browser handles it with boundary)
  const isFormData = options.body instanceof FormData;
  
  const headers = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  // BASE APP URL for server-side calls
  const APP_URL = (process.env.NEXT_PUBLIC_BASE_URL || 'https://www.mscinemas.my').replace(/\/$/, '');
  const isServer = typeof window === 'undefined';
  
  // Ensure url is absolute on server side
  const fetchUrl = (isServer && !url.startsWith('http')) 
    ? `${APP_URL}${url.startsWith('/') ? '' : '/'}${url}`
    : url;

  const response = await fetch(fetchUrl, config);

  if (response.status === 401) {
    // Handle unauthorized access (e.g., redirect to login)
    localStorage.removeItem('adminToken');
    window.location.href = '/admin/login';
    return null;
  }

  return response;
};
