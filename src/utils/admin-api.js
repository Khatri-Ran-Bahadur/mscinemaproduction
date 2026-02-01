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

  const response = await fetch(url, config);

  if (response.status === 401) {
    // Handle unauthorized access (e.g., redirect to login)
    localStorage.removeItem('adminToken');
    window.location.href = '/admin/login';
    return null;
  }

  return response;
};
