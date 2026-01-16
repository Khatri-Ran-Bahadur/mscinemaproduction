"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, MapPin, Clock, X } from 'lucide-react';
import { shows, movies, cinemas, booking } from '@/services/api';
import { APIError } from '@/services/api';
import Loader from '@/components/Loader';
import { getUserData } from '@/utils/storage';
import SeatIcon from '@/components/SeatIcon';
import MovieIcon from '@/components/MovieIcon';
import { encryptId, decryptId, encryptIds, decryptIds } from '@/utils/encryption';

export default function SeatSelection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Decrypt IDs from URL
  const encryptedMovieId = searchParams?.get('movieId') || '';
  const encryptedCinemaId = searchParams?.get('cinemaId') || '';
  const encryptedShowId = searchParams?.get('showId') || '';
  
  const movieId = encryptedMovieId ? decryptId(encryptedMovieId) : (localStorage.getItem('movieId') || '');
  const cinemaId = encryptedCinemaId ? decryptId(encryptedCinemaId) : (localStorage.getItem('cinemaId') || '7001');
  const decryptedShowId = encryptedShowId ? decryptId(encryptedShowId) : (localStorage.getItem('showId') || '31744');
  
  const [currentShowId, setCurrentShowId] = useState(decryptedShowId);
  const showId = currentShowId;
  
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [seatLayout, setSeatLayout] = useState(null);
  const [seatsData, setSeatsData] = useState([]);
  const [movieDetails, setMovieDetails] = useState(null);
  const [cinemaDetails, setCinemaDetails] = useState(null);
  const [showTimeDetails, setShowTimeDetails] = useState(null);
  const [allShowTimes, setAllShowTimes] = useState([]);
  const [filteredShowTimes, setFilteredShowTimes] = useState([]);
  const [selectedTimeIndex, setSelectedTimeIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [pageTimer, setPageTimer] = useState(300); // 5 minutes for page timer
  const [pageTimerActive, setPageTimerActive] = useState(false);
  const [maxSeats, setMaxSeats] = useState(6); // Default to 6, will be updated from ticket data
  const [ticketData, setTicketData] = useState(null); // Store ticket data for price calculation
  const [selectedTickets, setSelectedTickets] = useState({}); // Store selected tickets mapping
  const [lockedSeats, setLockedSeats] = useState({}); // Track locked seats: { seatNo: referenceNo }
  const [lockSeatResponse, setLockSeatResponse] = useState(null); // Store full LockSeat API response with lockedSeats array
  const [isLocking, setIsLocking] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [showBookingSummary, setShowBookingSummary] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmedReferenceNo, setConfirmedReferenceNo] = useState(null); // Store confirmed reference number
  const [lockReferenceNo, setLockReferenceNo] = useState(null); // Store referenceNo from lockSeat API
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes = 300 seconds
  // Form state for booking modal
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    passportNo: '',
    mobile: '',
    membershipNo: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [timerActive, setTimerActive] = useState(false); // Timer only active after locking seats

  // Initialize 5-minute page timer on page load
  useEffect(() => {
    // Check if coming from ticket-type page - if so, reset timer
    const fromTicketTypePage = localStorage.getItem('fromTicketTypePage');
    
    if (fromTicketTypePage === 'true') {
      // Coming from ticket-type page - start fresh timer
      localStorage.removeItem('fromTicketTypePage');
      localStorage.removeItem('seatSelectionPageTimerStartTime');
      localStorage.removeItem('seatSelectionTimerMovieId');
      localStorage.removeItem('seatSelectionTimerShowId');
      const timerDuration = 300; // 5 minutes
      const timerStartTime = Date.now().toString();
      localStorage.setItem('seatSelectionPageTimerStartTime', timerStartTime);
      localStorage.setItem('seatSelectionTimerMovieId', movieId || '');
      localStorage.setItem('seatSelectionTimerShowId', showId || '');
      setPageTimer(timerDuration);
      setPageTimerActive(true);
      return;
    }
    
    // Not coming from ticket-type page - check existing timer
    const pageTimerStartTime = localStorage.getItem('seatSelectionPageTimerStartTime');
    const timerMovieId = localStorage.getItem('seatSelectionTimerMovieId');
    const timerShowId = localStorage.getItem('seatSelectionTimerShowId');
    const timerDuration = 300; // 5 minutes
    
    // Check if timer is for the same movie/show
    const isSameMovie = timerMovieId === movieId && timerShowId === showId;
    
    if (pageTimerStartTime && isSameMovie) {
      // Timer exists for same movie/show - check if expired
      const elapsed = Math.floor((Date.now() - parseInt(pageTimerStartTime)) / 1000);
      const remaining = Math.max(0, timerDuration - elapsed);
      
      if (remaining > 0) {
        setPageTimer(remaining);
        setPageTimerActive(true);
      } else {
        // Timer expired - clear and start new one
        localStorage.removeItem('seatSelectionPageTimerStartTime');
        localStorage.removeItem('seatSelectionTimerMovieId');
        localStorage.removeItem('seatSelectionTimerShowId');
        const timerStartTime = Date.now().toString();
        localStorage.setItem('seatSelectionPageTimerStartTime', timerStartTime);
        localStorage.setItem('seatSelectionTimerMovieId', movieId || '');
        localStorage.setItem('seatSelectionTimerShowId', showId || '');
        setPageTimer(timerDuration);
        setPageTimerActive(true);
      }
    } else {
      // No existing timer OR different movie/show - start new timer
      if (pageTimerStartTime) {
        // Clear old timer for different movie/show
        localStorage.removeItem('seatSelectionPageTimerStartTime');
        localStorage.removeItem('seatSelectionTimerMovieId');
        localStorage.removeItem('seatSelectionTimerShowId');
      }
      const timerStartTime = Date.now().toString();
      localStorage.setItem('seatSelectionPageTimerStartTime', timerStartTime);
      localStorage.setItem('seatSelectionTimerMovieId', movieId || '');
      localStorage.setItem('seatSelectionTimerShowId', showId || '');
      setPageTimer(timerDuration);
      setPageTimerActive(true);
    }
  }, [movieId, showId, router]);

  // Cleanup: Clear timer when component unmounts (user navigates away)
  useEffect(() => {
    return () => {
      // Clear timer when leaving the page
      localStorage.removeItem('seatSelectionPageTimerStartTime');
      localStorage.removeItem('seatSelectionTimerMovieId');
      localStorage.removeItem('seatSelectionTimerShowId');
    };
  }, []);

  // Initialize timer from localStorage on page load (for seat locking)
  useEffect(() => {
    const timerStartTime = localStorage.getItem('timerStartTime');
    const lockRef = localStorage.getItem('lockReferenceNo');
    const confirmedRef = localStorage.getItem('confirmedReferenceNo');
    
    if (timerStartTime && (lockRef || confirmedRef)) {
      const elapsed = Math.floor((Date.now() - parseInt(timerStartTime)) / 1000);
      const timerDuration = 120; // 2 minutes for booking modal
      const remaining = Math.max(0, timerDuration - elapsed);
      
      if (remaining > 0) {
        setTimeLeft(remaining);
        setTimerActive(true);
        if (lockRef) setLockReferenceNo(lockRef);
        if (confirmedRef) setConfirmedReferenceNo(confirmedRef);
      } else {
        // Timer expired - clear localStorage
        localStorage.removeItem('timerStartTime');
        localStorage.removeItem('lockReferenceNo');
        localStorage.removeItem('confirmedReferenceNo');
      }
    }
  }, []);

  // 5-minute page timer countdown
  useEffect(() => {
    let interval = null;
    if (pageTimerActive && pageTimer > 0) {
      interval = setInterval(() => {
        setPageTimer(time => {
          if (time <= 1) {
            setPageTimerActive(false);
            // Verify timer is still for current movie/show before redirecting
            const timerMovieId = localStorage.getItem('seatSelectionTimerMovieId');
            const timerShowId = localStorage.getItem('seatSelectionTimerShowId');
            if (timerMovieId === movieId && timerShowId === showId) {
              localStorage.removeItem('seatSelectionPageTimerStartTime');
              localStorage.removeItem('seatSelectionTimerMovieId');
              localStorage.removeItem('seatSelectionTimerShowId');
              // Redirect to movie detail page when timer expires (use setTimeout to avoid render error)
              setTimeout(() => {
                if (movieId) {
                  const encryptedMovieId = encryptId(movieId);
                  router.push(`/movie-detail?movieId=${encryptedMovieId}`);
                } else {
                  router.push('/');
                }
              }, 0);
            } else {
              // Timer is for different movie/show - just clear it
              localStorage.removeItem('seatSelectionPageTimerStartTime');
              localStorage.removeItem('seatSelectionTimerMovieId');
              localStorage.removeItem('seatSelectionTimerShowId');
            }
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    } else if (pageTimer === 0 && pageTimerActive) {
      // Verify timer is still for current movie/show before redirecting
      const timerMovieId = localStorage.getItem('seatSelectionTimerMovieId');
      const timerShowId = localStorage.getItem('seatSelectionTimerShowId');
      if (timerMovieId === movieId && timerShowId === showId) {
        localStorage.removeItem('seatSelectionPageTimerStartTime');
        localStorage.removeItem('seatSelectionTimerMovieId');
        localStorage.removeItem('seatSelectionTimerShowId');
        setPageTimerActive(false);
        // Redirect to movie detail page when timer expires (use setTimeout to avoid render error)
        setTimeout(() => {
          if (movieId) {
            const encryptedMovieId = encryptId(movieId);
            router.push(`/movie-detail?movieId=${encryptedMovieId}`);
          } else {
            router.push('/');
          }
        }, 0);
      } else {
        // Timer is for different movie/show - just clear it
        localStorage.removeItem('seatSelectionPageTimerStartTime');
        localStorage.removeItem('seatSelectionTimerMovieId');
        localStorage.removeItem('seatSelectionTimerShowId');
        setPageTimerActive(false);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pageTimerActive, pageTimer, movieId, router]);

  // Countdown timer effect - 2 minutes timer for booking modal
  useEffect(() => {
    let interval = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => {
          if (time <= 1) {
            setTimerActive(false);
            // Timer expired - release seats and reload page
            if (confirmedReferenceNo) {
              // If confirmed, use ReleaseConfirmedLockedSeats
              releaseConfirmedSeatLock(cinemaId, showId, confirmedReferenceNo);
            } else if (lockReferenceNo) {
              // If only locked, use ReleaseLockedSeats
              releaseSeatLock(cinemaId, showId, lockReferenceNo);
            }
            // Clear state and reload page
              setLockReferenceNo(null);
            setConfirmedReferenceNo(null);
            setLockSeatResponse(null);
              setSelectedSeats([]);
              setShowBookingSummary(false);
            // Reload page after 1 second
            setTimeout(() => {
              window.location.reload();
            }, 1000);
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    } else if (timeLeft === 0) {
      // Timer expired - release seats and reload
      if (confirmedReferenceNo) {
        releaseConfirmedSeatLock(cinemaId, showId, confirmedReferenceNo);
      } else if (lockReferenceNo) {
      releaseSeatLock(cinemaId, showId, lockReferenceNo);
      }
      setLockReferenceNo(null);
      setConfirmedReferenceNo(null);
      setLockSeatResponse(null);
      setSelectedSeats([]);
      setShowBookingSummary(false);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, timeLeft, lockReferenceNo, confirmedReferenceNo, cinemaId, showId]);

  useEffect(() => {
    // Get total ticket count from localStorage (set by ticket-type page)
    const ticketDataStr = localStorage.getItem('ticketData');
    const selectedTicketsStr = localStorage.getItem('selectedTickets');
    
    if (ticketDataStr && selectedTicketsStr) {
      try {
        const ticketDataObj = JSON.parse(ticketDataStr);
        const selectedTicketsObj = JSON.parse(selectedTicketsStr);
        
        setTicketData(ticketDataObj);
        setSelectedTickets(selectedTicketsObj);
        
        // Calculate total tickets (accounting for twin-seats)
        let totalTickets = 0;
        Object.entries(selectedTicketsObj).forEach(([ticketTypeID, count]) => {
          const isTwinSeats = ticketDataObj?.generalInfo?.ticketTypeIDForTwinSeatsAndVIPSeats === parseInt(ticketTypeID);
          totalTickets += count * (isTwinSeats ? 2 : 1);
        });
        
        setMaxSeats(totalTickets);
      } catch (e) {
        console.error('Error parsing ticket data:', e);
      }
    }
    
    loadData();
    
    // Cleanup: Release locked seats when component unmounts
    return () => {
      if (lockReferenceNo) {
        releaseSeatLock(cinemaId, showId, lockReferenceNo).catch(e => 
          console.error('Error releasing seats on unmount:', e)
        );
      }
    };
  }, [cinemaId, showId, movieId]);

  const loadData = async (targetShowId = null) => {
    const activeShowId = targetShowId || currentShowId || showId;
    if (!cinemaId || !activeShowId) {
      setError('Missing cinema ID or show ID');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Load seat layout
      const layoutData = await shows.getSeatLayoutAndProperties(cinemaId, activeShowId);
      setSeatLayout(layoutData);
      
      // Extract seats array from response
      const allSeats = Array.isArray(layoutData) 
        ? layoutData 
        : (layoutData?.seats || layoutData?.data || []);
      
      // Filter out maintenance/blocked seats (seatStatus === 2) to match WordPress behavior
      // Only show available (0) and occupied (1) seats
      const seats = allSeats.filter(seat => {
        const status = seat.seatStatus;
        // Show seats with status 0 (available) or 1 (occupied/sold)
        // Hide seats with status 2 (maintenance/blocked) or other statuses
        return status === 0 || status === 1;
      });
      
      setSeatsData(seats);

      // Load movie details
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

      // Load all show times
      try {
        const showTimesList = await shows.getShowTimes(cinemaId);
        const allTimes = Array.isArray(showTimesList) ? showTimesList : [];
        setAllShowTimes(allTimes);
        
        // Load current show time details first
        const showTime = allTimes.find(s => (s.showID || s.showId || s.id) == activeShowId);
        if (showTime) {
          setShowTimeDetails(showTime);
          
          // Get the date from current show time
          let selectedDateStr = null;
          if (showTime.showDate) {
            selectedDateStr = showTime.showDate.split('T')[0].split(' ')[0]; // Get YYYY-MM-DD
          } else if (showTime.showTime) {
            const showDate = new Date(showTime.showTime);
            const year = showDate.getFullYear();
            const month = String(showDate.getMonth() + 1).padStart(2, '0');
            const day = String(showDate.getDate()).padStart(2, '0');
            selectedDateStr = `${year}-${month}-${day}`;
          }
          
          // Filter show times for the current movie AND selected date
          if (movieId && allTimes.length > 0 && selectedDateStr) {
            const filtered = allTimes
              .filter(show => {
                // Match movieID
                const showMovieID = show.movieID || show.movieId;
                if (parseInt(showMovieID) !== parseInt(movieId) && String(showMovieID) !== String(movieId)) {
                  return false;
                }
                
                // Match date
                if (show.showDate) {
                  const showDateStr = show.showDate.split('T')[0].split(' ')[0];
                  if (showDateStr !== selectedDateStr) {
                    return false;
                  }
                } else if (show.showTime) {
                  const showDate = new Date(show.showTime);
                  const year = showDate.getFullYear();
                  const month = String(showDate.getMonth() + 1).padStart(2, '0');
                  const day = String(showDate.getDate()).padStart(2, '0');
                  const showDateStr = `${year}-${month}-${day}`;
                  if (showDateStr !== selectedDateStr) {
                    return false;
                  }
                } else {
                  return false;
                }
                
                return true;
              })
              .map(show => ({
                ...show,
                showID: show.showID || show.showId || show.id,
                time: show.showTime 
                  ? new Date(show.showTime).toLocaleTimeString('en-US', { 
                      hour: 'numeric', 
                      minute: '2-digit',
                      hour12: true 
                    })
                  : '10:00 AM',
                available: show.sellingStatus === 0 && show.allowOnlineSales === true,
                sellingFast: show.sellingStatus === 1,
                soldOut: show.sellingStatus === 1 || show.sellingStatus === 2 || show.allowOnlineSales === false,
              }))
              .sort((a, b) => {
                const timeA = a.showTime ? new Date(a.showTime).getTime() : 0;
                const timeB = b.showTime ? new Date(b.showTime).getTime() : 0;
                return timeA - timeB;
              });
            
            setFilteredShowTimes(filtered);
            
            // Find current show time index
            const currentIndex = filtered.findIndex(s => (s.showID || s.showId || s.id) == activeShowId);
            if (currentIndex !== -1) {
              setSelectedTimeIndex(currentIndex);
            }
          }
        }
      } catch (showTimeErr) {
        console.error('Error loading show time details:', showTimeErr);
      }

    } catch (err) {
      console.error('Error loading seat layout:', err);
      if (err instanceof APIError) {
        setError(err.message || 'Failed to load seat layout');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Build seat grid from API data
  const buildSeatGrid = () => {
    if (!seatsData || seatsData.length === 0) return {};

    const grid = {};
    
    // Find the maximum column number from actual seat data
    const maxColumn = Math.max(...seatsData.map(seat => seat.seatColumn || 0), 0);

    // Group seats by row - using dynamic row letter from seatNo
    seatsData.forEach(seat => {
      // Extract non-numeric part as row letter (e.g., "A1" -> "A", "AA1" -> "AA")
      const rowLetter = seat.seatNo.replace(/[0-9]/g, '').trim(); 
      if (!grid[rowLetter]) {
        grid[rowLetter] = {};
      }
      grid[rowLetter][seat.seatColumn] = seat;
    });

    // Fill in missing columns with null for spacing
    Object.keys(grid).forEach(rowLetter => {
      for (let col = 1; col <= maxColumn; col++) {
        if (!grid[rowLetter][col]) {
          grid[rowLetter][col] = null;
        }
      }
    });

    return grid;
  };

  const seatGrid = buildSeatGrid();
  // Sort rows alphabetically (A, B, C...) then reverse if needed for display (Screen at top vs bottom)
  // Usually cinema maps show A at screen (Top) or Back (Bottom). 
  // Code previously used .sort().reverse().
  // If we want natural order (A first), or reverse. 
  // Previous code: Object.keys(seatGrid).sort().reverse();
  const rowLetters = Object.keys(seatGrid).sort().reverse();
  
  // Calculate total seats across all rows for dynamic gap calculation
  const calculateTotalSeats = () => {
    let total = 0;
    rowLetters.forEach(rowLetter => {
      const rowSeats = seatGrid[rowLetter];
      if (rowSeats) {
        const rowMaxColumn = Math.max(...Object.keys(rowSeats).map(k => parseInt(k) || 0), 0);
        total += rowMaxColumn;
      }
    });
    return total;
  };
  
  const totalSeats = calculateTotalSeats();
  
  // Calculate dynamic gap based on row seat count
  const getDynamicGap = (rowMaxColumn) => {
    if (rowMaxColumn <= 8) return 'gap-4 sm:gap-5 md:gap-6 lg:gap-7';
    if (rowMaxColumn <= 12) return 'gap-3 sm:gap-3.5 md:gap-4 lg:gap-5';
    if (rowMaxColumn <= 18) return 'gap-2 sm:gap-2.5 md:gap-3 lg:gap-3.5';
    if (rowMaxColumn <= 25) return 'gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3';
    if (rowMaxColumn <= 35) return 'gap-1 sm:gap-1.5 md:gap-2 lg:gap-2.5';
    return 'gap-1 sm:gap-1 md:gap-1.5 lg:gap-2';
  };

  // Get priceID for a seat based on ticket type mapping
  const getPriceIDForSeat = (seatIndex) => {
    if (!ticketData?.priceDetails || !selectedTickets) return 0;
    
    // Map seats to ticket types based on order
    // For simplicity, we'll use the first available ticket type
    // In a real scenario, you might want to map seats to specific ticket types
    const ticketTypeEntries = Object.entries(selectedTickets);
    if (ticketTypeEntries.length === 0) return 0;
    
    // Find which ticket type this seat belongs to based on index
    let currentIndex = 0;
    for (const [ticketTypeID, count] of ticketTypeEntries) {
      const ticketTypeIDNum = parseInt(ticketTypeID);
      const priceDetail = ticketData.priceDetails.find(p => p.ticketTypeID === ticketTypeIDNum);
      
      if (priceDetail && seatIndex >= currentIndex && seatIndex < currentIndex + count) {
        return priceDetail.priceID || 0;
      }
      currentIndex += count;
    }
    
    // Default to first ticket type's priceID
    const firstTicketTypeID = parseInt(ticketTypeEntries[0][0]);
    const firstPriceDetail = ticketData.priceDetails.find(p => p.ticketTypeID === firstTicketTypeID);
    return firstPriceDetail?.priceID || 0;
  };

  // Lock seats via API
  const lockSeat = async (seats) => {
    if (!seats || seats.length === 0) return null;

    setIsLocking(true);
    setError(''); // Clear previous errors
    
    try {
      // Use currentShowId to ensure we're using the latest show ID (important when time changes)
      const activeShowId = currentShowId || showId;
      
      if (!activeShowId || !cinemaId) {
        setError('Missing show ID or cinema ID. Please refresh the page and try again.');
        return null;
      }
      
      // Get current selected seats count to determine seat index
      const currentSelectedCount = selectedSeats.length;
      
      // Format: [{ seatID: 0, priceID: 0 }]
      const seatData = seats.map((seat, index) => {
        const seatID = typeof seat === 'object' ? seat.seatID : seat;
        // Calculate seat index based on current selection + this seat's position
        const seatIndex = currentSelectedCount + index;
        const priceID = typeof seat === 'object' && seat.priceID !== undefined 
          ? seat.priceID 
          : getPriceIDForSeat(seatIndex);
        
        return {
          seatID: seatID,
          priceID: priceID
        };
      });
      
      // Validate seat data
      if (seatData.some(seat => !seat.seatID || seat.seatID === 0)) {
        setError('Invalid seat selection. Please select seats again.');
        return null;
      }
      
      console.log('Locking seats with data:', { cinemaId, showId: activeShowId, seatData });
      
      const response = await booking.lockSeats(cinemaId, activeShowId, 0, seatData);
      const referenceNo = response?.referenceNo || response?.reference || response?.data?.referenceNo || response?.ReferenceNo;
      
      if (!referenceNo) {
        console.warn('No reference number in lock response:', response);
      }
      
      // Store the full response including lockedSeats array
      setLockSeatResponse(response);
      
      return referenceNo;
    } catch (err) {
      console.error('Error locking seats:', err);
      if (err instanceof APIError) {
        setError(err.message || 'Failed to lock seats. Please try again.');
      } else {
        setError('Failed to lock seats. Please try again.');
      }
      return null;
    } finally {
      setIsLocking(false);
    }
  };

  // Release seat lock via API
  const releaseSeatLock = async (cinemaId, showId, referenceNo) => {
    if (!referenceNo) return;
    
    setIsReleasing(true);
    try {
      await booking.releaseLockedSeats(cinemaId, showId, referenceNo, 0);
    } catch (err) {
      console.error('Error releasing seat lock:', err);
      // Don't show error to user for release failures
    } finally {
      setIsReleasing(false);
    }
  };

  const releaseConfirmedSeatLock = async (cinemaId, showId, referenceNo) => {
    if (!referenceNo) return;
    
    setIsReleasing(true);
    try {
      await booking.releaseConfirmedLockedSeats(cinemaId, showId, referenceNo);
    } catch (err) {
      console.error('Error releasing confirmed seat lock:', err);
      // Don't show error to user for release failures
    } finally {
      setIsReleasing(false);
    }
  };

  // Helper function to map seats to tickets deterministically
  // Returns a map of seatNo -> priceDetail
  const mapSeatsToTickets = () => {
    if (!ticketData?.priceDetails || !selectedTickets || selectedSeats.length === 0) return {};

    // Clone available tickets
    const availableTickets = { ...selectedTickets };
    
    // Helper to categorize tickets
    const getTicketCategory = (ticketTypeID) => {
      const id = parseInt(ticketTypeID);
      const priceDetail = ticketData.priceDetails?.find(p => p.ticketTypeID === id);
      const name = priceDetail?.ticketTypeName?.toUpperCase() || '';
      
      // Twin keys
      if (id === ticketData.generalInfo?.ticketTypeIDForTwinSeatsAndVIPSeats || name.includes('TWIN')) return 'TWIN';
      // Kids keys
      if (id === ticketData.generalInfo?.ticketTypeIDForKidsSeat || name.includes('KID') || name.includes('CHILD')) return 'KIDS';
      // Sofa keys
      if (id === ticketData.generalInfo?.ticketTypeIDForSofa || name.includes('SOFA') || name.includes('BED') || name.includes('FAMILY')) return 'SOFA';
      // Vip keys
      if (name.includes('VIP')) return 'VIP';
      // Handicap
      if (name.includes('HANDICAP') || name.includes('OKU')) return 'HANDICAP';
      // Normal
      return 'NORMAL';
    };

    // Group tickets by category
    const ticketsByCategory = {
      'TWIN': [], 'KIDS': [], 'SOFA': [], 'VIP': [], 'HANDICAP': [], 'NORMAL': []
    };
    
    Object.entries(availableTickets).forEach(([id, count]) => {
      if (count > 0) {
        const category = getTicketCategory(id);
        ticketsByCategory[category].push({ id: parseInt(id), count });
      }
    });

    const result = {};
    const sortedSeats = [...selectedSeats].sort();
    const processedSeats = new Set();

    for (const seatNo of sortedSeats) {
      if (processedSeats.has(seatNo)) continue;

      const seat = seatsData.find(s => s.seatNo === seatNo);
      if (!seat) continue;

      const rawType = Number(seat.seatType);
      let requiredCategory = 'NORMAL';
      let isTwinPair = false;

      // Determine Category
      if (rawType === 2 && seat.partnerSeatID) {
        requiredCategory = 'TWIN';
        isTwinPair = true;
      } else if (rawType === 1) {
         if (ticketsByCategory['VIP'].length > 0 && ticketsByCategory['HANDICAP'].length === 0) {
           requiredCategory = 'VIP';
         } else {
           requiredCategory = 'HANDICAP';
         }
      } else if (rawType === 3) requiredCategory = 'KIDS';
      else if (rawType === 4) requiredCategory = 'SOFA';
      
      // Find Ticket
      let assignedTicketID = null;
      let candidateList = ticketsByCategory[requiredCategory];
      
      // Fallback strategies
      let match = candidateList.find(t => t.count > 0);
      
      if (!match && requiredCategory !== 'NORMAL') {
        const normalList = ticketsByCategory['NORMAL'];
        match = normalList.find(t => t.count > 0);
      }
      if (!match) {
         Object.values(ticketsByCategory).some(list => {
           match = list.find(t => t.count > 0);
           return !!match;
         });
      }

      let priceDetail = null;
      if (match) {
        assignedTicketID = match.id;
        match.count--; // Decrement
        priceDetail = ticketData.priceDetails.find(p => p.ticketTypeID === assignedTicketID);
      } else {
        // No ticket left? Use default/first price
        priceDetail = ticketData.priceDetails[0];
      }

      // Assign
      result[seatNo] = priceDetail;
      processedSeats.add(seatNo);

      // Handle Partner
      if (isTwinPair) {
        // Find partner - use loose equality for ID
        const partner = seatsData.find(s => s.seatID == seat.partnerSeatID);
        if (partner && selectedSeats.includes(partner.seatNo)) {
           // Partner gets SAME ticket (and price)
           
           const ticketCategory = match ? getTicketCategory(match.id) : 'NORMAL';
           
           if (ticketCategory === 'TWIN') {
             // Shared ticket
             result[partner.seatNo] = priceDetail;
             processedSeats.add(partner.seatNo);
           } else {
             // Should consume another ticket for the partner if possible
             // Recursive-ish? 
             // Let's just try to find another match for the partner
             let partnerMatch = null;
             // Try to find same type first
             if (match && match.count > 0) {
               partnerMatch = match;
             } else {
               // Find another normal/available
               const normalList = ticketsByCategory['NORMAL'];
               partnerMatch = normalList.find(t => t.count > 0);
             }
             
             if (partnerMatch) {
               partnerMatch.count--;
               const partnerPrice = ticketData.priceDetails.find(p => p.ticketTypeID === partnerMatch.id);
               result[partner.seatNo] = partnerPrice;
             } else {
               result[partner.seatNo] = priceDetail; // Fallback to same
             }
             processedSeats.add(partner.seatNo);
           }
        }
      }
    }
    return result;
  };

  // Get price for a specific seat by seat number
  const getSeatPrice = (seatNo) => {
    const map = mapSeatsToTickets();
    const priceDetail = map[seatNo];
    if (!priceDetail) return 0;
    
    // For display, we use totalTicketPrice per seat
    return priceDetail.totalTicketPrice || ((priceDetail.price || 0) + (priceDetail.entertainmentTax || 0));
  };

  // Remove a seat from selection
  const removeSeat = (seatNo) => {
    setSelectedSeats(prev => {
      // Find the seat object
      const seat = seatsData.find(s => s.seatNo === seatNo);
      
      // If it's a twin seat, remove both seats
      if (seat && seat.seatType === 2 && seat.partnerSeatID) {
        const partnerSeat = seatsData.find(s => s.seatID === seat.partnerSeatID);
        if (partnerSeat) {
          return prev.filter(s => s !== seatNo && s !== partnerSeat.seatNo);
        }
      }
      
      // Otherwise, just remove the single seat
      return prev.filter(s => s !== seatNo);
    });
  };

  // Toggle seat selection - NO API CALL, just local state
  const toggleSeat = (seat) => {
    if (!seat || seat.seatStatus !== 0) return; // Can't select occupied or invalid seats
    
    const seatNo = seat.seatNo;
    
    // Handle double seats - if selecting one, select both
    if (seat.seatType === 2 && seat.partnerSeatID) {
      const partnerSeat = seatsData.find(s => s.seatID === seat.partnerSeatID);
      if (partnerSeat && partnerSeat.seatStatus === 0) {
        const bothSeats = [seatNo, partnerSeat.seatNo].sort();
        
        setSelectedSeats(prev => {
          const hasBoth = bothSeats.every(s => prev.includes(s));
          if (hasBoth) {
            // Deselect both - just remove from selection (no API call)
            return prev.filter(s => !bothSeats.includes(s));
          } else {
            // Check if we can select (2 seats for double)
            if (prev.length + 2 > maxSeats) {
              return prev; // Can't select, already at max
            }
            // Select both seats - just add to selection (no API call)
            return [...prev, ...bothSeats];
          }
        });
      }
    } else {
      // Single seat
      setSelectedSeats(prev => {
        const isSelected = prev.includes(seatNo);
        if (isSelected) {
          // Deselect - just remove from selection (no API call)
          return prev.filter(s => s !== seatNo);
        } else {
          // Check if we can select
          if (prev.length >= maxSeats) {
            return prev; // Can't select, already at max
          }
          // Select seat - just add to selection (no API call)
          return [...prev, seatNo];
        }
      });
    }
  };

  const isSeatSelected = (seat) => {
    if (!seat) return false;
    return selectedSeats.includes(seat.seatNo);
  };

  const isSeatOccupied = (seat) => {
    if (!seat) return false;
    return seat.seatStatus !== 0; // Assuming 0 = available, 1+ = occupied
  };

  const isDoubleSeat = (seat) => {
    return seat && seat.seatType === 2;
  };

  const isPartnerSeat = (seat) => {
    if (!seat || !seat.partnerSeatID) return false;
    return seatsData.some(s => s.seatID === seat.partnerSeatID && s.seatColumn < seat.seatColumn);
  };

  // Get seat type: 'twin', 'handicap', or 'normal'
  // Based on API data:
  // - seatType: 2 with partnerSeatID > 0 = Twin seats (e.g., A18/A17)
  // - seatType: 1 = Handicap/OKU seats
  // - seatType: 0 = Normal seats
  const getSeatType = (seat) => {
    if (!seat) return 'normal';
    
    // Twin seats: seatType === 2 and has partnerSeatID
    if (seat.seatType === 2 && seat.partnerSeatID && seat.partnerSeatID > 0) {
      return 'twin';
    }
    
    // Handicap/OKU seats: seatType === 1
    if (seat.seatType === 1) {
      return 'handicap';
    }

    // Family Bed / Sofa: seatType === 4
    if (seat.seatType === 4) {
      return 'family-bed';
    }

    // Kids: seatType === 3
    if (seat.seatType === 3) {
      return 'kids';
    }
    
    // Default: normal seats (seatType === 0)
    return 'normal';
  };

  // Get ticket type counts by category
  // Handicap tickets are counted as normal tickets (same as adult/senior citizen)
  const getTicketTypeCounts = () => {
    if (!ticketData || !selectedTickets) return { twin: 0, handicap: 0, normal: 0 };
    
    const twinSeatTypeID = ticketData.generalInfo?.ticketTypeIDForTwinSeatsAndVIPSeats;
    let twinCount = 0;
    let normalCount = 0;
    
    Object.entries(selectedTickets).forEach(([ticketTypeID, count]) => {
      const ticketTypeIDNum = parseInt(ticketTypeID);
      const priceDetail = ticketData.priceDetails?.find(p => p.ticketTypeID === ticketTypeIDNum);
      const ticketTypeName = priceDetail?.ticketTypeName?.toUpperCase() || '';
      
      if (ticketTypeIDNum === twinSeatTypeID || ticketTypeName.includes('TWIN')) {
        twinCount += count;
      } else {
        // All other tickets (adult, senior citizen, handicap) count as normal
        normalCount += count;
      }
    });
    
    return { twin: twinCount, handicap: 0, normal: normalCount };
  };

  // Count selected seats by type
  // Handicap seats are counted as normal seats (same as adult/senior citizen)
  const getSelectedSeatsByType = () => {
    const counts = { twin: 0, handicap: 0, normal: 0 };
    const selectedSeatObjects = selectedSeats.map(seatNo => 
      seatsData.find(s => s.seatNo === seatNo)
    ).filter(Boolean);
    
    selectedSeatObjects.forEach(seat => {
      const seatType = getSeatType(seat);
      if (seatType === 'twin') {
        // Count twin seats as pairs (each pair = 1)
        if (!isPartnerSeat(seat)) {
          counts.twin += 1;
        }
      } else if (seatType === 'handicap') {
        // Count handicap seats as normal seats (same category)
        counts.normal += 1;
      } else {
        counts[seatType] += 1;
      }
    });
    
    return counts;
  };

  // Check if seat should be disabled based on ticket type selection
  // Twin seats have separate restrictions, normal and handicap seats share the same restrictions
  // Special logic for Hall 6: seatType 4 = Adult, seatType 0 = Kids, seatType 3 = Family Bed
  // Seat type restrictions based on ticket selection:
  // If Kids tickets selected → only Kids seats (seatType: 3) can be selected
  // If Sofa tickets selected → only Sofa seats (seatType: 4) can be selected
  // If VIP tickets selected → only VIP seats (seatType: 1) can be selected
  // If Normal tickets selected → only Normal seats (seatType: 0) can be selected
  // If Twin tickets selected → only Twin seats (seatType: 2) can be selected
  const isSeatDisabled = (seat) => {
    if (!seat || seat.seatStatus !== 0) return true; // Disable occupied seats
    
    // Allow deselection of already selected seats (check this first)
    const seatIsSelected = selectedSeats.includes(seat.seatNo);
    if (seatIsSelected) {
      // For twin seats, also check partner seat
      if (seat.seatType === 2 && seat.partnerSeatID) {
        const partnerSeat = seatsData.find(s => s.seatID === seat.partnerSeatID);
        if (partnerSeat && selectedSeats.includes(partnerSeat.seatNo)) {
          return false; // Allow deselection of selected twin pair
        }
      }
      return false; // Allow deselection
    }
    
    // Check if tickets are selected
    if (!selectedTickets || Object.keys(selectedTickets).length === 0) {
      return true; // No tickets selected
    }
    
    if (!ticketData) {
      // If no ticket data, continue with default logic below
    } else {
      const currentSeatType = Number(seat.seatType);
      
      // Get ticket type IDs
      const kidsTicketTypeID = ticketData.generalInfo?.ticketTypeIDForKidsSeat;
      const sofaTicketTypeID = ticketData.generalInfo?.ticketTypeIDForSofa;
      const twinVIPTicketTypeID = ticketData.generalInfo?.ticketTypeIDForTwinSeatsAndVIPSeats;
      
      // Check which ticket types are selected
      const hasKidsTickets = kidsTicketTypeID && (selectedTickets[String(kidsTicketTypeID)] || 0) > 0;
      const hasSofaTickets = sofaTicketTypeID && (selectedTickets[String(sofaTicketTypeID)] || 0) > 0;
      const hasTwinVIPTickets = twinVIPTicketTypeID && (selectedTickets[String(twinVIPTicketTypeID)] || 0) > 0;
      
      // Check for Normal/Adult tickets (any ticket that's not Kids, Sofa, or Twin/VIP)
      const hasNormalTickets = Object.entries(selectedTickets).some(([ticketTypeID, count]) => {
        if (count === 0) return false;
        const ticketTypeIDNum = parseInt(ticketTypeID);
        return ticketTypeIDNum !== kidsTicketTypeID && 
               ticketTypeIDNum !== sofaTicketTypeID && 
               ticketTypeIDNum !== twinVIPTicketTypeID;
      });
      
      // Determine if Twin or VIP based on ticket name
      let isTwinTicket = false;
      let isVIPTicket = false;
      if (hasTwinVIPTickets && twinVIPTicketTypeID) {
        const priceDetail = ticketData.priceDetails?.find(p => p.ticketTypeID === twinVIPTicketTypeID);
        const ticketTypeName = priceDetail?.ticketTypeName?.toUpperCase() || '';
        isTwinTicket = ticketTypeName.includes('TWIN');
        isVIPTicket = !isTwinTicket && (ticketTypeName.includes('VIP') || ticketTypeName.includes('VIP'));
      }
      
      // Check if this seat type matches any selected ticket type
      // Allow multiple ticket types to be selected simultaneously
      
      // Check for Kids seats (seatType: 3)
      if (currentSeatType === 3) {
        if (hasKidsTickets) {
          // Count how many Kids seats are already selected
          const selectedKidsSeats = selectedSeats.filter(seatNo => {
            const s = seatsData.find(ss => ss.seatNo === seatNo);
            return s && Number(s.seatType) === 3;
          }).length;
          const kidsTicketCount = selectedTickets[String(kidsTicketTypeID)] || 0;
          // If we've selected all Kids seats for the ticket count, disable remaining Kids seats
          if (selectedKidsSeats >= kidsTicketCount) return true;
          return false; // Can select more Kids seats
        }
        // No Kids tickets selected, disable Kids seats
        return true;
      }
      
      // Check for Sofa seats (seatType: 4)
      if (currentSeatType === 4) {
        if (hasSofaTickets) {
          // Count how many Sofa seats are already selected
          const selectedSofaSeats = selectedSeats.filter(seatNo => {
            const s = seatsData.find(ss => ss.seatNo === seatNo);
            return s && Number(s.seatType) === 4;
          }).length;
          const sofaTicketCount = selectedTickets[String(sofaTicketTypeID)] || 0;
          // If we've selected all Sofa seats for the ticket count, disable remaining Sofa seats
          if (selectedSofaSeats >= sofaTicketCount) return true;
          return false; // Can select more Sofa seats
        }
        // No Sofa tickets selected, disable Sofa seats
        return true;
      }
      
      // Check for VIP seats (seatType: 1)
      if (currentSeatType === 1) {
        if (hasTwinVIPTickets && isVIPTicket) {
          // Count how many VIP seats are already selected
          const selectedVIPSeats = selectedSeats.filter(seatNo => {
            const s = seatsData.find(ss => ss.seatNo === seatNo);
            return s && Number(s.seatType) === 1;
          }).length;
          const vipTicketCount = selectedTickets[String(twinVIPTicketTypeID)] || 0;
          // If we've selected all VIP seats for the ticket count, disable remaining VIP seats
          if (selectedVIPSeats >= vipTicketCount) return true;
          return false; // Can select more VIP seats
        }
        // No VIP tickets selected, disable VIP seats
        return true;
      }
      
      // Check for Twin seats (seatType: 2) - handled by existing logic below
      if (currentSeatType === 2) {
        if (hasTwinVIPTickets && isTwinTicket) {
          // Twin seats are handled by existing logic below, continue
        } else {
          // No Twin tickets selected, disable Twin seats (unless handled by default logic)
          // Continue to default logic below
        }
      }
      
      // Check for Normal seats (seatType: 0)
      if (currentSeatType === 0) {
        if (hasNormalTickets) {
          // Count how many Normal seats are already selected
          const selectedNormalSeats = selectedSeats.filter(seatNo => {
            const s = seatsData.find(ss => ss.seatNo === seatNo);
            return s && Number(s.seatType) === 0;
          }).length;
          // Count total normal tickets
          let normalTicketCount = 0;
          Object.entries(selectedTickets).forEach(([ticketTypeID, count]) => {
            const ticketTypeIDNum = parseInt(ticketTypeID);
            if (ticketTypeIDNum !== kidsTicketTypeID && 
                ticketTypeIDNum !== sofaTicketTypeID && 
                ticketTypeIDNum !== twinVIPTicketTypeID) {
              normalTicketCount += count;
            }
          });
          // If we've selected all Normal seats for the ticket count, disable remaining Normal seats
          if (selectedNormalSeats >= normalTicketCount) return true;
          return false; // Can select more Normal seats
        }
        // No Normal tickets selected, disable Normal seats
        return true;
      }
    }
    
    // Check if this is Hall 6
    const hallNo = seatLayout?.hallDetails?.hallNo;
    const isHall6 = hallNo === 6;
    
    // Special logic for Hall 6
    if (isHall6) {
      // Map seat types to ticket types for Hall 6:
      // seatType 4 = ADULT (ticketTypeID: 17)
      // seatType 0 = KIDS (ticketTypeID: 37)
      // seatType 3 = FAMILY BED (ticketTypeID: 38)
      
      // If this seat is already selected, don't disable it (allow deselection)
      // Note: seatIsSelected is already checked above, so this check is redundant but kept for clarity
      if (selectedSeats.includes(seat.seatNo)) return false;
      
      // Check which ticket types are selected
      if (!selectedTickets || Object.keys(selectedTickets).length === 0) {
        return true; // No tickets selected
      }
      
      // Get the seat's raw seatType value
      const rawSeatType = seat.seatType;
      
      // Check if the seat type matches any selected ticket type
      let hasMatchingTicket = false;
      let selectedCountForThisType = 0;
      let totalCountForThisType = 0;
      
      if (rawSeatType === 4) {
        // Adult seat - check if ADULT tickets (ticketTypeID: 17) are selected
        const adultCount = selectedTickets['17'] || 0;
        if (adultCount > 0) {
          hasMatchingTicket = true;
          totalCountForThisType = adultCount;
          // Count how many seatType 4 seats are already selected
          selectedCountForThisType = selectedSeats.filter(seatNo => {
            const s = seatsData.find(ss => ss.seatNo === seatNo);
            return s && s.seatType === 4;
          }).length;
        }
      } else if (rawSeatType === 0) {
        // Kids seat - check if KIDS tickets (ticketTypeID: 37) are selected
        const kidsCount = selectedTickets['37'] || 0;
        if (kidsCount > 0) {
          hasMatchingTicket = true;
          totalCountForThisType = kidsCount;
          // Count how many seatType 0 seats are already selected
          selectedCountForThisType = selectedSeats.filter(seatNo => {
            const s = seatsData.find(ss => ss.seatNo === seatNo);
            return s && s.seatType === 0;
          }).length;
        }
      } else if (rawSeatType === 3) {
        // Family Bed seat - check if FAMILY BED tickets (ticketTypeID: 38) are selected
        const familyBedCount = selectedTickets['38'] || 0;
        if (familyBedCount > 0) {
          hasMatchingTicket = true;
          totalCountForThisType = familyBedCount;
          // Count how many seatType 3 seats are already selected
          selectedCountForThisType = selectedSeats.filter(seatNo => {
            const s = seatsData.find(ss => ss.seatNo === seatNo);
            return s && s.seatType === 3;
          }).length;
        }
      }
      
      // If no matching ticket type is selected, disable this seat
      if (!hasMatchingTicket) return true;
      
      // If we've already selected all seats for this ticket type, disable
      if (selectedCountForThisType >= totalCountForThisType) return true;
      
      // Can select more seats of this type
      return false;
    }
    
    // Default logic for other halls
    const seatType = getSeatType(seat);
    const ticketCounts = getTicketTypeCounts();
    const selectedCounts = getSelectedSeatsByType();
    
    // If this seat is already selected, don't disable it (allow deselection)
    // Note: seatIsSelected is already checked at the top of the function
    if (seatType === 'twin' && seat.partnerSeatID) {
      const partnerSeat = seatsData.find(s => s.seatID === seat.partnerSeatID);
      const partnerIsSelected = partnerSeat && selectedSeats.includes(partnerSeat.seatNo);
      if (selectedSeats.includes(seat.seatNo) && partnerIsSelected) return false; // Don't disable selected pair
    } else {
      if (selectedSeats.includes(seat.seatNo)) return false; // Don't disable selected seat
    }
    
    // Twin seats: only selectable if twin tickets selected, limited to ticket count
    if (seatType === 'twin') {
      if (ticketCounts.twin === 0) return true; // No twin tickets selected
      if (selectedCounts.twin >= ticketCounts.twin) return true; // Already selected all twin seats needed
      return false; // Can select more twin seats
    }
    
    // Normal and handicap seats: share the same restrictions (counted together)
    // Only selectable if normal tickets (adult/senior/handicap) selected, limited to total ticket count
    if (seatType === 'normal' || seatType === 'handicap') {
      if (ticketCounts.normal === 0) return true; // No normal/handicap tickets selected
      if (selectedCounts.normal >= ticketCounts.normal) return true; // Already selected all normal/handicap seats needed
      return false; // Can select more normal/handicap seats
    }
    
    return false;
  };

  const handleGoBack = async () => {
    // Release locked seats if they were locked
    if (lockReferenceNo) {
      try {
        await releaseSeatLock(cinemaId, showId, lockReferenceNo);
        setLockReferenceNo(null);
        setLockSeatResponse(null);
      } catch (e) {
        console.error('Error releasing seats on back:', e);
      }
    }
    
    // Stop timer
    setTimerActive(false);
    
    // Clear selected seats when going back
    setSelectedSeats([]);
    localStorage.removeItem('selectedSeats');
    localStorage.removeItem('lockedSeats');
    localStorage.removeItem('bookingData');
    router.back();
  };

  // Calculate total ticket price
  const calculateTotalPrice = () => {
    if (!ticketData?.priceDetails || selectedSeats.length === 0) return { netPrice: 0, tax: 0, total: 0 };
    
    // Map selected seats to ticket types
    // For now, we'll use the first ticket type price for each seat
    // In a real scenario, you'd map seats to specific ticket types
    let netPrice = 0;
    let tax = 0;
    
    // Get ticket counts from selectedTickets
    const ticketTypeCounts = {};
    Object.entries(selectedTickets).forEach(([ticketTypeID, count]) => {
      ticketTypeCounts[parseInt(ticketTypeID)] = count;
    });
    
    // Calculate price based on ticket types
    ticketData.priceDetails.forEach((price) => {
      const count = ticketTypeCounts[price.ticketTypeID] || 0;
      if (count > 0) {
        const isTwinSeats = ticketData?.generalInfo?.ticketTypeIDForTwinSeatsAndVIPSeats === price.ticketTypeID || price.ticketTypeName?.toUpperCase().includes('TWIN');
        const seatsPerTicket = isTwinSeats ? 2 : 1;
        
        const pricePerTicket = price.price || 0;
        const taxPerTicket = price.entertainmentTax || 0;
        netPrice += pricePerTicket * count * seatsPerTicket;
        tax += taxPerTicket * count * seatsPerTicket;
      }
    });
    
    const total = netPrice + tax;
    
    return {
      netPrice: netPrice.toFixed(2),
      tax: tax.toFixed(2),
      total: total.toFixed(2)
    };
  };

  const handleBookSeat = async () => {
    // Check if seats are selected
    if (selectedSeats.length === 0) {
      setError('Please select at least one seat.');
      return;
    }
    
    // Check if we've selected the correct number of seats
    if (selectedSeats.length > maxSeats) {
      setError(`You can only select up to ${maxSeats} seat(s). Please remove some seats.`);
      return;
    }
    
    // Allow booking if we have at least one seat and not exceeding max
    
    setIsLocking(true);
    setError('');
    
    try {
      // Validate that we have seat data for the current show
      if (!seatsData || seatsData.length === 0) {
        setError('Seat layout not loaded. Please wait and try again.');
        setIsLocking(false);
        return;
      }

      // Use the mapping helper to generate the payload consistently
      const seatMap = mapSeatsToTickets();
      const seatObjects = [];
      const sortedSeats = [...selectedSeats].sort();
      
      for (const seatNo of sortedSeats) {
        const seat = seatsData.find(s => s.seatNo === seatNo);
        if (!seat) {
           console.error(`Seat ${seatNo} not found in layout`);
           continue; 
        }
        
        // Validate seatID exists
        if (!seat.seatID || seat.seatID === 0) {
          console.error(`Seat ${seatNo} has invalid seatID:`, seat);
          continue;
        }
        
        const priceDetail = seatMap[seatNo];
        // If map fails (shouldn't if valid), fallback to 0 or first price
        const priceID = priceDetail?.priceID || (ticketData?.priceDetails?.[0]?.priceID) || 0;
        
        seatObjects.push({
          seatID: seat.seatID,
          priceID: priceID
        });
      }
      
      // Validate all selected seats were processed
      if (seatObjects.length !== selectedSeats.length) {
      if (seatObjects.length === 0) {
             setError('Error processing seat selection.');
        setIsLocking(false);
        return;
         }
      }
      
      // Call lockSeat API
      const referenceNo = await lockSeat(seatObjects);
      
      if (!referenceNo) {
        setError('Failed to lock seats. Please try again.');
        setIsLocking(false);
        return;
      }
      
      // Store reference number and start timer
      setLockReferenceNo(referenceNo);
      setTimeLeft(300); // Reset to 5 minutes (300 seconds)
      setTimerActive(true);
      
      // Store timer start time (lock time) in localStorage for payment page
      // This is the actual timestamp when seats were locked
      const lockTime = Date.now();
      localStorage.setItem('timerStartTime', lockTime.toString());
      localStorage.setItem('lockReferenceNo', referenceNo);
      localStorage.setItem('lockTime', lockTime.toString()); // Also store as lockTime for clarity
      
      // Initialize form data with user data if available
      const userData = getUserData();
      setFormData({
        name: userData?.name || userData?.Name || '',
        email: userData?.email || userData?.Email || '',
        passportNo: userData?.passportNo || userData?.PassportNo || '',
        mobile: userData?.mobile || userData?.Mobile || userData?.mobileNo || userData?.MobileNo || '',
        membershipNo: userData?.membershipNo || userData?.MembershipNo || ''
      });
      setFormErrors({});
      
      // Show booking summary modal
      setShowBookingSummary(true);
    } catch (err) {
      console.error('Error locking seats:', err);
      setError('Failed to lock seats. Please try again.');
    } finally {
      setIsLocking(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.mobile.trim()) {
      errors.mobile = 'Mobile number is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProceedToPayment = async () => {
    // Validate form
    if (!validateForm()) {
      setError('Please fill in all required fields correctly.');
      return;
    }

    // Use the reference number from lockSeat API
    if (!lockReferenceNo) {
      setError('Seats are not locked. Please try selecting seats again.');
      return;
    }
    
    // Stop timer since we're proceeding
    setTimerActive(false);

    setIsConfirming(true);
    setError('');
    setFormErrors({});

    try {
      // Check membership validity if membershipNo is provided
      let membershipId = 0;
      if (formData.membershipNo && formData.membershipNo.trim()) {
        try {
          const membershipResponse = await booking.isValidMember(formData.membershipNo.trim());
          // Assuming API returns a valid response if membership is valid
          // Adjust based on actual API response structure
          if (membershipResponse) {
            membershipId = formData.membershipNo.trim();
          } else {
            setFormErrors(prev => ({ ...prev, membershipNo: 'Invalid membership number' }));
            setIsConfirming(false);
            return;
          }
        } catch (membershipErr) {
          console.error('Membership validation error:', membershipErr);
          setFormErrors(prev => ({ ...prev, membershipNo: 'Invalid membership number' }));
          setIsConfirming(false);
          return;
        }
      }

      // Get user info - use 0 for guest, otherwise from auth
      const userData = getUserData();
      const userId = userData?.userID || userData?.userId || userData?.id || 0;
      const paymentVia = 0; // Default payment method

      // Confirm locked seats with form data
      // API Signature: ShowID, ReferenceNo, UserID, Email, MembershipID, PaymentVia, Name, PassportNo, MobileNo
      const confirmResponse = await booking.confirmLockedSeats(
        showId,
        lockReferenceNo,
        userId,
        formData.email.trim(),
        membershipId,
        paymentVia,
        formData.name.trim(),
        formData.passportNo.trim(),
        formData.mobile.trim()
      );
      
      // Check response - API returns {id: 0, remarks: "Failed"} or {id: 1, remarks: "Success"}
      if (confirmResponse && confirmResponse.remarks === 'Failed') {
        setError('Failed to confirm seats. Please try again.');
        setIsConfirming(false);
        return;
      }

      // Check if confirmation was successful
      // API returns: {id: 0, remarks: "Failed"} on failure or {id: 1, remarks: "Success"} on success
      const isSuccess = confirmResponse && confirmResponse.remarks !== 'Failed' && confirmResponse.id !== 0;
      
      if (!isSuccess) {
        const errorMsg = confirmResponse?.remarks || 'Failed to confirm seats';
        setError(errorMsg);
        setIsConfirming(false);
        return;
      }

      // Store confirmed reference number (might be same or different from lock reference)
      const confirmedRef = confirmResponse?.referenceNo || confirmResponse?.reference || lockReferenceNo;
      setConfirmedReferenceNo(confirmedRef);

      // Update timer start time in localStorage for payment page (keep original lock time)
      // Don't reset timer when confirming - continue from lock time
      const lockTime = localStorage.getItem('timerStartTime') || Date.now().toString();
      localStorage.setItem('timerStartTime', lockTime);
      localStorage.setItem('confirmedReferenceNo', confirmedRef);

      // Store booking data for payment gateway
      const priceInfo = calculateDetailedPrice();
      const bookingData = {
        cinemaId,
        showId,
        movieId,
        seats: selectedSeats,
        ticketData,
        selectedTickets,
        priceInfo,
        referenceNo: lockReferenceNo,
        confirmedReferenceNo: confirmedRef,
        confirmResponse,
        membershipId,
        formData: formData,
        // Include all details for payment page
        movieDetails: movieDetails,
        cinemaDetails: cinemaDetails,
        showTimeDetails: showTimeDetails
      };
      
      localStorage.setItem('bookingData', JSON.stringify(bookingData));
      
      // Close booking summary modal
      setShowBookingSummary(false);
      
      // Redirect to payment page (with encrypted IDs)
      const encrypted = encryptIds({ cinemaId, showId, movieId });
      router.push(`/payment?cinemaId=${encrypted.cinemaId}&showId=${encrypted.showId}&movieId=${encrypted.movieId}&referenceNo=${confirmedRef}`);
    } catch (err) {
      console.error('Error confirming locked seats:', err);
      if (err instanceof APIError) {
        setError(err.message || 'Failed to confirm seats. Please try again.');
      } else {
        setError('Failed to confirm seats. Please try again.');
      }
    } finally {
      setIsConfirming(false);
    }
  };

  // Map seats to ticket types
  const getSeatsByTicketType = () => {
    // Use lockedSeats data from API response if available
    if (lockSeatResponse?.lockedSeats && Array.isArray(lockSeatResponse.lockedSeats) && lockSeatResponse.lockedSeats.length > 0) {
      // Group seats by ticket type name
      const seatsByTypeMap = {};
      
      lockSeatResponse.lockedSeats.forEach((seat) => {
        const ticketTypeName = seat.ticketTypeName || 'ADULT';
        if (!seatsByTypeMap[ticketTypeName]) {
          seatsByTypeMap[ticketTypeName] = {
            ticketTypeName: ticketTypeName,
            seats: [],
            totalPrice: 0,
            totalTax: 0
          };
        }
        seatsByTypeMap[ticketTypeName].seats.push(seat.seatNo);
        seatsByTypeMap[ticketTypeName].totalPrice += seat.price || 0;
        seatsByTypeMap[ticketTypeName].totalTax += (seat.entertainmentTax || 0) + (seat.govtTax || 0);
      });
      
      return Object.values(seatsByTypeMap);
    }
    
    // Fallback to old calculation if lockedSeats data not available
    if (!selectedSeats.length || !ticketData?.priceDetails || !selectedTickets) {
      return [];
    }

    const seatsByType = [];
    let seatIndex = 0;
    
    // Get ticket type entries in order
    const ticketTypeEntries = Object.entries(selectedTickets).filter(([_, count]) => count > 0);
    
    ticketTypeEntries.forEach(([ticketTypeID, count]) => {
      const ticketTypeIDNum = parseInt(ticketTypeID);
      const priceDetail = ticketData.priceDetails.find(p => p.ticketTypeID === ticketTypeIDNum);
      
      if (priceDetail) {
        const isTwinSeats = ticketData?.generalInfo?.ticketTypeIDForTwinSeatsAndVIPSeats === ticketTypeIDNum || priceDetail.ticketTypeName?.toUpperCase().includes('TWIN');
        const seatsPerTicket = isTwinSeats ? 2 : 1;
        const effectiveCount = count * seatsPerTicket;
        
        const seatsForThisType = selectedSeats.slice(seatIndex, seatIndex + effectiveCount);
        if (seatsForThisType.length > 0) {
          seatsByType.push({
            ticketTypeName: priceDetail.ticketTypeName || 'ADULT',
            seats: seatsForThisType,
            priceID: priceDetail.priceID,
            ticketTypeID: ticketTypeIDNum
          });
        }
        seatIndex += effectiveCount;
      }
    });
    
    return seatsByType;
  };

  // Calculate detailed pricing
  const calculateDetailedPrice = () => {
    // Use lockedSeats data from API response if available
    if (lockSeatResponse?.lockedSeats && Array.isArray(lockSeatResponse.lockedSeats) && lockSeatResponse.lockedSeats.length > 0) {
      let netPrice = 0;
      let entertainmentTax = 0;
      let govtTax = 0;
      let onlineCharge = 0;
      let totalTicketPrice = 0;
      
      // Calculate totals from lockedSeats array
      lockSeatResponse.lockedSeats.forEach((seat) => {
        netPrice += seat.price || 0;
        entertainmentTax += seat.entertainmentTax || 0;
        govtTax += seat.govtTax || 0;
        onlineCharge += seat.onlineCharge || 0;
        totalTicketPrice += seat.totalTicketPrice || 0;
      });
      
      // totalTicketPrice already includes all charges (price + entertainmentTax + govtTax + onlineCharge)
      return {
        netPrice: parseFloat(netPrice.toFixed(2)),
        tax: parseFloat((entertainmentTax + govtTax).toFixed(2)),
        entertainmentTax: parseFloat(entertainmentTax.toFixed(2)),
        govtTax: parseFloat(govtTax.toFixed(2)),
        onlineCharge: parseFloat(onlineCharge.toFixed(2)),
        totalTicketPrice: parseFloat(totalTicketPrice.toFixed(2)),
        reservationFee: parseFloat(onlineCharge.toFixed(2)), // onlineCharge serves as reservation fee
        grandTotal: parseFloat(totalTicketPrice.toFixed(2)) // totalTicketPrice already includes all charges
      };
    }
    
    // Fallback to old calculation if lockedSeats data not available
    if (!ticketData?.priceDetails || selectedSeats.length === 0) {
      return {
        netPrice: 0,
        tax: 0,
        totalTicketPrice: 0,
        reservationFee: 2.10,
        grandTotal: 0
      };
    }
    
    let netPrice = 0;
    let tax = 0;
    
    // Get ticket counts from selectedTickets
    const ticketTypeCounts = {};
    Object.entries(selectedTickets).forEach(([ticketTypeID, count]) => {
      ticketTypeCounts[parseInt(ticketTypeID)] = count;
    });
    
    // Calculate price based on ticket types
    let totalTicketPriceSum = 0;

    ticketData.priceDetails.forEach((price) => {
      const count = ticketTypeCounts[price.ticketTypeID] || 0;
      if (count > 0) {
        const isTwinSeats = ticketData?.generalInfo?.ticketTypeIDForTwinSeatsAndVIPSeats === price.ticketTypeID || price.ticketTypeName?.toUpperCase().includes('TWIN');
        const seatsPerTicket = isTwinSeats ? 2 : 1;
          
        const pricePerTicket = price.price || 0;
        const taxPerTicket = price.entertainmentTax || 0;
        
        // Use totalTicketPrice if available, otherwise sum components
        const totalPerTicket = price.totalTicketPrice || (pricePerTicket + taxPerTicket);
        
        netPrice += pricePerTicket * count * seatsPerTicket;
        tax += taxPerTicket * count * seatsPerTicket;
        
        totalTicketPriceSum += totalPerTicket * count * seatsPerTicket;
      }
    });
    
    const totalTicketPrice = totalTicketPriceSum;
    const reservationFee = 2.10; // Could come from API or config
    const grandTotal = totalTicketPrice + reservationFee;
    
    return {
      netPrice: parseFloat(netPrice.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      totalTicketPrice: parseFloat(totalTicketPrice.toFixed(2)),
      reservationFee: parseFloat(reservationFee.toFixed(2)),
      grandTotal: parseFloat(grandTotal.toFixed(2))
    };
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
    return 'Show Time';
  };

  const movieTitle = movieDetails?.movieName?.replace(/^\./, '') || 'Movie Title';
  const movieGenre = movieDetails?.genre || 'N/A';
  const movieDuration = movieDetails?.duration || 'N/A';
  const movieLanguage = movieDetails?.language || 'N/A';
  const movieImage = movieDetails?.imageURL || 'img/banner.jpg';
  const cinemaName = cinemaDetails?.displayName || cinemaDetails?.name || `Cinema ${cinemaId}`;
  const experienceType = movieDetails?.type || '2D';
  const hallName = showTimeDetails?.hallName || seatLayout?.hallDetails?.hallName || 'HALL - 1';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1c1c1c]">
        <Loader fullScreen={true} size="large" />
      </div>
    );
  }

  if (error || !seatGrid || Object.keys(seatGrid).length === 0) {
    return (
      <div className="min-h-screen bg-[#1c1c1c] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Failed to load seat layout'}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-[#FFCA20] text-black rounded hover:bg-[#FFCA20]/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Format timer display (MM:SS)
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#1c1c1c] text-white pb-10">
      {/* Countdown Timer */}
      {timerActive && lockReferenceNo && (
        <div className="bg-[#FFCA20] text-black px-4 py-2 text-center font-bold text-sm">
          Time remaining: {formatTimer(timeLeft)}
        </div>
      )}
      
      {/* Header */}
      <div className="relative">
        <div className="absolute top-5 left-5 z-10">
          <button 
            className="flex items-center gap-2 text-white/70 hover:text-white text-sm" 
            onClick={handleGoBack}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>

        {/* Breadcrumb */}
        <div className="absolute top-5 right-3 sm:right-5 z-10 hidden sm:block">
          <div className="flex items-center gap-2 text-xs text-white/50">
            <span className="hover:text-white cursor-pointer">Select cinema</span>
            <span>›</span>
            <span className="hover:text-white cursor-pointer">Ticket type</span>
            <span>›</span>
            <span className="text-white font-medium">Select seat</span>
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
                <span className="font-medium">{experienceType}</span>
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

      <div className="w-full max-w-full mx-auto px-2 sm:px-4 md:px-6 lg:px-8 mt-4 sm:mt-8">
       

        {/* Timer and Seat Legend Section */}
        <div className="mb-4 sm:mb-8">
          {/* 5-minute Timer - Right side above legend */}
          {pageTimerActive && (
            <div className="flex justify-end mb-4">
              <div className="relative">
                <div className="bg-[#D4A574] h-1 w-full absolute -top-1"></div>
                <div className="bg-[#1a1a1a] px-4 py-2 rounded text-white font-semibold text-sm">
                  Time Remaining: {formatTimer(pageTimer)}
                </div>
              </div>
            </div>
          )}
          
        {/* Seat Legend */}
          <div className="flex items-center justify-center flex-wrap gap-3 sm:gap-6 text-[10px] sm:text-xs">
          <div className="flex items-center gap-1.5 sm:gap-2">
              <SeatIcon variant="outline" seatType="normal" className="text-gray-400" />
            <span className="text-white/70">Available</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
              <SeatIcon variant="selected" seatType="normal" />
            <span className="text-white/70">Selected</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
              <SeatIcon variant="occupied" seatType="normal" />
            <span className="text-white/70">Occupied</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
              <SeatIcon variant="outline" seatType="handicap" className="text-gray-400" />
              <span className="text-white/70">OKU</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="flex items-center shrink-0">
              <SeatIcon variant="outline" seatType="twin" className="text-gray-400" />
              <SeatIcon variant="outline" seatType="twin" className="text-gray-400" />
            </div>
             
              <span className="text-white/70">Twins</span>
          </div>
          </div>
        </div>

        {/* Seat Map Area */}
        
        {/* Screen - Full Width Fixed Top */}
        <div className="mb-8 relative w-full px-4 sm:px-8 md:px-12 lg:px-16 mx-auto">
          <svg width="100%" height="65" viewBox="0 0 898 65" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
            <g filter="url(#filter0_d_2065_2204)">
              <path d="M19 39.5C19 39.5 280.919 15 449 15C617.081 15 879 39.5 879 39.5" stroke="#F0F0F0" strokeWidth="4" strokeLinecap="round"/>
            </g>
            <path d="M428.961 58.598C428.308 58.598 427.720 58.486 427.197 58.262C426.674 58.0287 426.264 57.702 425.965 57.282C425.666 56.862 425.517 56.372 425.517 55.812H427.225C427.262 56.232 427.426 56.5773 427.715 56.848C428.014 57.1187 428.429 57.254 428.961 57.254C429.512 57.254 429.941 57.1233 430.249 56.862C430.557 56.5913 430.711 56.246 430.711 55.826C430.711 55.4993 430.613 55.2333 430.417 55.028C430.230 54.8227 429.992 54.664 429.703 54.552C429.423 54.440 429.031 54.3187 428.527 54.188C427.892 54.020 427.374 53.852 426.973 53.684C426.581 53.5067 426.245 53.236 425.965 52.872C425.685 52.508 425.545 52.0227 425.545 51.416C425.545 50.856 425.685 50.366 425.965 49.946C426.245 49.526 426.637 49.204 427.141 48.98C427.645 48.756 428.228 48.644 428.891 48.644C429.834 48.644 430.604 48.882 431.201 49.358C431.808 49.8247 432.144 50.4687 432.209 51.29H430.445C430.417 50.9353 430.249 50.632 429.941 50.38C429.633 50.128 429.227 50.002 428.723 50.002C428.266 50.002 427.892 50.1187 427.603 50.352C427.314 50.5853 427.169 50.9213 427.169 51.36C427.169 51.6587 427.258 51.906 427.435 52.102C427.622 52.2887 427.855 52.438 428.135 52.55C428.415 52.662 428.798 52.7833 429.283 52.914C429.927 53.0913 430.450 53.2687 430.851 53.446C431.262 53.6233 431.607 53.8987 431.887 54.272C432.176 54.636 432.321 55.126 432.321 55.742C432.321 56.2367 432.186 56.7033 431.915 57.142C431.654 57.5807 431.266 57.9353 430.753 58.206C430.249 58.4673 429.652 58.598 428.961 58.598ZM433.672 54.636C433.672 53.8427 433.831 53.1473 434.148 52.55C434.475 51.9433 434.923 51.4767 435.492 51.15C436.062 50.8233 436.715 50.660 437.452 50.66C438.386 50.660 439.156 50.884 439.762 51.332C440.378 51.7707 440.794 52.4007 441.008 53.222H439.286C439.146 52.8393 438.922 52.5407 438.614 52.326C438.306 52.1113 437.919 52.004 437.452 52.004C436.799 52.004 436.276 52.2373 435.884 52.704C435.502 53.1613 435.310 53.8053 435.310 54.636C435.310 55.4667 435.502 56.1153 435.884 56.582C436.276 57.0487 436.799 57.282 437.452 57.282C438.376 57.282 438.988 56.876 439.286 56.064H441.008C440.784 56.848 440.364 57.4733 439.748 57.94C439.132 58.3973 438.367 58.626 437.452 58.626C436.715 58.626 436.062 58.4627 435.492 58.136C434.923 57.800 434.475 57.3333 434.148 56.736C433.831 56.1293 433.672 55.4293 433.672 54.636ZM444.195 51.906C444.428 51.514 444.736 51.2107 445.119 50.996C445.511 50.772 445.973 50.660 446.505 50.66V52.312H446.099C445.473 52.312 444.997 52.4707 444.671 52.788C444.353 53.1053 444.195 53.656 444.195 54.44V58.5H442.599V50.786H444.195V51.906ZM455.042 54.454C455.042 54.7433 455.023 55.0047 454.986 55.238H449.092C449.139 55.854 449.367 56.3487 449.778 56.722C450.189 57.0953 450.693 57.282 451.290 57.282C452.149 57.282 452.755 56.9227 453.110 56.204H454.832C454.599 56.9133 454.174 57.4967 453.558 57.954C452.951 58.402 452.195 58.626 451.290 58.626C450.553 58.626 449.890 58.4627 449.302 58.136C448.723 57.800 448.266 57.3333 447.930 56.736C447.603 56.1293 447.440 55.4293 447.440 54.636C447.440 53.8427 447.599 53.1473 447.916 52.55C448.243 51.9433 448.695 51.4767 449.274 51.15C449.862 50.8233 450.534 50.660 451.290 50.66C452.018 50.660 452.667 50.8187 453.236 51.136C453.805 51.4533 454.249 51.9013 454.566 52.48C454.883 53.0493 455.042 53.7073 455.042 54.454ZM453.376 53.95C453.367 53.362 453.157 52.8907 452.746 52.536C452.335 52.1813 451.827 52.004 451.220 52.004C450.669 52.004 450.198 52.1813 449.806 52.536C449.414 52.8813 449.181 53.3527 449.106 53.95H453.376ZM463.683 54.454C463.683 54.7433 463.664 55.0047 463.627 55.238H457.733C457.779 55.854 458.008 56.3487 458.419 56.722C458.829 57.0953 459.333 57.282 459.931 57.282C460.789 57.282 461.396 56.9227 461.751 56.204H463.472C463.239 56.9133 462.815 57.4967 462.199 57.954C461.592 58.402 460.836 58.626 459.931 58.626C459.193 58.626 458.531 58.4627 457.943 58.136C457.364 57.800 456.907 57.3333 456.571 56.736C456.244 56.1293 456.081 55.4293 456.081 54.636C456.081 53.8427 456.239 53.1473 456.557 52.55C456.883 51.9433 457.336 51.4767 457.915 51.15C458.503 50.8233 459.175 50.660 459.931 50.66C460.659 50.660 461.307 50.8187 461.877 51.136C462.446 51.4533 462.889 51.9013 463.207 52.48C463.524 53.0493 463.683 53.7073 463.683 54.454ZM462.017 53.95C462.007 53.362 461.797 52.8907 461.387 52.536C460.976 52.1813 460.467 52.004 459.861 52.004C459.310 52.004 458.839 52.1813 458.447 52.536C458.055 52.8813 457.821 53.3527 457.747 53.95H462.017ZM469.145 50.66C469.752 50.660 470.293 50.786 470.769 51.038C471.254 51.290 471.632 51.6633 471.903 52.158C472.174 52.6527 472.309 53.250 472.309 53.95V58.5H470.727V54.188C470.727 53.4973 470.554 52.970 470.209 52.606C469.864 52.2327 469.392 52.046 468.795 52.046C468.198 52.046 467.722 52.2327 467.367 52.606C467.022 52.970 466.849 53.4973 466.849 54.188V58.5H465.253V50.786H466.849V51.668C467.110 51.3507 467.442 51.1033 467.843 50.926C468.254 50.7487 468.688 50.660 469.145 50.66Z" fill="#FAFAFA"/>
            <defs>
              <filter id="filter0_d_2065_2204" x="0" y="0" width="898" height="62.5001" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                <feOffset dy="4"/>
                <feGaussianBlur stdDeviation="8.5"/>
                <feComposite in2="hardAlpha" operator="out"/>
                <feColorMatrix type="matrix" values="0 0 0 0 0.941176 0 0 0 0 0.941176 0 0 0 0 0.941176 0 0 0 1 0"/>
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_2065_2204"/>
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_2065_2204" result="shape"/>
              </filter>
            </defs>
          </svg>
        </div>

        {/* Seat Map Box (Dark Background) - Fixed Wrapper */}
        <div className="bg-[#1a1a1a] rounded-lg p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 mb-6 w-full max-w-full mt-8">
          
          {/* Scrollable Container - Scrolls INSIDE the dark box */}
          <div className="w-full overflow-x-auto no-scrollbar relative pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div className="w-full flex flex-col items-stretch">
              <div className="flex flex-col gap-3 sm:gap-4 md:gap-5 lg:gap-6 w-full">
            {rowLetters.map((rowLetter, rowIndex) => {
              const rowSeats = seatGrid[rowLetter];
              // Get max column from actual seat data in this row (or use 0 if no seats)
              const rowMaxColumn = rowSeats ? Math.max(...Object.keys(rowSeats).map(k => parseInt(k) || 0), 0) : 0;
              
              // Get dynamic gap class based on row seat count
              const dynamicGapClass = getDynamicGap(rowMaxColumn);
              
              // Check if this is Hall 6 for seat labeling (check both number and string, and hallName as fallback)
              const hallNo = seatLayout?.hallDetails?.hallNo;
              const hallName = seatLayout?.hallDetails?.hallName || showTimeDetails?.hallName || '';
              const isHall6 = hallNo === 6 || hallNo === '6' || hallName?.includes('6') || hallName?.toUpperCase()?.includes('HALL - 6');
              
              return (
                <div key={rowLetter} className="flex items-center w-full relative">
                {/* Row Label Left - Fixed Position */}
                  <span className="text-[9px] sm:text-[10px] md:text-xs text-white/40 w-6 sm:w-7 md:w-8 lg:w-10 text-center font-medium shrink-0 sticky left-0 z-20 pr-1">{rowLetter}</span>
                
                {/* Seats - Full Width Container - Takes remaining space */}
                <div className="flex-1 min-w-0 flex items-center">
                  <div className={`flex items-center justify-evenly w-full ${dynamicGapClass}`}>
                    {Array.from({ length: rowMaxColumn }, (_, i) => {
                      const column = rowMaxColumn - i;
                      const seat = rowSeats[column];
                      
                      if (!seat) {
                        // Empty space - invisible spacer (no width, just maintains position)
                        return <div key={`${rowLetter}-${column}`} className="shrink-0 w-0"></div>;
                      }

                      const isSelected = isSeatSelected(seat);
                      const isOccupied = isSeatOccupied(seat);
                      const isDouble = isDoubleSeat(seat);
                      const isPartner = isPartnerSeat(seat);
                      const seatType = getSeatType(seat);
                      const isDisabled = isSeatDisabled(seat);
                      
                      // Extract seat number from seatNo (e.g., "A10" -> "10")
                      const seatNumber = seat.seatNo.replace(rowLetter, '');
                    
                      // Get seat label based on seatType:
                      // 0 = Normal (no label)
                      // 1 = VIP (show "VIP")
                      // 2 = Twin Seat (no label)
                      // 3 = Kids Seat (show "KIDS")
                      // 4 = Sofa (show "BED")
                      const getSeatLabel = () => {
                        if (!isHall6) return null;
                        const rawSeatType = Number(seat.seatType); // Convert to number for proper comparison
                        
                        // Map seatType to labels:
                        if (rawSeatType === 1) return 'VIP';      // VIP seat
                        if (rawSeatType === 3) return 'KIDS';    // Kids seat
                        if (rawSeatType === 4) return 'BED';     // Sofa seat
                        // seatType 0 (Normal) and 2 (Twin) - no label
                        return null;
                      };
                      const seatLabel = getSeatLabel();
                      
                      // Get label for partner seat (for twin seats)
                      const getPartnerSeatLabel = () => {
                        if (!isHall6 || !isDouble || isPartner) return null;
                        const partnerSeat = seatsData.find(s => s.seatID === seat.partnerSeatID);
                        if (!partnerSeat) return null;
                        const rawSeatType = Number(partnerSeat.seatType); // Convert to number for proper comparison
                        
                        // Map seatType to labels:
                        if (rawSeatType === 1) return 'VIP';      // VIP seat
                        if (rawSeatType === 3) return 'KIDS';    // Kids seat
                        if (rawSeatType === 4) return 'BED';     // Sofa seat
                        // seatType 0 (Normal) and 2 (Twin) - no label
                        return null;
                      };
                      const partnerSeatLabel = getPartnerSeatLabel();
                    
                      // For double/twin seats, render as pairs
                      if (isDouble && !isPartner) {
                        const partnerSeat = seatsData.find(s => s.seatID === seat.partnerSeatID);
                        const partnerIsSelected = partnerSeat ? isSeatSelected(partnerSeat) : false;
                        const partnerIsOccupied = partnerSeat ? isSeatOccupied(partnerSeat) : false;
                        const partnerIsDisabled = partnerSeat ? isSeatDisabled(partnerSeat) : false;
                        const bothSelected = isSelected && partnerIsSelected;
                        // Both seats in a twin pair have the same seatType (twin)
                        const partnerSeatType = partnerSeat ? getSeatType(partnerSeat) : seatType;

                    return (
                          <div key={`${rowLetter}-${column}`} className="flex flex-col items-center shrink-0 gap-0.5 min-w-0">
                            <div className="flex items-center shrink-0 min-w-0">
                              <button
                              onClick={() => toggleSeat(seat)}
                              disabled={isOccupied || partnerIsOccupied || isDisabled || partnerIsDisabled}
                              className={`relative rounded-l shrink-0 transition-all ${
                                bothSelected
                                  ? '' 
                                  : (isOccupied || partnerIsOccupied || isDisabled || partnerIsDisabled)
                                    ? 'cursor-not-allowed opacity-60' 
                                    : 'hover:opacity-80'
                                  }`}
                              >
                              <SeatIcon 
                                seatType={seatType}
                                variant={bothSelected ? 'selected' : (isOccupied || partnerIsOccupied) ? 'occupied' : 'outline'}
                                className={bothSelected ? '' : (isOccupied || partnerIsOccupied) ? '' : 'text-gray-400'}
                              />
                              </button>
                            {partnerSeat && (
                              <button
                                onClick={() => toggleSeat(partnerSeat)}
                                disabled={isOccupied || partnerIsOccupied || isDisabled || partnerIsDisabled}
                                className={`relative rounded-r shrink-0 transition-all ${
                                  bothSelected
                                    ? '' 
                                    : (isOccupied || partnerIsOccupied || isDisabled || partnerIsDisabled)
                                    ? 'cursor-not-allowed opacity-60' 
                                    : 'hover:opacity-80'
                                  }`}
                              >
                                <SeatIcon 
                                  seatType={partnerSeatType}
                                  variant={bothSelected ? 'selected' : (isOccupied || partnerIsOccupied) ? 'occupied' : 'outline'}
                                  className={bothSelected ? '' : (isOccupied || partnerIsOccupied) ? '' : 'text-gray-400'}
                                />
                              </button>
                            )}
                            </div>
                            {/* Seat Number Below Icon */}
                            <div className="flex gap-2">
                                <span className={`text-[9px] sm:text-[10px] font-semibold leading-tight whitespace-nowrap ${
                                  (isOccupied || partnerIsOccupied) ? 'text-zinc-600' : 'text-zinc-400'
                                }`}>
                                  {/* Reconstruct full seat ID for display since seatNumber might be stripped */}
                                  {seat.seatNo}
                                </span>
                                {partnerSeat && (
                                  <span className={`text-[9px] sm:text-[10px] font-semibold leading-tight whitespace-nowrap ${
                                    (isOccupied || partnerIsOccupied) ? 'text-zinc-600' : 'text-zinc-400'
                                  }`}>
                                    {partnerSeat.seatNo}
                                  </span>
                                )}
                            </div>
                            {(seatLabel || partnerSeatLabel) && (
                              <span className="text-[9px] sm:text-[10px] text-[#FFCA20] font-semibold leading-tight whitespace-nowrap">
                                {seatLabel || partnerSeatLabel}
                              </span>
                            )}
                            </div>
                        );
                      } else if (isPartner) {
                        // Skip partner seats (already rendered with main seat)
                        return null;
                      } else {
                        // Single seat
                        return (
                          <div key={`${rowLetter}-${column}`} className="flex flex-col items-center shrink-0 gap-0.5 min-w-0">
                          <button
                            onClick={() => toggleSeat(seat)}
                              disabled={isOccupied || isDisabled}
                              className={`relative rounded shrink-0 transition-all min-w-0 ${
                              isSelected 
                                  ? '' 
                                  : (isOccupied || isDisabled)
                                  ? 'cursor-not-allowed opacity-60' 
                                  : 'hover:opacity-80'
                              }`}
                            >
                              <SeatIcon 
                                seatType={seatType}
                                variant={isSelected ? 'selected' : isOccupied ? 'occupied' : 'outline'}
                                className={isSelected ? '' : isOccupied ? '' : 'text-gray-400'}
                              />
                          </button>
                          
                          {/* Seat Number for Single Seat */}
                          <span className={`text-[9px] sm:text-[10px] font-semibold leading-tight whitespace-nowrap ${
                            isOccupied ? 'text-zinc-600' : 'text-zinc-400'
                          }`}>
                            {seat.seatNo}
                          </span>
                            {seatLabel && (
                              <span className="text-[9px] sm:text-[10px] text-[#FFCA20] font-semibold leading-tight whitespace-nowrap">{seatLabel}</span>
                            )}
                          </div>
                    );
                      }
                  })}
                  </div>
                </div>
                
                {/* Row Label Right - Fixed Position */}
                <span className="text-[9px] sm:text-[10px] md:text-xs text-white/40 w-6 sm:w-7 md:w-8 lg:w-10 text-center font-medium shrink-0 sticky right-0 z-20 pl-1">{rowLetter}</span>
              </div>
            );
          })}
          </div>
        </div>
      </div>



            </div>

      {/* Footer - Selected Seats and Book Button - Full Width */}
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 mt-4 sm:mt-6">
        <div className="bg-[#1a1a1a] rounded-lg p-4 sm:p-5 md:p-6">
          <div className="flex flex-col gap-4 sm:gap-5">
            {/* Selected Seats Cards */}
            {selectedSeats.length > 0 ? (
              <div className="flex flex-wrap gap-3 sm:gap-4">
                {selectedSeats.sort().map((seatNo) => {
                  const seatPrice = getSeatPrice(seatNo);
                  return (
                    <div
                      key={seatNo}
                      className="bg-[#2a2a2a] rounded-lg px-4 py-3 flex items-center justify-between gap-3 min-w-[140px] sm:min-w-[160px]"
                    >
                      <div className="flex-1">
                        <div className="text-white/70 text-xs sm:text-sm mb-1">{seatNo}</div>
                        <div className="text-[#FFCA20] font-semibold text-sm sm:text-base">
                          RM {seatPrice.toFixed(2)}
            </div>
                      </div>
                      <button
                        onClick={() => removeSeat(seatNo)}
                        className="w-6 h-6 rounded-full bg-[#3a3a3a] hover:bg-[#4a4a4a] flex items-center justify-center transition flex-shrink-0"
                        aria-label={`Remove ${seatNo}`}
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-white/50 text-sm py-2">No seats selected</div>
            )}

            {/* Book Button */}
            <div className="flex flex-col items-center gap-3 sm:gap-4">
            <button 
              onClick={handleBookSeat}
                disabled={selectedSeats.length !== maxSeats || isLocking}
                className={`px-8 sm:px-10 md:px-12 py-2.5 sm:py-3 md:py-3.5 rounded font-medium text-sm sm:text-base transition ${
                  selectedSeats.length === maxSeats && !isLocking
                  ? 'bg-[#FFCA20] text-black hover:bg-[#FFCA20]/90' 
                  : 'bg-[#FFCA20]/30 text-black/50 cursor-not-allowed'
              }`}
            >
              {isLocking ? 'Locking seats...' : 'Book seat'}
            </button>

            {error && (
                <div className="text-xs sm:text-sm text-red-400 text-center mt-1">{error}</div>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Summary Modal */}
      {showBookingSummary && (() => {
        const priceInfo = calculateDetailedPrice();
        const seatsByType = getSeatsByTicketType();
        const movieTitle = movieDetails?.movieName || movieDetails?.title || 'Movie';
        const movieImage = movieDetails?.imageURL || 'img/banner.jpg';
        const movieGenre = movieDetails?.genre || 'N/A';
        const movieDuration = movieDetails?.duration || 'N/A';
        const movieLanguage = movieDetails?.language || 'N/A';
        const cinemaName = cinemaDetails?.displayName || cinemaDetails?.name || `Cinema ${cinemaId}`;
        const experienceType = movieDetails?.type || '2D';
        
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
          return 'N/A';
        };

        return (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-[#1a1a1a] rounded-lg w-full max-w-6xl relative max-h-[90vh] overflow-y-auto">
              {/* Close Button */}
            <button 
                onClick={async () => {
                  // Release locked seats when closing modal
                  if (lockReferenceNo) {
                    try {
                      await releaseSeatLock(cinemaId, showId, lockReferenceNo);
                      setLockReferenceNo(null);
                      setLockSeatResponse(null);
                      setTimerActive(false);
                      setSelectedSeats([]);
                    } catch (e) {
                      console.error('Error releasing seats on modal close:', e);
                    }
                  }
                  setShowBookingSummary(false);
                }}
                className="absolute top-4 right-4 text-white/70 hover:text-white z-10"
            >
                <X className="w-5 h-5" />
            </button>

              {/* Header */}
              <div className="p-6 border-b border-[#2a2a2a]">
                <h2 className="text-2xl font-bold text-white">Booking Details</h2>
            </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                {/* Left Column - Form */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Customer Information</h3>
                    <div className="space-y-4">
                      {/* Name */}
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          Name <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className={`w-full px-4 py-2.5 bg-[#2a2a2a] border rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#FFCA20] ${
                            formErrors.name ? 'border-red-500' : 'border-[#3a3a3a]'
                          }`}
                          placeholder="Enter your name"
                        />
                        {formErrors.name && (
                          <p className="text-xs text-red-400 mt-1">{formErrors.name}</p>
                        )}
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          Email <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className={`w-full px-4 py-2.5 bg-[#2a2a2a] border rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#FFCA20] ${
                            formErrors.email ? 'border-red-500' : 'border-[#3a3a3a]'
                          }`}
                          placeholder="Enter your email"
                        />
                        {formErrors.email && (
                          <p className="text-xs text-red-400 mt-1">{formErrors.email}</p>
                        )}
                      </div>

                    

                      {/* Mobile */}
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          Mobile <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="tel"
                          value={formData.mobile}
                          onChange={(e) => handleInputChange('mobile', e.target.value)}
                          className={`w-full px-4 py-2.5 bg-[#2a2a2a] border rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#FFCA20] ${
                            formErrors.mobile ? 'border-red-500' : 'border-[#3a3a3a]'
                          }`}
                          placeholder="Enter mobile number"
                        />
                        {formErrors.mobile && (
                          <p className="text-xs text-red-400 mt-1">{formErrors.mobile}</p>
                        )}
                      </div>

                      {/* Membership No */}
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          Membership No
                        </label>
                        <input
                          type="text"
                          value={formData.membershipNo}
                          onChange={(e) => handleInputChange('membershipNo', e.target.value)}
                          className={`w-full px-4 py-2.5 bg-[#2a2a2a] border rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#FFCA20] ${
                            formErrors.membershipNo ? 'border-red-500' : 'border-[#3a3a3a]'
                          }`}
                          placeholder="Enter membership number (optional)"
                        />
                        {formErrors.membershipNo && (
                          <p className="text-xs text-red-400 mt-1">{formErrors.membershipNo}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Summary */}
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-white">Booking Summary</h3>
                      {/* Timer Display */}
                      {pageTimerActive && pageTimer > 0 && (
                        <div className="relative">
                          <div className="bg-[#D4A574] h-1 w-full absolute -top-1"></div>
                          <div className="bg-[#1a1a1a] px-4 py-2 rounded text-white font-semibold text-sm">
                            Time Remaining: {formatTimer(pageTimer)}
                          </div>
                        </div>
                      )}
                    </div>
                    
                {/* Movie Details */}
                    <div className="flex gap-4 mb-6 pb-6 border-b border-[#2a2a2a]">
                  <img
                    src={movieImage}
                    alt={movieTitle}
                    className="w-24 h-36 object-cover rounded"
                    onError={(e) => {
                      e.target.src = 'img/banner.jpg';
                    }}
                />
                <div className="flex-1">
                        <h4 className="text-lg font-bold text-white mb-2">{movieTitle}</h4>
                    <div className="text-xs text-white/70 space-y-1">
                      <p>{movieGenre}</p>
                      <p>{movieDuration}</p>
                      <p>{movieLanguage}</p>
                      <p>{cinemaName}</p>
                      <p>{experienceType}</p>
                      <p>{hallName}</p>
                      <p>{formatShowDateTime()}</p>
                  </div>
                </div>
              </div>

                {/* Seat Info */}
                    <div className="mb-6 pb-6 border-b border-[#2a2a2a]">
                  <h4 className="text-sm font-semibold text-white mb-3">Seat info</h4>
                  <div className="space-y-2">
                    {seatsByType.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                            <span className="text-xs text-white/70 min-w-[80px]">{item.ticketTypeName}</span>
                  <div className="flex gap-1 flex-wrap">
                          {item.seats.map((seatNo, idx) => (
                            <span
                              key={idx}
                              className="bg-[#FFCA20] text-black text-xs font-medium px-2 py-1 rounded"
                            >
                              {seatNo}
                      </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tickets */}
                    <div className="mb-6 pb-6 border-b border-[#2a2a2a]">
                  <h4 className="text-sm font-semibold text-white mb-3">Tickets</h4>
                      <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-white/70">
                      <span>Net Price ({selectedSeats.length} X Ticket(s))</span>
                      <span className="text-white">RM {priceInfo.netPrice.toFixed(2)}</span>
                    </div>
                    {priceInfo.entertainmentTax !== undefined && priceInfo.entertainmentTax > 0 && (
                      <div className="flex justify-between text-white/70">
                        <span>Entertainment Tax</span>
                        <span className="text-white">RM {priceInfo.entertainmentTax.toFixed(2)}</span>
                      </div>
                    )}
                    {priceInfo.govtTax !== undefined && priceInfo.govtTax > 0 && (
                      <div className="flex justify-between text-white/70">
                        <span>Government Tax</span>
                        <span className="text-white">RM {priceInfo.govtTax.toFixed(2)}</span>
                      </div>
                    )}
                    {priceInfo.onlineCharge !== undefined && priceInfo.onlineCharge > 0 && (
                      <div className="flex justify-between text-white/70">
                        <span>Online Charge</span>
                        <span className="text-white">RM {priceInfo.onlineCharge.toFixed(2)}</span>
                      </div>
                    )}
                    {priceInfo.tax !== undefined && priceInfo.tax > 0 && (!priceInfo.entertainmentTax && !priceInfo.govtTax) && (
                    <div className="flex justify-between text-white/70">
                      <span>Tax</span>
                      <span className="text-white">RM {priceInfo.tax.toFixed(2)}</span>
              </div>
                    )}
                    <div className="flex justify-between text-white font-semibold pt-2 border-t border-[#2a2a2a]">
                      <span>Total Ticket Price</span>
                      <span>RM {priceInfo.totalTicketPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>

                {/* Grand Total */}
                    <div className="bg-[#FFCA20] rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                        <span className="text-base font-bold text-black">Grand Total</span>
                        <span className="text-xl font-bold text-black">RM {priceInfo.grandTotal.toFixed(2)}</span>
                </div>
              </div>

                {/* Proceed to Payment Button */}
              <button 
                  onClick={handleProceedToPayment}
                  disabled={isConfirming}
                  className={`w-full bg-[#FFCA20] text-black font-bold py-3 rounded-lg transition ${
                    isConfirming 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:bg-[#FFCA20]/90'
                  }`}
              >
                      {isConfirming ? 'Processing...' : 'Proceed to Payment'}
              </button>
              
              {error && (
                <div className="text-xs text-red-400 text-center mt-2">{error}</div>
              )}
                  </div>
                </div>
            </div>
          </div>
        </div>
        );
      })()}
      </div>
    </div>
  );
}
