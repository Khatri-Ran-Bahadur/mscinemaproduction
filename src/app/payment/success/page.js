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

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get order ID from URL or localStorage
        const urlOrderId = searchParams?.get('orderId');
        const storedPayment = localStorage.getItem('paymentResult');
        let storedData = null;
        
        if (storedPayment) {
          try {
            storedData = JSON.parse(storedPayment);
            if (storedData.status === 'success') {
              setOrderId(storedData.orderId || urlOrderId || '');
            }
          } catch (e) {
            console.error('Error parsing stored payment:', e);
          }
        }

        // Get payment response parameters from URL
        const responseData = {};
        searchParams?.forEach((value, key) => {
          responseData[key] = value;
        });

        // If we have URL parameters, verify the signature
        if (Object.keys(responseData).length > 0) {
          const isValidSignature = await payment.verifyPaymentResponse(responseData);
          
          if (isValidSignature) {
            setIsValid(true);
            setPaymentData(responseData);
            setOrderId(responseData.orderid || responseData.OrderID || urlOrderId || '');
            
            // Store payment result
            localStorage.setItem('paymentResult', JSON.stringify({
              status: 'success',
              orderId: responseData.orderid || responseData.OrderID || urlOrderId,
              data: responseData,
              timestamp: new Date().toISOString(),
            }));
          } else {
            setError('Payment verification failed. Please contact support.');
          }
        } else if (storedData && storedData.status === 'success') {
          // Use stored payment result if no URL params
          setIsValid(true);
          setPaymentData(storedData.data || {});
          setOrderId(storedData.orderId || '');
        } else {
          setError('No payment data received');
        }
      } catch (err) {
        console.error('Payment verification error:', err);
        setError('Error verifying payment. Please contact support.');
      } finally {
        setIsVerifying(false);
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
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-3">Payment Successful!</h1>
            <p className="text-white/70 mb-2">Your payment has been processed successfully.</p>
            
            {paymentData?.orderid && (
              <div className="mt-4 p-4 bg-[#2a2a2a] rounded text-left">
                <p className="text-sm text-white/60 mb-1">Order ID:</p>
                <p className="text-white font-semibold">{paymentData.orderid}</p>
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

