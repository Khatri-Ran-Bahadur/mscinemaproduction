/**
 * Centralized Security Utilities
 * Handles input sanitization, HTML escaping, and validation to prevent XSS and other injection attacks.
 */

/**
 * Strips all HTML tags and script content from a string.
 * Use this when you want pure text output and want to be absolutely sure no HTML is rendered.
 * @param {string} input - The string to sanitize
 * @returns {string} - The sanitized string
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove <script>...</script>
    .replace(/<[^>]*>/g, '') // Remove any remaining HTML tags
    .trim();
}

/**
 * Escapes special characters to their HTML entities.
 * Use this when you want to display user-provided text safely within an HTML context.
 * @param {string} text - The string to escape
 * @returns {string} - The escaped string
 */
export function escapeHtml(text) {
  if (typeof text !== 'string') return text;
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };
  return text.replace(/[&<>"'/`=]/g, m => map[m]);
}

/**
 * Checks if a string contains suspicious patterns that might indicate an XSS attempt.
 * @param {string} input - The string to check
 * @returns {boolean} - True if suspicious patterns are detected
 */
export function hasSuspiciousPatterns(input) {
  if (typeof input !== 'string') return false;
  
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick=, onload=, etc.
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<applet/i,
    /<meta/i,
    /<link/i,
    /<style/i,
    /eval\(/i,
    /document\./i,
    /window\./i,
    /cookie/i
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(input));
}

/**
 * Combined sanitization and validation for API inputs.
 * @param {Object} data - The input data object
 * @param {Array<string>} fields - The fields to process
 * @returns {Object} - Object with 'sanitizedData' and 'isValid'
 */
export function processSecureInput(data, fields) {
  const sanitizedData = { ...data };
  let isValid = true;
  
  for (const field of fields) {
    if (data[field]) {
      const value = data[field];
      if (hasSuspiciousPatterns(value)) {
        isValid = false;
        break;
      }
      sanitizedData[field] = sanitizeInput(value);
    }
  }
  
  return { sanitizedData, isValid };
}
