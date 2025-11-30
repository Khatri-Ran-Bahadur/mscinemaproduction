"use client";

import React, { useState } from 'react';
import { ChevronLeft, MapPin, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TicketSelection() {
  const router = useRouter();
  const [tickets, setTickets] = useState({
    adult: 0,
    student: 0,
    child: 0,
    disabled: 0,
    children: 0,
    handicap: 0
  });

  const ticketTypes = [
    { id: 'adult', name: 'Adult', price: 'RM 13.00', age: '' },
    { id: 'student', name: 'Student (Citizen)', age: 'for youth (13-17) and over 60', price: 'RM 12.00' },
    { id: 'child', name: 'Child / Senior', age: '', price: 'RM 10.00' },
    { id: 'disabled', name: 'Disabled', age: '', price: 'RM 13.00' },
    { id: 'children', name: 'Children', age: '', price: 'RM 13.00' },
    { id: 'handicap', name: 'Handicap (OKU)', age: '', price: 'RM 9.00' }
  ];

  const increment = (type) => {
    setTickets(prev => ({ ...prev, [type]: prev[type] + 1 }));
  };

  const decrement = (type) => {
    setTickets(prev => ({ ...prev, [type]: Math.max(0, prev[type] - 1) }));
  };

  const handleGoBack = () => {
    router.back();
  };

  const totalTickets = Object.values(tickets).reduce((sum, count) => sum + count, 0);

  return (
    <div className="min-h-screen bg-[#1c1c1c] text-white pb-10">
      {/* Header */}
      <div className="relative">
        <div className="absolute top-5 left-5 z-10">
          <button className="flex items-center gap-2 text-white/70 hover:text-white text-sm" onClick={handleGoBack}>
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>

        {/* Breadcrumb */}
        <div className="absolute top-5 right-5 z-10">
          <div className="flex items-center gap-2 text-xs text-white/50">
            <span className="hover:text-white cursor-pointer">Select Cinema</span>
            <span>›</span>
            <span className="text-white">Your Seat</span>
            <span>›</span>
            <span className="hover:text-white cursor-pointer">Select Seat</span>
            <span>›</span>
            <span className="hover:text-white cursor-pointer">Payment</span>
          </div>
        </div>

        {/* Hero Image */}
        <div className="relative h-56 overflow-hidden">
          <img 
            src="img/banner.jpg" 
            alt="Predator Badlands"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-[#1c1c1c]/70 to-[#1c1c1c]" />
          
          {/* Movie Info */}
          <div className="absolute bottom-5 left-8">
            <h1 className="text-3xl font-bold mb-1.5">Predator: Badlands</h1>
            <div className="flex items-center gap-3 text-xs text-white/70 mb-3">
              <span>Action, Sci-Fi</span>
              <span>|</span>
              <span>1 hr 30 mins</span>
              <span>|</span>
              <span>English</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-white/80">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>Kampar, Putra</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded">
                <span className="font-medium">IMAX</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>13 Nov 2025 | 08 PM</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-8 mt-6">
        {/* Ticket Selection */}
        <div className="mb-6">
          <h2 className="text-sm font-medium mb-4 text-white">Ticket selection</h2>
          
          {/* Table Header */}
          <div className="bg-[#2a2a2a] rounded-t-lg p-4 grid grid-cols-3 text-xs text-white/60 font-medium">
            <div>Ticket type</div>
            <div className="text-center">Price</div>
            <div className="text-center">Amount</div>
          </div>

          {/* Ticket Rows */}
          <div className="bg-[#232323] rounded-b-lg">
            {ticketTypes.map((ticket, idx) => (
              <div 
                key={ticket.id}
                className={`p-4 grid grid-cols-3 items-center ${
                  idx !== ticketTypes.length - 1 ? 'border-b border-white/5' : ''
                }`}
              >
                <div>
                  <div className="text-sm text-white font-medium">{ticket.name}</div>
                  {ticket.age && (
                    <div className="text-xs text-white/50 mt-0.5">{ticket.age}</div>
                  )}
                </div>
                <div className="text-center text-sm text-white/90">{ticket.price}</div>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => decrement(ticket.id)}
                    className="w-6 h-6 rounded border border-white/20 flex items-center justify-center hover:bg-white/5 transition text-white/70"
                  >
                    −
                  </button>
                  <span className="text-sm w-6 text-center text-white">{tickets[ticket.id]}</span>
                  <button
                    onClick={() => increment(ticket.id)}
                    className="w-6 h-6 rounded border border-white/20 flex items-center justify-center hover:bg-white/5 transition text-white/70"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Info Text */}
          <div className="mt-4 text-xs text-white/50">
            <p>*Maximum 8 tickets per transaction.</p>
            <p className="mt-1">*Ticket sales are subject to availability and cinema capacity.</p>
          </div>
        </div>

        {/* Continue Button */}
        <div className="flex justify-center mt-8">
          <button 
            className={`px-8 py-2.5 rounded font-medium text-sm transition ${
              totalTickets > 0 
                ? 'bg-[#f5c118] text-black hover:bg-[#f5c118]/90' 
                : 'bg-[#f5c118]/30 text-black/50 cursor-not-allowed'
            }`}
            disabled={totalTickets === 0}
            onClick={()=>{
              router.push('/seat-selection')
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}