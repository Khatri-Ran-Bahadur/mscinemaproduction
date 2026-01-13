'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, Star, ChevronLeft, ChevronRight, ArrowRight, Film, Clock, Volume2, X } from 'lucide-react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { movies as moviesAPI } from '@/services/api';
import { APIError } from '@/services/api';
import { ExperienceOurHall } from '@/components/Homepage/ExperienceOurHall';
import { Promotions } from '@/components/Homepage/Promotions';
import Loader from '@/components/Loader';
import { encryptId } from '@/utils/encryption';

export default function MovieStreamingSite() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeMovieTab, setActiveMovieTab] = useState('now-showing');
  const [featuredMovies, setFeaturedMovies] = useState([]);
  const [nowShowingMovies, setNowShowingMovies] = useState([]);
  const [advanceBookingMovies, setAdvanceBookingMovies] = useState([]);
  const [comingSoonMovies, setComingSoonMovies] = useState([]);
  const [topRatedMovies, setTopRatedMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [heroMovies, setHeroMovies] = useState([]);
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [currentTrailerVideoId, setCurrentTrailerVideoId] = useState(null);

  // Ensure currentSlide doesn't exceed available movies
  useEffect(() => {
    if (currentSlide >= heroMovies.length && heroMovies.length > 0) {
      setCurrentSlide(0);
    }
  }, [heroMovies.length, currentSlide]);

  useEffect(() => {
    loadMovies();
  }, []);

  // Helper function to extract YouTube video ID from URL
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Handle watch trailer button click
  const handleWatchTrailer = () => {
    const currentHeroMovie = heroMovies[currentSlide];
    if (currentHeroMovie && currentHeroMovie.trailerUrl) {
      const videoId = getYouTubeVideoId(currentHeroMovie.trailerUrl);
      if (videoId) {
        setCurrentTrailerVideoId(videoId);
        setShowTrailerModal(true);
      }
    }
  };

  const loadMovies = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Fetch Movies and Banners in parallel
      const [moviesData, bannersRes] = await Promise.all([
        moviesAPI.getMovies(),
        fetch('/api/banners')
      ]);
      
      const bannersData = await bannersRes.json();
      const activeBanners = bannersData.success ? bannersData.banners : [];

      if (!Array.isArray(moviesData) || moviesData.length === 0) {
        throw new Error('No movies data received');
      }

      // Transform API data to match component structure
      const transformedMovies = moviesData.map((movie) => ({
        id: movie.movieID,
        title: movie.movieName?.replace(/^\./, '') || "Unknown Movie", // Remove leading dot
        image: movie.imageURL || `img/movies1.png`,
        rating: movie.rating || "U/A",
        year: movie.releaseDate ? movie.releaseDate.split('-')[2] : new Date().getFullYear().toString(),
        genre: movie.genre || "Action",
        language: movie.language || "English",
        type: movie.type || "2D",
        duration: movie.duration || "",
        synopsis: movie.synopsis || "",
        trailerUrl: movie.trailerUrl || "",
        releaseDate: movie.releaseDate || "",
        showType: movie.showType
      }));

      // Categorize movies based on release date and showType
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Now Showing: Movies released today or before
      const nowShowing = transformedMovies.filter(movie => {
        if (!movie.releaseDate) return false;
        const releaseDate = new Date(movie.releaseDate.split('-').reverse().join('-'));
        releaseDate.setHours(0, 0, 0, 0);
        return releaseDate <= today && (movie.showType === '1' || !movie.showType);
      });

      // Advance Booking
      const advanceBooking = transformedMovies.filter(movie => {
        if (!movie.releaseDate) return false;
        const releaseDate = new Date(movie.releaseDate.split('-').reverse().join('-'));
        releaseDate.setHours(0, 0, 0, 0);
        const daysDiff = Math.ceil((releaseDate - today) / (1000 * 60 * 60 * 24));
        return releaseDate > today && daysDiff <= 30;
      });

      // Coming Soon
      const comingSoon = transformedMovies.filter(movie => {
        if (!movie.releaseDate) return false;
        const releaseDate = new Date(movie.releaseDate.split('-').reverse().join('-'));
        releaseDate.setHours(0, 0, 0, 0);
        const daysDiff = Math.ceil((releaseDate - today) / (1000 * 60 * 60 * 24));
        return releaseDate > today && daysDiff > 30;
      });

      // Top Rated
      const topRated = [...transformedMovies].sort((a, b) => {
        const ratingA = parseFloat(a.rating) || 0;
        const ratingB = parseFloat(b.rating) || 0;
        return ratingB - ratingA;
      }).slice(0, 10);

      // Set state variables
      setNowShowingMovies(nowShowing);
      setFeaturedMovies(nowShowing.slice(0, 10)); // Simplified mapping, just use transformed objects
      setAdvanceBookingMovies(advanceBooking);
      setComingSoonMovies(comingSoon);
      setTopRatedMovies(topRated);

      // Process Hero Movies (Banners or Fallback)
      if (activeBanners.length > 0) {
        const heroList = activeBanners.map(banner => {
            if (banner.type === 'movie' && banner.movieId) {
                // Find associated movie
                const movie = transformedMovies.find(m => m.id.toString() === banner.movieId.toString());
                if (movie) {
                    return {
                        id: movie.id,
                        title: movie.title.toUpperCase(),
                        subtitle: `${movie.genre} | ${movie.duration}`,
                        image: banner.image || movie.image, // Prefer banner image
                        type: movie.type,
                        trailerUrl: movie.trailerUrl,
                        isMovie: true
                    };
                }
            }
            
            // Normal banner fallback or if movie not found
            return {
                id: banner.id,
                title: banner.title || '',
                subtitle: banner.description || '',
                image: banner.image,
                link: banner.link,
                type: 'PROMO',
                isMovie: false
            };
        }).filter(item => item); // Filter out nulls if any (though map returns obj)

        setHeroMovies(heroList);
      } else if (nowShowing.length > 0) {
        // Fallback to top 5 movies if no banners
        const heroMoviesList = nowShowing.slice(0, 5).map(movie => ({
          id: movie.id,
          title: movie.title.toUpperCase(),
          subtitle: movie.title,
          image: movie.image || "img/banner1.jpg",
          type: movie.type || "2D",
          trailerUrl: movie.trailerUrl || "",
          isMovie: true
        }));
        setHeroMovies(heroMoviesList);
      } else {
        setHeroMovies([]);
      }

    } catch (err) {
      console.error('Error loading movies:', err);
      if (err instanceof APIError) {
        setError(err.message || 'Failed to load movies');
      } else {
        setError('An unexpected error occurred');
      }
      setHeroMovies([]);
      setNowShowingMovies([]);
      setFeaturedMovies([]);
      setAdvanceBookingMovies([]);
      setComingSoonMovies([]);
      setTopRatedMovies([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-slide effect
  useEffect(() => {
    if (heroMovies.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % heroMovies.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [heroMovies.length]);

  return (
    <div className="bg-black min-h-screen text-[#D3D3D3]">
      <Header/>

      {/* Hero Section - Full Banner View with Slider */}
      {/* Hide hero section on mobile during loading, show on desktop */}
      {heroMovies.length > 0 ? (
      <div className={`relative h-[40vh] md:h-[70vh] max-h-[700px] overflow-hidden group ${isLoading ? 'hidden md:block' : ''}`}>
        
        {/* Slider Track */}
        <div 
          className="flex h-full transition-transform duration-[1500ms] ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {heroMovies.map((movie, index) => (
            <div key={index} className="min-w-full h-full relative overflow-hidden">
              <div className="absolute inset-0">
                <img 
                  src={movie.image || "img/banner1.jpg"}
                  alt={movie.title || "Movie"}
                  className={`w-full h-full object-cover center transition-transform duration-[8000ms] ease-linear ${index === currentSlide ? 'scale-110' : 'scale-100'}`}
                />
                {/* Bottom Gradient Overlay - Desktop: from bottom */}
                <div 
                  className="absolute inset-0 hidden md:block"
                  style={{
                    background: 'linear-gradient(180deg, rgba(34, 34, 34, 0) 42.53%, rgba(34, 34, 34, 0.5) 71.27%, #222222 100%)'
                  }}
                />
                {/* Top Gradient Overlay - Mobile: from top */}
                <div 
                  className="absolute inset-0 md:hidden"
                  style={{
                    background: 'linear-gradient(180deg, rgba(17, 17, 17, 0) 46.79%, rgba(17, 17, 17, 0.5) 68.08%, #111111 94.68%)'
                  }}
                />
                {/* Bottom Gradient Overlay - Mobile: from bottom */}
                <div 
                  className="absolute inset-0 md:hidden"
                  style={{
                    background: 'linear-gradient(180deg, rgba(17, 17, 17, 0) 46.79%, rgba(17, 17, 17, 0.5) 68.08%, #111111 94.68%)'
                  }}
                />
              </div>
              
              <div className="relative h-full container mx-auto px-4 sm:px-6 lg:px-8 z-10 flex flex-col justify-end pb-12 md:pb-20 lg:pb-28">
                <div className="max-w-3xl">
                  <h1 className="text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-2 text-[#FAFAFA] uppercase tracking-tight leading-tight drop-shadow-lg">
                    {movie.title || ""}
                  </h1>
                  <h2 className="text-base md:text-xl lg:text-2xl font-normal mb-3 md:mb-4 text-[#FAFAFA] drop-shadow-md">
                    {movie.subtitle || ""}
                  </h2>

                  <div className="flex items-center space-x-2 md:space-x-3 mb-4 md:mb-6 text-xs md:text-sm text-[#FAFAFA] drop-shadow-md">
                    <span>
                      {movie.type || "2D"}
                    </span>
                    <span className="text-[#FAFAFA]/50">|</span>
                    <span>ATMOS</span>
                  </div>

                  <div className="flex flex-row space-x-2 md:space-x-3 lg:space-x-4 mb-4 md:mb-6">
                    {movie.isMovie ? (
                      <>
                        <button 
                          onClick={() => {
                            if (movie.trailerUrl) {
                              const videoId = getYouTubeVideoId(movie.trailerUrl);
                              if (videoId) {
                                setCurrentTrailerVideoId(videoId);
                                setShowTrailerModal(true);
                              }
                            }
                          }}
                          disabled={!movie.trailerUrl || !getYouTubeVideoId(movie.trailerUrl)}
                          className={`bg-transparent border-2 border-[#FFCA20] text-[#FFCA20] px-3 md:px-6 lg:px-8 py-2 md:py-2.5 lg:py-3 rounded font-semibold hover:bg-[#FFCA20] hover:text-black transition text-xs md:text-sm uppercase tracking-wide whitespace-nowrap shadow-lg flex-1 md:flex-initial ${
                            !movie.trailerUrl || !getYouTubeVideoId(movie.trailerUrl)
                              ? 'opacity-50 cursor-not-allowed hidden' // Hide if no trailer
                              : ''
                          }`}
                        >
                          Watch trailer
                        </button>

                        <Link 
                          href={movie.id ? `/movie-detail?movieId=${encryptId(movie.id)}` : '/movie-detail'}
                          className="bg-[#FFCA20] text-black px-3 md:px-6 lg:px-8 py-2 md:py-2.5 lg:py-3 rounded font-semibold hover:bg-[#FFCA20]/90 transition text-xs md:text-sm uppercase tracking-wide inline-block text-center whitespace-nowrap shadow-lg flex-1 md:flex-initial"
                        >
                          Book now
                        </Link>
                      </>
                    ) : (
                      movie.link && (
                        <a 
                          href={movie.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-[#FFCA20] text-black px-3 md:px-6 lg:px-8 py-2 md:py-2.5 lg:py-3 rounded font-semibold hover:bg-[#FFCA20]/90 transition text-xs md:text-sm uppercase tracking-wide inline-block text-center whitespace-nowrap shadow-lg flex-1 md:flex-initial"
                        >
                          Learn More
                        </a>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Carousel Dots - Centered on screen */}
        <div className="absolute bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 flex justify-center gap-2 z-20">
          {heroMovies.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all shadow-md duration-300 ${
                currentSlide === index ? 'bg-[#FFCA20] w-6' : 'bg-[#FFCA20]/30 hover:bg-[#FFCA20]/60'
              }`}
            />
          ))}
        </div>

        {/* Navigation Arrows (Hidden on Mobile) */}
        <button 
          onClick={() => setCurrentSlide(prev => (prev - 1 + heroMovies.length) % heroMovies.length)}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hidden md:block z-20"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
        <button 
          onClick={() => setCurrentSlide(prev => (prev + 1) % heroMovies.length)}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hidden md:block z-20"
        >
          <ChevronRight className="w-8 h-8" />
        </button>

      </div>
      ) : null}

      {/* Movie Listings Section */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Navigation Tabs */}
        <div className="flex gap-4 md:gap-6 border-b border-[#2a2a2a] mb-6 md:mb-8 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveMovieTab('now-showing')}
            className={`pb-3 px-2 text-sm font-medium transition relative whitespace-nowrap ${
              activeMovieTab === 'now-showing' 
                ? 'text-[#FAFAFA]' 
                : 'text-[#D3D3D3] hover:text-[#FAFAFA]'
            }`}
          >
            Now showing
            {activeMovieTab === 'now-showing' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFCA20]"></div>
            )}
          </button>
          <button
            onClick={() => setActiveMovieTab('advance-booking')}
            className={`pb-3 px-2 text-sm font-medium transition relative whitespace-nowrap ${
              activeMovieTab === 'advance-booking' 
                ? 'text-[#FAFAFA]' 
                : 'text-[#D3D3D3] hover:text-[#FAFAFA]'
            }`}
          >
            Advance booking
            {activeMovieTab === 'advance-booking' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFCA20]"></div>
            )}
          </button>
          <button
            onClick={() => setActiveMovieTab('coming-soon')}
            className={`pb-3 px-2 text-sm font-medium transition relative whitespace-nowrap ${
              activeMovieTab === 'coming-soon' 
                ? 'text-[#FAFAFA]' 
                : 'text-[#D3D3D3] hover:text-[#FAFAFA]'
            }`}
          >
            Coming soon
            {activeMovieTab === 'coming-soon' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFCA20]"></div>
            )}
          </button>
        </div>

        {isLoading && (
          <div className="text-center py-16">
            <Loader size="default" />
          </div>
        )}
        
        {error && !isLoading && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Movie Grid - 2x2 for mobile with horizontal scroll, horizontal scroll for desktop */}
        {!isLoading && (
        <>
        <div className="relative">
          {/* Mobile: 2x2 Grid */}
          <div className="md:hidden mb-6">
            <div className="grid grid-cols-2 gap-4">
              {(() => {
                let moviesToShow = [];
                switch(activeMovieTab) {
                  case 'now-showing':
                    moviesToShow = nowShowingMovies;
                    break;
                  case 'advance-booking':
                    moviesToShow = advanceBookingMovies;
                    break;
                  case 'coming-soon':
                    moviesToShow = comingSoonMovies;
                    break;
                  default:
                    moviesToShow = nowShowingMovies;
                }

                return moviesToShow.length > 0 ? (
                  moviesToShow.slice(0, 4).map((movie, index) => {
                    const isNewRelease = activeMovieTab === 'now-showing';
                    
                    return (
                      <div key={movie.id}>
                        <Link href={`/movie-detail?movieId=${movie.id}`} className="group cursor-pointer block">
                          <div className="relative rounded-lg overflow-hidden border-2 border-[#FFCA20] aspect-[2/3] transition-all duration-300">
                            {/* Movie Image */}
                            <img
                              src={movie.image || `/img/movies${(movie.id % 4) + 1}.png`}
                              alt={movie.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = `/img/movies${(movie.id % 4) + 1}.png`;
                              }}
                            />
                            
                            {/* Gradient Overlay - like experience cards */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent"></div>
                            
                            {/* Tags */}
                            {isNewRelease && index === 0 && (
                              <div className="absolute top-2 left-2 z-10">
                                <span className="bg-[#FFCA20] text-black px-2 py-1 rounded-full text-[10px] font-bold">New releases</span>
                              </div>
                            )}
                            
                            {/* Glassmorphism Footer with Content - Transparent glass showing image through */}
                            <div className="absolute bottom-0 left-0 right-0 p-3 backdrop-blur-lg bg-black/10 border-t border-white/5">
                              <h3 className="text-sm font-bold text-white mb-2 line-clamp-1">{movie.title}</h3>
                              <div className="flex flex-col gap-1.5 text-xs text-white">
                                <div className="flex items-center gap-2">
                                  <Film size={12} className="text-[#FFCA20] flex-shrink-0" />
                                  <span className="text-white">{movie.genre || 'Action'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock size={12} className="text-[#FFCA20] flex-shrink-0" />
                                  <span className="text-white">{movie.duration || '1 hr 48 mins'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Volume2 size={12} className="text-[#FFCA20] flex-shrink-0" />
                                  <span className="text-white">{movie.language || 'English'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </div>
                    );
                    })
                  ) : (
                    !isLoading && (
                      <div className="col-span-2 text-center text-white py-8">
                        No movies available in this category
                      </div>
                    )
                  );
                })()}
            </div>
          </div>

          {/* Desktop: Horizontal Scrollable Movie List */}
          <div className="hidden md:block">
            <div className="overflow-x-auto scrollbar-hide pb-4">
              <div className="flex gap-4" style={{ width: 'max-content' }}>
                {(() => {
                  let moviesToShow = [];
                  switch(activeMovieTab) {
                    case 'now-showing':
                      moviesToShow = nowShowingMovies;
                      break;
                    case 'advance-booking':
                      moviesToShow = advanceBookingMovies;
                      break;
                    case 'coming-soon':
                      moviesToShow = comingSoonMovies;
                      break;
                    default:
                      moviesToShow = nowShowingMovies;
                  }

                  return moviesToShow.length > 0 ? (
                    moviesToShow.map((movie) => {
                      const releaseDate = movie.releaseDate ? new Date(movie.releaseDate.split('-').reverse().join('-')) : null;
                      const formattedDate = releaseDate ? releaseDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase() : '';
                      const isNewRelease = activeMovieTab === 'now-showing';
                      const isLastChance = activeMovieTab === 'now-showing' && Math.random() > 0.7;
                      
                      return (
                        <Link href={`/movie-detail?movieId=${encryptId(movie.id)}`} key={movie.id} className="shrink-0 w-48 lg:w-56">
              <div className="group cursor-pointer">
                <div className="relative rounded-lg overflow-hidden aspect-[2/3] mb-3">
                  <img 
                    src={movie.image}
                    alt={movie.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                onError={(e) => {
                                  e.target.src = `img/movies${(movie.id % 4) + 1}.png`;
                                }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex items-end justify-center pb-4">
                                <button className="bg-[#FFCA20] text-black p-3 rounded-full">
                      <Play size={20} fill="currentColor" />
                    </button>
                  </div>
                              {/* Tags */}
                              <div className="absolute top-3 left-3 flex flex-col gap-2">
                                {isNewRelease && (
                                  <span className="bg-[#FFCA20] text-black px-2 py-1 rounded text-xs font-bold">New releases</span>
                                )}
                                {isLastChance && (
                                  <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">LAST CHANCE</span>
                                )}
                                {activeMovieTab === 'advance-booking' || activeMovieTab === 'coming-soon' ? (
                                  formattedDate && (
                                    <span className="bg-black/80 text-white px-2 py-1 rounded text-xs font-bold">
                                      DI PAWAGAM {formattedDate.split(' ').slice(0, 3).join(' ').toUpperCase()}
                                    </span>
                                  )
                                ) : null}
                              </div>
                  </div>
                </div>
                        </Link>
                      );
                    })
                  ) : (
                    !isLoading && (
                      <div className="text-center text-[#D3D3D3] py-8 w-full">
                        No movies available in this category
                      </div>
                    )
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* View All Button - Centered at bottom */}
        <div className="flex justify-center mt-6 md:mt-8">
          <Link href="/movies" className="text-[#FFCA20] text-sm font-medium hover:text-[#FFCA20]/80 flex items-center gap-1">
            View all <ArrowRight size={16} />
          </Link>
        </div>
        </>
        )}
      </div>

      {/* Promotions Section */}
      {!isLoading && <Promotions/>}

      {/* Experience Our Hall Section */}
      {!isLoading && <ExperienceOurHall />}

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
            {/* Close button with high z-index and proper positioning */}
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