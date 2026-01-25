"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Film, Clock, Volume2, X } from 'lucide-react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { movies as moviesAPI } from '@/services/api';
import { APIError } from '@/services/api';
import Loader from '@/components/Loader';
import MovieCard from '@/components/MovieCard';
import { ExperiencesGrid } from '@/components/Experiences/ExperiencesGrid';
import { encryptId } from '@/utils/encryption';

export default function MoviesPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('now-showing');
    const [viewMode, setViewMode] = useState('movies'); // 'movies' or 'experiences'
    const [movies, setMovies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showTrailerModal, setShowTrailerModal] = useState(false);
    const [currentTrailerVideoId, setCurrentTrailerVideoId] = useState(null);

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
                image: movie.imageURL || movie.image || movie.poster || "placeholder.png",
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

    // Helper function to extract YouTube video ID from URL
    const getYouTubeVideoId = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const handleWatchTrailer = (movie) => {
        if (movie && movie.trailerUrl) {
            const videoId = getYouTubeVideoId(movie.trailerUrl);
            if (videoId) {
                setCurrentTrailerVideoId(videoId);
                setShowTrailerModal(true);
            } else {
                // If not a YouTube URL, open in new tab
                window.open(movie.trailerUrl, '_blank');
            }
        }
    };

    const handleBookNow = (movie) => {
        const movieId = movie.id || movie;
        router.push(`/movie-detail?movieId=${encryptId(movieId)}`);
    };

    const filteredMovies = () => {
        switch (activeTab) {
            case 'now-showing':
                return movies.filter(m => m.showType === "1");
            case 'advance-booking':
                // Show all showType 0 movies for Advance Booking
                return movies.filter(m => m.showType === "0");
            case 'coming-soon':
                // Show all showType 0 movies for Coming Soon
                return movies.filter(m => m.showType === "0");
            case 'top-rated':
                return movies; 
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
        return movie.showType === "1";
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
            <div className="pt-18 pb-16 relative min-h-screen ">
                <div style={{ background: 'linear-gradient(180deg, rgba(17, 17, 17, 0.4) 0%, rgba(103, 80, 2, 0.4) 65.74%)' }}>
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between mb-6 flex-wrap gap-4 py-6" >
                            {/* Dynamic Title */}
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#FAFAFA]">
                                {viewMode === 'movies' ? 'Movies' : 'Experiences'}
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
                    </div>
                </div>
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header Section with Title and Toggle */}
                    <div className="mb-8">
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
                                filteredMovies().map((movie) => {
                                    return (
                                        <MovieCard
                                            key={movie.id}
                                            movie={{
                                                ...movie,
                                                isNewRelease: isNewRelease(movie),
                                                badge: isNewRelease(movie) ? 'New releases' : null
                                            }}
                                            onBookNow={handleBookNow}
                                            onWatchTrailer={handleWatchTrailer}
                                            showButtons={true}
                                        />
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
                    {/* {viewMode === 'experiences' && (
                        <ExperiencesGrid 
                            showTitle={false}
                            columns={3}
                            showFullDescription={true}
                        />
                    )} */}
                </div>
            </div>

            {/* Trailer Modal */}
            {showTrailerModal && (
                <div 
                    className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-2 md:p-4" 
                    onClick={() => setShowTrailerModal(false)}
                >
                    <div 
                        className="relative w-full max-w-4xl bg-black rounded-lg overflow-hidden" 
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowTrailerModal(false);
                            }}
                            className="absolute top-2 right-2 md:top-4 md:right-4 z-[100] bg-black/90 hover:bg-black text-[#FAFAFA] p-2 md:p-2.5 rounded-full transition-all shadow-lg border border-white/20 pointer-events-auto"
                            style={{ zIndex: 100 }}
                        >
                            <X className="w-5 h-5 md:w-6 md:h-6" />
                        </button>
                        {currentTrailerVideoId ? (
                            <div className="relative w-full" style={{ paddingBottom: '56.25%', zIndex: 1 }}>
                                <iframe
                                    className="absolute top-0 left-0 w-full h-full"
                                    src={`https://www.youtube.com/embed/${currentTrailerVideoId}?autoplay=1`}
                                    title="Movie Trailer"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    style={{ pointerEvents: 'auto' }}
                                />
                            </div>
                        ) : (
                            <div className="p-12 text-center text-[#FAFAFA]">
                                <p className="text-lg mb-4">Trailer not available</p>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowTrailerModal(false);
                                    }}
                                    className="px-6 py-2 bg-[#FFCA20] text-black rounded hover:bg-[#FFCA20]/90 transition"
                                >
                                    Close
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}
