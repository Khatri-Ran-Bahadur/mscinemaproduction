import React from 'react';

/**
 * RatingIcon Component
 * Displays a movie rating icon based on the rating string (P12, 13, 16, 18)
 * 
 * @param {string} rating - The rating string from API
 * @param {string} className - Additional CSS classes
 */
export default function RatingIcon({ rating, className = '' }) {
    if (!rating) return null;
    
    const r = rating.toString().toUpperCase().trim();
    let iconPath = '';
    
    // Logic to match the rating to the icon files in public/ratingicon/
    if (r.includes('13')) iconPath = '/ratingicon/rating-13.png';
    else if (r.includes('16')) iconPath = '/ratingicon/rating-16.png';
    else if (r.includes('18')) iconPath = '/ratingicon/rating-18.png';
    else if (r.includes('P12')) iconPath = '/ratingicon/rating-p12.png';
    else return null;

    return (
        <div className={`inline-flex items-center justify-center overflow-hidden shrink-0 ${className}`}>
            <img 
                src={iconPath} 
                alt={`Rating ${r}`}
                className="w-full h-full object-contain"
                onError={(e) => { e.target.style.display = 'none'; }}
            />
        </div>
    );
}
