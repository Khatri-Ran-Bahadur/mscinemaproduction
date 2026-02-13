import React from 'react';
import { Film, Clock, Volume2 } from 'lucide-react';
import RatingIcon from './RatingIcon';

export default function MovieCard({ movie, onBookNow, onWatchTrailer, className = '', showButtons = true }) {
  const handleCardClick = (e) => {
    // Only navigate on card click if buttons are not shown
    if (!showButtons && onBookNow) {
      onBookNow(movie);
    }
  };

  return (
    <div 
        className={`relative rounded-xl overflow-hidden group border border-white/5 shadow-lg ${showButtons ? 'cursor-default' : 'cursor-pointer'} ${className}`}
        onClick={handleCardClick}
    >
        {/* Poster Image */}
        <div className="relative aspect-[2/3] overflow-hidden">
            <img
                src={movie.image}
                alt={movie.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                onError={(e) => { e.target.src = 'img/movies1.png'; }}
            />
            
            {/* Gradient Background Shadow */}
            <div 
                className="absolute inset-0"
                style={{
                    background: 'linear-gradient(179.66deg, rgba(17, 17, 17, 0) 0.3%, rgba(17, 17, 17, 0.3) 32.33%, rgba(17, 17, 17, 0.6) 60.86%)'
                }}
            />

            {/* Glass Background with Movie Information */}
            <div className="absolute bottom-0 left-0 right-0 z-10">
                {/* Glassmorphism Background */}
                <div 
                    className="backdrop-blur-md bg-black/30 border-t border-white/10"
                    style={{
                        background: 'linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.4) 50%, rgba(0, 0, 0, 0.7) 100%)'
                    }}
                >
                    <div className="p-2 sm:p-3">
                        {/* Movie title and Rating Icon */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                            <h3 className="text-[#FAFAFA] text-xs sm:text-sm font-bold truncate tracking-wide">
                                {movie.title}
                            </h3>
                            {movie.rating && (
                                <RatingIcon rating={movie.rating} className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow-lg" />
                            )}
                        </div>
                        
                        {/* Movie Information with Icons */}
                        <div className="flex flex-col gap-1 text-[9px] sm:text-[10px] text-[#FAFAFA]">
                            {/* Genre */}
                            {(movie.genre || movie.genres) && (
                                <div className="flex items-center gap-1.5">
                                    <Film size={10} className="text-[#FAFAFA] shrink-0" />
                                    <span className="text-[#FAFAFA]">{movie.genre || movie.genres}</span>
                                </div>
                            )}
                            
                            {/* Duration */}
                            {movie.duration && (
                                <div className="flex items-center gap-1.5">
                                    <Clock size={10} className="text-[#FAFAFA] shrink-0" />
                                    <span className="text-[#FAFAFA]">{movie.duration}</span>
                                </div>
                            )}
                            
                            {/* Language */}
                            {(movie.languages || movie.language) && (
                                <div className="flex items-center gap-1.5">
                                    <Volume2 size={10} className="text-[#FAFAFA] shrink-0" />
                                    <span className="text-[#FAFAFA]">{movie.languages || movie.language}</span>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        {showButtons && (
                            <div className="flex items-center justify-between gap-2 mt-2 pt-1.5">
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (onWatchTrailer) {
                                            onWatchTrailer(movie);
                                        }
                                    }}
                                    className="text-[#FFCA20] font-bold text-[10px] sm:text-xs hover:text-[#fff0b3] transition-colors whitespace-nowrap"
                                >
                                    Watch trailer
                                </button>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (onBookNow) {
                                            onBookNow(movie);
                                        }
                                    }}
                                    className="bg-[#FFCA20] text-black px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg font-bold text-[10px] sm:text-xs hover:bg-[#FFCA20]/90 transition-all shadow-md active:scale-95 whitespace-nowrap"
                                >
                                    Book now
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}
