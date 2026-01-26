'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { auth } from '@/services/api';

export default function MaintenanceCheck({ children }) {
  const [isChecking, setIsChecking] = useState(true);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Check maintenance mode on mount and when pathname changes
  useEffect(() => {
    checkMaintenanceMode();
  }, [pathname]);

  const checkMaintenanceMode = async () => {
    setIsChecking(true);
    
    try {
      // First: allow overriding maintenance mode via env var (NEXT_PUBLIC_MAINTENANCE)
      // This avoids waiting on the API when you want to enable maintenance immediately.
      const MAINTENANCE_ENV =false;

      let maintenanceActive = false;

      if (MAINTENANCE_ENV) {
        maintenanceActive = true;
      } else {
        // Use actual API response
        const response = await auth.getMaintenanceModeAndAppVersionById(1);
        
        // Check if maintenance mode is active
        // API may return maintenanceMode in multiple shapes/keys
        const maintenanceModeValue = 
          response?.maintenanceMode || 
          response?.MaintenanceMode || 
          response?.isMaintenanceMode || 
          response?.IsMaintenanceMode;
        
        // Check if maintenance mode is "True" (string comparison) or boolean/number
        maintenanceActive = 
          maintenanceModeValue === "True" || 
          maintenanceModeValue === "true" || 
          maintenanceModeValue === true ||
          maintenanceModeValue === 1;
      }

      if (maintenanceActive) {
        setIsMaintenance(true);
        // If maintenance is active, redirect to maintenance page (unless already there)
        if (pathname !== '/maintenance') {
          router.replace('/maintenance');
        }
      } else {
        setIsMaintenance(false);
        // If maintenance mode is off and we're on maintenance page, redirect to home
        if (pathname === '/maintenance') {
          router.replace('/');
        }
      }
    } catch (error) {
      // If API fails, allow the app to continue (don't block on error)
      setIsMaintenance(false);
    } finally {
      setIsChecking(false);
    }
  };

  // Show loading state while checking (only if not on maintenance page)
  if (isChecking && pathname !== '/maintenance') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-[#FFCA20] text-lg mb-4">Loading...</div>
        </div>
      </div>
    );
  }

  // If maintenance mode is ACTIVE, block all pages except maintenance page
  if (isMaintenance) {
    // Only allow access to maintenance page
    if (pathname === '/maintenance') {
      return <>{children}</>;
    }
    // Block all other pages - show nothing while redirecting
    return null;
  }

  // If maintenance mode is OFF, block access to maintenance page
  if (!isMaintenance && pathname === '/maintenance') {
    return null; // Will redirect to home
  }

  // Normal access - show the page
  return <>{children}</>;
}

