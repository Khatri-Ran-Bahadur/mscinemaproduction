/**
 * Utility functions for date and time handling
 * Especially focusing on Malaysia Time (MYT) synchronization
 */

/**
 * Get current time in Malaysia (Asia/Kuala_Lumpur) as a Date object
 * @returns {Date} Date object representing current time in MYT
 */
export const getMalaysiaDate = () => {
  const now = new Date();
  const mytString = now.toLocaleString("en-US", {timeZone: "Asia/Kuala_Lumpur"});
  return new Date(mytString);
};

/**
 * Format a Date object to Malaysia Time string
 * @param {Date} date 
 * @returns {string} Formatted string
 */
export const formatMalaysiaTime = (date) => {
  return date.toLocaleString("en-US", {
    timeZone: "Asia/Kuala_Lumpur",
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

/**
 * Check if a timestamp is expired based on Malaysia time
 * @param {number|string} startTime Timestamp in milliseconds or ISO string
 * @param {number} durationMinutes Duration in minutes
 * @returns {boolean} True if expired
 */
export const isExpiredMYT = (startTime, durationMinutes) => {
  if (!startTime) return true;
  
  const start = new Date(parseInt(startTime));
  const now = new Date(); // Browser local time
  
  // For frontend timers, we usually care about elapsed "wall clock" time 
  // which is independent of timezone if we compare Date.now() to Date.now() stored previously.
  // But if startTime implies a server timestamp in MYT, we need care.
  
  // Assumption: startTime was stored using Date.now() on the client
  // So we just compare with Date.now()
  const elapsed = (now.getTime() - start.getTime()) / (1000 * 60);
  return elapsed > durationMinutes;
};
