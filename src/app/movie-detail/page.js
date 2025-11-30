"use client";

import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';

export default function MovieBooking() {
  const [selectedDate, setSelectedDate] = useState('11');
  const [selectedExperience, setSelectedExperience] = useState('IMAX');
  const [selectedTime, setSelectedTime] = useState(null);

  const dates = [
    { day: '11', date: 'Mon', month: 'NOV' },
    { day: '12', date: 'Tue', month: 'NOV' },
    { day: '13', date: 'Wed', month: 'NOV' },
    { day: '14', date: 'Thu', month: 'NOV' },
    { day: '15', date: 'Fri', month: 'NOV' },
    { day: '16', date: 'Sat', month: 'NOV' },
  ];

  const experiences = ['IMAX', '2D', '3D', 'ATMOS'];

  const showtimes = [
    { time: '10:45AM', format: 'IMAX' },
    { time: '12:00PM', format: '3D' },
    { time: '3:30PM', format: 'IMAX' },
    { time: '12:15PM', format: '3D' },
    { time: '1:00PM', format: 'IMAX' },
    { time: '3:45PM', format: 'IMAX' },
    { time: '10:45AM', format: 'IMAX' },
    { time: '11:00AM', format: '3D' },
    { time: '3:30PM', format: 'Standard' },
    { time: '12:15PM', format: 'Dolby Atmos' },
    { time: '1:00PM', format: 'VIP' },
    { time: '3:45PM', format: 'IMAX' },
    { time: '10:45AM', format: 'IMAX' },
    { time: '11:00AM', format: '3D' },
    { time: '3:15PM', format: 'Screenx' },
    { time: '6:15PM', format: 'Dolby' },
    { time: '8:00PM', format: '2DX' },
    { time: '9:45PM', format: 'IMAX' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="relative">
        <div className="absolute top-4 left-6 z-10">
          <button className="flex items-center gap-1 text-white/80 hover:text-white text-sm">
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>

        {/* Breadcrumb */}
        <div className="absolute top-4 right-6 z-10">
          <div className="flex items-center gap-2 text-xs text-white/50">
            <span className="hover:text-white cursor-pointer">Select Cinema</span>
            <span>›</span>
            <span className="hover:text-white cursor-pointer">Select type</span>
            <span>›</span>
            <span className="hover:text-white cursor-pointer">Select Seat</span>
            <span>›</span>
            <span className="text-white">Payment</span>
          </div>
        </div>

        {/* Hero Image */}
        <div className="relative h-72 overflow-hidden">
          <img 
            src="img/banner.jpg" 
            alt="Predator Badlands"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-[#0a0a0a]/60 to-[#0a0a0a]" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
          
          {/* Movie Info */}
          <div className="absolute bottom-8 left-8">
            <h1 className="text-5xl font-bold mb-2">Predator: Badlands</h1>
            <div className="flex items-center gap-3 text-sm text-white/70 mb-4">
              <span>Action, Sci-Fi</span>
              <span>|</span>
              <span>1 hr 30 mins</span>
              <span>|</span>
              <span>English</span>
            </div>
            <div className="flex gap-3">
              <button className="px-6 py-2 bg-transparent border border-white/40 text-white text-sm rounded hover:bg-white/10 transition">
                Watch Trailer
              </button>
              <button className="px-6 py-2 bg-yellow-500 text-black font-semibold text-sm rounded hover:bg-yellow-400 transition">
                Movie Info
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 mt-8">
        {/* Select Date */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold mb-4 text-white/90">Select Date</h2>
          <div className="flex gap-3">
            {dates.map((date) => (
              <button
                key={date.day}
                onClick={() => setSelectedDate(date.day)}
                className={`w-16 h-20 rounded-lg flex flex-col items-center justify-center transition ${
                  selectedDate === date.day
                    ? 'bg-yellow-500 text-black'
                    : 'bg-[#1a1a1a] text-white hover:bg-[#252525] border border-[#2a2a2a]'
                }`}
              >
                <span className="text-2xl font-bold">{date.day}</span>
                <span className="text-xs mt-1">{date.date}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Select Experience */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold mb-4 text-white/90">Select Experience</h2>
          <div className="flex gap-3">
            {experiences.map((exp) => (
              <button
                key={exp}
                onClick={() => setSelectedExperience(exp)}
                className={`px-8 py-2.5 rounded-lg text-sm font-medium transition ${
                  selectedExperience === exp
                    ? 'bg-yellow-500 text-black'
                    : 'bg-[#1a1a1a] text-white hover:bg-[#252525] border border-[#2a2a2a]'
                }`}
              >
                {exp}
              </button>
            ))}
          </div>
        </div>

        {/* Select Cinema & Time */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white/90">Select cinema & Time</h2>
            <div className="flex gap-6 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-white/60">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span className="text-white/60">Selling fast</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span className="text-white/60">Sold out</span>
              </div>
            </div>
          </div>

          {/* Cinema Location Card */}
          <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#2a2a2a]">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
              <span className="text-sm text-white/70">
                Kampar, Perak - Kampar Putra Behind Terminal
              </span>
            </div>

            {/* Showtimes Grid */}
            <div className="grid grid-cols-6 gap-3">
              {showtimes.map((show, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedTime(idx)}
                  className={`p-3 rounded-lg border transition ${
                    selectedTime === idx
                      ? 'bg-yellow-500 border-yellow-500 text-black'
                      : 'bg-[#0a0a0a] border-[#2a2a2a] text-white hover:border-[#3a3a3a] hover:bg-[#151515]'
                  }`}
                >
                  <div className="text-sm font-semibold">{show.time}</div>
                  <div className="text-xs mt-1 opacity-70">{show.format}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}