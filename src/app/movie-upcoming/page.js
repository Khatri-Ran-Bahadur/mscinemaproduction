"use client"
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, X, Film } from 'lucide-react';
import { movies, cinemas, shows } from '@/services/api';
import { APIError } from '@/services/api';
import Loader from '@/components/Loader';
import { encryptId, decryptId, encryptIds } from '@/utils/encryption';
import RatingIcon from '@/components/RatingIcon';
import { formatHallName } from '@/utils/hall';

import Header from '@/components/header';
import Footer from '@/components/footer';

// Movie Icon Component
const MovieIcon = ({ className = '' }) => (
  <svg 
    width="19" 
    height="19" 
    viewBox="0 0 19 19" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      fillRule="evenodd" 
      clipRule="evenodd" 
      d="M17.4992 11.875V16.875C17.4992 17.0408 17.4333 17.1997 17.3161 17.3169C17.1989 17.4342 17.04 17.5 16.8742 17.5H2.49919C2.33343 17.5 2.17446 17.4342 2.05725 17.3169C1.94004 17.1997 1.87419 17.04 1.87419 16.875V11.875H17.4992Z" 
      fill="#D3D3D3"
    />
    <path 
      fillRule="evenodd" 
      clipRule="evenodd" 
      d="M0.624192 8.21748V16.875C0.624192 17.3723 0.821736 17.8492 1.17337 18.2008C1.525 18.5524 2.00191 18.75 2.49919 18.75H16.8742C17.3715 18.75 17.8484 18.5524 18.2 18.2008C18.5516 17.8492 18.7492 17.3723 18.7492 16.875V8.13373C18.7492 7.96797 18.6833 7.809 18.5661 7.69179C18.4489 7.57458 18.29 7.50873 18.1242 7.50873H5.62044L10.2448 6.16873C10.2892 6.16113 10.3326 6.14855 10.3742 6.13123L17.2148 4.14873C17.2941 4.12557 17.368 4.08697 17.4323 4.03513C17.4966 3.9833 17.55 3.91926 17.5894 3.84671C17.6289 3.77416 17.6536 3.69452 17.6621 3.61238C17.6707 3.53024 17.6629 3.44722 17.6392 3.3681L17.0117 1.28935C16.8739 0.8322 16.5612 0.447894 16.1417 0.219927C15.7222 -0.00803951 15.2296 -0.061251 14.7711 0.0718533L1.44294 3.93435C1.18895 4.00782 0.952062 4.13096 0.74601 4.29665C0.539959 4.46234 0.36884 4.66727 0.242572 4.89958C0.116303 5.13189 0.0373964 5.38694 0.010424 5.64997C-0.0165484 5.91299 0.00895009 6.17875 0.0854417 6.43185L0.624192 8.21748ZM15.3523 8.75873L14.2298 10.625H17.4992V8.75873H15.3523ZM5.47982 10.625H8.39607L9.51857 8.75873H6.60232L5.47982 10.625ZM1.87419 10.625H4.02107L5.14357 8.75873H1.87419V10.625ZM9.85482 10.625H12.7711L13.8936 8.75873H10.9773L9.85482 10.625ZM3.28732 4.70185L5.06044 6.36998L1.66919 7.35248L1.28232 6.07123C1.25377 5.97635 1.24431 5.87677 1.25447 5.77821C1.26463 5.67966 1.29422 5.5841 1.34152 5.49705C1.38882 5.41 1.45291 5.33318 1.53007 5.27103C1.60723 5.20889 1.69593 5.16265 1.79107 5.13498L3.28732 4.70185ZM4.68169 4.29748L6.45482 5.9656L8.90669 5.25498L7.13357 3.58685L4.68169 4.29748ZM8.52794 3.18248L10.3011 4.85123L13.0742 4.04748L11.3011 2.37873L8.52794 3.18248ZM14.4686 3.6431L12.6954 1.97498L15.1192 1.27248C15.2617 1.23108 15.4147 1.24758 15.5451 1.31838C15.6754 1.38918 15.7726 1.50857 15.8154 1.6506L16.2598 3.12435L14.4686 3.6431Z" 
      fill="#D3D3D3"
    />
  </svg>
);

