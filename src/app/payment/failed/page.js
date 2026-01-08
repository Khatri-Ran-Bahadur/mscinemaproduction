"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { XCircle, Loader2, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { payment } from '@/services/api';

export default function PaymentFailedPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState('');
  const [paymentData, setPaymentData] = useState(null);

  useEffect(() => {
    const processFailure = async () => {
      try {
        // Get payment response parameters from URL
        const responseData = {};
        searchParams.forEach((value, key) => {
          responseData[key] = value;
        });

        setPaymentData(responseData);

        // Extract error message if available
        const errorMsg = responseData.error_desc || responseData.error || responseData.reason || 'Payment was cancelled or failed';
        setError(errorMsg);

        // Store payment failure for tracking
        localStorage.setItem('paymentResult', JSON.stringify({
          status: 'failed',
          data: responseData,
          error: errorMsg,
          timestamp: new Date().toISOString(),
        }));

        // Get booking data for log
        const bookingDataStr = localStorage.getItem('bookingData');
        let bookingData = null;
        try {
          bookingData = bookingDataStr ? JSON.parse(bookingDataStr) : null;
        } catch (e) {
          console.warn('[Payment Failed] Could not parse booking data:', e);
        }

        // Save payment log to JSON file (for testing)
        const orderid = responseData.orderid || responseData.orderId || '';
        if (orderid) {
          try {
            await fetch('/api/payment/save-log', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                orderId: orderid,
                status: 'failed',
                data: {
                  ...responseData,
                  error: errorMsg,
                  bookingData: bookingData,
                },
              }),
            });
          } catch (logError) {
            console.warn('[Payment Failed] Failed to save payment log:', logError);
            // Don't block the flow if log saving fails
          }
        }

        // Call CancelBooking API
        await callCancelBooking(responseData);
      } catch (err) {
        console.error('Payment failure processing error:', err);
        setError('An error occurred processing your payment failure.');
      } finally {
        setIsVerifying(false);
      }
    };

    const callCancelBooking = async (responseData) => {
      try {
        const orderid = responseData.orderid || responseData.orderId || '';
        const tranID = responseData.tranID || responseData.tranId || '';
        const cardType = responseData.cardType || 'card';
        const errorDesc = responseData.error_desc || responseData.error || 'Payment failed';

        // Get booking data from localStorage
        const bookingDataStr = localStorage.getItem('bookingData');
        if (!bookingDataStr) {
          console.warn('[Payment Failed] Booking data not found, skipping CancelBooking');
          return;
        }

        const bookingData = JSON.parse(bookingDataStr);
        const {
          cinemaId,
          showId,
          confirmedReferenceNo,
          referenceNo
        } = bookingData;

        if (!cinemaId || !showId || !confirmedReferenceNo) {
          console.warn('[Payment Failed] Missing booking information, skipping CancelBooking');
          return;
        }

        // Call CancelBooking API - Direct call with authentication
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
            console.warn('[Payment Failed] Could not get token, proceeding without auth:', err);
          }
        }

        const queryParams = new URLSearchParams();
        queryParams.append('TransactionNo', tranID || orderid);
        queryParams.append('CardType', cardType);
        queryParams.append('Remarks', errorDesc);

        const url = `${API_BASE_URL}/Booking/CancelBooking/${cinemaId}/${showId}/${confirmedReferenceNo}?${queryParams.toString()}`;

        console.log('[Payment Failed] Calling CancelBooking:', url);

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
        console.log('[Payment Failed] CancelBooking response:', data);

        // Clear booking data after cancellation
        localStorage.removeItem('bookingData');
      } catch (err) {
        console.error('[Payment Failed] CancelBooking error:', err);
        // Don't show error to user, just log it
      }
    };

    processFailure();
  }, [searchParams]);

  const handleRetry = () => {
    // Clear payment result
    localStorage.removeItem('paymentResult');
    
    // Go back to previous page or booking flow
    router.back();
  };

  return (
    <div className="min-h-screen bg-[#1c1c1c] text-white flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-8 max-w-md w-full text-center">
        {isVerifying ? (
          <>
            <Loader2 className="w-12 h-12 text-[#FFCA20] animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-3">Processing...</h1>
            <p className="text-white/70">Please wait.</p>
          </>
        ) : (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-3">Payment Failed</h1>
            <p className="text-red-400 mb-4">{error}</p>
            
            {paymentData?.orderid && (
              <div className="mt-4 p-4 bg-[#2a2a2a] rounded text-left mb-6">
                <p className="text-sm text-white/60 mb-1">Order ID:</p>
                <p className="text-white font-semibold">{paymentData.orderid}</p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleRetry}
                className="w-full bg-[#FFCA20] text-black font-semibold py-3 px-6 rounded hover:bg-[#FFCA20]/90 transition flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>

              <Link
                href="/"
                className="w-full bg-[#3a3a3a] text-white font-semibold py-3 px-6 rounded hover:bg-[#4a4a4a] transition flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Link>
            </div>

            <div className="mt-6 pt-6 border-t border-[#2a2a2a]">
              <p className="text-sm text-white/60 mb-2">Need help?</p>
              <Link
                href="/contact"
                className="text-[#FFCA20] hover:underline text-sm"
              >
                Contact Support
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

