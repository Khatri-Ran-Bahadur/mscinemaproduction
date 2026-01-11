/**
 * Seat Status Icon Component
 * Displays seat icons for availability status:
 * - Available: Green seat
 * - Selling fast: Yellow seat
 * - Sold out: Red seat
 */

export default function SeatStatusIcon({ status = 'available', className = '' }) {
  const colors = {
    available: '#22C55E', // Green
    'selling-fast': '#FFCA20', // Yellow
    'sold-out': '#C51322' // Red
  };

  const color = colors[status] || colors.available;

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg width="18" height="17" viewBox="0 0 18 17" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path 
          d="M12.5 16.25V10.625H5V16.25C5 16.625 4.75 16.875 4.375 16.875H13.125C12.75 16.875 12.5 16.625 12.5 16.25Z" 
          fill={color}
        />
        <path 
          d="M15.625 6.3125V3C15.625 1.375 14.25 0 12.625 0H4.875C3.25 0 1.875 1.375 1.875 3V6.3125C0.8125 6.5625 0 7.5625 0 8.75V15C0 16.0625 0.8125 16.875 1.875 16.875H4.375C4 16.875 3.75 16.625 3.75 16.25V8.75C3.75 8.0625 3.1875 7.5 2.5 7.5C2.125 7.5 1.875 7.25 1.875 6.875C1.875 6.5 2.125 6.25 2.5 6.25C3.875 6.25 5 7.375 5 8.75V9.375H12.5V8.75C12.5 7.375 13.625 6.25 15 6.25C15.375 6.25 15.625 6.5 15.625 6.875C15.625 7.25 15.375 7.5 15 7.5C14.3125 7.5 13.75 8.0625 13.75 8.75V16.25C13.75 16.625 13.5 16.875 13.125 16.875H15.625C16.6875 16.875 17.5 16.0625 17.5 15V8.75C17.5 7.5625 16.6875 6.625 15.625 6.3125Z" 
          fill={color}
        />
      </svg>
    </div>
  );
}

