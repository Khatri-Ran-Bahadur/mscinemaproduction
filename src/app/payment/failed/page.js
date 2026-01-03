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
      } catch (err) {
        console.error('Payment failure processing error:', err);
        setError('An error occurred processing your payment failure.');
      } finally {
        setIsVerifying(false);
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
                className="inline-block w-full bg-[#3a3a3a] text-white font-semibold py-3 px-6 rounded hover:bg-[#4a4a4a] transition flex items-center justify-center gap-2"
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

