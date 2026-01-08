/**
 * Seat Icon Component
 * Displays seat icons in three styles:
 * - Outline: Available seats (gray outline)
 * - Solid Black: Selected seats (black fill)
 * - Red: Occupied seats (red fill)
 * Shows only the icon without any numbers or text overlay
 */

export default function SeatIcon({ variant = 'outline', className = '' }) {
  const baseSize = 'w-6 h-5 sm:w-7 sm:h-6 md:w-8 md:h-7';
  
  if (variant === 'selected') {
    // Solid black icon for selected seats
    return (
      <div className={`${baseSize} ${className} flex items-center justify-center`}>
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Backrest with headrest detail */}
          <rect x="3" y="2" width="18" height="8" rx="2" fill="#000000" />
          <line x1="6" y1="4.5" x2="18" y2="4.5" stroke="#333333" strokeWidth="0.8" />
          {/* Left armrest */}
          <rect x="2" y="8" width="2" height="8" fill="#000000" />
          {/* Right armrest */}
          <rect x="20" y="8" width="2" height="8" fill="#000000" />
          {/* Seat cushion */}
          <rect x="4" y="14" width="16" height="6" rx="1" fill="#000000" />
          {/* Base/platform */}
          <rect x="8" y="20" width="8" height="2" fill="#1a1a1a" />
        </svg>
      </div>
    );
  }
  
  if (variant === 'occupied') {
    // Red icon for occupied/seats
    return (
      <div className={`${baseSize} ${className} flex items-center justify-center`}>
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Backrest with headrest detail */}
          <rect x="3" y="2" width="18" height="8" rx="2" fill="#DC2626" />
          <line x1="6" y1="4.5" x2="18" y2="4.5" stroke="#B91C1C" strokeWidth="0.8" />
          {/* Left armrest */}
          <rect x="2" y="8" width="2" height="8" fill="#991B1B" />
          {/* Right armrest */}
          <rect x="20" y="8" width="2" height="8" fill="#991B1B" />
          {/* Seat cushion */}
          <rect x="4" y="14" width="16" height="6" rx="1" fill="#991B1B" />
          {/* Base/platform */}
          <rect x="8" y="20" width="8" height="2" fill="#6B7280" />
        </svg>
      </div>
    );
  }
  
  // Outline icon (default - available seats)
  return (
    <div className={`${baseSize} ${className} flex items-center justify-center`}>
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Backrest with headrest detail */}
        <rect x="3" y="2" width="18" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <line x1="6" y1="4.5" x2="18" y2="4.5" stroke="currentColor" strokeWidth="1" />
        {/* Left armrest */}
        <rect x="2" y="8" width="2" height="8" stroke="currentColor" strokeWidth="1.5" fill="none" />
        {/* Right armrest */}
        <rect x="20" y="8" width="2" height="8" stroke="currentColor" strokeWidth="1.5" fill="none" />
        {/* Seat cushion */}
        <rect x="4" y="14" width="16" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
        {/* Base/platform */}
        <rect x="8" y="20" width="8" height="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </svg>
    </div>
  );
}

