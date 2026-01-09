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
              const cinemaId = parsed.cinemaDetails?.cinemaID || parsed.cinemaId || parsed.cinemaDetails?.cinemaId;
              const showId = parsed.showTimeDetails?.showID || parsed.showId || parsed.showTimeDetails?.showId;
              const referenceNo = parsed.confirmedReferenceNo || parsed.referenceNo || orderIdFromUrl;
              
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

