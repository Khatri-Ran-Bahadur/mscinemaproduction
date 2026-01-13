"use client";

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export default function TicketModal({ ticketData, isOpen, onClose, bookingId }) {
  const [mergedData, setMergedData] = useState(null);

  // Merge ticket data with booking data from localStorage
  useEffect(() => {
    if (ticketData && typeof window !== 'undefined') {
      try {
        // Get booking data from localStorage
        const bookingDataStr = localStorage.getItem('bookingData');
        const paymentResultStr = localStorage.getItem('paymentResult');
        
        let bookingData = null;
        let paymentResult = null;
        
        if (bookingDataStr) {
          bookingData = JSON.parse(bookingDataStr);
        }
        
        if (paymentResultStr) {
          paymentResult = JSON.parse(paymentResultStr);
        }
        
        // Merge ticket data with booking data
        const merged = {
          // Movie information - try multiple sources (PascalCase, camelCase, nested)
          movieName: ticketData.MovieName || ticketData.movieName || 
                     bookingData?.movieDetails?.movieName || 
                     bookingData?.movieDetails?.title || 
                     bookingData?.movieDetails?.MovieName ||
                     'Unknown Movie',
          movieImage: ticketData.MovieImage || ticketData.movieImage || ticketData.poster || 
                     bookingData?.movieDetails?.movieImage || 
                     bookingData?.movieDetails?.poster || 
                     bookingData?.movieDetails?.MovieImage ||
                     '/img/banner.jpg',
          genre: ticketData.Genre || ticketData.genre || 
                 bookingData?.movieDetails?.genre || 
                 bookingData?.movieDetails?.Genre ||
                 (Array.isArray(bookingData?.movieDetails?.genres) ? bookingData.movieDetails.genres.join(', ') : null) ||
                 'N/A',
          duration: ticketData.Duration || ticketData.duration || ticketData.runningTime || 
                   bookingData?.movieDetails?.duration || 
                   bookingData?.movieDetails?.runningTime || 
                   bookingData?.movieDetails?.Duration ||
                   'N/A',
          language: ticketData.Language || ticketData.language || 
                    bookingData?.movieDetails?.language || 
                    bookingData?.movieDetails?.Language ||
                    'English',
          
          // Customer information
          customerName: ticketData.CustomerName || ticketData.customerName || ticketData.name || 
                       bookingData?.formData?.name || 
                       bookingData?.formData?.Name ||
                       'Guest',
          
          // Show information
          experienceType: ticketData.ExperienceType || ticketData.experienceType || 
                         bookingData?.showTimeDetails?.experienceType || 
                         bookingData?.showTimeDetails?.type || 
                         bookingData?.showTimeDetails?.ExperienceType ||
                         'Standard',
          hallName: ticketData.HallName || ticketData.hallName || ticketData.hall || 
                   bookingData?.showTimeDetails?.hallName || 
                   bookingData?.showTimeDetails?.hall || 
                   bookingData?.showTimeDetails?.HallName ||
                   'N/A',
          cinemaName: ticketData.CinemaName || ticketData.cinemaName || 
                     bookingData?.cinemaDetails?.cinemaName || 
                     bookingData?.cinemaDetails?.CinemaName ||
                     'N/A',
          
          // Date and time
          showDate: ticketData.ShowDate || ticketData.showDate || 
                   bookingData?.showTimeDetails?.showDate || 
                   bookingData?.showTimeDetails?.date || 
                   bookingData?.showTimeDetails?.ShowDate ||
                   '',
          showTime: ticketData.ShowTime || ticketData.showTime || 
                   bookingData?.showTimeDetails?.showTime || 
                   bookingData?.showTimeDetails?.time || 
                   bookingData?.showTimeDetails?.ShowTime ||
                   '',
          
          // Ticket details - try both PascalCase and camelCase
          ticketDetails: ticketData.TicketDetails || ticketData.ticketDetails || ticketData.ticketDetails || [],
          
          // Booking IDs - try multiple sources
          bookingID: bookingId || 
                    ticketData.BookingID || ticketData.bookingID || 
                    ticketData.ReferenceNo || ticketData.referenceNo || 
                    bookingData?.confirmedReferenceNo || 
                    bookingData?.referenceNo || 
                    paymentResult?.orderId || 
                    paymentResult?.data?.orderid || 
                    'N/A',
          trackingID: ticketData.TrackingID || ticketData.trackingID || 
                     ticketData.TransactionNo || ticketData.transactionNo || 
                     paymentResult?.data?.tranID || 
                     paymentResult?.data?.tranId || 
                     'N/A',
        };
        
        setMergedData(merged);
      } catch (e) {
        console.error('Error merging ticket data:', e);
        // Fallback to ticketData as-is
        setMergedData(ticketData);
      }
    } else if (!ticketData && typeof window !== 'undefined') {
      // If no ticketData, try to build from bookingData only
      try {
        const bookingDataStr = localStorage.getItem('bookingData');
        const paymentResultStr = localStorage.getItem('paymentResult');
        
        if (bookingDataStr) {
          const bookingData = JSON.parse(bookingDataStr);
          let paymentResult = null;
          if (paymentResultStr) {
            paymentResult = JSON.parse(paymentResultStr);
          }
          
          const merged = {
            movieName: bookingData?.movieDetails?.movieName || bookingData?.movieDetails?.title || 'Unknown Movie',
            movieImage: bookingData?.movieDetails?.movieImage || bookingData?.movieDetails?.poster || '/img/banner.jpg',
            genre: bookingData?.movieDetails?.genre || (Array.isArray(bookingData?.movieDetails?.genres) ? bookingData.movieDetails.genres.join(', ') : 'N/A'),
            duration: bookingData?.movieDetails?.duration || bookingData?.movieDetails?.runningTime || 'N/A',
            language: bookingData?.movieDetails?.language || 'English',
            customerName: bookingData?.formData?.name || 'Guest',
            experienceType: bookingData?.showTimeDetails?.experienceType || bookingData?.showTimeDetails?.type || 'Standard',
            hallName: bookingData?.showTimeDetails?.hallName || bookingData?.showTimeDetails?.hall || 'N/A',
            cinemaName: bookingData?.cinemaDetails?.cinemaName || 'N/A',
            showDate: bookingData?.showTimeDetails?.showDate || bookingData?.showTimeDetails?.date || '',
            showTime: bookingData?.showTimeDetails?.showTime || bookingData?.showTimeDetails?.time || '',
            ticketDetails: [],
            bookingID: bookingId || bookingData?.confirmedReferenceNo || bookingData?.referenceNo || paymentResult?.orderId || 'N/A',
            trackingID: paymentResult?.data?.tranID || paymentResult?.data?.tranId || 'N/A',
          };
          
          setMergedData(merged);
        }
      } catch (e) {
        console.error('Error building from bookingData:', e);
      }
    }
  }, [ticketData, isOpen]);

  if (!isOpen || !mergedData) return null;

  // Extract ticket information from merged data
  const movieName = mergedData.movieName || 'Unknown Movie';
  const movieImage = mergedData.movieImage || '/img/banner.jpg';
  const genre = mergedData.genre || 'N/A';
  const duration = mergedData.duration || 'N/A';
  const language = mergedData.language || 'English';
  
  const customerName = mergedData.customerName || 'Guest';
  const experienceType = mergedData.experienceType || 'Standard';
  const hallName = mergedData.hallName || 'N/A';
  
  const showDate = mergedData.showDate || '';
  const showTime = mergedData.showTime || '';
  
  // Format date and time
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    try {
      const [hours, minutes] = timeStr.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  // Extract ticket details (seats and ticket types)
  const ticketDetails = mergedData.ticketDetails || [];
  
  // Group seats by ticket type
  const seatGroups = {};
  ticketDetails.forEach((ticket) => {
    const ticketType = ticket.TicketType || ticket.ticketType || ticket.Type || ticket.type || 'Adult';
    const seatNo = ticket.SeatNo || ticket.seatNo || ticket.Seat || ticket.seat || '';
    if (!seatGroups[ticketType]) {
      seatGroups[ticketType] = [];
    }
    if (seatNo) {
      seatGroups[ticketType].push(seatNo);
    }
  });
  
  // If no ticket details, try to get from booking data
  if (ticketDetails.length === 0 && typeof window !== 'undefined') {
    try {
      const bookingDataStr = localStorage.getItem('bookingData');
      if (bookingDataStr) {
        const bookingData = JSON.parse(bookingDataStr);
        const seats = bookingData.seats || [];
        const selectedTickets = bookingData.selectedTickets || [];
        
        seats.forEach((seat, index) => {
          const ticket = selectedTickets[index];
          const ticketType = ticket?.ticketType || ticket?.type || 'Adult';
          const seatNo = seat?.seatID || seat?.seatNo || seat?.seat || '';
          if (seatNo) {
            if (!seatGroups[ticketType]) {
              seatGroups[ticketType] = [];
            }
            seatGroups[ticketType].push(seatNo);
          }
        });
      }
    } catch (e) {
      // Ignore
    }
  }

  // Format seat display - extract seat numbers (e.g., "H3", "H4")
  const formatSeats = () => {
    const parts = [];
    Object.entries(seatGroups).forEach(([type, seatList]) => {
      // Extract seat numbers (e.g., "H3", "H4")
      const seatNumbers = seatList.map(s => {
        const seatStr = String(s);
        // If seat is like "H3" or "H-3", extract the full seat code
        const match = seatStr.match(/([A-Z])(\d+)/);
        if (match) {
          return match[1] + match[2]; // Return "H3"
        }
        return seatStr;
      });
      parts.push({ type, seats: seatNumbers });
    });
    return parts;
  };

  const seatDisplay = formatSeats();
  // Calculate total persons from seat groups
  const totalPersons = Object.values(seatGroups).reduce((sum, seats) => sum + seats.length, 0) || ticketDetails.length || 0;

  // Get booking and tracking IDs
  const displayBookingId = mergedData.bookingID || mergedData.referenceNo || mergedData.bookingId || 'N/A';
  const trackingId = mergedData.trackingID || mergedData.trackingId || mergedData.transactionNo || 'N/A';

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Modal Overlay */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      
      {/* Modal Content */}
      <div className="relative bg-[#2a2a2a] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto z-10">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition z-20 bg-[#2a2a2a] rounded-full p-2 hover:bg-[#3a3a3a]"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Ticket Content */}
        <div className="bg-[#2a2a2a] rounded-lg overflow-hidden">
          {/* Movie Poster Section */}
          <div className="relative w-full h-64 md:h-80">
            <img
              src={movieImage}
              alt={movieName}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = '/img/banner.jpg';
              }}
            />
            <div className="absolute top-4 left-4">
              <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                {movieName.toUpperCase()}
              </h2>
            </div>
          </div>

          {/* Movie Title Section */}
          <div className="px-6 py-4 border-b border-dashed border-[#4a4a4a]">
            <h3 className="text-2xl font-bold text-white mb-2">{movieName}</h3>
            <p className="text-sm text-gray-400">
              {genre} | {duration} | {language}
            </p>
          </div>

          {/* Ticket Holder Section */}
          <div className="px-6 py-4 border-b border-dashed border-[#4a4a4a]">
            <h4 className="text-xl font-bold text-white mb-2">{customerName}</h4>
            <p className="text-sm text-gray-400 mb-1">
              {experienceType} | {hallName}
            </p>
            <p className="text-sm text-gray-400">
              {formatDate(showDate)} | {formatTime(showTime)}
            </p>
          </div>

          {/* Seat and Booking Details Section */}
          <div className="px-6 py-4 border-b border-dashed border-[#4a4a4a]">
            {/* Seat Information with highlighted seat numbers */}
            <div className="mb-2">
              <p className="text-sm text-white">
                {seatDisplay.length > 0 ? (
                  seatDisplay.map((group, idx) => (
                    <span key={idx}>
                      {idx > 0 && ' | '}
                      {group.type} <span className="text-[#FFCA20]">{group.seats.join(', ')}</span>
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400">No seat information</span>
                )}
              </p>
            </div>
            <p className="text-xs text-gray-400 mb-4">{totalPersons} person</p>
            
            {/* Booking IDs */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Booking ID</span>
                <span className="text-sm text-white font-semibold">{displayBookingId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Tracking ID</span>
                <span className="text-sm text-white font-semibold">{trackingId}</span>
              </div>
            </div>
          </div>

          {/* Barcode Section */}
          <div className="px-6 py-6 bg-black/30 flex justify-center">
            <div className="bg-white p-4 rounded">
              {/* Barcode */}
              <div className="flex items-center justify-center">
                <img
                  src={`https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(displayBookingId)}&code=Code128&translate-esc=on`}
                  alt="Barcode"
                  className="h-20 w-auto"
                  onError={(e) => {
                    // Fallback if barcode service fails
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

