/**
 * Seat Icon Component
 * Displays seat icons using Font Awesome icons
 * - Normal seats: fa-couch
 * - Handicap/OKU seats: fa-wheelchair
 * - Twin seats: fa-couch (same as normal but different styling context)
 * - Variants: outline (available - white), selected (gold/yellow), occupied (red)
 */

import React from 'react';

export default function SeatIcon({ 
  variant = 'outline', 
  seatType = 'normal', // 'normal', 'twin', 'handicap'
  className = '' 
}) {
  // Size classes - more responsive sizing
  const baseSize = seatType === 'normal' 
    ? 'text-base sm:text-lg md:text-xl lg:text-2xl' // Responsive sizing for normal seats
    : 'text-sm sm:text-base md:text-lg lg:text-xl';

  // Color classes based on variant
  let colorClass = '';
  if (variant === 'selected') {
    colorClass = 'text-[#FFCA20]'; // Gold/Yellow
  } else if (variant === 'occupied') {
    colorClass = 'text-[#C51322]'; // Red
  } else {
    colorClass = 'text-white'; // White for available
  }

  // Icon class based on seat type
  let iconClass = 'fa-couch'; // Default for normal and twin seats
  if (seatType === 'handicap') {
    iconClass = 'fa-wheelchair';
  }

  return (
    <div className={`${baseSize} ${className} flex items-center justify-center`}>
      <i className={`fa-solid ${iconClass} ${colorClass}`}></i>
    </div>
  );
}