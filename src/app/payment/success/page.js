"use client";

import React, { useState, Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { X, CheckCircle } from 'lucide-react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import TicketModal from '@/components/TicketModal';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [ticketData, setTicketData] = useState(null);
  const [isLoadingTicket, setIsLoadingTicket] = useState(false);
  const [orderid, setOrderid] = useState('');
  
  // Extract only orderid from URL (secure - minimal data exposure)
  useEffect(() => {
    if (typeof window !== 'undefined' && searchParams) {
      const orderIdFromUrl = searchParams.get('orderid') || searchParams.get('orderId') || '';
      
      if (orderIdFromUrl) {
        setOrderid(orderIdFromUrl);
        
        // Get payment data from localStorage (set by molpay_return or previous session)
        try {
          const paymentResultStr = localStorage.getItem('paymentResult');
          let paymentData = null;
          
          if (paymentResultStr) {
            const paymentResult = JSON.parse(paymentResultStr);
            // Verify orderid matches
            if (paymentResult.orderId === orderIdFromUrl || paymentResult.data?.orderid === orderIdFromUrl) {
              paymentData = paymentResult.data || paymentResult;
            }
          }
          
          // If no payment data in localStorage, create minimal entry
          if (!paymentData) {
            paymentData = {
              orderid: orderIdFromUrl,
              orderId: orderIdFromUrl,
              status: '00', // Assume success if redirected here
            };
            
            localStorage.setItem('paymentResult', JSON.stringify({
              status: 'success',
              orderId: orderIdFromUrl,
              data: paymentData,
              timestamp: new Date().toISOString(),
            }));
          }

          // Get booking data
          try {
            const bookingDataStr = localStorage.getItem('bookingData');
            if (bookingDataStr) {
              const parsed = JSON.parse(bookingDataStr);
              setBookingData(parsed);
              
              // Call GetTickets API to fetch ticket data (non-blocking)
              // Use referenceNo from lockSeats (not confirmedReferenceNo) as per API requirements
              const cinemaId = parsed.cinemaDetails?.cinemaID || parsed.cinemaId || parsed.cinemaDetails?.cinemaId;
              const showId = parsed.showTimeDetails?.showID || parsed.showId || parsed.showTimeDetails?.showId;
              const referenceNo = parsed.referenceNo || parsed.confirmedReferenceNo || orderIdFromUrl;
              
              if (cinemaId && showId && referenceNo) {
                setIsLoadingTicket(true);
                // Use dynamic import to avoid SSR issues
                setTimeout(async () => {
                  try {
                    const { booking } = await import('@/services/api');
                    if (booking?.getTickets) {
                      const fetchedTicketData = await booking.getTickets(cinemaId, showId, referenceNo);
                      if (fetchedTicketData) {
                        setTicketData(fetchedTicketData);
                        localStorage.setItem('ticketData', JSON.stringify(fetchedTicketData));
                        
                        // Send ticket email after ticket data is loaded
                        sendTicketEmailAfterPayment(parsed, fetchedTicketData, referenceNo, orderIdFromUrl);
                      }
                    }
                  } catch (error) {
                    console.warn('Error fetching ticket data (non-critical):', error);
                  } finally {
                    setIsLoadingTicket(false);
                  }
                }, 100);
              }
            }
          } catch (e) {
            console.warn('Error parsing booking data:', e);
          }
        } catch (e) {
          console.warn('Error processing payment data:', e);
        }
      }
    }
  }, [searchParams]);

  const handleViewTicket = () => {
    // Show ticket modal
    setShowTicketModal(true);
  };

  const handleCloseTicket = () => {
    setShowTicketModal(false);
  };

  // Function to send ticket email after payment success
  const sendTicketEmailAfterPayment = async (bookingData, ticketData, referenceNo, orderIdOverride) => {
    // Check if email already sent for this transaction
    const uniqueId = orderIdOverride || referenceNo;
    const emailSentKey = `ticket_email_sent_${uniqueId}`;
    
    if (typeof window !== 'undefined' && localStorage.getItem(emailSentKey)) {
      console.log(`Email already sent for order ${uniqueId}, skipping.`);
      return;
    }

    try {
      // Get customer email from booking data or payment result
      let customerEmail = bookingData?.formData?.email || 
                         bookingData?.formData?.Email || 
                         bookingData?.billingEmail ||
                         '';
      
      // Try to get from paymentResult if not found
      if (!customerEmail && typeof window !== 'undefined') {
        try {
          const paymentResultStr = localStorage.getItem('paymentResult');
          if (paymentResultStr) {
            const paymentResult = JSON.parse(paymentResultStr);
            customerEmail = paymentResult?.data?.bill_email || 
                           paymentResult?.data?.email ||
                           paymentResult?.email ||
                           '';
          }
        } catch (e) {
          console.error('Error parsing paymentResult for email:', e);
        }
      }
      
      console.log('Customer Email resolved to:', customerEmail); // LOGGING

      if (!customerEmail) {
        console.warn('No email found in booking data or payment result, skipping ticket email');
        return;
      }

      // Extract ticket information similar to TicketModal
      const ticketInfo = {
        customerName: ticketData?.CustomerName || ticketData?.customerName || ticketData?.name || 
                     bookingData?.formData?.name || 
                     bookingData?.formData?.Name ||
                     'Guest',
        customerPhone: ticketData?.CustomerPhone || ticketData?.customerPhone || ticketData?.phone || 
                      bookingData?.formData?.mobile || 
                      bookingData?.formData?.phone ||
                      bookingData?.formData?.Mobile ||
                      '',
        customerEmail: customerEmail,
        movieName: ticketData?.MovieName || ticketData?.movieName || 
                  bookingData?.movieDetails?.movieName || 
                  bookingData?.movieDetails?.title || 
                  bookingData?.movieDetails?.MovieName ||
                  'Unknown Movie',
        movieImage: ticketData?.MovieImage || ticketData?.movieImage || ticketData?.poster || 
                   bookingData?.movieDetails?.movieImage || 
                   bookingData?.movieDetails?.poster || 
                   bookingData?.movieDetails?.MovieImage ||
                   '/img/banner.jpg',
        genre: ticketData?.Genre || ticketData?.genre || 
              bookingData?.movieDetails?.genre || 
              bookingData?.movieDetails?.Genre ||
              (Array.isArray(bookingData?.movieDetails?.genres) ? bookingData.movieDetails.genres.join(', ') : null) ||
              'N/A',
        duration: ticketData?.Duration || ticketData?.duration || ticketData?.runningTime || 
                 bookingData?.movieDetails?.duration || 
                 bookingData?.movieDetails?.runningTime || 
                 bookingData?.movieDetails?.Duration ||
                 'N/A',
        language: ticketData?.Language || ticketData?.language || 
                 bookingData?.movieDetails?.language || 
                 bookingData?.movieDetails?.Language ||
                 'English',
        experienceType: ticketData?.ExperienceType || ticketData?.experienceType || 
                       bookingData?.showTimeDetails?.experienceType || 
                       bookingData?.showTimeDetails?.type || 
                       bookingData?.showTimeDetails?.ExperienceType ||
                       'Standard',
        hallName: ticketData?.HallName || ticketData?.hallName || ticketData?.hall || 
                 bookingData?.showTimeDetails?.hallName || 
                 bookingData?.showTimeDetails?.hall || 
                 bookingData?.showTimeDetails?.HallName ||
                 'N/A',
        cinemaName: ticketData?.CinemaName || ticketData?.cinemaName || 
                   bookingData?.cinemaDetails?.cinemaName || 
                   bookingData?.cinemaDetails?.CinemaName ||
                   'N/A',
        showDate: ticketData?.ShowDate || ticketData?.showDate || 
                 bookingData?.showTimeDetails?.showDate || 
                 bookingData?.showTimeDetails?.date || 
                 bookingData?.showTimeDetails?.ShowDate ||
                 '',
        showTime: ticketData?.ShowTime || ticketData?.showTime || 
                 bookingData?.showTimeDetails?.showTime || 
                 bookingData?.showTimeDetails?.time || 
                 bookingData?.showTimeDetails?.ShowTime ||
                 '',
        bookingId: orderIdOverride || 
                  ticketData?.BookingID || ticketData?.bookingID || 
                  ticketData?.ReferenceNo || ticketData?.referenceNo || 
                  bookingData?.confirmedReferenceNo || 
                  bookingData?.referenceNo || 
                  referenceNo ||
                  'N/A',
        trackingId: ticketData?.TrackingID || ticketData?.trackingID || 
                   ticketData?.TransactionNo || ticketData?.transactionNo || 
                   'N/A',
        referenceNo: ticketData?.ReferenceNo || ticketData?.referenceNo || 
                    bookingData?.confirmedReferenceNo || 
                    bookingData?.referenceNo || 
                    referenceNo ||
                    'N/A',
      };

      // Get tracking ID from paymentResult in localStorage if available
      if (typeof window !== 'undefined') {
        try {
          const paymentResultStr = localStorage.getItem('paymentResult');
          if (paymentResultStr) {
            const paymentResult = JSON.parse(paymentResultStr);
            if (paymentResult?.data?.tranID || paymentResult?.data?.tranId) {
              ticketInfo.trackingId = paymentResult.data.tranID || paymentResult.data.tranId;
            }
          }
        } catch (e) {
          // Ignore
        }
      }

      // Extract ticket details and format seat display
      const ticketDetails = ticketData?.TicketDetails || ticketData?.ticketDetails || [];
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
      if (ticketDetails.length === 0) {
        const seats = bookingData?.seats || [];
        const selectedTickets = bookingData?.selectedTickets || [];
        
        seats.forEach((seat, index) => {
          const ticket = selectedTickets[index];
          const ticketType = ticket?.ticketType || ticket?.type || 'Adult';
          const seatNo = ticket?.seatNo || seat?.seatNo || seat?.seat || ''; // Fixed mapping
          if (seatNo) {
            if (!seatGroups[ticketType]) {
              seatGroups[ticketType] = [];
            }
            seatGroups[ticketType].push(seatNo);
          }
        });
      }

      // Format seat display
      const formatSeats = () => {
        const parts = [];
        Object.entries(seatGroups).forEach(([type, seatList]) => {
          const seatNumbers = seatList.map(s => {
            const seatStr = String(s);
            const match = seatStr.match(/([A-Z])(\d+)/);
            if (match) {
              return match[1] + match[2];
            }
            return seatStr;
          });
          parts.push({ type, seats: seatNumbers });
        });
        return parts;
      };

      ticketInfo.seatDisplay = formatSeats();
      ticketInfo.totalPersons = Object.values(seatGroups).reduce((sum, seats) => sum + seats.length, 0) || ticketDetails.length || 0;
      
      // Add ticket details with pricing for email template
      ticketInfo.ticketDetails = ticketDetails.length > 0 ? ticketDetails : [];
      
      // Calculate totals
      let totalPrice = 0;
      let totalSurcharge = 0;
      
      if (ticketDetails.length > 0) {
        ticketDetails.forEach(ticket => {
          const price = parseFloat(ticket.Price || ticket.price || ticket.TicketPrice || ticket.ticketPrice || 0);
          const surcharge = parseFloat(ticket.Surcharge || ticket.surcharge || 0);
          totalPrice += price;
          totalSurcharge += surcharge;
        });
      }
      
      // Get sub charge and grand total from booking data or calculate
      ticketInfo.subCharge = bookingData?.subCharge || 
                             ticketData?.SubCharge || 
                             ticketData?.subCharge || 
                             totalSurcharge || 
                             0;
      ticketInfo.grandTotal = bookingData?.grandTotal || 
                              ticketData?.GrandTotal || 
                              ticketData?.grandTotal || 
                              (totalPrice + totalSurcharge + parseFloat(ticketInfo.subCharge)) || 
                              0;

      console.log('Sending ticket email payload:', { email: customerEmail, ticketInfo }); // LOGGING

      // Call API to send ticket email
      const emailResponse = await fetch('/api/auth/send-ticket-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: customerEmail,
          ticketInfo: ticketInfo,
        }),
      });

      console.log('Email API response status:', emailResponse.status); // LOGGING

      const emailData = await emailResponse.json();
      console.log('Email API response data:', emailData); // LOGGING

      if (!emailResponse.ok) {
        console.error('Failed to send ticket email:', emailData.error || emailData.message);
      } else {
        console.log('Ticket email sent successfully:', emailData.messageId);
        // Mark as sent
        if (typeof window !== 'undefined') {
          localStorage.setItem(emailSentKey, 'true');
        }
      }
    } catch (error) {
      console.error('Error in sendTicketEmailAfterPayment:', error);
      // Don't fail the payment success flow if email fails
    }
  };

  // Try to load ticket data from localStorage if not already loaded
  useEffect(() => {
    if (typeof window !== 'undefined' && !ticketData) {
      try {
        const ticketDataStr = localStorage.getItem('ticketData');
        if (ticketDataStr) {
          const parsed = JSON.parse(ticketDataStr);
          setTicketData(parsed);
        }
      } catch (e) {
        // Ignore
      }
    }
  }, [ticketData]);

  return (
    <div className="min-h-screen bg-[#1c1c1c] text-white">
      <Header />
      
      {/* Main Content */}
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-2xl mx-auto">
            {/* Success Card */}
            <div className="bg-[#2a2a2a] rounded-lg p-8 md:p-12 shadow-2xl" style={{
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.02) 10px, rgba(255,255,255,0.02) 20px)'
            }}>
              {/* Success Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 bg-[#FFCA20] rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-14 h-14 text-black" strokeWidth={2.5} />
                </div>
              </div>

              {/* Heading */}
              <h1 className="text-3xl md:text-4xl font-bold text-[#FFCA20] text-center mb-4">
                Booking Confirmed!
              </h1>

              {/* Subtitle */}
              <p className="text-gray-300 text-center mb-8 text-lg">
                Your ticket has been successfully booked.
              </p>

              {/* Order ID Display */}
              {orderid && (
                <div className="bg-[#1a1a1a] rounded-lg p-4 mb-8 border border-[#3a3a3a]">
                  <p className="text-sm text-gray-400 mb-1 text-center">Order ID</p>
                  <p className="text-white font-semibold text-center font-mono">{orderid}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="space-y-4">
                <button
                  onClick={handleViewTicket}
                  disabled={isLoadingTicket || !ticketData}
                  className="w-full bg-[#FFCA20] text-black font-semibold py-4 px-6 rounded-lg hover:bg-[#FFCA20]/90 transition disabled:opacity-50 disabled:cursor-not-allowed text-lg flex items-center justify-center gap-2"
                >
                  {isLoadingTicket ? (
                    <>
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading ticket...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>View ticket</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => router.push('/')}
                  className="w-full bg-transparent border-2 border-[#FFCA20] text-[#FFCA20] font-semibold py-4 px-6 rounded-lg hover:bg-[#FFCA20]/10 transition text-lg"
                >
                  Back to home
                </button>
              </div>

              {/* Additional Info */}
              <div className="mt-8 pt-8 border-t border-[#3a3a3a]">
                <p className="text-sm text-gray-400 text-center">
                  Your booking confirmation has been sent to your email. 
                  You can also view your tickets in the "My Tickets" section.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* Ticket Modal */}
      <TicketModal
        ticketData={ticketData}
        isOpen={showTicketModal}
        onClose={handleCloseTicket}
        bookingId={orderid}
      />
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#1c1c1c] text-white">
        <Header />
        <div className="pt-24 pb-16 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#FFCA20] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white/70">Loading...</p>
          </div>
        </div>
        <Footer />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}

