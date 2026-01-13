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
  seatType = 'normal', // 'normal', 'twin', 'handicap', 'family-bed'
  className = '' 
}) {
  // Size classes - refined responsive sizing
  const baseSize = seatType === 'normal' 
    ? 'text-base sm:text-lg md:text-xl lg:text-2xl' // Responsive sizing for normal seats
    : seatType === 'family-bed'
    ? 'w-10 h-6 sm:w-12 sm:h-7 md:w-14 md:h-8 lg:w-16 lg:h-9' // Special sizing for family bed SVG
    : 'text-sm sm:text-base md:text-lg lg:text-xl';

  // Color values/classes based on variant
  let color = '#FFFFFF'; // Default white
  let colorClass = 'text-white';
  
  if (variant === 'selected') {
    color = '#FFCA20';
    colorClass = 'text-[#FFCA20]';
  } else if (variant === 'occupied') {
    color = '#C51322';
    colorClass = 'text-[#C51322]';
  } else {
    color = '#FFFFFF'; // Gray-ish for outline? or Keep white
    colorClass = 'text-white'; // White for available
    if (variant === 'outline' && seatType === 'normal') {
       // Outline usually implies border/stroke or specific color in FA, but here we use text color.
       // The original code used 'text-white' for outline. "grey-400" was passed in className often.
    }
  }

  // Handle Family Bed SVG
  if (seatType === 'family-bed') {
    return (
      <div className={`${baseSize} ${className} flex items-center justify-center`}>
        <svg 
          viewBox="0 0 64.6 29.6" 
          width="100%" 
          height="100%" 
          style={{ 
            fillRule: 'evenodd', 
            clipRule: 'evenodd', 
            fill: color // Use the determined color
          }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M6.6,1.8c-1.1,0-2,0.9-2,2v8.5c2,0.3,3.5,2,3.5,4v5.3h48.5v-5.3c0-2.2,1.7-3.9,3.8-4V3.8c0-1.1-0.9-2-2-2 C58.4,1.8,6.6,1.8,6.6,1.8z M60.4,14.1c-0.1,0-0.2,0-0.4,0.1c-1,0.2-1.7,1.1-1.7,2.2v7.1h-52v-7.1c0-1-0.7-1.9-1.7-2.2l0,0 c-0.2,0-0.4-0.1-0.6-0.1c-1.2,0-2.2,1-2.2,2.2v8.1v1.2v1.2c0,0.6,0.4,1,1,1h59c0.6,0,1-0.4,1-1v-2.5l0,0v-8.1c0-1.2-1-2.2-2.2-2.2 C60.5,14.1,60.4,14.1,60.4,14.1z"/>
        </svg>
      </div>
    );
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