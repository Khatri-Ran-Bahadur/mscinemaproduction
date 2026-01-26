"use client";

import { useRouter } from 'next/navigation';

export default function MaintenancePage() {
  const router = useRouter();
  
  // Static maintenance message
  const maintenanceMessage = "";

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center p-6">
      {/* Illustration Section */}
      <div className="relative mb-12 w-full max-w-lg flex justify-center">
        <img 
          src="/img/maintainacne.png" 
          alt="Maintenance illustration" 
          className="max-w-full h-auto"
        />
      </div>

      {/* Content Section */}
      <div className="text-center max-w-2xl">
        {/* Heading */}
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Website is under maintenance
        </h1>

        {/* Description */}
        <p className="text-lg text-white/80 mb-10 leading-relaxed">
          {maintenanceMessage}
        </p>

        {/* Back to Home Button */}
        <button
          onClick={() => {
            // Try to reload and check maintenance status again
            window.location.href = '/';
          }}
          className="inline-block bg-[#FFCA20] text-white font-semibold px-8 py-3 rounded-lg hover:bg-[#FFCA20]/90 transition"
        >
          Back to home
        </button>
      </div>
    </div>
  );
}

