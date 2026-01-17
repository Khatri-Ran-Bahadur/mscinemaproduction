
/**
 * Returns a human-readable string representing time elapsed since the given date.
 * Formats: "1s ago", "2m ago", "3h ago", "4d ago", "1M ago", "1y ago"
 * @param {string|Date} date - The date to format
 * @returns {string} - Formatted time ago string
 */
export function timeAgo(date) {
  if (!date) return '';

  const now = new Date();
  let past;

  // Handle "dd-MM-yyyy HH:mm:ss" specific custom format if needed, 
  // but usually better to rely on standard Date parsing if possible or specific logic.
  // Since we have varied inputs, let's try standard constructor first.
  if (typeof date === 'string' && date.includes('-') && date.includes(':') && date.split(' ')[0].length === 10 && date.split(' ')[0].split('-')[2].length === 4) {
      // Possible "dd-MM-yyyy HH:mm:ss" format: 17-01-2025 12:00:00
      // Date constructor expects "yyyy-MM-dd", so we might need to flip it if it defaults to dd-mm-yyyy in browser? 
      // Actually standard parsing is tricky for dd-mm-yyyy.
      // Let's implement a quick heuristic parser for that specific format used in half-way-bookings.
      const [dPart, tPart] = date.split(' ');
      if (dPart && tPart) {
          const [d, m, y] = dPart.split('-');
          if (d && m && y && y.length === 4) {
               // Assuming the string input "dd-MM-yyyy HH:mm:ss" is in Malaysian Time (MYT, +08:00)
               past = new Date(`${y}-${m}-${d}T${tPart}+08:00`);
          }
      }
  }
  
  if (!past || isNaN(past.getTime())) {
      past = new Date(date);
  }

  if (isNaN(past.getTime())) return '-';

  const diffMs = now - past;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 60) return `${Math.max(0, diffSec)}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 30) return `${diffDay}d ago`;
  if (diffMonth < 12) return `${diffMonth}mo ago`;
  return `${diffYear}y ago`;
}
