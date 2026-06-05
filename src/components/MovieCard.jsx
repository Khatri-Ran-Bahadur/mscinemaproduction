import React from 'react';
import RatingIcon from './RatingIcon';

export default function MovieCard({ movie, onBookNow, onWatchTrailer, className = '', showButtons = true }) {
    const handleCardClick = (e) => {
        if (onBookNow) {
            onBookNow(movie);
        }
    };

    return (
        <div
            className={`relative rounded-xl overflow-hidden group bg-[#0a0a0a] border border-red-950/60 hover:border-red-600/60 shadow-lg hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all duration-300 flex flex-col h-full cursor-pointer ${className}`}
            onClick={handleCardClick}
        >
            {/* Poster Image Container */}
            <div className="relative aspect-[2/3] overflow-hidden w-full shrink-0 bg-[#141414]">
                <img
                    src={movie.image}
                    alt={movie.title}
                    className="w-full h-full object-cover transition-transform duration-750 ease-out group-hover:scale-105"
                    onError={(e) => { e.target.src = 'img/movies1.png'; }}
                />

                {/* Styled Red Movie Type Badge (Overlay top-left) */}
                {movie.type && (
                    <div 
                        className="absolute top-3 left-0 bg-red-600 text-white font-black text-[10px] sm:text-xs px-3.5 py-1 z-30 shadow-md uppercase tracking-wider"
                        style={{
                            clipPath: 'polygon(0 0, 100% 0, 88% 100%, 0 100%)'
                        }}
                    >
                        {movie.type}
                    </div>
                )}

                {/* Hover Action Overlay (z-20) */}
                {showButtons && (
                    <div className="absolute inset-0 bg-red-950/75 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 z-20">
                        {/* Book Now Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onBookNow) {
                                    onBookNow(movie);
                                }
                            }}
                            className="bg-white text-black font-extrabold px-6 py-2.5 rounded-full text-xs sm:text-sm hover:bg-[#FFCA20] hover:text-black transition-all transform hover:scale-105 active:scale-95 cursor-pointer shadow-md"
                        >
                            {movie?.showType === '0' ? 'More info' : 'Book now'}
                        </button>

                        {/* Watch Trailer Button */}
                        {movie.trailerUrl && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onWatchTrailer) {
                                        onWatchTrailer(movie);
                                    }
                                }}
                                className="border border-white/60 text-white font-bold px-5 py-2 rounded-full text-[10px] sm:text-xs hover:bg-white hover:text-black hover:border-white transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
                            >
                                Watch trailer
                            </button>
                        )}
                    </div>
                )}

                {/* Rating Icon (Overlay bottom-left - z-30 to remain visible on hover) */}
                {movie.rating && (
                    <div className="absolute bottom-3 left-3 z-30">
                        <RatingIcon 
                            rating={movie.rating} 
                            className="w-10 h-10 sm:w-11 sm:h-11 shadow-lg filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]" 
                        />
                    </div>
                )}

                {/* Subtle Gradient Shadow at bottom of poster for rating icon readability */}
                <div
                    className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-10"
                />
            </div>

            {/* Movie Details Section (Title below the image) */}
            <div className="p-4 sm:p-5 flex flex-col justify-center items-center flex-grow bg-black border-t border-white/5 min-h-[72px]">
                <h3 className="text-white font-bold text-center text-sm sm:text-base line-clamp-2 uppercase tracking-wide group-hover:text-red-500 transition-colors duration-300">
                    {movie.title}
                </h3>
            </div>
        </div>
    );
}


