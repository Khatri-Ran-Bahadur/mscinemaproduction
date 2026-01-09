"use client";

import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/header';
import Footer from '@/components/footer';

function TicketContent() {
  const router = useRouter();

  // Redirect to my-tickets page
  React.useEffect(() => {
    router.push('/my-tickets');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#1c1c1c] text-white">
      <Header />
      <div className="pt-20 pb-12 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/70 mb-4">Redirecting to My Tickets...</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function TicketPage() {
  return (
    <Suspense fallback={
      <>
        <Header />
        <div className="min-h-screen bg-[#1c1c1c] text-white flex items-center justify-center pt-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#FFCA20] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white/70">Loading...</p>
          </div>
        </div>
        <Footer />
      </>
    }>
      <TicketContent />
    </Suspense>
  );
}
