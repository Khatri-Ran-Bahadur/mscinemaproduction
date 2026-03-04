"use client";

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Clock, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/header';
import Footer from '@/components/footer';

function PaymentPendingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [orderid, setOrderid] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && searchParams) {
      const orderIdFromUrl = searchParams.get('orderid') || searchParams.get('orderId') || '';
      setOrderid(orderIdFromUrl);
      
      // Store payment pending for tracking
      if (orderIdFromUrl) {
        localStorage.setItem('paymentResult', JSON.stringify({
          status: 'pending',
          orderId: orderIdFromUrl,
          data: {
            orderid: orderIdFromUrl,
            status: '22',
          },
          timestamp: new Date().toISOString(),
        }));
      }
    }
  }, [searchParams]);

  const handleBackToHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#1c1c1c] text-white">
      <Header />
      
      <div className="pt-24 pb-16 flex items-center justify-center min-h-[80vh]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-md mx-auto">
            {/* Pending Card */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-8 shadow-2xl text-center relative overflow-hidden" style={{
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 15px, rgba(255,202,32,0.02) 15px, rgba(255,202,32,0.02) 30px)'
            }}>
              {/* Decorative Glow */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#FFCA20]/5 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#FFCA20]/5 rounded-full blur-3xl animate-pulse"></div>

              {/* Pending Icon */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-[#FFCA20]/10 rounded-full flex items-center justify-center border-2 border-[#FFCA20]/20">
                    <Clock className="w-10 h-10 text-[#FFCA20] animate-pulse" />
                  </div>
                  {/* Rotating outer ring */}
                  <div className="absolute inset-0 border-2 border-dashed border-[#FFCA20]/40 rounded-full animate-[spin_10s_linear_infinite]"></div>
                </div>
              </div>

              {/* Heading */}
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
                Payment Pending
              </h1>

              {/* Subtitle */}
              <p className="text-gray-400 mb-6 leading-relaxed">
                Your transaction is currently being processed. This may take a few minutes depending on your bank.
              </p>

              {/* Order ID Display */}
              {orderid && (
                <div className="bg-[#2a2a2a] rounded-lg p-4 mb-8 border border-[#3a3a3a]">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Order ID</p>
                  <p className="text-[#FFCA20] font-mono font-medium">{orderid}</p>
                </div>
              )}

              {/* Info Message */}
              <div className="flex items-start gap-3 text-left bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-8">
                <div className="mt-0.5">
                  <RefreshCw className="w-4 h-4 text-blue-400 animate-spin-slow" />
                </div>
                <p className="text-sm text-blue-100/80">
                  Please do not refresh the page or close the browser. You will be notified once the payment is confirmed.
                </p>
              </div>

              {/* Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleBackToHome}
                  className="w-full bg-[#FFCA20] text-black font-semibold py-3.5 px-6 rounded-lg hover:bg-[#FFCA20]/90 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Home</span>
                </button>
                
                <p className="text-xs text-gray-500 mt-4">
                  Check your email for booking confirmation after processing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default function PaymentPendingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#1c1c1c] text-white">
        <Header />
        <div className="pt-24 pb-16 flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#FFCA20] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white/70">Loading status...</p>
          </div>
        </div>
        <Footer />
      </div>
    }>
      <PaymentPendingContent />
    </Suspense>
  );
}
