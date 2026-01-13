"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, MapPin, Clock, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { shows, movies, cinemas } from '@/services/api';
import { APIError } from '@/services/api';
import Loader from '@/components/Loader';
import { encryptId, decryptId, encryptIds, decryptIds } from '@/utils/encryption';

export default function TicketSelection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Decrypt IDs from URL
  const encryptedCinemaId = searchParams.get('cinemaId');
  const encryptedShowId = searchParams.get('showId');
  const encryptedMovieId = searchParams.get('movieId');
  
  const cinemaId = encryptedCinemaId ? decryptId(encryptedCinemaId) : (localStorage.getItem('cinemaId') || '');
  const showId = encryptedShowId ? decryptId(encryptedShowId) : (localStorage.getItem('showId') || '');
  const movieId = encryptedMovieId ? decryptId(encryptedMovieId) : (localStorage.getItem('movieId') || '');
  const showTime = searchParams.get('showTime'); // Optional: passed from previous page
  const showDate = searchParams.get('showDate'); // Optional: passed from previous page
  const experienceType = searchParams.get('experienceType') || '2D'; // Experience type (2D, 3D, IMAX, etc.)

  const [ticketData, setTicketData] = useState(null);
  const [movieDetails, setMovieDetails] = useState(null);
  const [cinemaDetails, setCinemaDetails] = useState(null);
  const [showTimeDetails, setShowTimeDetails] = useState(null);
  const [tickets, setTickets] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationCategory, setConfirmationCategory] = useState(null);
  const [pendingIncrement, setPendingIncrement] = useState(null); // Store ticketTypeID that needs confirmation before incrementing
  
  const hasLoadedData = useRef(false);

  useEffect(() => {
    if (!cinemaId || !showId) {
      setError('Missing cinema ID or show ID');
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      if (hasLoadedData.current) return;
      hasLoadedData.current = true;

      setIsLoading(true);
      setError('');

      try {
        // Load ticket configuration and prices
        const configData = await shows.getConfigAndTicketPrice(cinemaId, showId);
        setTicketData(configData);

        // Initialize tickets state with all ticket types set to 0
        if (configData?.priceDetails) {
          const initialTickets = {};
          configData.priceDetails.forEach((price) => {
            initialTickets[price.ticketTypeID] = 0;
          });
          setTickets(initialTickets);
        }

        // Load cinema details
        try {
          const cinemasList = await cinemas.getCinemas();
          const cinema = Array.isArray(cinemasList)
            ? cinemasList.find(c => (c.cinemaID || c.cinemaId || c.id) == cinemaId)
            : null;
          if (cinema) {
            setCinemaDetails(cinema);
          }
        } catch (cinemaErr) {
          console.error('Error loading cinema details:', cinemaErr);
        }

        // Load show times to get the selected show time details
        try {
          const showTimesList = await shows.getShowTimes(cinemaId);
          const showTime = Array.isArray(showTimesList)
            ? showTimesList.find(s => (s.showID || s.showId || s.id) == showId)
            : null;
          if (showTime) {
            setShowTimeDetails(showTime);
          }
        } catch (showTimeErr) {
          console.error('Error loading show time details:', showTimeErr);
        }

        // Load movie details if movieId is provided
        if (movieId) {
          try {
            const moviesList = await movies.getMovies();
            const movie = Array.isArray(moviesList) 
              ? moviesList.find(m => (m.movieID || m.movieId || m.id) == movieId)
              : null;
            if (movie) {
              setMovieDetails(movie);
            }
          } catch (movieErr) {
            console.error('Error loading movie details:', movieErr);
          }
        }
      } catch (err) {
        console.error('Error loading ticket data:', err);
        hasLoadedData.current = false; // Allow retry
        if (err instanceof APIError) {
          setError(err.message || 'Failed to load ticket information');
        } else {
          setError('An unexpected error occurred. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [cinemaId, showId, movieId]);

  // Check if a ticket type requires confirmation before incrementing
  const requiresConfirmation = (ticketTypeID) => {
    if (!ticketData?.priceDetails) return false;
    
    const price = ticketData.priceDetails.find(p => p.ticketTypeID === ticketTypeID);
    if (!price) return false;
    
    const ticketTypeName = price.ticketTypeName?.toUpperCase() || '';
    
    // Check if it requires confirmation
    if (ticketTypeName.includes('FAMILY BED')) {
      return true;
    }
    if (ticketTypeName.includes('CHILDREN') || ticketTypeName.includes('CHILD') || ticketTypeName.includes('KIDS')) {
      return true;
    }
    if (ticketTypeName.includes('SENIOR') || ticketTypeName.includes('SENIOR-CITIZEN')) {
      return true;
    }
    if (ticketTypeName.includes('HANDICAP') || ticketTypeName.includes('OKU')) {
      return true;
    }
    if (ticketTypeName.includes('STUDENT')) {
      return true;
    }
    
    return false;
  };

  // Get category name for confirmation modal
  const getCategoryName = (ticketTypeID) => {
    if (!ticketData?.priceDetails) return '';
    
    const price = ticketData.priceDetails.find(p => p.ticketTypeID === ticketTypeID);
    if (!price) return '';
    
    const ticketTypeName = price.ticketTypeName?.toUpperCase() || '';
    
    if (ticketTypeName.includes('FAMILY BED')) {
      return 'Family Bed';
    }
    if (ticketTypeName.includes('CHILDREN') || ticketTypeName.includes('CHILD') || ticketTypeName.includes('KIDS')) {
      return 'Children/Kids';
    }
    if (ticketTypeName.includes('SENIOR') || ticketTypeName.includes('SENIOR-CITIZEN')) {
      return 'Senior-citizen (60 years old and above)';
    }
    if (ticketTypeName.includes('HANDICAP') || ticketTypeName.includes('OKU')) {
      return 'Handicap (OKU)';
    }
    if (ticketTypeName.includes('STUDENT')) {
      return 'Student';
    }
    
    return '';
  };

  const increment = (ticketTypeID) => {
    // Check if this ticket type requires confirmation
    if (requiresConfirmation(ticketTypeID)) {
      setPendingIncrement(ticketTypeID);
      setConfirmationCategory(getCategoryName(ticketTypeID));
      setShowConfirmationModal(true);
      return;
    }
    
    // No confirmation needed, proceed with increment
    doIncrement(ticketTypeID);
  };

  const doIncrement = (ticketTypeID) => {
    const maxTickets = ticketData?.generalInfo?.maxTicketsPerTransaction || 6;
    const currentTotal = Object.values(tickets).reduce((sum, count) => sum + count, 0);
    
    // Check if this is twin-seats (counts as 2 tickets)
    const isTwinSeats = ticketData?.generalInfo?.ticketTypeIDForTwinSeatsAndVIPSeats === ticketTypeID;
    // Also check if name contains TWIN which usually implies 2 seats
    const price = ticketData?.priceDetails?.find(p => p.ticketTypeID === ticketTypeID);
    const isNameTwin = price?.ticketTypeName?.toUpperCase()?.includes('TWIN');
    
    const ticketWeight = (isTwinSeats || isNameTwin) ? 2 : 1;
    
    if (currentTotal + ticketWeight <= maxTickets) {
      setTickets(prev => ({ ...prev, [ticketTypeID]: (prev[ticketTypeID] || 0) + 1 }));
    }
  };

  const decrement = (ticketTypeID) => {
    setTickets(prev => ({ ...prev, [ticketTypeID]: Math.max(0, (prev[ticketTypeID] || 0) - 1) }));
  };

  const handleGoBack = () => {
    // Store show time info for movie-detail page to restore selection
    const showTimeParam = showTimeDetails?.showTime ? encodeURIComponent(showTimeDetails.showTime) : '';
    const showDateParam = showTimeDetails?.showDate ? encodeURIComponent(showTimeDetails.showDate) : '';
    const expType = experienceType || movieDetails?.type || '2D';
    
    if (showTimeParam && showDateParam && showId) {
      localStorage.setItem('lastSelectedShowTime', JSON.stringify({
        showTime: showTimeParam,
        showDate: showDateParam,
        experienceType: expType,
        showId: showId
      }));
    }
    
    router.back();
  };

  // Check if user has selected tickets that require confirmation
  const checkForConfirmation = () => {
    if (!ticketData?.priceDetails) return null;
    
    for (const price of ticketData.priceDetails) {
      const ticketCount = tickets[price.ticketTypeID] || 0;
      if (ticketCount > 0) {
        const ticketTypeName = price.ticketTypeName?.toUpperCase() || '';
        
        if (ticketTypeName.includes('FAMILY BED')) {
          return 'Family Bed';
        }
        if (ticketTypeName.includes('CHILDREN') || ticketTypeName.includes('CHILD') || ticketTypeName.includes('KIDS')) {
          return 'Children/Kids';
        }
        if (ticketTypeName.includes('HANDICAP') || ticketTypeName.includes('OKU')) {
          return 'Handicap';
        }
        if (ticketTypeName.includes('SENIOR') || ticketTypeName.includes('SENIOR-CITIZEN')) {
          return 'Senior-citizen';
        }
        if (ticketTypeName.includes('STUDENT')) {
          return 'Student';
        }
      }
    }
    return null;
  };

  const handleContinue = () => {
    const category = checkForConfirmation();
    if (category) {
      setConfirmationCategory(category);
      setShowConfirmationModal(true);
    } else {
      proceedToSeatSelection();
    }
  };

  const handleConfirmCategory = () => {
    setShowConfirmationModal(false);
    
    // If there's a pending increment, perform it
    if (pendingIncrement !== null) {
      doIncrement(pendingIncrement);
      setPendingIncrement(null);
    } else {
      // Otherwise, proceed to seat selection (from Continue button)
      proceedToSeatSelection();
    }
    
    setConfirmationCategory(null);
  };

  const proceedToSeatSelection = () => {
    // Store selected tickets in localStorage or pass via query params
    localStorage.setItem('selectedTickets', JSON.stringify(tickets));
    localStorage.setItem('ticketData', JSON.stringify(ticketData));
    localStorage.setItem('cinemaId', cinemaId);
    localStorage.setItem('showId', showId);
    localStorage.setItem('movieId', movieId || '');
    // Set flag to indicate coming from ticket-type page - this will reset the timer
    localStorage.setItem('fromTicketTypePage', 'true');
    // Clear any existing timer
    localStorage.removeItem('seatSelectionPageTimerStartTime');
    const encrypted = encryptIds({ cinemaId, showId, movieId: movieId || '' });
    router.push(`/seat-selection?cinemaId=${encrypted.cinemaId}&showId=${encrypted.showId}&movieId=${encrypted.movieId}`);
  };

  // Calculate total tickets (twin-seats count as 2)
  const calculateTotalTickets = () => {
    let total = 0;
    Object.entries(tickets).forEach(([ticketTypeID, count]) => {
      const isTwinSeats = ticketData?.generalInfo?.ticketTypeIDForTwinSeatsAndVIPSeats === parseInt(ticketTypeID);
      total += count * (isTwinSeats ? 2 : 1);
    });
    return total;
  };

  const totalTickets = calculateTotalTickets();
  const maxTickets = ticketData?.generalInfo?.maxTicketsPerTransaction || 6;

  // Calculate total price
  const calculateTotalPrice = () => {
    if (!ticketData?.priceDetails) return 0;
    
    let total = 0;
    ticketData.priceDetails.forEach((price) => {
      const count = tickets[price.ticketTypeID] || 0;
      total += price.totalTicketPrice * count;
    });
    return total.toFixed(2);
  };

  // Format show date and time
  const formatShowDateTime = () => {
    if (showTimeDetails?.showTime) {
      try {
        const date = new Date(showTimeDetails.showTime);
        const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        return `${dateStr}, ${timeStr}`;
      } catch (e) {
        return showTimeDetails.showTime;
      }
    }
    if (showDate && showTime) {
      return `${showDate}, ${showTime}`;
    }
    return 'Show Time';
  };

  // Get ticket type description
  const getTicketTypeDescription = (ticketTypeName, ticketTypeID) => {
    const descriptions = {
      'ADULT': '',
      'CHILDREN': 'The Height must below 90cm (0.9)',
      'SENIOR-CITIZEN': '60 years old and above',
      'TWIN-SEATS': '',
      'HANDICAP ( OKU )': '',
      'VIP': '',
      'KIDS': 'The seat is only for children aged between 2-12 years old',
      'STUDENT': '',
      'FAMILY BED': '2 adult and 2 kids age below 10 years',
    };
    
    // Check if it's twin seats from generalInfo
    if (ticketData?.generalInfo?.ticketTypeIDForTwinSeatsAndVIPSeats === ticketTypeID) {
      return '';
    }
    
    return descriptions[ticketTypeName?.toUpperCase()] || '';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1c1c1c]">
        <Loader fullScreen={true} size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#1c1c1c] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => {
              hasLoadedData.current = false;
              window.location.reload();
            }}
            className="px-4 py-2 bg-[#FFCA20] text-black rounded hover:bg-[#FFCA20]/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!ticketData) {
    return (
      <div className="min-h-screen bg-[#1c1c1c] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-white mb-4">No ticket information available</p>
          <button
            onClick={handleGoBack}
            className="px-4 py-2 bg-[#FFCA20] text-black rounded hover:bg-[#FFCA20]/90"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const movieTitle = movieDetails?.movieName || movieDetails?.title || 'Movie';
  const movieGenre = movieDetails?.genre || 'N/A';
  const movieDuration = movieDetails?.duration || 'N/A';
  const movieLanguage = movieDetails?.language || 'N/A';
  const movieImage = movieDetails?.imageURL || 'img/banner.jpg';
  const hallName = ticketData?.hallDetails?.hallName || 'HALL - 1';
  const cinemaName = cinemaDetails?.displayName || cinemaDetails?.name || `Cinema ${cinemaId}`;
  // Experience type from URL params (IMAX, 2D, 3D, etc.)
  const displayExperienceType = experienceType || movieDetails?.type || '2D';

  return (
    <div className="min-h-screen bg-[#1c1c1c] text-white pb-10">
      {/* Header */}
      <div className="relative">
        <div className="absolute top-5 left-5 z-10">
          <button className="flex items-center gap-2 text-white/70 hover:text-white text-sm" onClick={handleGoBack}>
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>

        {/* Breadcrumb */}
        <div className="absolute top-5 right-5 z-10">
          <div className="flex items-center gap-2 text-xs text-white/50">
            <span className="hover:text-white cursor-pointer">Select cinema</span>
            <span>›</span>
            <span className="text-white font-medium">Ticket type</span>
            <span>›</span>
            <span className="hover:text-white cursor-pointer">Select seat</span>
            <span>›</span>
            <span className="hover:text-white cursor-pointer">Payment</span>
          </div>
        </div>

        {/* Hero Image */}
        <div className="relative h-56 overflow-hidden">
          <img 
            src={movieImage} 
            alt={movieTitle}
            className="absolute inset-0 w-full h-full object-cover object-center"
            onError={(e) => {
              e.target.src = 'img/banner.jpg';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-[#1c1c1c]/70 to-[#1c1c1c]" />
          
          {/* Movie Info */}
          <div className="absolute bottom-5 left-8">
            <h1 className="text-3xl font-bold mb-1.5">{movieTitle}</h1>
            <div className="flex items-center gap-3 text-xs text-white/70 mb-3">
              <span>{movieGenre}</span>
              <span>|</span>
              <span>{movieDuration}</span>
              <span>|</span>
              <span>{movieLanguage}</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-white/80 flex-wrap">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>{cinemaName}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded">
                <span className="font-medium">{displayExperienceType}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-medium">{hallName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatShowDateTime()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-8 mt-6">
        {/* Ticket Selection */}
        <div className="mb-6">
          <h2 className="text-sm font-medium mb-4 text-white">Ticket selection</h2>
          
          {/* Table Header */}
          <div className="bg-[#2a2a2a] rounded-t-lg p-4 grid grid-cols-3 text-xs text-white/60 font-medium">
            <div>Ticket type</div>
            <div className="text-center">Price</div>
            <div className="text-center">Amount</div>
          </div>

          {/* Ticket Rows */}
          <div className="bg-[#232323] rounded-b-lg">
            {ticketData.priceDetails && ticketData.priceDetails.length > 0 ? (
              ticketData.priceDetails.map((price, idx) => {
                const ticketCount = tickets[price.ticketTypeID] || 0;
                const description = getTicketTypeDescription(price.ticketTypeName, price.ticketTypeID);
                const isTwinSeats = ticketData?.generalInfo?.ticketTypeIDForTwinSeatsAndVIPSeats === price.ticketTypeID || price.ticketTypeName?.toUpperCase().includes('TWIN');
                const canIncrement = totalTickets + (isTwinSeats ? 2 : 1) <= maxTickets;
                
                return (
              <div 
                    key={price.priceID || idx}
                className={`p-4 grid grid-cols-3 items-center ${
                      idx !== ticketData.priceDetails.length - 1 ? 'border-b border-white/5' : ''
                }`}
              >
                <div>
                      <div className="text-sm text-white font-medium">
                        {price.ticketTypeName}
                        {description && (
                          <div className="text-xs text-white/60 font-normal ml-1">
                            {description}
                          </div>
                  )}
                </div>
                    </div>
                    <div className="text-center text-sm text-white/90">
                      RM {(price.totalTicketPrice * (isTwinSeats ? 2 : 1)).toFixed(2)}
                    </div>
                <div className="flex items-center justify-center gap-3">
                  <button
                        onClick={() => decrement(price.ticketTypeID)}
                        disabled={ticketCount === 0}
                        className={`w-6 h-6 rounded flex items-center justify-center transition text-[#FFCA20] ${
                          ticketCount === 0 
                            ? 'opacity-50 cursor-not-allowed border-[0.5px] border-[#FFCA20]/50' 
                            : 'border-[0.5px] border-[#FFCA20] hover:bg-[#FFCA20]/10'
                        }`}
                  >
                    −
                  </button>
                      <span className="text-sm w-6 text-center text-white font-medium">{ticketCount}</span>
                  <button
                        onClick={() => increment(price.ticketTypeID)}
                        disabled={!canIncrement}
                        className={`w-6 h-6 rounded flex items-center justify-center transition text-[#FFCA20] ${
                          !canIncrement 
                            ? 'opacity-50 cursor-not-allowed border-[0.5px] border-[#FFCA20]/50' 
                            : 'border-[0.5px] border-[#FFCA20] hover:bg-[#FFCA20]/10'
                        }`}
                  >
                    +
                  </button>
                </div>
              </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-white/50 text-sm">
                No ticket types available
              </div>
            )}
          </div>

          {/* Info Text */}
          <div className="mt-4 text-xs text-white/50 space-y-1">
            <p>*Maximum {maxTickets} tickets per transaction.</p>
            {ticketData.generalInfo?.saleTwinSeatsTogether && (
              <p>*Twin-seats counted as 2 tickets.</p>
            )}
          </div>
        </div>

        {/* Continue Button */}
        <div className="flex justify-center mt-8">
          <button 
            className={`px-8 py-2.5 rounded font-medium text-sm transition ${
              totalTickets > 0 
                ? 'bg-[#f5c118] text-black hover:bg-[#f5c118]/90' 
                : 'bg-[#f5c118]/30 text-black/50 cursor-not-allowed'
            }`}
            disabled={totalTickets === 0}
            onClick={handleContinue}
          >
            Continue
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmationModal && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowConfirmationModal(false);
            setPendingIncrement(null);
            setConfirmationCategory(null);
          }}
        >
          <div 
            className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg w-full max-w-md relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
              <h2 className="text-xl font-bold text-[#FAFAFA]">Confirmation</h2>
              <button
                onClick={() => {
                  setShowConfirmationModal(false);
                  setPendingIncrement(null);
                  setConfirmationCategory(null);
                }}
                className="text-[#FAFAFA] hover:text-[#FFCA20] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Confirmation Text */}
              <div className="text-center mb-6">
                <p className="text-[#FAFAFA] text-sm leading-relaxed">
                  Please confirm you are under this particular category <span className="font-bold text-[#FFCA20]">"{confirmationCategory}"</span>, verification will be done at the checkpoint.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowConfirmationModal(false);
                    setPendingIncrement(null);
                    setConfirmationCategory(null);
                  }}
                  className="flex-1 bg-[#2a2a2a] text-white font-semibold py-3 rounded-lg hover:bg-[#3a3a3a] transition border border-[#3a3a3a]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmCategory}
                  className="flex-1 bg-[#FFCA20] text-black font-semibold py-3 rounded-lg hover:bg-[#FFCA20]/90 transition"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