export default function MovieUpcoming() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const encryptedMovieId = searchParams?.get('movieId');
  const movieId = encryptedMovieId ? decryptId(encryptedMovieId) : null;
  const cinemaId = '7001';
  
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateObj, setSelectedDateObj] = useState(null);
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [movieDetails, setMovieDetails] = useState(null);
  const [cinemasList, setCinemasList] = useState([]);
  const [allShowTimes, setAllShowTimes] = useState([]); 
  const [filteredShowTimes, setFilteredShowTimes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [showMovieInfoModal, setShowMovieInfoModal] = useState(false);
  const [showAgeConfirmationModal, setShowAgeConfirmationModal] = useState(false);
  const [availableDates, setAvailableDates] = useState([]);
  const [showTimeRestrictionModal, setShowTimeRestrictionModal] = useState(false);
  const [isShowTimesLoading, setIsShowTimesLoading] = useState(false);
  const [isAgeConfirmed, setIsAgeConfirmed] = useState(false);
  
  const hasLoadedMovieDetails = useRef(false);
  const hasLoadedCinemas = useRef(false);
  const hasLoadedShowTimes = useRef(false);
  const hasLoadedShowDates = useRef(false);
  const lastMovieId = useRef(null);
  const isLoadingData = useRef(false);

  useEffect(() => {
    if (!movieId || !cinemaId) return;

    if (lastMovieId.current !== movieId) {
      hasLoadedMovieDetails.current = false;
      hasLoadedCinemas.current = false;
      hasLoadedShowTimes.current = false;
      hasLoadedShowDates.current = false;
      lastMovieId.current = movieId;
    }

    const loadData = async () => {
      if (isLoadingData.current) return;
      isLoadingData.current = true;
      
      try {
        const moviesData = await movies.getMovies();
        const allMovies = Array.isArray(moviesData) ? moviesData : [];
        
        if (!hasLoadedMovieDetails.current) {
          await loadMovieDetails(allMovies);
          hasLoadedMovieDetails.current = true;
        }
        
        setIsLoading(false);
        
        if (!hasLoadedCinemas.current || !hasLoadedShowTimes.current) {
          setIsShowTimesLoading(true);
          const result = await loadCinemasAndShowTimes();
          hasLoadedCinemas.current = true;
          hasLoadedShowTimes.current = true;
          hasLoadedShowDates.current = true;
          
          if (result && result.firstDateObj && result.allShowTimes) {
            filterShowTimesByDateAndMovie(result.firstDateObj, false, result.allShowTimes);
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to load movie data');
        setIsLoading(false);
      } finally {
        setIsShowTimesLoading(false);
        isLoadingData.current = false;
      }
    };
    
    loadData();
  }, [movieId, cinemaId]);

  useEffect(() => {
    if (movieDetails?.type && !selectedExperience) {
      setSelectedExperience(movieDetails.type);
    }
  }, [movieDetails]);

  useEffect(() => {
    if (selectedDateObj && allShowTimes.length > 0 && movieId) {
      filterShowTimesByDateAndMovie(selectedDateObj);
    }
  }, [selectedDateObj, allShowTimes, movieId, selectedExperience]);

  const filterShowTimesByDateAndMovie = (dateObj, restoreShowTime = false, showTimesOverride = null) => {
    const sourceShowTimes = showTimesOverride || allShowTimes;
    if (!dateObj || sourceShowTimes.length === 0 || !movieId) {
      setFilteredShowTimes([]);
      return;
    }

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const selectedDateStr = `${year}-${month}-${day}`;

    const filtered = sourceShowTimes.filter((show) => {
      const showMovieID = show.movieID || show.movieId;
      const movieIdNum = parseInt(movieId);
      const showMovieIdNum = parseInt(showMovieID);
      
      if (showMovieIdNum !== movieIdNum && String(showMovieID) !== String(movieId)) {
        return false;
      }

      if (show.showDate) {
        const showDateStr = show.showDate.split('T')[0].split(' ')[0];
        if (showDateStr !== selectedDateStr) return false;
      } else {
        return false;
      }

      return true;
    });

    filtered.sort((a, b) => {
      const timeA = a.showTime ? new Date(a.showTime).getTime() : 0;
      const timeB = b.showTime ? new Date(b.showTime).getTime() : 0;
      return timeA - timeB;
    });

    setFilteredShowTimes(filtered);
  };

  const loadMovieDetails = async (allMovies) => {
    if (!movieId) return;
    setError('');
    
    try {
      const movieIdNum = parseInt(movieId);
      const movie = allMovies.find(m => {
        const mId = m.movieID || m.movieId || m.id;
        return mId === movieIdNum || mId === movieId || String(mId) === String(movieId);
      });
      
      if (movie) {
        setMovieDetails(movie);
      } else {
        throw new Error(`Movie not found`);
      }
    } catch (err) {
      setError(err.message || 'Movie not found.');
    }
  };

  const loadCinemasAndShowTimes = async () => {
    try {
      const cinemasData = await cinemas.getCinemas();
      setCinemasList(Array.isArray(cinemasData) ? cinemasData : []);

      if (cinemaId) {
        const showTimesData = await shows.getShowTimes(cinemaId);
        const transformedShowTimes = Array.isArray(showTimesData) 
          ? showTimesData.map((show) => ({
              id: show.showID || show.showId || show.id,
              movieID: show.movieID || show.movieId,
              showDate: show.showDate,
              showTime: show.showTime,
              hallName: formatHallName(show.hallName || 'HALL - 1'),
              sellingStatus: show.sellingStatus !== undefined ? show.sellingStatus : 0,
              allowOnlineSales: show.allowOnlineSales !== undefined ? show.allowOnlineSales : true,
              time: show.showTime 
                ? new Date(show.showTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                : '10:00 AM',
            }))
          : [];
        
        setAllShowTimes(transformedShowTimes);
        
        const movieIdNum = parseInt(movieId);
        const movieShowTimes = transformedShowTimes.filter(s => parseInt(s.movieID) === movieIdNum);

        const uniqueDatesMap = new Map();
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

        movieShowTimes.forEach(item => {
          const showDateStr = item.showDate;
          if (!showDateStr) return;
          const dateParts = showDateStr.split('T')[0].split(' ')[0].split('-');
          if (dateParts.length === 3) {
            const year = parseInt(dateParts[0], 10);
            const month = parseInt(dateParts[1], 10) - 1;
            const day = parseInt(dateParts[2], 10);
            const dateObj = new Date(year, month, day);
            dateObj.setHours(0, 0, 0, 0);
            const fullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            if (!uniqueDatesMap.has(fullDate)) {
              uniqueDatesMap.set(fullDate, {
                day: day.toString(),
                date: days[dateObj.getDay()],
                month: months[dateObj.getMonth()],
                dateObj: dateObj,
                showDate: fullDate
              });
            }
          }
        });

        const dates = Array.from(uniqueDatesMap.values()).sort((a, b) => a.dateObj - b.dateObj);
        setAvailableDates(dates);
        
        let firstDateObj = null;
        if (!selectedDate && dates.length > 0) {
          setSelectedDate(dates[0].day);
          setSelectedDateObj(dates[0].dateObj);
          firstDateObj = dates[0].dateObj;
        }
        
        return { allShowTimes: transformedShowTimes, dates, firstDateObj };
      }
      return null;
    } catch (err) {
      console.error('Error loading data:', err);
      throw err;
    }
  };

  const proceedToTicketType = (indexOverride) => {
    const targetIndex = (indexOverride !== undefined && indexOverride !== null) ? indexOverride : selectedTime;
    if (targetIndex !== null) {
      const show = filteredShowTimes[targetIndex];
      const showId = show.id;
      const showTimeParam = show.showTime ? encodeURIComponent(show.showTime) : '';
      const showDateParam = show.showDate ? encodeURIComponent(show.showDate) : '';
      const experienceType = selectedExperience || movieDetails?.type || '2D';
      const encrypted = encryptIds({ cinemaId, showId, movieId });
      router.push(`/ticket-type?cinemaId=${encrypted.cinemaId}&showId=${encrypted.showId}&movieId=${encrypted.movieId}&showTime=${showTimeParam}&showDate=${showDateParam}&experienceType=${encodeURIComponent(experienceType)}`);
    }
  };

  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date.day);
    setSelectedDateObj(date.dateObj);
    setSelectedTime(null);
  };

  const experiences = ['IMAX', '2D', '3D', 'ATMOS'];
  const movieType = movieDetails?.type || '2D';

  const movieTitle = movieDetails?.movieName?.replace(/^\./, '') || 'Movie Title';
  const movieImage = movieDetails?.imageURL || 'img/banner.jpg';
  const movieGenre = movieDetails?.genre || 'Action';
  const movieDuration = movieDetails?.duration || '';
  const movieLanguage = movieDetails?.language || 'English';
  const movieRating = movieDetails?.rating || 'U/A';
  const movieSynopsis = movieDetails?.synopsis || '';
  const movieCast = movieDetails?.cast || '';
  const movieDirector = movieDetails?.director || '';
  const movieReleaseDate = movieDetails?.releaseDate || '';
  const trailerUrl = movieDetails?.trailerUrl || '';
  const trailerVideoId = getYouTubeVideoId(trailerUrl);

  if (isLoading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><Loader size="large" fullScreen={true} /></div>;
  if (error && !movieDetails) return <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center"><div className="text-center"><p className="text-red-400 mb-4">{error}</p><button onClick={() => window.location.reload()} className="px-4 py-2 bg-[#FFCA20] text-black rounded">Retry</button></div></div>;
  
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#D3D3D3]">
      <Header />
      <div className="pt-14">
        <div className="relative">
          <div className="relative h-[250px] md:h-[450px] overflow-hidden">
            {movieDetails ? (
              <>
                <img src={movieImage} alt={movieTitle} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/40 to-black/20" />
                <div className="absolute bottom-4 left-6 md:bottom-10 md:left-12 flex flex-col md:flex-row items-end justify-between w-[calc(100%-3rem)] md:w-[calc(100%-6rem)]">
                  <div>
                    <h1 className="text-2xl md:text-5xl font-bold mb-3 text-[#FAFAFA] tracking-tight">{movieTitle}</h1>
                    <div className="flex flex-wrap items-center gap-3 text-sm md:text-base text-[#D3D3D3] mb-4">
                       <span>{movieDuration}</span>
                       <span className="opacity-50">•</span>
                       <span className="uppercase">{movieLanguage}</span>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0">
                    <RatingIcon rating={movieRating} className="w-12 h-12 md:w-16 md:h-16" />
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>

        {movieDetails && (availableDates.length > 0 || isShowTimesLoading) ? (
          <div className="mt-4">
            <div className="mb-6 px-6 md:px-8">
              <h2 className="text-xs font-bold mb-4 text-[#FAFAFA] uppercase tracking-widest opacity-60">Select Date</h2>
              <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                {availableDates.map((date, index) => {
                  const isSelected = selectedDate === date.day;
                  const dateObj = date.dateObj;
                  return (
                    <button
                      key={index}
                      onClick={() => handleDateSelect(date)}
                      className={`min-w-[75px] h-[95px] rounded-xl flex flex-col items-center justify-center transition shrink-0 ${isSelected ? 'bg-[#FFCA20] text-black shadow-lg shadow-[#FFCA20]/20' : 'bg-[#1a1a1a] text-[#FAFAFA] border border-[#2a2a2a]'}`}
                    >
                      <span className={`text-[10px] uppercase font-bold mb-1 ${isSelected ? 'text-black' : 'text-gray-500'}`}>{date.date}</span>
                      <span className="text-2xl font-black">{date.day}</span>
                      <span className={`text-[10px] uppercase font-bold mt-1 ${isSelected ? 'text-black' : 'text-gray-500'}`}>{date.month}</span>
                    </button>
                  );
                })}
              </div>
              {availableDates.length > 0 && <div className="border-b border-[#2a2a2a] mt-4 opacity-50"></div>}
            </div>

            <div className="mb-6 px-6 md:px-8">
              <h2 className="text-xs font-bold mb-4 text-[#FAFAFA] uppercase tracking-widest opacity-60">Select Experience</h2>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {experiences.map((exp) => (
                  <button
                    key={exp}
                    onClick={() => { if (exp === movieType) setSelectedExperience(exp); }}
                    disabled={exp !== movieType}
                    className={`px-8 py-3 rounded-lg text-sm font-bold transition shrink-0 ${selectedExperience === exp ? 'bg-[#FFCA20] text-black' : exp !== movieType ? 'bg-[#1a1a1a] text-[#444] border border-[#2a2a2a] cursor-not-allowed' : 'bg-[#1a1a1a] text-[#FAFAFA] border border-[#2a2a2a]'}`}
                  >
                    {exp}
                  </button>
                ))}
              </div>
              <div className="border-b border-[#2a2a2a] mt-6 opacity-50"></div>
            </div>

            <div className="mb-10 px-6 md:px-8">
              <h2 className="text-xs font-bold mb-4 text-[#FAFAFA] uppercase tracking-widest opacity-60">Select Time</h2>
              <div className="bg-[#111] rounded-2xl p-6 border border-[#2a2a2a] relative min-h-[150px]">
                {isShowTimesLoading && <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20 rounded-2xl backdrop-blur-sm"><Loader size="medium" /></div>}
                {filteredShowTimes.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                    {filteredShowTimes.map((show, idx) => (
                      <button
                        key={idx}
                        onClick={() => { setSelectedTime(idx); proceedToTicketType(idx); }}
                        className="p-4 rounded-xl border-2 border-[#FFCA20] bg-[#FFCA20] text-black font-black hover:scale-105 active:scale-95 transition"
                      >
                        <div className="text-lg">{show.time}</div>
                        <div className="text-[10px] mt-1 uppercase opacity-60 font-bold">{show.hallName}</div>
                      </button>
                    ))}
                  </div>
                ) : !isShowTimesLoading ? (
                  <div className="text-center text-gray-500 py-10 font-bold uppercase tracking-widest text-xs">No show times available</div>
                ) : null}
                <div className="mt-8 pt-6 border-t border-[#2a2a2a]">
                  {cinemasList.map((cinema, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs text-gray-400">
                      <MovieIcon className="w-4 h-4" />
                      <span className="font-bold">{cinema.displayName}</span>
                      <span className="opacity-50" dangerouslySetInnerHTML={{ __html: cinema.address }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : movieDetails && (
          <div className="px-6 md:px-8 py-20 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-6">
               <Film className="text-gray-600" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-wide">Advance Booking</h2>
            <p className="text-gray-500 max-w-sm mb-8 italic">Stay tuned! Online booking for this movie will be available shortly.</p>
            <div className="flex gap-4">
              <button onClick={() => setShowTrailerModal(true)} className="px-8 py-3 bg-white/5 border border-white/20 rounded-lg hover:bg-white/10 transition font-bold uppercase text-xs tracking-widest">Watch Trailer</button>
              <button onClick={() => setShowMovieInfoModal(true)} className="px-8 py-3 bg-[#FFCA20] text-black rounded-lg hover:bg-[#FFCA20]/90 transition font-bold uppercase text-xs tracking-widest">Movie Info</button>
            </div>
          </div>
        )}

        {showTrailerModal && (
          <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[100] p-4" onClick={() => setShowTrailerModal(false)}>
            <div className="relative w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowTrailerModal(false)} className="absolute top-4 right-4 z-10 bg-black/80 p-3 rounded-full text-white hover:bg-black transition border border-white/20"><X size={24}/></button>
              <div className="relative w-full aspect-video">
                <iframe className="absolute inset-0 w-full h-full" src={`https://www.youtube.com/embed/${trailerVideoId}?autoplay=1`} allowFullScreen />
              </div>
            </div>
          </div>
        )}

        {showMovieInfoModal && (
          <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[100] p-4 overflow-y-auto" onClick={() => setShowMovieInfoModal(false)}>
            <div className="bg-[#111] rounded-2xl max-w-2xl w-full p-8 relative border border-white/10" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowMovieInfoModal(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition"><X size={24}/></button>
              <h2 className="text-3xl font-black mb-6 text-white uppercase italic tracking-tighter">{movieTitle}</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <img src={movieImage} className="rounded-xl w-full h-80 object-cover shadow-2xl" alt="" />
                <div className="space-y-4 text-sm">
                  <p><span className="text-gray-500 uppercase font-black text-[10px]">Genre</span><br/>{movieGenre}</p>
                  <p><span className="text-gray-500 uppercase font-black text-[10px]">Duration</span><br/>{movieDuration}</p>
                  <p><span className="text-gray-500 uppercase font-black text-[10px]">Language</span><br/>{movieLanguage}</p>
                  <p><span className="text-gray-500 uppercase font-black text-[10px]">Release</span><br/>{movieReleaseDate}</p>
                </div>
              </div>
              <p className="mt-8 text-gray-400 text-sm leading-relaxed">{movieSynopsis}</p>
              <div className="mt-8 flex gap-4">
                <button onClick={() => { setShowMovieInfoModal(false); setShowTrailerModal(true); }} className="px-8 py-3 bg-white text-black rounded-lg font-black uppercase text-xs">Watch Trailer</button>
                <button onClick={() => setShowMovieInfoModal(false)} className="px-8 py-3 bg-[#222] text-white rounded-lg font-black uppercase text-xs">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

function TimeRestrictionModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1c1c1c] rounded-lg max-w-md w-full p-6 border border-[#2a2a2a]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white uppercase tracking-tighter italic">Restriction</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition"><X size={24} /></button>
        </div>
        <p className="text-white/60 text-sm mb-6">Online booking for this show is currently closed. Please visit the box office directly. Thank you!</p>
        <button onClick={onClose} className="w-full bg-[#333] hover:bg-[#444] text-white font-bold py-3 rounded-xl transition uppercase text-xs">Understood</button>
      </div>
    </div>
  );
}
