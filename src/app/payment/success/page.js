"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { payment } from '@/services/api';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState('');
  const [paymentData, setPaymentData] = useState(null);
  const [orderId, setOrderId] = useState('');
  const [isReserving, setIsReserving] = useState(false);
  const [reserveError, setReserveError] = useState('');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get payment response parameters from URL
        const responseData = {};
        searchParams?.forEach((value, key) => {
          responseData[key] = value;
        });

        const orderid = responseData.orderid || responseData.orderId || '';
        const tranID = responseData.tranID || responseData.tranId || '';
        const status = responseData.status || '';
        const amount = responseData.amount || '';
        const currency = responseData.currency || 'MYR';
        const channel = responseData.channel || '';
        const cardType = responseData.cardType || 'card';

        // Get booking data for log
        const bookingDataStr = localStorage.getItem('bookingData');
        let bookingData = null;
        try {
          bookingData = bookingDataStr ? JSON.parse(bookingDataStr) : null;
        } catch (e) {
          console.warn('[Payment Success] Could not parse booking data:', e);
        }

        if (status === '00' && orderid) {
          setIsValid(true);
          setPaymentData(responseData);
          setOrderId(orderid);
          
          // Store payment result
          localStorage.setItem('paymentResult', JSON.stringify({
            status: 'success',
            orderId: orderid,
            data: responseData,
            timestamp: new Date().toISOString(),
          }));

          // Save payment log to JSON file (for testing)
          try {
            await fetch('/api/payment/save-log', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                orderId: orderid,
                status: 'success',
                data: {
                  ...responseData,
                  bookingData: bookingData,
                },
              }),
            });
          } catch (logError) {
            console.warn('[Payment Success] Failed to save payment log:', logError);
            // Don't block the flow if log saving fails
          }

          // Call ReserveBooking API
          await callReserveBooking(orderid, tranID, cardType, channel);
        } else {
          setError('Invalid payment status or missing order ID.');
        }
      } catch (err) {
        console.error('Payment verification error:', err);
        setError('Error verifying payment. Please contact support.');
      } finally {
        setIsVerifying(false);
      }
    };

    const callReserveBooking = async (orderid, tranID, cardType, channel) => {
      try {
        setIsReserving(true);
        setReserveError('');

        // Get booking data from localStorage
        const bookingDataStr = localStorage.getItem('bookingData');
        if (!bookingDataStr) {
          throw new Error('Booking data not found');
        }

        const bookingData = JSON.parse(bookingDataStr);
        const {
          cinemaId,
          showId,
          confirmedReferenceNo,
          referenceNo,
          membershipId = 0
        } = bookingData;

        if (!cinemaId || !showId || !confirmedReferenceNo) {
          throw new Error('Missing booking information');
        }

        // Determine authorizeId from channel or cardType
        let authorizeId = tranID || '';
        if (channel && (channel.includes('credit') || channel.includes('Credit'))) {
          authorizeId = tranID || '';
        }

        // Determine card type from channel
        let finalCardType = cardType;
        if (channel) {
          if (channel.toLowerCase().includes('visa')) {
            finalCardType = 'visa';
          } else if (channel.toLowerCase().includes('master')) {
            finalCardType = 'master';
          } else if (channel.toLowerCase().includes('credit')) {
            finalCardType = 'credit';
          } else {
            finalCardType = channel.toLowerCase();
          }
        }

        // Call ReserveBooking API - Direct call with authentication
        const { API_BASE_URL } = await import('@/config/api');

        // Get authentication token - use stored token or fetch new one
        const { getPublicToken, getToken } = await import('@/utils/storage');
        const { getPublicToken: fetchPublicToken } = await import('@/services/api/auth');
        
        let token = getToken() || getPublicToken();
        
        // If no token or expired, fetch new one
        if (!token) {
          try {
            const tokenData = await fetchPublicToken();
            token = tokenData?.token || tokenData?.Token;
          } catch (err) {
            console.warn('[Payment Success] Could not get token, proceeding without auth:', err);
          }
        }

        const queryParams = new URLSearchParams();
        queryParams.append('TransactionNo', tranID || orderid);
        queryParams.append('CardType', finalCardType);
        if (authorizeId) {
          queryParams.append('AuthorizeId', authorizeId);
        }
        queryParams.append('Remarks', `Payment successful via ${channel || 'payment gateway'}`);

        const url = `${API_BASE_URL}/Booking/ReserveBooking/${cinemaId}/${showId}/${confirmedReferenceNo}/${membershipId}?${queryParams.toString()}`;

        console.log('[Payment Success] Calling ReserveBooking:', url);

        const headers = {
          'accept': '*/*',
          'Content-Type': 'application/json',
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
          method: 'POST',
          headers,
        });

        const data = await response.json();
        console.log('[Payment Success] ReserveBooking response:', data);

        if (!response.ok) {
          throw new Error(data.message || 'Failed to reserve booking');
        }

        // Clear booking data after successful reservation
        localStorage.removeItem('bookingData');
      } catch (err) {
        console.error('[Payment Success] ReserveBooking error:', err);
        setReserveError(err.message || 'Failed to complete booking reservation. Please contact support.');
      } finally {
        setIsReserving(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  const handleContinue = () => {
    // Clear payment result from localStorage after handling
    localStorage.removeItem('paymentResult');
    
    // Redirect to my-tickets page or home
    router.push('/my-tickets');
  };

  return (
    <div className="min-h-screen bg-[#1c1c1c] text-white flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-8 max-w-md w-full text-center">
        {isVerifying ? (
          <>
            <Loader2 className="w-12 h-12 text-[#FFCA20] animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-3">Verifying Payment...</h1>
            <p className="text-white/70">Please wait while we verify your payment.</p>
          </>
        ) : isValid ? (
          <>
            {isReserving ? (
              <>
                <Loader2 className="w-12 h-12 text-[#FFCA20] animate-spin mx-auto mb-6" />
                <h1 className="text-2xl font-bold mb-3">Completing Booking...</h1>
                <p className="text-white/70">Please wait while we finalize your booking.</p>
              </>
            ) : (
              <>
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
                <h1 className="text-2xl font-bold mb-3">Payment Successful!</h1>
                <p className="text-white/70 mb-2">Your payment has been processed successfully.</p>
                
                {reserveError && (
                  <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/50 rounded text-left">
                    <p className="text-sm text-yellow-400">{reserveError}</p>
                    <p className="text-xs text-white/60 mt-2">Your payment was successful. Please contact support to complete your booking.</p>
                  </div>
                )}
                
                {paymentData?.orderid && (
                  <div className="mt-4 p-4 bg-[#2a2a2a] rounded text-left">
                    <p className="text-sm text-white/60 mb-1">Order ID:</p>
                    <p className="text-white font-semibold">{paymentData.orderid}</p>
                    {paymentData.tranID && (
                      <>
                        <p className="text-sm text-white/60 mb-1 mt-2">Transaction ID:</p>
                        <p className="text-white font-semibold">{paymentData.tranID}</p>
                      </>
                    )}
                  </div>
                )}

                <button
                  onClick={handleContinue}
                  className="mt-6 w-full bg-[#FFCA20] text-black font-semibold py-3 px-6 rounded hover:bg-[#FFCA20]/90 transition flex items-center justify-center gap-2"
                >
                  View My Tickets
                  <ArrowRight className="w-4 h-4" />
                </button>

                <Link
                  href="/"
                  className="mt-4 inline-block text-white/60 hover:text-white text-sm transition"
                >
                  Back to Home
                </Link>
              </>
            )}
          </>
        ) : (
          <>
            <div className="w-16 h-16 text-red-500 mx-auto mb-6 flex items-center justify-center text-4xl">
              ✕
            </div>
            <h1 className="text-2xl font-bold mb-3">Payment Verification Failed</h1>
            <p className="text-red-400 mb-6">{error || 'There was an issue verifying your payment.'}</p>
            <Link
              href="/my-tickets"
              className="inline-block bg-[#FFCA20] text-black font-semibold py-2 px-6 rounded hover:bg-[#FFCA20]/90 transition"
            >
              Check My Tickets
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

