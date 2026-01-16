/**
 * Booking details storage for payment callbacks
 * Stores booking details temporarily so they can be retrieved during payment callbacks
 */

import fs from 'fs';
import path from 'path';

const STORAGE_DIR = path.join(process.cwd(), 'temp', 'booking-details');

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

/**
 * Store booking details for an order
 */
export function storeBookingDetails(orderid, details) {
  try {
    const filePath = path.join(STORAGE_DIR, `${orderid}.json`);
    const data = {
      orderid,
      ...details,
      timestamp: new Date().toISOString(),
    };
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`[Booking Storage] Stored booking details for ${orderid}`);
    return true;
  } catch (error) {
    console.error(`[Booking Storage] Failed to store booking details for ${orderid}:`, error);
    return false;
  }
}

/**
 * Retrieve booking details for an order
 */
export function getBookingDetails(orderid) {
  try {
    const filePath = path.join(STORAGE_DIR, `${orderid}.json`);
    if (!fs.existsSync(filePath)) {
      console.warn(`[Booking Storage] No booking details found for ${orderid}`);
      return null;
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(`[Booking Storage] Retrieved booking details for ${orderid}`);
    return data;
  } catch (error) {
    console.error(`[Booking Storage] Failed to retrieve booking details for ${orderid}:`, error);
    return null;
  }
}

/**
 * Delete booking details for an order (cleanup after successful processing)
 */
export function deleteBookingDetails(orderid) {
  try {
    const filePath = path.join(STORAGE_DIR, `${orderid}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[Booking Storage] Deleted booking details for ${orderid}`);
    }
    return true;
  } catch (error) {
    console.error(`[Booking Storage] Failed to delete booking details for ${orderid}:`, error);
    return false;
  }
}

/**
 * Clean up old booking details (older than 24 hours)
 */
export function cleanupOldBookingDetails() {
  try {
    const files = fs.readdirSync(STORAGE_DIR);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    let cleaned = 0;
    for (const file of files) {
      const filePath = path.join(STORAGE_DIR, file);
      const stats = fs.statSync(filePath);
      const age = now - stats.mtimeMs;
      
      if (age > maxAge) {
        fs.unlinkSync(filePath);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`[Booking Storage] Cleaned up ${cleaned} old booking details`);
    }
    return cleaned;
  } catch (error) {
    console.error('[Booking Storage] Failed to cleanup old booking details:', error);
    return 0;
  }
}
