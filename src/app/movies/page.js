"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { movies as moviesAPI } from '@/services/api';
import { APIError } from '@/services/api';
import Loader from '@/components/Loader';
import { ExperiencesGrid } from '@/components/Experiences/ExperiencesGrid';

export default function MoviesPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('now-showing');
    const [viewMode, setViewMode] = useState('movies'); // 'movies' or 'experiences'
    const [movies, setMovies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadMovies();
    }, []);

    const loadMovies = async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await moviesAPI.getMovies();
            // Transform API data to match component structure
            const transformedMovies = Array.isArray(data) ? data.map((movie, index) => ({
                id: movie.movieID || movie.id || index + 1,
                image: movie.imageURL || movie.image || movie.poster || "img/movies1.png",
                title: movie.movieName || movie.title || movie.name || "Unknown Movie",
                genre: movie.genre || movie.genres || movie.category || "Action",
                rating: movie.rating || movie.ageRating || "U/A",
                languages: movie.language || movie.languages || "English",
                duration: movie.duration || "1 hr 48 mins",
                isComingSoon: movie.isComingSoon || movie.comingSoon || false,
                showType: movie.showType || "1",
                releaseDate: movie.releaseDate || "",
                trailerUrl: movie.trailerUrl || movie.trailer || "",
                synopsis: movie.synopsis || ""
            })) : [];
            
            setMovies(transformedMovies);
        } catch (err) {
            console.error('Error loading movies:', err);
            if (err instanceof APIError) {
                setError(err.message || 'Failed to load movies');
            } else {
                setError('An unexpected error occurred');
            }
            setMovies([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleWatchTrailer = (trailerUrl, e) => {
        e.stopPropagation();
        if (trailerUrl) {
            window.open(trailerUrl, '_blank');
        }
    };

    const handleBookNow = (movieId, e) => {
        e.stopPropagation();
        router.push(`/movie-detail?movieId=${movieId}`);
    };

    const filteredMovies = () => {
        switch (activeTab) {
            case 'now-showing':
                return movies.filter(m => m.showType === "1" || !m.isComingSoon);
            case 'advance-booking':
                return movies.filter(m => m.showType === "2");
            case 'coming-soon':
                return movies.filter(m => m.isComingSoon || m.showType === "3");
            case 'top-rated':
                return movies; // Could filter by rating if available
            default:
                return movies;
        }
    };

    const formatReleaseDate = (dateString) => {
        if (!dateString) return "";
        try {
            const date = new Date(dateString);
            const day = date.getDate();
            const month = date.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
            const year = date.getFullYear();
            return `${day} ${month} ${year}`;
        } catch (e) {
            return dateString;
        }
    };

    const isNewRelease = (movie) => {
        return movie.showType === "1" || !movie.isComingSoon;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black text-[#FAFAFA]">
                <Header />
                <div className="min-h-screen flex items-center justify-center">
                    <Loader fullScreen={true} size="large" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-[#FAFAFA]">
            <Header />
            
            {/* Main Content */}
            <div className="pt-24 pb-16 relative min-h-screen">
                {/* Gradient Background Shadow - Full Width, Bottom to Top */}
                <div 
                    className="absolute left-0 right-0 top-0 bottom-0 pointer-events-none"
                    style={{
                        background: 'linear-gradient(180deg, rgba(17, 17, 17, 0.4) 0%, rgba(103, 80, 2, 0.4) 65.74%)'
                    }}
                />
                
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    {/* Header Section with Title and Toggle */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-6 flex-wrap gap-4 py-6">
                            {/* Dynamic Title */}
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#FAFAFA]">
                                {viewMode === 'movies' ? 'Cinemas' : 'Experiences'}
                            </h1>
                            
                            {/* Toggle Switch Buttons - Smaller and Rounded */}
                            <div className="inline-flex rounded-full bg-[#1a1a1a] border border-[#2a2a2a] p-0.5">
                                <button
                                    onClick={() => setViewMode('movies')}
                                    className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                                        viewMode === 'movies'
                                            ? 'bg-[#FFCA20] text-black shadow-sm'
                                            : 'text-[#D3D3D3] hover:text-[#FAFAFA]'
                                    }`}
                                >
                                    Near me
                                </button>
                                <button
                                    onClick={() => setViewMode('experiences')}
                                    className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                                        viewMode === 'experiences'
                                            ? 'bg-[#FFCA20] text-black shadow-sm'
                                            : 'text-[#D3D3D3] hover:text-[#FAFAFA]'
                                    }`}
                                >
                                    Experiences
                                </button>
                            </div>
                        </div>
                        
                        {/* Tabs - Only show for movies view */}
                        {viewMode === 'movies' && (
                            <div className="flex gap-6 md:gap-8 border-b border-[#3a3a3a] overflow-x-auto">
                            <button
                                onClick={() => setActiveTab('now-showing')}
                                className={`pb-4 px-2 text-sm font-medium transition relative whitespace-nowrap ${
                                    activeTab === 'now-showing' 
                                        ? 'text-[#FFCA20]' 
                                        : 'text-[#D3D3D3] hover:text-[#FAFAFA]'
                                }`}
                            >
                                Now showing
                                {activeTab === 'now-showing' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFCA20]"></div>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('advance-booking')}
                                className={`pb-4 px-2 text-sm font-medium transition relative whitespace-nowrap ${
                                    activeTab === 'advance-booking' 
                                        ? 'text-[#FFCA20]' 
                                        : 'text-[#D3D3D3] hover:text-[#FAFAFA]'
                                }`}
                            >
                                Advance booking
                                {activeTab === 'advance-booking' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFCA20]"></div>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('coming-soon')}
                                className={`pb-4 px-2 text-sm font-medium transition relative whitespace-nowrap ${
                                    activeTab === 'coming-soon' 
                                        ? 'text-[#FFCA20]' 
                                        : 'text-[#D3D3D3] hover:text-[#FAFAFA]'
                                }`}
                            >
                                Coming soon
                                {activeTab === 'coming-soon' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFCA20]"></div>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('top-rated')}
                                className={`pb-4 px-2 text-sm font-medium transition relative whitespace-nowrap ${
                                    activeTab === 'top-rated' 
                                        ? 'text-[#FFCA20]' 
                                        : 'text-[#D3D3D3] hover:text-[#FAFAFA]'
                                }`}
                            >
                                Top rated
                                {activeTab === 'top-rated' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFCA20]"></div>
                                )}
                            </button>
                            </div>
                        )}
                    </div>

                    {/* Error Message */}
                    {error && viewMode === 'movies' && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded text-sm text-red-400">
                            {error}
                            <button 
                                onClick={loadMovies}
                                className="ml-4 text-[#FFCA20] hover:text-[#FFCA20]/80 underline"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {/* Movies Grid */}
                    {!isLoading && viewMode === 'movies' && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                            {filteredMovies().length > 0 ? (
                                filteredMovies().map((movie, index) => {
                                    const showDetails = index % 3 === 1; // Show details on every 2nd card (index 1, 4, 7, etc.)
                                    const formattedDate = formatReleaseDate(movie.releaseDate);
                                    
                                    return (
                                        <div 
                                            key={movie.id} 
                                            className="group cursor-pointer"
                                            onClick={() => handleBookNow(movie.id, { stopPropagation: () => {} })}
                                        >
                                            <div className="relative rounded-lg overflow-hidden">
                                                {/* Movie Poster */}
                                                <div className="relative aspect-[2/3] overflow-hidden">
                                                    <img 
                                                        src={movie.image} 
                                                        alt={movie.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                                        onError={(e) => { e.target.src = 'img/movies1.png'; }}
                                                    />
                                                    
                                                    {/* Gradient Background Shadow */}
                                                    <div 
                                                        className="absolute inset-0"
                                                        style={{
                                                            background: 'linear-gradient(180deg, rgba(17, 17, 17, 0.4) 0%, rgba(103, 80, 2, 0.4) 65.74%)'
                                                        }}
                                                    />
                                                    
                                                    {/* New Releases Banner */}
                                                    {isNewRelease(movie) && (
                                                        <div className="absolute top-3 left-3 z-10">
                                                            <span className="bg-[#FFCA20] text-black px-2 py-1 text-[10px] sm:text-xs font-bold rounded">
                                                                New releases
                                                            </span>
                                                        </div>
                                                    )}
                                                    
                                                    {/* Title Overlay */}
                                                    <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 z-10">
                                                        <h3 className="text-sm sm:text-base md:text-lg font-bold text-[#FAFAFA] mb-1 line-clamp-2">
                                                            {movie.title}
                                                        </h3>
                                                        {formattedDate && (
                                                            <p className="text-[10px] sm:text-xs text-[#D3D3D3]">
                                                                {movie.releaseDate ? `DI PAWAGAM ${formattedDate}` : `IN THEATERS ${formattedDate}`}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="col-span-full text-center py-16 text-[#D3D3D3]">
                                    No movies available in this category.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Experiences Grid */}
                    {viewMode === 'experiences' && (
                        <ExperiencesGrid 
                            showTitle={false}
                            columns={3}
                            showFullDescription={true}
                        />
                    )}
                </div>
            </div>

            <Footer />
        </div>
    );
}
