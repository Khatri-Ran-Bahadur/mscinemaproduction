"use client";

import React, { useState } from 'react';
import Link from 'next/link';

const EXPERIENCES_DATA = [
    {
        id: 1,
        image: "img/experiences1.jpg",
        fallbackImage: "img/our_hall.jpg",
        title: "INDULGE",
        description: "An exclusive cinematic experience offering premium comfort, gourmet dining on the big screen."
    },
    {
        id: 2,
        image: "img/experiences2.jpg",
        fallbackImage: "img/our_hall2.jpg",
        title: "IMAX",
        description: "Immerse yourself in the ultimate movie experience with breathtaking visuals, powerful sound."
    },
    {
        id: 3,
        image: "img/experiences3.jpg",
        fallbackImage: "img/our_hall3.jpg",
        title: "JUNIOR",
        description: "A fun-filled cinema experience designed especially for kids, featuring playful seating."
    },
    {
        id: 4,
        image: "img/experiences4.jpg",
        fallbackImage: "img/our_hall4.jpg",
        title: "BEANIE",
        description: "Relax in cozy bean bag seating and enjoy a laid-back, comfort-first movie experience like no other."
    },
    {
        id: 5,
        image: "img/experiences5.jpg",
        fallbackImage: "img/our_hall5.jpg",
        title: "DOLBY ATMOS",
        description: "Experience cinema with stunningly realistic sound that moves all around you for total immersion."
    },
    {
        id: 6,
        image: "img/experiences6.jpg",
        fallbackImage: "img/our_hall6.jpg",
        title: "3D",
        description: "Step into the story with lifelike depth and stunning visuals that bring every scene closer than ever."
    }
];

const ExperienceCard = ({ experience, showFullDescription }) => {
    const [imageError, setImageError] = useState(false);
    const currentImage = imageError ? experience.fallbackImage : experience.image;
    
    return (
        <div 
            className="group cursor-pointer rounded-lg overflow-hidden transition-all duration-300 relative h-[300px] sm:h-[350px] md:h-[400px] lg:h-[450px] bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${currentImage})` }}
        >
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
                <h4 className="font-bold text-lg md:text-2xl mb-2 text-[#FAFAFA] uppercase tracking-wide">
                    {experience.title}
                </h4>
                {showFullDescription ? (
                    <p className="text-sm md:text-base text-[#FAFAFA] leading-relaxed">
                        {experience.description}
                    </p>
                ) : (
                    <p className="text-sm md:text-base text-[#FAFAFA] leading-relaxed">
                        {experience.description.split(' ').slice(0, 10).join(' ')}...{' '}
                        <Link href="/experiences" className="text-[#FFCA20] font-medium hover:underline inline">
                            more
                        </Link>
                    </p>
                )}
            </div>
            {/* Hidden img for error handling */}
            <img 
                src={currentImage}
                alt=""
                className="hidden"
                onError={() => setImageError(true)}
            />
        </div>
    );
};

export const ExperiencesGrid = ({ 
    showTitle = false, 
    title = "Experience our hall",
    columns = 3, // Default 3 columns for desktop
    showFullDescription = false, // For home page, show truncated; for movies page, show full
    className = "",
    experiences = []
}) => {
    const gridCols = {
        2: 'grid-cols-2',
        3: 'grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-2 lg:grid-cols-4'
    };

    // Use passed experiences or fallback to static data if empty and not explicitly suppressing
    // However, ExperienceOurHall passes the filtered list.
    // If experiences prop is passed (even if empty array), we use it.
    // If undefined, we might use default? 
    // Let's assume if it's passed, it overrides EXPERIENCES_DATA.
    // But EXPERIENCES_DATA was static. 
    // Let's use experiences if it has length, otherwise fallback? 
    // The user wants dynamic. So if we fetch dynamic and it's 0, we show 0.
    
    // Actually, to support existing usage elsewhere without breaking, let's default to EXPERIENCES_DATA if experiences is empty AND not passed. 
    // But simpler: just use generic list.
    
    const displayData = (experiences && experiences.length > 0) ? experiences : EXPERIENCES_DATA;
    // Note: ExperienceOurHall returns null if empty, so here displayData will likely be static if not called from ExperienceOurHall or if called with empty but we want fallback.
    // But wait, ExperienceOurHall passes `experiences` state. If that state is populated, we use it. 
    // If ExperienceOurHall handles the "loading/empty" check, then when we get here we have data.
    
    // But wait! If I change ExperienceOurHall to fetch, and I want to "make dynamic", do I still want the hardcoded `EXPERIENCES_DATA`? 
    // Probably not. But I should keep it for safety in case API fails or during migration.
    // However, the `ExperienceOurHall.js` component now only renders `ExperiencesGrid` if `experiences.length > 0`.
    
    // So if I modify ExperiencesGrid to prefer `experiences` prop:
    const finalData = experiences && experiences.length > 0 ? experiences : EXPERIENCES_DATA;

    return (
        <div className={className}>
            {showTitle && (
                <h3 className="text-xl md:text-2xl font-bold mb-6 md:mb-8 text-[#FAFAFA]">{title}</h3>
            )}
            <div className={`grid ${gridCols[columns] || gridCols[3]} gap-4 md:gap-6`}>
                {finalData.map((experience) => (
                    <ExperienceCard 
                        key={experience.id}
                        experience={experience}
                        showFullDescription={showFullDescription}
                    />
                ))}
            </div>
        </div>
    );
};

export default ExperiencesGrid;
