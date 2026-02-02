"use client"
import React from 'react'
import Link from 'next/link'
import { home } from '@/services/api'

export const Promotions = () => {
  const [promotions, setPromotions] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const data = await home.getPromotions();
        if (data.success) {
          setPromotions(data.promotions);
        }
      } catch (error) {
        console.error('Failed to fetch promotions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPromotions();
  }, []);

  if (loading) return null; // Or skeleton

  if (promotions.length === 0) {
    // Optional: show fallback static content if dynamic is empty, or just return null
    // Returning null as "hide if empty" is better for dynamic logic
    return null;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <h3 className="text-xl md:text-2xl font-bold mb-6 md:mb-8 text-[#FAFAFA]">Promotions</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {promotions.map((promo) => (
             <div key={promo.id} className="group cursor-pointer rounded-lg overflow-hidden relative h-[250px] sm:h-[300px] md:h-[350px]">
               {/* Content Wrapper - handles link if present, or just div */}
               {promo.link ? (
                 <Link href={promo.link} target="_blank" className="block w-full h-full relative">
                    <img 
                      src={promo.image || "img/banner.jpg"} 
                      alt={promo.title || "Promotion"} 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    
                    {/* Overlay - Only show if title or description exists */}
                    {(promo.title || promo.description) && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
                          {promo.title && (
                            <h4 className="font-bold text-lg md:text-xl mb-1 text-[#FAFAFA] uppercase tracking-wide">
                              {promo.title}
                            </h4>
                          )}
                          {promo.description && (
                            <p className="text-xs md:text-sm text-[#FAFAFA] leading-relaxed line-clamp-3">
                              {promo.description}
                            </p>
                          )}
                        </div>
                      </>
                    )}
                 </Link>
               ) : (
                  <div className="block w-full h-full relative">
                    <img 
                      src={promo.image || "img/banner.jpg"} 
                      alt={promo.title || "Promotion"} 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    
                    {/* Overlay - Only show if title or description exists */}
                    {(promo.title || promo.description) && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
                          {promo.title && (
                            <h4 className="font-bold text-lg md:text-xl mb-1 text-[#FAFAFA] uppercase tracking-wide">
                              {promo.title}
                            </h4>
                          )}
                          {promo.description && (
                            <p className="text-xs md:text-sm text-[#FAFAFA] leading-relaxed line-clamp-3">
                              {promo.description}
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
               )}
             </div>
          ))}
        </div>
      </div>
  )
}
