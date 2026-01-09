"use client";

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [orderid, setOrderid] = React.useState('');
  const [errorMsg, setErrorMsg] = React.useState('Payment was cancelled or failed');

  // Extract minimal data from URL (secure)
  React.useEffect(() => {
    if (typeof window !== 'undefined' && searchParams) {
      const orderIdFromUrl = searchParams.get('orderid') || searchParams.get('orderId') || '';
      const status = searchParams.get('status') || '';
      
      setOrderid(orderIdFromUrl);
      
      // Get error message from localStorage or use default
      try {
        const paymentResultStr = localStorage.getItem('paymentResult');
        if (paymentResultStr) {
          const paymentResult = JSON.parse(paymentResultStr);
          if (paymentResult.error) {
            setErrorMsg(paymentResult.error);
          } else if (paymentResult.data?.error_desc) {
            setErrorMsg(paymentResult.data.error_desc);
          }
        }
      } catch (e) {
        // Use default error message
      }
      
      // Store payment failure for tracking
      if (orderIdFromUrl) {
        localStorage.setItem('paymentResult', JSON.stringify({
          status: 'failed',
          orderId: orderIdFromUrl,
          data: {
            orderid: orderIdFromUrl,
            status: status,
          },
          error: errorMsg,
          timestamp: new Date().toISOString(),
        }));
      }
    }
  }, [searchParams, errorMsg]);

  const handleRetry = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('paymentResult');
    }
    router.back();
  };

  return (
    <div className="min-h-screen bg-[#1c1c1c] text-white flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-8 max-w-md w-full text-center">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
        <h1 className="text-2xl font-bold mb-3">Payment Failed</h1>
        <p className="text-red-400 mb-4">{errorMsg}</p>
        
        {orderid && (
          <div className="mt-4 p-4 bg-[#2a2a2a] rounded text-left mb-6">
            <p className="text-sm text-white/60 mb-1">Order ID:</p>
            <p className="text-white font-semibold">{orderid}</p>
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
      </div>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#1c1c1c] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70">Loading...</p>
        </div>
      </div>
    }>
      <PaymentFailedContent />
    </Suspense>
  );
}

