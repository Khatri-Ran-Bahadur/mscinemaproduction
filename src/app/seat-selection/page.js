"use client";

import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';

export default function SeatSelection() {
  const [selectedSeats, setSelectedSeats] = useState(['F8', 'F9']);
  const [seatType, setSeatType] = useState('standard');

  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const seatsPerRow = 14;

  const seatTypes = [
    { id: 'available', label: 'Available', color: 'border-gray-600' },
    { id: 'selected', label: 'Selected', color: 'bg-[#f5c118]' },
    { id: 'occupied', label: 'Occupied', color: 'bg-gray-700' },
    { id: 'single', label: 'Single', color: 'border-blue-500' },
    { id: 'double', label: 'Double', color: 'border-pink-500' }
  ];

  const occupiedSeats = ['C5', 'C6', 'D7', 'D8', 'E6', 'E7', 'E8', 'E9'];
  const coupleSeats = ['F5-F6', 'F11-F12', 'G5-G6', 'G11-G12'];

  const toggleSeat = (seatId) => {
    if (occupiedSeats.includes(seatId)) return;
    
    setSelectedSeats(prev => 
      prev.includes(seatId) 
        ? prev.filter(s => s !== seatId)
        : [...prev, seatId]
    );
  };

  const isCoupleLeft = (row, col) => {
    return coupleSeats.includes(`${row}${col}-${row}${col + 1}`);
  };

  const isCoupleRight = (row, col) => {
    return coupleSeats.includes(`${row}${col - 1}-${row}${col}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-10">
      {/* Header */}
      <div className="relative">
        <div className="absolute top-5 left-5 z-10">
          <button className="flex items-center gap-2 text-white/70 hover:text-white text-sm">
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>

        {/* Breadcrumb */}
        <div className="absolute top-5 right-5 z-10">
          <div className="flex items-center gap-2 text-xs text-white/50">
            <span className="hover:text-white cursor-pointer">Select Cinema</span>
            <span>›</span>
            <span className="hover:text-white cursor-pointer">Your Seat</span>
            <span>›</span>
            <span className="text-white">Select Seat</span>
            <span>›</span>
            <span className="hover:text-white cursor-pointer">Payment</span>
          </div>
        </div>

        {/* Hero Image */}
        <div className="relative h-48 overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1635805737707-575885ab0820?w=1600&h=400&fit=crop&q=80" 
            alt="Predator Badlands"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-[#0a0a0a]/80 to-[#0a0a0a]" />
          
          {/* Movie Info */}
          <div className="absolute bottom-4 left-8">
            <h1 className="text-2xl font-bold mb-1">Predator: Badlands</h1>
            <div className="flex items-center gap-3 text-xs text-white/70">
              <span>Action, Sci-Fi</span>
              <span>|</span>
              <span>1 hr 30 mins</span>
              <span>|</span>
              <span>English</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-white/70 mt-1">
              <span>📍 Kampar, Putra</span>
              <span className="bg-white/10 px-2 py-0.5 rounded">IMAX</span>
              <span>🕐 13 Nov 2025, 1:30 PM</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 mt-8">
        {/* Seat Type Legend */}
        <div className="flex items-center justify-center gap-6 mb-8 text-xs">
          {seatTypes.map(type => (
            <div key={type.id} className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded border-2 ${type.color} ${type.id === 'available' ? 'border-2' : ''}`}></div>
              <span className="text-white/70">{type.label}</span>
            </div>
          ))}
        </div>

        {/* Screen */}
        <div className="mb-8">
          <div className="bg-gradient-to-b from-gray-700 to-gray-800 h-2 rounded-t-3xl mx-auto w-3/4 opacity-60"></div>
          <p className="text-center text-xs text-white/50 mt-2">Screen</p>
        </div>

        {/* Seat Map */}
        <div className="bg-[#1a1a1a] rounded-lg p-6">
          <div className="flex flex-col gap-2">
            {rows.map((row, rowIndex) => (
              <div key={row} className="flex items-center justify-center gap-2">
                {/* Row Label Left */}
                <span className="text-xs text-white/50 w-6 text-center">{row}</span>
                
                {/* Seats */}
                <div className="flex gap-1.5">
                  {Array.from({ length: seatsPerRow }, (_, i) => {
                    const seatNum = i + 1;
                    const seatId = `${row}${seatNum}`;
                    const isOccupied = occupiedSeats.includes(seatId);
                    const isSelected = selectedSeats.includes(seatId);
                    const isCoupleL = isCoupleLeft(row, seatNum);
                    const isCoupleR = isCoupleRight(row, seatNum);
                    
                    // Add gap for aisle
                    const showGap = seatNum === 7;

                    return (
                      <React.Fragment key={seatId}>
                        <button
                          onClick={() => toggleSeat(seatId)}
                          disabled={isOccupied}
                          className={`w-6 h-6 rounded text-[9px] flex items-center justify-center transition-all
                            ${isSelected 
                              ? 'bg-[#f5c118] text-black font-semibold border-2 border-[#f5c118]' 
                              : isOccupied 
                              ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                              : isCoupleL || isCoupleR
                              ? 'border-2 border-pink-500 bg-transparent text-white/70 hover:bg-pink-500/20'
                              : 'border-2 border-gray-600 bg-transparent text-white/70 hover:border-gray-500 hover:bg-gray-800/50'
                            }
                            ${isCoupleL ? 'rounded-r-none' : ''}
                            ${isCoupleR ? 'rounded-l-none' : ''}
                          `}
                        >
                          {seatNum}
                        </button>
                        {showGap && <div className="w-4"></div>}
                      </React.Fragment>
                    );
                  })}
                </div>
                
                {/* Row Label Right */}
                <span className="text-xs text-white/50 w-6 text-center">{row}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Seats Info */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm">
            <span className="text-white/60">Selected Seats: </span>
            <span className="text-white font-semibold">{selectedSeats.join(', ') || 'None'}</span>
          </div>
          <div className="text-sm">
            <span className="text-white/60">Total: </span>
            <span className="text-white font-semibold">RM {selectedSeats.length * 13}.00</span>
          </div>
        </div>

        {/* Continue Button */}
        <div className="flex justify-center mt-8">
          <button 
            className={`px-10 py-3 rounded font-medium text-sm transition ${
              selectedSeats.length > 0
                ? 'bg-[#f5c118] text-black hover:bg-[#f5c118]/90' 
                : 'bg-[#f5c118]/30 text-black/50 cursor-not-allowed'
            }`}
            disabled={selectedSeats.length === 0}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}