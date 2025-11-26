"use client";

import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';

export default function MovieBooking() {
  const [selectedDate, setSelectedDate] = useState('11');
  const [selectedExperience, setSelectedExperience] = useState('IMAX');
  const [selectedTime, setSelectedTime] = useState(null);

  const dates = [
    { day: '11', date: 'Mon' },
    { day: '12', date: 'Tue' },
    { day: '13', date: 'Wed' },
    { day: '14', date: 'Thu' },
    { day: '15', date: 'Fri' },
    { day: '16', date: 'Sat' },
  ];

  const experiences = ['IMAX', '2D', '3D', 'ATMOS'];

  const showtimes = [
    { time: '10:45AM', format: 'IMAX', available: true },
    { time: '11:00AM', format: '3D', available: true },
    { time: '11:30AM', format: '3D', available: true },
    { time: '12:00PM', format: 'IMAX', available: true },
    { time: '12:15PM', format: 'IMAX', available: true },
    { time: '10:45AM', format: 'IMAX', available: true },
    { time: '11:00AM', format: '3D', available: true },
    { time: '11:30AM', format: 'Standard', available: true },
    { time: '12:15PM', format: 'Dolby Atmos', available: true },
    { time: '1:00PM', format: 'VIP', available: true },
    { time: '10:45AM', format: 'IMAX', available: true },
    { time: '10:45AM', format: 'IMAX', available: true },
    { time: '11:30PM', format: 'Standard', available: true },
    { time: '3:15PM', format: 'Dolby', available: true },
    { time: '5:50PM', format: 'Screenx', available: true },
    { time: '8:30PM', format: '4DX', available: true },
    { time: '10:45AM', format: 'IMAX', available: true },
  ];

  return (
    <div className="min-h-screen bg-[#1c1c1c] text-white pb-10">
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
            <span className="hover:text-white cursor-pointer">Select Seat</span>
            <span>›</span>
            <span className="text-white">Payment</span>
          </div>
        </div>

        {/* Hero Image */}
        <div className="relative h-64 overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1635805737707-575885ab0820?w=1200&h=400&fit=crop" 
            alt="Predator Badlands"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#1c1c1c]/50 to-[#1c1c1c]" />
          
          {/* Movie Info */}
          <div className="absolute bottom-6 left-8">
            <h1 className="text-4xl font-bold mb-1">Predator: Badlands</h1>
            <div className="flex items-center gap-3 text-xs text-white/70 mb-3">
              <span>Action, Sci-Fi</span>
              <span>|</span>
              <span>1 hr 30 mins</span>
              <span>|</span>
              <span>English</span>
            </div>
            <div className="flex gap-2">
              <button className="px-5 py-1.5 bg-transparent border border-white/30 text-white text-xs rounded hover:bg-white/5 transition">
                Watch Trailer
              </button>
              <button className="px-5 py-1.5 bg-[#f5c118] text-black font-medium text-xs rounded hover:bg-[#f5c118]/90 transition">
                Movie Info
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 mt-6">
        {/* Select Date */}
        <div className="mb-6">
          <h2 className="text-xs font-medium mb-3 text-white/60 uppercase tracking-wide">Select Date</h2>
          <div className="flex gap-2">
            {dates.map((date) => (
              <button
                key={date.day}
                onClick={() => setSelectedDate(date.day)}
                className={`w-14 h-14 rounded flex flex-col items-center justify-center transition text-sm ${
                  selectedDate === date.day
                    ? 'bg-[#f5c118] text-black'
                    : 'bg-[#2a2a2a] text-white hover:bg-[#333333]'
                }`}
              >
                <span className="text-xl font-semibold">{date.day}</span>
                <span className="text-[10px] mt-0.5">{date.date}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Select Experience */}
        <div className="mb-6">
          <h2 className="text-xs font-medium mb-3 text-white/60 uppercase tracking-wide">Select Experience</h2>
          <div className="flex gap-2">
            {experiences.map((exp) => (
              <button
                key={exp}
                onClick={() => setSelectedExperience(exp)}
                className={`px-6 py-1.5 rounded text-sm transition ${
                  selectedExperience === exp
                    ? 'bg-[#f5c118] text-black font-semibold'
                    : 'bg-[#2a2a2a] text-white hover:bg-[#333333]'
                }`}
              >
                {exp}
              </button>
            ))}
          </div>
        </div>

        {/* Select Cinema & Time */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-medium text-white/60 uppercase tracking-wide">Select Cinema & Time</h2>
            <div className="flex gap-5 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-sm"></div>
                <span className="text-white/60">Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-yellow-500 rounded-sm"></div>
                <span className="text-white/60">Selling fast</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-red-500 rounded-sm"></div>
                <span className="text-white/60">Sold out</span>
              </div>
            </div>
          </div>

          {/* Cinema Location */}
          <div className="bg-[#2a2a2a] rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-white/70">
                Kampar, Perak - Kampar Putra Behind Terminal
              </span>
            </div>

            {/* Showtimes Grid */}
            <div className="grid grid-cols-6 gap-2">
              {showtimes.map((show, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedTime(idx)}
                  className={`p-2.5 rounded border transition ${
                    selectedTime === idx
                      ? 'bg-[#f5c118] border-[#f5c118] text-black'
                      : 'bg-[#1c1c1c] border-[#3a3a3a] text-white hover:border-[#4a4a4a] hover:bg-[#252525]'
                  }`}
                >
                  <div className="text-xs font-semibold">{show.time}</div>
                  <div className="text-[10px] mt-1 opacity-70">{show.format}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}