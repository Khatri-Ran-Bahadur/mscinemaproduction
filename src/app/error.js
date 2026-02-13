'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Error({ error, reset }) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Runtime error:', error);
    
    // Redirect to homepage after a short delay or immediately
    router.push('/');
  }, [error, router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center text-white p-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
        <p className="text-gray-400 mb-4">Redirecting you to the homepage...</p>
      </div>
    </div>
  );
}
