/**
 * Simple encryption/decryption utility for URL parameters
 * Uses a combination of base64 encoding and a simple cipher for security
 */

const SECRET_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'ms-cinema-secret-key-2024';

/**
 * Encrypt an ID
 * @param {string|number} id - The ID to encrypt
 * @returns {string} Encrypted string
 */
export function encryptId(id) {
  if (!id) return '';
  
  try {
    const idStr = String(id);
    // Add timestamp for uniqueness (optional, can remove if you want same ID to encrypt to same value)
    // For now, we'll keep it simple and deterministic
    const combined = `${idStr}:${SECRET_KEY}`;
    
    // Simple XOR cipher with key
    let encrypted = '';
    for (let i = 0; i < idStr.length; i++) {
      const keyChar = SECRET_KEY[i % SECRET_KEY.length];
      const encryptedChar = String.fromCharCode(idStr.charCodeAt(i) ^ keyChar.charCodeAt(0));
      encrypted += encryptedChar;
    }
    
    // Base64 encode
    const base64 = btoa(encrypted);
    
    // Replace URL-unsafe characters
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  } catch (error) {
    console.error('Encryption error:', error);
    return String(id); // Fallback to original ID
  }
}

/**
 * Decrypt an encrypted ID
 * @param {string} encryptedId - The encrypted ID to decrypt
 * @returns {string} Decrypted ID
 */
export function decryptId(encryptedId) {
  if (!encryptedId) return '';
  
  try {
    // Restore URL-safe characters
    const base64 = encryptedId.replace(/-/g, '+').replace(/_/g, '/');
    
    // Add padding if needed
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    
    // Base64 decode
    const encrypted = atob(padded);
    
    // Simple XOR decipher with key
    let decrypted = '';
    for (let i = 0; i < encrypted.length; i++) {
      const keyChar = SECRET_KEY[i % SECRET_KEY.length];
      const decryptedChar = String.fromCharCode(encrypted.charCodeAt(i) ^ keyChar.charCodeAt(0));
      decrypted += decryptedChar;
    }
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    // Try to return as-is if it's not encrypted (for backward compatibility)
    return encryptedId;
  }
}

/**
 * Encrypt multiple IDs for URL
 * @param {Object} params - Object with IDs to encrypt {movieId, cinemaId, showId}
 * @returns {Object} Object with encrypted IDs
 */
export function encryptIds(params) {
  const encrypted = {};
  if (params.movieId) encrypted.movieId = encryptId(params.movieId);
  if (params.cinemaId) encrypted.cinemaId = encryptId(params.cinemaId);
  if (params.showId) encrypted.showId = encryptId(params.showId);
  return encrypted;
}

/**
 * Decrypt multiple IDs from URL
 * @param {Object} params - Object with encrypted IDs {movieId, cinemaId, showId}
 * @returns {Object} Object with decrypted IDs
 */
export function decryptIds(params) {
  const decrypted = {};
  if (params.movieId) decrypted.movieId = decryptId(params.movieId);
  if (params.cinemaId) decrypted.cinemaId = decryptId(params.cinemaId);
  if (params.showId) decrypted.showId = decryptId(params.showId);
  return decrypted;
}

