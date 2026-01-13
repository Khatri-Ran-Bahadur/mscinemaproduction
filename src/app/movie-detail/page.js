"use client"
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, X } from 'lucide-react';
import { movies, cinemas, shows } from '@/services/api';
import { APIError } from '@/services/api';
import Loader from '@/components/Loader';
import SeatStatusIcon from '@/components/SeatStatusIcon';
import { encryptId, decryptId, encryptIds, decryptIds } from '@/utils/encryption';

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
      d="M17.4992 11.875V16.875C17.4992 17.0408 17.4333 17.1997 17.3161 17.3169C17.1989 17.4342 17.04 17.5 16.8742 17.5H2.49919C2.33343 17.5 2.17446 17.4342 2.05725 17.3169C1.94004 17.1997 1.87419 17.0408 1.87419 16.875V11.875H17.4992Z" 
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

export default function MovieBooking() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const encryptedMovieId = searchParams?.get('movieId');
  const movieId = encryptedMovieId ? decryptId(encryptedMovieId) : null;
  // Always use this cinema ID since there's only one cinema
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
  const [moviesList, setMoviesList] = useState([]);
  const [showTimeRestrictionModal, setShowTimeRestrictionModal] = useState(false);
  
  // Refs to prevent duplicate API calls
  const hasLoadedMovies = useRef(false);
  const hasLoadedMovieDetails = useRef(false);
  const hasLoadedCinemas = useRef(false);
  const hasLoadedShowTimes = useRef(false);
  const hasLoadedShowDates = useRef(false);
  const lastMovieId = useRef(null);

  useEffect(() => {
    // Reset refs when movieId actually changes
    if (movieId && lastMovieId.current !== movieId) {
      hasLoadedMovieDetails.current = false;
      hasLoadedCinemas.current = false;
      hasLoadedShowTimes.current = false;
      hasLoadedShowDates.current = false;
      lastMovieId.current = movieId;
    }
    
    // Load all data in sequence to prevent duplicate calls
    const loadData = async () => {
      // Step 1: Load movies list first (only once per session)
      let allMoviesData = [];
      if (!hasLoadedMovies.current) {
        hasLoadedMovies.current = true; // Set immediately to prevent duplicate calls
        allMoviesData = await loadMoviesList();
      } else {
        // If already loaded, use existing moviesList state
        // Wait a bit for state to update if needed
        if (moviesList.length === 0) {
          // Wait up to 500ms for state to update
          for (let i = 0; i < 10; i++) {
            await new Promise(resolve => setTimeout(resolve, 50));
            if (moviesList.length > 0) {
              allMoviesData = moviesList;
              break;
            }
          }
          // If still empty, fetch fresh (shouldn't happen but safety net)
          if (allMoviesData.length === 0) {
            allMoviesData = await loadMoviesList();
          }
        } else {
          allMoviesData = moviesList;
        }
      }
      
      // Step 2: Load movie details (uses movies data from step 1 - no additional API call)
      if (movieId && !hasLoadedMovieDetails.current) {
        hasLoadedMovieDetails.current = true; // Set immediately to prevent duplicate calls
        await loadMovieDetails(allMoviesData);
      }
      
      // Step 3: Load show dates for the movie (if not already loaded)
      if (movieId && cinemaId && !hasLoadedShowDates.current) {
        await loadShowDatesForMovie();
      }
      
      // Step 4: Load cinemas and show times (only once per movieId)
      if (movieId && (!hasLoadedCinemas.current || !hasLoadedShowTimes.current)) {
        hasLoadedCinemas.current = true; // Set immediately to prevent duplicate calls
        hasLoadedShowTimes.current = true; // Set immediately to prevent duplicate calls
        await loadCinemasAndShowTimes();
      }
      
      // All data loaded, hide main loader
      setIsLoading(false);
    };
    
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movieId, cinemaId]);

  // Auto-select experience when movie details are loaded
  useEffect(() => {
    if (movieDetails?.type && !selectedExperience) {
      setSelectedExperience(movieDetails.type);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movieDetails]);

  // Filter show times when date, movie, or experience changes
  useEffect(() => {
    if (selectedDateObj && allShowTimes.length > 0 && movieId) {
      // Check if we're returning from ticket-type page
      const hasLastSelectedShowTime = localStorage.getItem('lastSelectedShowTime');
      filterShowTimesByDateAndMovie(selectedDateObj, !!hasLastSelectedShowTime);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDateObj, allShowTimes, movieId, selectedExperience]);

  const loadMoviesList = async () => {
    try {
      const data = await movies.getMovies();
      const moviesArray = Array.isArray(data) ? data : [];
      setMoviesList(moviesArray.slice(0, 10)); // For display purposes
      return moviesArray; // Return full array for movie details lookup
    } catch (err) {
      console.error('Error loading movies list:', err);
      setMoviesList([]);
      hasLoadedMovies.current = false; // Reset on error to allow retry
      return [];
    }
  };

  // This useEffect is now handled by the one below that includes movieId and selectedExperience

  // Load show dates from API and filter by movie and cinema
  const loadShowDatesForMovie = async () => {
    if (!movieId || !cinemaId || hasLoadedShowDates.current) return;
    
    try {
      hasLoadedShowDates.current = true;
      setError('');
      
      // Fetch all show dates from API
      const allShowDates = await shows.getShowDates();
      
      if (!Array.isArray(allShowDates) || allShowDates.length === 0) {
        setAvailableDates([]);
        return;
      }

      // Filter show dates for current movie and cinema
      const movieIdNum = parseInt(movieId);
      const cinemaIdNum = parseInt(cinemaId);
      
      const filteredShowDates = allShowDates.filter(item => {
        const itemMovieId = parseInt(item.movieID || item.movieId || 0);
        const itemCinemaId = parseInt(item.cinemaID || item.cinemaId || 0);
        
        return itemMovieId === movieIdNum && itemCinemaId === cinemaIdNum;
      });

      // Process show dates and convert to display format
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      
      // Extract unique dates and convert format
      const uniqueDatesMap = new Map();
      
      filteredShowDates.forEach(item => {
        const showDateStr = item.showDate || item.ShowDate || item.date;
        if (!showDateStr) return;
        
        // Parse DD-MM-YYYY format to Date object
        const dateParts = showDateStr.split('-');
        if (dateParts.length === 3) {
          const day = parseInt(dateParts[0], 10);
          const month = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed
          const year = parseInt(dateParts[2], 10);
          
          const dateObj = new Date(year, month, day);
          dateObj.setHours(0, 0, 0, 0);
          
          // Use YYYY-MM-DD as key for uniqueness
          const fullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          
          if (!uniqueDatesMap.has(fullDate)) {
            uniqueDatesMap.set(fullDate, {
              day: day.toString(),
              date: days[dateObj.getDay()],
              month: months[dateObj.getMonth()],
              fullDate: fullDate,
              dateObj: dateObj,
              showDate: showDateStr // Keep original format
            });
          }
        }
      });
      
      // Convert map to array and sort chronologically
      const dates = Array.from(uniqueDatesMap.values()).sort((a, b) => a.dateObj - b.dateObj);
      
      setAvailableDates(dates);
      
      // Auto-select first available date if no date is selected
      if (!selectedDate && dates.length > 0) {
        setSelectedDate(dates[0].day);
        setSelectedDateObj(dates[0].dateObj);
      }
      
      
    } catch (err) {
      console.error('Error loading show dates:', err);
      hasLoadedShowDates.current = false; // Reset on error to allow retry
      setError('Failed to load show dates. Please try again.');
      // Fallback to empty dates array
      setAvailableDates([]);
    }
  };

  // Filter show times by selected date, movieID, and experience type
  const filterShowTimesByDateAndMovie = (dateObj, restoreShowTime = false) => {
    if (!dateObj || allShowTimes.length === 0 || !movieId) {
      setFilteredShowTimes([]);
      return;
    }

    // Get the selected date in YYYY-MM-DD format for comparison (use local date, not UTC)
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const selectedDateStr = `${year}-${month}-${day}`;

    // Filter show times that match:
    // 1. Selected date (showDate format: YYYY-MM-DD)
    // 2. Movie ID
    // 3. Experience type (if selected)
    const filtered = allShowTimes.filter((show) => {
      // Match movieID - handle both string and number comparison
      const showMovieID = show.movieID || show.movieId;
      const movieIdNum = parseInt(movieId);
      const showMovieIdNum = parseInt(showMovieID);
      
      if (showMovieIdNum !== movieIdNum && String(showMovieID) !== String(movieId)) {
        return false;
      }

      // Match date - API returns showDate in YYYY-MM-DD format
      if (show.showDate) {
        // Handle both YYYY-MM-DD and YYYY-MM-DDTHH:mm:ss formats
        const showDateStr = show.showDate.split('T')[0].split(' ')[0]; // Get YYYY-MM-DD
        if (showDateStr !== selectedDateStr) {
          return false;
        }
      } else {
        return false; // If no showDate, exclude it
      }

      // Match experience type if selected
      if (selectedExperience) {
        // The API doesn't have experience type in show times, so we'll use movie type
        // But we can still filter if needed based on hall or other criteria
        // For now, we'll show all times for the selected date and movie
      }

      // Only show times that allow online sales (but show them anyway, just mark as unavailable)
      // Don't filter out - let user see all times but disable those with allowOnlineSales: false
      // if (show.allowOnlineSales === false) {
      //   return false;
      // }

      return true;
    });

    // Sort by show time
    filtered.sort((a, b) => {
      const timeA = a.showTime ? new Date(a.showTime).getTime() : 0;
      const timeB = b.showTime ? new Date(b.showTime).getTime() : 0;
      return timeA - timeB;
    });

    console.log('Filtered show times for date', selectedDateStr, 'movie', movieId, ':', filtered.length, filtered);
    console.log('All show times:', allShowTimes.length);
    console.log('Selected date string:', selectedDateStr);
    console.log('Movie ID:', movieId, 'Type:', typeof movieId);
    console.log('Sample show time:', allShowTimes[0]);
    setFilteredShowTimes(filtered);
    
    // Restore show time selection if coming back from ticket-type page
    if (restoreShowTime) {
      const lastSelectedShowTime = localStorage.getItem('lastSelectedShowTime');
      if (lastSelectedShowTime && filtered.length > 0) {
        try {
          const showTimeData = JSON.parse(lastSelectedShowTime);
          localStorage.removeItem('lastSelectedShowTime');
          
          // Find the matching show time index in filtered array
          const matchingShowIndex = filtered.findIndex(show => {
            const showId = show.showID || show.id;
            return showId == showTimeData.showId;
          });
          
          if (matchingShowIndex !== -1) {
            // Restore the selected time
            setTimeout(() => {
              setSelectedTime(matchingShowIndex);
            }, 100);
          }
        } catch (e) {
          console.error('Error restoring show time selection:', e);
        }
      }
    }
  };

  const loadMovieDetails = async (allMoviesData) => {
    if (!movieId) return;
    
    setError(''); // Clear previous errors
    
    try {
      // Use provided movies data (from loadMoviesList - no additional API call)
      let allMovies = allMoviesData;
      
      // Ensure allMovies is an array
      if (!Array.isArray(allMovies)) {
        allMovies = [];
      }
      
      // If empty, something went wrong - but don't fetch again
      if (allMovies.length === 0) {
        throw new Error('Movies list is empty. Please refresh the page.');
      }
      
      // Find the movie by ID (handle different ID formats)
      const movieIdNum = parseInt(movieId);
      const movie = allMovies.find(m => {
        const mId = m.movieID || m.movieId || m.id;
        // Try multiple comparison methods
        return mId === movieIdNum || 
               mId === movieId || 
               String(mId) === String(movieId) ||
               parseInt(mId) === movieIdNum;
      });
      
      if (movie) {
        setMovieDetails(movie);
        setError(''); // Clear any previous errors
      } else {
        // Movie not found in the list
        throw new Error(`Movie with ID ${movieId} not found`);
      }
    } catch (err) {
      hasLoadedMovieDetails.current = false; // Reset on error to allow retry
      if (err instanceof APIError) {
        setError(err.message || 'Failed to load movie details');
      } else {
        setError(err.message || 'Movie not found. Please check the movie ID and try again.');
      }
    }
  };

  const loadCinemasAndShowTimes = async () => {
    setError('');
    try {
      // Load cinemas
      const cinemasData = await cinemas.getCinemas();
      setCinemasList(Array.isArray(cinemasData) ? cinemasData : []);

      // Load show times for selected cinema
      if (cinemaId) {
        const showTimesData = await shows.getShowTimes(cinemaId);
        
        // Transform API response to match our format
        const transformedShowTimes = Array.isArray(showTimesData) 
          ? showTimesData.map((show) => ({
              id: show.showID || show.showId || show.id,
              showID: show.showID || show.showId || show.id,
              movieID: show.movieID || show.movieId,
              showDate: show.showDate, // Format: YYYY-MM-DD
              showTime: show.showTime, // Format: YYYY-MM-DD HH:mm:ss
              hallName: show.hallName || 'HALL - 1',
              sellingStatus: show.sellingStatus !== undefined ? show.sellingStatus : 0,
              allowOnlineSales: show.allowOnlineSales !== undefined ? show.allowOnlineSales : true,
              // Format time for display (extract time from datetime)
              time: show.showTime 
                ? new Date(show.showTime).toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                  })
                : '10:00 AM',
              // Determine availability based on sellingStatus and allowOnlineSales
              // Only available if: sellingStatus = 0 AND allowOnlineSales = true
              available: show.sellingStatus === 0 && show.allowOnlineSales === true,
              sellingFast: show.sellingStatus === 1,
              // Sold out if: sellingStatus = 1 OR sellingStatus = 2 OR allowOnlineSales = false
              soldOut: show.sellingStatus === 1 || show.sellingStatus === 2 || show.allowOnlineSales === false,
            }))
          : [];
        
        console.log('Loaded show times:', transformedShowTimes.length, 'for cinema:', cinemaId);
        console.log('Show times for movie', movieId, ':', transformedShowTimes.filter(s => (s.movieID || s.movieId) == movieId));
        
        setAllShowTimes(transformedShowTimes);
        
        // Note: Available dates are now loaded from getShowDates() API
        // They are not updated based on show times anymore
        
        // Filter will be applied by useEffect when date is selected
      }
    } catch (err) {
      console.error('Error loading data:', err);
      hasLoadedCinemas.current = false; // Reset on error to allow retry
      hasLoadedShowTimes.current = false; // Reset on error to allow retry
      if (err instanceof APIError) {
        setError(err.message || 'Failed to load show times');
      } else {
        setError('An unexpected error occurred');
      }
    }
  };
  
  // Note: This function is kept for backward compatibility but show dates 
  // are now loaded from API via loadShowDatesForMovie()
  // Show dates are determined by API response, not by show times

  // Extract YouTube video ID from URL
  const proceedToTicketType = (indexOverride) => {
    const targetIndex = (indexOverride !== undefined && indexOverride !== null) ? indexOverride : selectedTime;
    
    if (targetIndex !== null) {
      const show = filteredShowTimes[targetIndex];
      // Only proceed if: sellingStatus = 0 AND allowOnlineSales = true
      const isAvailable = show && show.sellingStatus === 0 && show.allowOnlineSales === true;
      
      if (isAvailable) {
        // Check if show time is less than 1 hour from now
        if (show.showDate) {
          try {
            // Parse show date - format: "YYYY-MM-DD"
            const showDateStr = show.showDate.split('T')[0].split(' ')[0]; // Get YYYY-MM-DD
            
            // Get show time - could be in show.time (formatted) or show.showTime (raw)
            const showTimeStr = show.time || show.showTime || ''; // Format: "HH:mm" or "HH:mm AM/PM"
            
            if (showTimeStr) {
              // Combine date and time
              // Handle different time formats
              let showDateTime;
              if (showTimeStr.includes('AM') || showTimeStr.includes('PM')) {
                // 12-hour format with AM/PM
                showDateTime = new Date(`${showDateStr} ${showTimeStr}`);
              } else {
                // 24-hour format (HH:mm)
                showDateTime = new Date(`${showDateStr}T${showTimeStr}:00`);
              }
              
              // Check if the date is valid
              if (!isNaN(showDateTime.getTime())) {
                const now = new Date();
                const timeDifference = showDateTime.getTime() - now.getTime();
                const hoursDifference = timeDifference / (1000 * 60 * 60); // Convert to hours
                
                // If less than 1 hour and in the future, show restriction modal
                if (hoursDifference < 1 && hoursDifference > 0) {
                  setShowTimeRestrictionModal(true);
                  return;
                }
              }
            }
          } catch (error) {
            console.error('Error parsing show date/time:', error);
            // Continue with booking if date parsing fails
          }
        }
        
        // Use showID from the show time (this is the actual show ID from API)
        const showId = show.showID || show.showId || show.id;
        // Pass show time and date for display on ticket-type page
        const showTimeParam = show.showTime ? encodeURIComponent(show.showTime) : '';
        const showDateParam = show.showDate ? encodeURIComponent(show.showDate) : '';
        const experienceType = selectedExperience || movieDetails?.type || '2D';
        const encrypted = encryptIds({ cinemaId, showId, movieId });
        router.push(`/ticket-type?cinemaId=${encrypted.cinemaId}&showId=${encrypted.showId}&movieId=${encrypted.movieId}&showTime=${showTimeParam}&showDate=${showDateParam}&experienceType=${encodeURIComponent(experienceType)}`);
      } else {
        setError('This show time is not available for online booking.');
        setSelectedTime(null);
      }
    }
  };

  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleClick = (idx) => {
    const show = filteredShowTimes[idx];
    // Only allow selection if: sellingStatus = 0 AND allowOnlineSales = true
    const isAvailable = show && show.sellingStatus === 0 && show.allowOnlineSales === true;
    
    if (isAvailable) {
      setSelectedTime(idx);
      
      // Check if age is already confirmed in localStorage
      const ageConfirmed = localStorage.getItem('age_confirmed');
      if (!ageConfirmed) {
        setShowAgeConfirmationModal(true);
      } else {
        proceedToTicketType(idx);
      }
    } else {
      // Don't allow selection if not available
      setSelectedTime(null);
    }
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date.day);
    setSelectedDateObj(date.dateObj);
    setSelectedTime(null); // Reset selected time when date changes
    // Filter will be triggered by useEffect
  };

  const handleGoBack = () => {
    router.back();
  };

  const experiences = ['IMAX', '2D', '3D', 'ATMOS'];

  // Get movie type as the primary experience (auto-selected)
  const movieType = movieDetails?.type || '2D';
  
  // Only show the movie's type as available (others are disabled)
  const availableExperiences = [movieType];

  // Get movie display data
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

  // Show single full-page loader while loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader size="large" fullScreen={true} />
      </div>
    );
  }

  // Show error state if no movie details and there's an error
  if (error && !movieDetails) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-[#D3D3D3] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => {
              setIsLoading(true);
              hasLoadedMovieDetails.current = false;
              hasLoadedCinemas.current = false;
              hasLoadedShowTimes.current = false;
              const loadData = async () => {
                const allMoviesData = await loadMoviesList();
                await loadMovieDetails(allMoviesData);
                await loadCinemasAndShowTimes();
                setIsLoading(false);
              };
              loadData();
            }}
            className="px-4 py-2 bg-[#FFCA20] text-black rounded hover:bg-[#FFCA20]/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  // Time Restriction Modal
  const TimeRestrictionModal = () => {
    if (!showTimeRestrictionModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-[#1c1c1c] rounded-lg max-w-md w-full p-6 border border-[#2a2a2a]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Booking Not Available</h3>
            <button
              onClick={() => setShowTimeRestrictionModal(false)}
              className="text-gray-400 hover:text-white transition"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="mb-6">
            <p className="text-white/80 text-sm leading-relaxed">
              You cannot book this ticket online. The show time is less than 1 hour away.
            </p>
            <p className="text-white/80 text-sm leading-relaxed mt-2">
              Please go to the hall and book directly at the counter.
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowTimeRestrictionModal(false)}
              className="flex-1 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white px-4 py-2 rounded transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#D3D3D3]">
      {/* Header */}
      <div className="relative">
        <div className="absolute top-4 left-6 z-10">
          <button className="flex items-center gap-1 text-[#D3D3D3] hover:text-[#FAFAFA] text-sm" onClick={handleGoBack}>
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>

        {/* Breadcrumb */}
        <div className="absolute top-4 right-6 z-10">
          <div className="flex items-center gap-2 text-xs text-[#D3D3D3]">
            <span className="hover:text-[#FAFAFA] text-white cursor-pointer">Select Cinema</span>
            <span>›</span>
            <span className="hover:text-[#FAFAFA] cursor-pointer">Select type</span>
            <span>›</span>
            <span className="hover:text-[#FAFAFA] cursor-pointer">Select Seat</span>
            <span>›</span>
            <span className="text-[#FAFAFA]">Payment</span>
          </div>
        </div>

        {/* Hero Image */}
        <div className="relative h-72 overflow-hidden">
          {movieDetails ? (
            <>
              <img 
                src={movieImage} 
                alt={movieTitle}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'img/banner.jpg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-[#0a0a0a]/60 to-[#0a0a0a]" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
              
              {/* Movie Info */}
              <div className="absolute bottom-8 left-8">
                <h1 className="text-5xl font-bold mb-2 text-[#FAFAFA]">{movieTitle}</h1>
                <div className="flex items-center gap-3 text-sm text-[#D3D3D3] mb-4">
                  <span>{movieGenre}</span>
                  {movieDuration && <span>|</span>}
                  <span>{movieDuration}</span>
                  {movieLanguage && <span>|</span>}
                  <span>{movieLanguage}</span>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowTrailerModal(true)}
                    disabled={!trailerVideoId}
                    className={`px-6 py-2 bg-transparent border border-[#D3D3D3]/40 text-[#FAFAFA] text-sm rounded hover:bg-white/10 transition ${
                      !trailerVideoId ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    Watch Trailer
                  </button>
                  <button 
                    onClick={() => setShowMovieInfoModal(true)}
                    className="px-6 py-2 bg-[#FFCA20] text-black font-semibold text-sm rounded hover:bg-[#FFCA20]/90 transition"
                  >
                    Movie Info
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {movieDetails ? (
        <div className="mt-8">
        {/* Select Date */}
        <div className="mb-8 px-6 md:px-8">
          <h2 className="text-sm font-semibold mb-4 text-[#FAFAFA]">Select Date</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {availableDates.length > 0 ? (
              availableDates.map((date, index) => {
                // Format date object for display
                const dateObj = date.dateObj || new Date();
                const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                const dayNumber = dateObj.getDate();
                const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
                const isSelected = selectedDate === date.day;
                
                return (
                  <button
                    key={date.showDate || `${date.day}-${index}`}
                    onClick={() => handleDateSelect(date)}
                    className={`min-w-[70px] h-[90px] rounded-lg flex flex-col items-center justify-center transition shrink-0 ${
                      isSelected
                        ? 'bg-[#FFCA20] text-black'
                        : 'bg-[#1a1a1a] text-[#FAFAFA] hover:bg-[#252525] border border-[#2a2a2a]'
                    }`}
                  >
                    {/* Day of Week */}
                    <span className={`text-xs font-medium mb-1 ${isSelected ? 'text-black' : 'text-[#FAFAFA]'}`}>
                      {dayOfWeek}
                    </span>
                    {/* Day Number - Larger and Bolder */}
                    <span className={`text-2xl md:text-3xl font-bold ${isSelected ? 'text-black' : 'text-[#FAFAFA]'}`}>
                      {dayNumber}
                    </span>
                    {/* Month */}
                    <span className={`text-xs font-medium mt-1 ${isSelected ? 'text-black' : 'text-[#FAFAFA]'}`}>
                      {month}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="text-sm text-gray-400 py-4">
                No show dates available for this movie
              </div>
            )}
          </div>
          {/* Separator Line */}
          <div className="border-b border-[#2a2a2a] mt-4"></div>
        </div>

        {/* Select Experience */}
        <div className="mb-8 px-6 md:px-8">
          <h2 className="text-sm font-semibold mb-4 text-[#FAFAFA]">Select Experience</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {experiences.map((exp) => {
              const isMovieType = exp === movieType;
              const isSelected = selectedExperience === exp;
              const isDisabled = !isMovieType;
              
              return (
                <button
                  key={exp}
                  onClick={() => {
                    if (!isDisabled) {
                      setSelectedExperience(exp);
                    }
                  }}
                  disabled={isDisabled}
                  className={`px-6 md:px-8 py-2.5 rounded-lg text-sm font-medium transition shrink-0 whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#FFCA20] text-black'
                      : isDisabled
                      ? 'bg-[#1a1a1a] text-[#666] border border-[#2a2a2a] cursor-not-allowed opacity-50'
                      : 'bg-[#1a1a1a] text-[#FAFAFA] hover:bg-[#252525] border border-[#2a2a2a]'
                  }`}
                >
                  {exp}
                </button>
              );
            })}
          </div>
          {/* Separator Line */}
          <div className="border-b border-[#2a2a2a] mt-4"></div>
        </div>

        {/* Select Cinema & Time */}
        <div className="mb-8 px-6 md:px-8">
          <h2 className="text-sm font-semibold mb-4 text-[#FAFAFA]">Select cinema & Time</h2>
          
          {/* Seat Availability Legend */}
          <div className="flex items-center gap-4 md:gap-6 mb-4 flex-wrap text-xs">
            <div className="flex items-center gap-2">
              <SeatStatusIcon status="available" />
              <span className="text-green-500">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <SeatStatusIcon status="selling-fast" />
              <span className="text-[#FFCA20]">Selling fast</span>
            </div>
            <div className="flex items-center gap-2">
              <SeatStatusIcon status="sold-out" />
              <span className="text-red-500">Sold out</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded text-sm text-red-400">
              {error}
              <button 
                onClick={loadCinemasAndShowTimes}
                className="ml-4 text-yellow-500 hover:text-yellow-400 underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Cinema Location Card */}
          {
          <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#2a2a2a]">
              {cinemasList.length > 0 ? (
                cinemasList.map((cinema, index) => (
                  <div key={cinema.id || cinema.cinemaId || `cinema-${index}`}>
                    <div className="flex items-center gap-2 mb-5">
                      <div className="flex-shrink-0">
                        <MovieIcon />
                      </div>
                      <span className="text-sm text-[#FAFAFA]">
                        {cinema.displayName} - <span dangerouslySetInnerHTML={{ __html: cinema.address }} />
                      </span>
                    </div>
                  </div>
                ))
              ) : (
            <div className="flex items-center gap-2 mb-5">
              <div className="flex-shrink-0">
                <MovieIcon />
              </div>
                  <span className="text-sm text-[#FAFAFA]">
                    No cinemas available
                  </span>
            </div>
              )}

            {/* Showtimes Grid */}
              {filteredShowTimes.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {filteredShowTimes.map((show, idx) => {
                    // Determine if show is available for selection
                    // Only available if: sellingStatus = 0 AND allowOnlineSales = true
                    const isAvailable = show.sellingStatus === 0 && show.allowOnlineSales === true;
                    const isSoldOut = !isAvailable; // Sold out if not available
                    
                    return (
                      <button
                        key={show.showID || show.id || idx}
                        onClick={() => {
                          if (isAvailable) {
                            handleClick(idx);
                          }
                        }}
                        disabled={isSoldOut}
                        className={`p-3 rounded-lg border transition ${
                          isSoldOut
                            ? 'bg-gray-800  text-gray-500 cursor-not-allowed opacity-60'
                            : selectedTime === idx
                            ? 'bg-[#FFCA20] border-[#FFCA20] text-black'
                            : show.sellingFast
                            ? 'bg-[#0a0a0a] border-[#FFCA20] text-[#FAFAFA] hover:border-[#FFCA20] hover:bg-[#151515]'
                            : 'bg-[#FFCA20] border-[#FFCA20] text-black'
                        }`}
                        title={isSoldOut 
                          ? (show.allowOnlineSales === false 
                              ? 'Not available for online sales' 
                              : show.sellingStatus === 1 
                              ? 'Selling fast / Limited availability' 
                              : 'Sold out')
                          : 'Available'}
                      >
                        <div className="text-sm font-semibold">{show.time}</div>
                        <div className="text-xs mt-1 opacity-70">{show.hallName || 'HALL - 1'}</div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  {selectedDateObj 
                    ? `No show times available for ${selectedDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                    : 'No show times available for this cinema.'
                  }
                  
                </div>
              )}
            </div>
          }
        </div>



        </div>
      ) : null}

      {/* Trailer Modal */}
      {showTrailerModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-2 md:p-4" onClick={() => setShowTrailerModal(false)}>
          <div className="relative w-full max-w-4xl bg-black rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
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
            {trailerVideoId ? (
              <div className="relative w-full" style={{ paddingBottom: '56.25%', zIndex: 1 }}>
                <iframe
                  className="absolute top-0 left-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${trailerVideoId}?autoplay=1`}
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

      {/* Movie Info Modal */}
      {showMovieInfoModal && movieDetails && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowMovieInfoModal(false)}>
          <div className="relative w-full max-w-2xl bg-[#1a1a1a] rounded-lg p-6 my-8" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowMovieInfoModal(false)}
              className="absolute top-4 right-4 text-[#D3D3D3] hover:text-[#FAFAFA] transition"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="flex gap-6 mb-6">
              <img 
                src={movieImage} 
                alt={movieTitle}
                className="w-32 h-48 object-cover rounded"
                onError={(e) => {
                  e.target.src = 'img/movies1.png';
                }}
              />
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2 text-[#FAFAFA]">{movieTitle}</h2>
                <div className="space-y-2 text-sm text-[#D3D3D3]">
                  <div><span className="font-semibold text-[#FAFAFA]">Genre:</span> {movieGenre}</div>
                  <div><span className="font-semibold text-[#FAFAFA]">Duration:</span> {movieDuration}</div>
                  <div><span className="font-semibold text-[#FAFAFA]">Language:</span> {movieLanguage}</div>
                  <div><span className="font-semibold text-[#FAFAFA]">Rating:</span> {movieRating}</div>
                  <div><span className="font-semibold text-[#FAFAFA]">Type:</span> {movieType}</div>
                  {movieReleaseDate && (
                    <div><span className="font-semibold text-[#FAFAFA]">Release Date:</span> {movieReleaseDate}</div>
                  )}
                </div>
              </div>
            </div>

            {movieSynopsis && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2 text-[#FAFAFA]">Synopsis</h3>
                <p className="text-[#D3D3D3] text-sm leading-relaxed">{movieSynopsis}</p>
              </div>
            )}

            {movieCast && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2 text-[#FAFAFA]">Cast</h3>
                <p className="text-[#D3D3D3] text-sm">{movieCast}</p>
              </div>
            )}

            {movieDirector && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2 text-[#FAFAFA]">Director</h3>
                <p className="text-[#D3D3D3] text-sm">{movieDirector}</p>
              </div>
            )}

            <div className="flex gap-3">
              {trailerVideoId && (
                  <button
                    onClick={() => {
                      setShowMovieInfoModal(false);
                      setShowTrailerModal(true);
                    }}
                    className="px-6 py-2 bg-[#FFCA20] text-black font-semibold rounded hover:bg-[#FFCA20]/90 transition"
                  >
                    Watch Trailer
                  </button>
              )}
              <button
                onClick={() => setShowMovieInfoModal(false)}
                className="px-6 py-2 bg-transparent border border-[#D3D3D3]/40 text-[#FAFAFA] rounded hover:bg-white/10 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Age Confirmation Modal */}
      {showAgeConfirmationModal && (
        <AgeConfirmationModal
          moviesList={moviesList}
          onConfirm={() => {
            localStorage.setItem('age_confirmed', 'true');
            setShowAgeConfirmationModal(false);
            proceedToTicketType();
          }}
          onClose={() => setShowAgeConfirmationModal(false)}
        />
      )}

      {/* Time Restriction Modal */}
      {showTimeRestrictionModal && (
        <TimeRestrictionModal />
      )}
    </div>
  );
}

// Age Confirmation Modal Component
function AgeConfirmationModal({ onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg w-full max-w-md relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
          <h2 className="text-xl font-bold text-[#FAFAFA]">Confirmation</h2>
          <button
            onClick={onClose}
            className="text-[#FAFAFA] hover:text-[#FFCA20] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Icon Circle */}
          <div className="flex justify-center mb-6">
            <div className="w-32 h-32 bg-[#3a3a3a] rounded-full"></div>
          </div>

          {/* Age Confirmation Text */}
          <div className="text-center mb-6">
            <p className="text-[#FAFAFA] text-sm leading-relaxed">
              Please confirm you are above <span className="font-bold text-[#FFCA20]">"18"</span> age, Verification will be done at the checkout.
            </p>
          </div>


          {/* Confirm Button */}
          <button
            onClick={onConfirm}
            className="w-full bg-[#FFCA20] text-black font-semibold py-3 rounded-lg hover:bg-[#FFCA20]/90 transition"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}