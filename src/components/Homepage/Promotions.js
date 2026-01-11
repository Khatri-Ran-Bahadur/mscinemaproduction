"use client"

import React from 'react'

export const Promotions = () => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <h3 className="text-xl md:text-2xl font-bold mb-6 md:mb-8 text-[#FAFAFA]">Promotions</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {/* Promotion Image 1 */}
          <div className="group cursor-pointer rounded-lg overflow-hidden aspect-[4/3]">
            <img 
              src="img/promotions1.jpg" 
              alt="Promotion 1" 
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />
          </div>

          {/* Promotion Image 2 */}
          <div className="group cursor-pointer rounded-lg overflow-hidden aspect-[4/3]">
            <img 
              src="img/promotions2.jpg" 
              alt="Promotion 2" 
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />
        </div>

          {/* Promotion Image 3 */}
          <div className="group cursor-pointer rounded-lg overflow-hidden aspect-[4/3]">
            <img 
              src="img/promotions3.jpg" 
              alt="Promotion 3" 
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />
                </div>

          {/* Promotion Image 4 - Repeat promotions1 */}
          <div className="group cursor-pointer rounded-lg overflow-hidden aspect-[4/3]">
            <img 
              src="img/promotions1.jpg" 
              alt="Promotion 4" 
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />
                </div>

          {/* Promotion Image 5 - Repeat promotions2 */}
          <div className="group cursor-pointer rounded-lg overflow-hidden aspect-[4/3]">
            <img 
              src="img/promotions2.jpg" 
              alt="Promotion 5" 
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />
              </div>

          {/* Promotion Image 6 - Repeat promotions3 */}
          <div className="group cursor-pointer rounded-lg overflow-hidden aspect-[4/3]">
            <img 
              src="img/promotions3.jpg" 
              alt="Promotion 6" 
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />
            </div>
        </div>
      </div>
  )
}
