'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, Star, ChevronLeft, ChevronRight, ArrowRight, Film, Clock, Volume2 } from 'lucide-react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { movies as moviesAPI } from '@/services/api';
import { APIError } from '@/services/api';
import { ExperienceOurHall } from '@/components/Homepage/ExperienceOurHall';
import { Promotions } from '@/components/Homepage/Promotions';
import Loader from '@/components/Loader';

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

  // Ensure currentSlide doesn't exceed available movies
  useEffect(() => {
    if (currentSlide >= heroMovies.length && heroMovies.length > 0) {
      setCurrentSlide(0);
    }
  }, [heroMovies.length, currentSlide]);

  useEffect(() => {
    loadMovies();
  }, []);

  const loadMovies = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await moviesAPI.getMovies();
      
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No movies data received');
      }

      // Transform API data to match component structure
      const transformedMovies = data.map((movie) => ({
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

      // Advance Booking: Movies releasing in future (within next 30 days)
      const advanceBooking = transformedMovies.filter(movie => {
        if (!movie.releaseDate) return false;
        const releaseDate = new Date(movie.releaseDate.split('-').reverse().join('-'));
        releaseDate.setHours(0, 0, 0, 0);
        const daysDiff = Math.ceil((releaseDate - today) / (1000 * 60 * 60 * 24));
        return releaseDate > today && daysDiff <= 30;
      });

      // Coming Soon: Movies releasing later
      const comingSoon = transformedMovies.filter(movie => {
        if (!movie.releaseDate) return false;
        const releaseDate = new Date(movie.releaseDate.split('-').reverse().join('-'));
        releaseDate.setHours(0, 0, 0, 0);
        const daysDiff = Math.ceil((releaseDate - today) / (1000 * 60 * 60 * 24));
        return releaseDate > today && daysDiff > 30;
      });

      // Top Rated: Movies sorted by rating
      const topRated = [...transformedMovies].sort((a, b) => {
        const ratingA = parseFloat(a.rating) || 0;
        const ratingB = parseFloat(b.rating) || 0;
        return ratingB - ratingA;
      }).slice(0, 10);

      // Set all movie categories
      setNowShowingMovies(nowShowing.map(movie => ({
        id: movie.id,
        title: movie.title,
        image: movie.image,
        rating: movie.rating,
        language: movie.language,
        type: movie.type,
        releaseDate: movie.releaseDate,
        showType: movie.showType,
      })));

      setAdvanceBookingMovies(advanceBooking.map(movie => ({
        id: movie.id,
        title: movie.title,
        image: movie.image,
        rating: movie.rating,
        language: movie.language,
        type: movie.type,
        releaseDate: movie.releaseDate,
      })));

      setComingSoonMovies(comingSoon.map(movie => ({
        id: movie.id,
        title: movie.title,
        image: movie.image,
        rating: movie.rating,
        language: movie.language,
        type: movie.type,
        releaseDate: movie.releaseDate,
      })));

      setTopRatedMovies(topRated.map(movie => ({
        id: movie.id,
        title: movie.title,
        image: movie.image,
        rating: movie.rating,
        language: movie.language,
        type: movie.type,
        releaseDate: movie.releaseDate,
      })));

      // Set featured movies (now showing by default)
      setFeaturedMovies(nowShowing.slice(0, 10).map(movie => ({
        id: movie.id,
        title: movie.title,
        image: movie.image,
        rating: movie.rating,
        language: movie.language,
        type: movie.type,
        releaseDate: movie.releaseDate,
      })));

      // Update hero movies with first 5 now showing movies for carousel
      if (nowShowing.length > 0) {
        const heroMoviesList = nowShowing.slice(0, 5).map(movie => ({
          title: movie.title.toUpperCase(),
          subtitle: movie.title,
          image: movie.image || "img/banner1.jpg",
          type: movie.type || "2D"
        }));
        setHeroMovies(heroMoviesList);
      } else {
        // If no movies, set empty array (don't show default)
        setHeroMovies([]);
      }

    } catch (err) {
      console.error('Error loading movies:', err);
      if (err instanceof APIError) {
        setError(err.message || 'Failed to load movies');
      } else {
        setError('An unexpected error occurred');
      }
      // Don't set default movies on error - just show error message
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

  return (
    <div className="bg-black min-h-screen text-[#D3D3D3]">
      <Header/>

      {/* Hero Section - Full Banner View */}
      {heroMovies.length > 0 ? (
      <div className="relative h-[60vh] md:h-screen">
        <div className="absolute inset-0">
          <img 
            src={heroMovies[currentSlide]?.image || "img/banner1.jpg"}
            alt={heroMovies[currentSlide]?.title || "Movie"}
            className="w-full h-full object-cover"
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
        
        <div className="relative h-full px-4 md:px-6 lg:px-16 z-10">
          <div className="absolute bottom-12 md:bottom-20 lg:bottom-28 left-4 md:left-6 lg:left-16 max-w-3xl w-[calc(100%-2rem)] md:w-auto">
            <h1 className="text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-2 text-[#FAFAFA] uppercase tracking-tight leading-tight drop-shadow-lg">
              {heroMovies[currentSlide]?.title || ""}
            </h1>
            <h2 className="text-base md:text-xl lg:text-2xl font-normal mb-3 md:mb-4 text-[#FAFAFA] drop-shadow-md">
              {heroMovies[currentSlide]?.subtitle || ""}
            </h2>

            <div className="flex items-center space-x-2 md:space-x-3 mb-4 md:mb-6 text-xs md:text-sm text-[#FAFAFA] drop-shadow-md">
              <span>
                {heroMovies[currentSlide]?.type || "2D"}
              </span>
              <span className="text-[#FAFAFA]/50">|</span>
              <span>ATMOS</span>
            </div>

            <div className="flex flex-row space-x-2 md:space-x-3 lg:space-x-4 mb-4 md:mb-6">
              <button className="bg-transparent border-2 border-[#FFCA20] text-[#FFCA20] px-3 md:px-6 lg:px-8 py-2 md:py-2.5 lg:py-3 rounded font-semibold hover:bg-[#FFCA20] hover:text-black transition text-xs md:text-sm uppercase tracking-wide whitespace-nowrap shadow-lg flex-1 md:flex-initial">
                Watch trailer
              </button>

              <Link 
                href={nowShowingMovies[0]?.id ? `/movie-detail?movieId=${nowShowingMovies[0].id}` : '/movie-detail'}
                className="bg-[#FFCA20] text-black px-3 md:px-6 lg:px-8 py-2 md:py-2.5 lg:py-3 rounded font-semibold hover:bg-[#FFCA20]/90 transition text-xs md:text-sm uppercase tracking-wide inline-block text-center whitespace-nowrap shadow-lg flex-1 md:flex-initial"
              >
                Book now
              </Link>
            </div>
          </div>

          {/* Carousel Dots - Centered on screen */}
          <div className="absolute bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 flex justify-center gap-2 z-20">
            {heroMovies.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition shadow-md ${
                  currentSlide === index ? 'bg-[#FFCA20]' : 'bg-[#FFCA20]/30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
      ) : null}

      {/* Movie Listings Section */}
      <div className="px-4 md:px-6 lg:px-16 py-8 md:py-12">
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
            <div className="overflow-x-auto scrollbar-hide pb-4 -mx-6 lg:-mx-16 px-6 lg:px-16">
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
                        <Link href={`/movie-detail?movieId=${movie.id}`} key={movie.id} className="shrink-0 w-48 lg:w-56">
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

      <Footer />
    </div>
  );
}