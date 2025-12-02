"use client";

import React, { useState } from 'react';
import { ChevronLeft, X } from 'lucide-react';

export default function SeatSelection() {
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [showSummary, setShowSummary] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showTicket, setShowTicket] = useState(false);

  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  const seatsPerRow = 16;

  const seatTypes = [
    { id: 'available', label: 'Available', color: 'border-gray-600 bg-transparent' },
    { id: 'selected', label: 'Selected', color: 'bg-[#f5c118]' },
    { id: 'occupied', label: 'Occupied', color: 'bg-gray-700' },
    { id: 'single', label: 'Single', color: 'border-purple-500 bg-transparent' },
    { id: 'double', label: 'Double', color: 'border-orange-500 bg-transparent' }
  ];

  const occupiedSeats = ['C5', 'C6', 'D7', 'D8', 'E6', 'E7', 'E8', 'E9', 'F10', 'G11'];
  const singleSeats = ['E4', 'F4', 'G4', 'H4'];
  const doubleSeats = ['E5-E6', 'F5-F6', 'G5-G6'];

  const ticketPrice = 13.00;
  const tax = 4.40;

  const toggleSeat = (seatId) => {
    if (occupiedSeats.includes(seatId)) return;
    
    setSelectedSeats(prev => 
      prev.includes(seatId) 
        ? prev.filter(s => s !== seatId)
        : [...prev, seatId]
    );
  };

  const isSingleSeat = (seatId) => singleSeats.includes(seatId);
  
  const isDoubleLeft = (row, col) => {
    return doubleSeats.includes(`${row}${col}-${row}${col + 1}`);
  };

  const isDoubleRight = (row, col) => {
    return doubleSeats.includes(`${row}${col - 1}-${row}${col}`);
  };

  const subtotal = selectedSeats.length * ticketPrice;
  const total = subtotal + tax;

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

        <div className="relative h-48 overflow-hidden">
          <img 
            src="img/banner.jpg" 
            alt="Predator Badlands"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-[#0a0a0a]/80 to-[#0a0a0a]" />
          
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

      <div className="max-w-5xl mx-auto px-8 mt-8">
        {/* Seat Type Legend */}
        <div className="flex items-center justify-center gap-6 mb-8 text-xs">
          {seatTypes.map(type => (
            <div key={type.id} className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded border ${type.color} ${type.id === 'available' ? 'border-2 border-gray-600' : type.id === 'single' ? 'border-2' : type.id === 'double' ? 'border-2' : ''}`}></div>
              <span className="text-white/70">{type.label}</span>
            </div>
          ))}
        </div>

        {/* Screen */}
        <div className="mb-8">
          <div className="bg-gradient-to-b from-gray-600 to-gray-700 h-1.5 rounded-t-3xl mx-auto w-3/4 opacity-50"></div>
          <p className="text-center text-xs text-white/40 mt-2">Screen</p>
        </div>

        {/* Seat Map */}
        <div className="bg-[#1a1a1a] rounded-lg p-6">
          <div className="flex flex-col gap-2">
            {rows.map((row) => (
              <div key={row} className="flex items-center justify-center gap-2">
                {/* Row Label Left */}
                <span className="text-xs text-white/40 w-6 text-center font-medium">{row}</span>
                
                {/* Seats */}
                <div className="flex gap-1">
                  {Array.from({ length: seatsPerRow }, (_, i) => {
                    const seatNum = i + 1;
                    const seatId = `${row}${seatNum}`;
                    const isOccupied = occupiedSeats.includes(seatId);
                    const isSelected = selectedSeats.includes(seatId);
                    const isSingle = isSingleSeat(seatId);
                    const isDoubleL = isDoubleLeft(row, seatNum);
                    const isDoubleR = isDoubleRight(row, seatNum);
                    
                    // Add gaps for J row (couple seats)
                    const isJRow = row === 'J';
                    const showGap = (seatNum === 2 || seatNum === 5 || seatNum === 8 || seatNum === 11 || seatNum === 14) && isJRow;

                    return (
                      <React.Fragment key={seatId}>
                        {isJRow && seatNum <= 14 ? (
                          // J row - pairs of seats
                          seatNum % 2 === 1 && (
                            <div className="flex">
                              <button
                                onClick={() => toggleSeat(seatId)}
                                disabled={isOccupied}
                                className={`w-7 h-6 rounded-l text-[9px] flex items-center justify-center transition-all border
                                  ${isSelected 
                                    ? 'bg-[#f5c118] text-black font-semibold border-[#f5c118]' 
                                    : isOccupied 
                                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed border-gray-700' 
                                    : 'border-gray-600 bg-[#2a2a2a] text-white/60 hover:border-gray-500 hover:bg-gray-800/50'
                                  }`}
                              >
                                {seatNum}
                              </button>
                              <button
                                onClick={() => toggleSeat(`${row}${seatNum + 1}`)}
                                disabled={occupiedSeats.includes(`${row}${seatNum + 1}`)}
                                className={`w-7 h-6 rounded-r text-[9px] flex items-center justify-center transition-all border border-l-0
                                  ${selectedSeats.includes(`${row}${seatNum + 1}`)
                                    ? 'bg-[#f5c118] text-black font-semibold border-[#f5c118]' 
                                    : occupiedSeats.includes(`${row}${seatNum + 1}`)
                                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed border-gray-700' 
                                    : 'border-gray-600 bg-[#2a2a2a] text-white/60 hover:border-gray-500 hover:bg-gray-800/50'
                                  }`}
                              >
                                {seatNum + 1}
                              </button>
                            </div>
                          )
                        ) : (
                          // Regular rows
                          <button
                            onClick={() => toggleSeat(seatId)}
                            disabled={isOccupied}
                            className={`w-7 h-6 text-[9px] flex items-center justify-center transition-all border
                              ${isSelected 
                                ? 'bg-[#f5c118] text-black font-semibold border-[#f5c118] rounded' 
                                : isOccupied 
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed border-gray-700 rounded' 
                                : isSingle
                                ? 'border-purple-500 bg-[#2a2a2a] text-white/60 hover:bg-purple-500/20 rounded'
                                : isDoubleL || isDoubleR
                                ? 'border-orange-500 bg-[#2a2a2a] text-white/60 hover:bg-orange-500/20'
                                : 'border-gray-600 bg-[#2a2a2a] text-white/60 hover:border-gray-500 hover:bg-gray-800/50 rounded'
                              }
                              ${isDoubleL ? 'rounded-l rounded-r-none' : ''}
                              ${isDoubleR ? 'rounded-r rounded-l-none' : ''}
                            `}
                          >
                            {seatNum}
                          </button>
                        )}
                        {showGap && <div className="w-3"></div>}
                      </React.Fragment>
                    );
                  })}
                </div>
                
                {/* Row Label Right */}
                <span className="text-xs text-white/40 w-6 text-center font-medium">{row}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Info Bar */}
        <div className="mt-6 bg-[#1a1a1a] rounded-lg p-4">
          <div className="flex flex-col items-center gap-3">
            <div className="text-sm text-center">
              <span className="text-white/50">Your seats: </span>
              <span className="text-[#f5c118] font-bold">{selectedSeats.join(', ') || 'None'}</span>
            </div>
            <button 
              onClick={() => selectedSeats.length > 0 && setShowSummary(true)}
              className={`px-8 py-2.5 rounded font-bold text-sm transition ${
                selectedSeats.length > 0
                  ? 'bg-[#f5c118] text-black hover:bg-[#f5c118]/90' 
                  : 'bg-[#f5c118]/30 text-black/50 cursor-not-allowed'
              }`}
              disabled={selectedSeats.length === 0}
            >
              Book seat
            </button>
          </div>
        </div>
      </div>

      {/* Booking Summary Modal */}
      {showSummary && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-lg w-full max-w-xs relative">
            <button 
              onClick={() => setShowSummary(false)}
              className="absolute top-3 right-3 text-white/50 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-3 border-b border-gray-800">
              <h2 className="text-base font-bold text-white">Booking Summary</h2>
            </div>

            <div className="p-3">
              <div className="flex gap-2 mb-3">
                <img 
                  src="img/banner.jpg" 
                  alt="Movie poster"
                  className="w-16 h-22 object-cover rounded"
                />
                <div className="flex-1">
                  <h3 className="font-bold text-white text-xs mb-1">PREDATOR: BADLANDS</h3>
                  <div className="text-[10px] text-white/60 space-y-0.5">
                    <p>Kampar, PUTRA | IMAX</p>
                    <p>1 hr 30 mins | English</p>
                    <p>13 Nov 2025, 1:30 PM</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#0a0a0a] rounded p-2 mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/60">Seat NO:</span>
                  <div className="flex gap-1 flex-wrap">
                    {selectedSeats.map((seat) => (
                      <span key={seat} className="bg-gray-800 px-1.5 py-0.5 rounded text-[10px] text-white">
                        {seat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <h4 className="text-xs font-semibold text-white mb-1.5">TICKETS</h4>
                <div className="text-[10px] space-y-1">
                  <div className="flex justify-between text-white/60">
                    <span>Wed 13 Nov {selectedSeats.length} Ticket(s)</span>
                    <span>RM {subtotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <h4 className="text-xs font-semibold text-white mb-1.5">Payment details</h4>
                <div className="text-[10px] space-y-1">
                  <div className="flex justify-between text-white/60">
                    <span>Sub Total</span>
                    <span>RM {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>Tax</span>
                    <span>RM {tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>RESERVATION FEE</span>
                    <span>RM 0.00</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#f5c118] rounded p-2 mb-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-black">GRAND TOTAL</span>
                  <span className="text-base font-bold text-black">RM {total.toFixed(2)}</span>
                </div>
              </div>

              <button 
                onClick={() => {
                  setShowSummary(false);
                  setShowConfirmation(true);
                }}
                className="w-full bg-[#f5c118] text-black font-bold py-2 text-sm rounded hover:bg-[#f5c118]/90 transition"
              >
                Proceed to Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2a2a2a] rounded-lg w-full max-w-xs relative p-6 text-center">
            <button 
              onClick={() => setShowConfirmation(false)}
              className="absolute top-3 right-3 text-white/50 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-[#f5c118] rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <h3 className="text-white font-bold text-lg mb-2">Booking Confirmed!</h3>
            <p className="text-white/60 text-sm mb-6">Your ticket has been successfully booked</p>

            <div className="space-y-2">
              <button 
                onClick={() => {
                  setShowConfirmation(false);
                  setShowTicket(true);
                }}
                className="w-full bg-[#f5c118] text-black font-bold py-2.5 text-sm rounded hover:bg-[#f5c118]/90 transition"
              >
                View Ticket
              </button>
              <button 
                onClick={() => setShowConfirmation(false)}
                className="w-full bg-transparent border border-white/20 text-white font-medium py-2.5 text-sm rounded hover:bg-white/5 transition"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Modal */}
      {showTicket && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2a2a2a] rounded-lg w-full max-w-xs relative">
            <button 
              onClick={() => setShowTicket(false)}
              className="absolute top-3 right-3 text-white/50 hover:text-white z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-3 border-b border-gray-700">
              <h2 className="text-base font-bold text-white">Ticket</h2>
            </div>

            <div className="p-3">
              <div className="relative mb-3 rounded overflow-hidden">
                <img 
                  src="img/banner.jpg" 
                  alt="Movie poster"
                  className="w-full h-32 object-cover"
                />
              </div>

              <div className="mb-3">
                <h3 className="font-bold text-white text-sm mb-2">Predator: Badlands</h3>
                <div className="text-[10px] text-white/60 space-y-1">
                  <p>Action, Sci-Fi | 1 hr 30 mins | English</p>
                </div>
              </div>

              <div className="bg-[#1a1a1a] rounded p-2 mb-3">
                <div className="text-[10px] text-white/80 space-y-1">
                  <p className="font-semibold">Kampar putra</p>
                  <p>Nov 13 2025 • 1:30 PM</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3 text-[10px]">
                <div>
                  <p className="text-white/60 mb-1">Seat</p>
                  <div className="flex gap-1 flex-wrap">
                    {selectedSeats.map((seat) => (
                      <span key={seat} className="bg-[#1a1a1a] px-2 py-1 rounded text-white font-medium">
                        {seat}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-white/60 mb-1">Screen Hall</p>
                  <p className="text-white font-medium">2</p>
                </div>
                <div>
                  <p className="text-white/60 mb-1">Booking ID</p>
                  <p className="text-white font-medium">TXB0110084455</p>
                </div>
                <div>
                  <p className="text-white/60 mb-1">PAYMENT/PRICE</p>
                  <p className="text-white font-medium">RM {total.toFixed(2)}</p>
                </div>
              </div>

              <div className="bg-white p-3 rounded mb-3 flex justify-center">
                <svg width="200" height="60" viewBox="0 0 200 60">
                  {[5, 8, 12, 15, 20, 23, 28, 31, 35, 38, 43, 46, 50, 53, 58, 61, 66, 69, 73, 76, 81, 84, 88, 91, 95, 98, 103, 106, 110, 113, 118, 121, 125, 128, 133, 136, 140, 143, 148, 151, 155, 158, 163, 166, 170, 173, 178, 181, 185, 188, 193].map((x, i) => (
                    <rect key={i} x={x} y="5" width={i % 3 === 0 ? "3" : "2"} height="45" fill="black"/>
                  ))}
                </svg>
              </div>

              <button className="w-full bg-[#f5c118] text-black font-bold py-2 text-sm rounded hover:bg-[#f5c118]/90 transition">
                Download Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}