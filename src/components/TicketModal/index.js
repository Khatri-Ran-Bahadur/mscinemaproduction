"use client";

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import QRCode from 'qrcode';

export default function TicketModal({ ticketData, isOpen, onClose }) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

  // Extract booking and ticket details with fallbacks
  const bookingDetails = ticketData?.bookingDetails || {};
  const ticketList = ticketData?.ticketDetails || [];
  
  // Get reference number for QR code
  const referenceNo = bookingDetails.referenceNo || 'N/A';
  
  // Generate QR Code
  useEffect(() => {
    if (isOpen && referenceNo && referenceNo !== 'N/A') {
      QRCode.toDataURL(referenceNo, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      })
      .then(url => {
        setQrCodeDataUrl(url);
      })
      .catch(err => {
        console.error('Error generating QR code:', err);
      });
    }
  }, [isOpen, referenceNo]);

  if (!isOpen) return null;

  // Format date helper (Malaysian locale)
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-MY', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        timeZone: 'Asia/Kuala_Lumpur'
      });
    } catch {
      return dateStr;
    }
  };

  // Format time helper (Malaysian locale)
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    try {
      // If timeStr is a full date-time string, extract time part
      if (timeStr.includes('T') || timeStr.includes(' ')) {
        const date = new Date(timeStr);
        return date.toLocaleTimeString('en-MY', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: 'Asia/Kuala_Lumpur'
        });
      }
      // If it's just time string (HH:MM or HH:MM:SS)
      const [hours, minutes] = timeStr.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  // Group seats by ticket type
  const seatGroups = {};
  ticketList.forEach((ticket) => {
    const ticketType = ticket.ticketTypeName || 'Standard';
    const seatNo = ticket.seatNo || '';
    if (!seatGroups[ticketType]) {
      seatGroups[ticketType] = [];
    }
    if (seatNo) {
      seatGroups[ticketType].push(seatNo);
    }
  });

  const seatDisplay = Object.entries(seatGroups).map(([type, seats]) => ({
      type,
      seats: seats
  }));

  const totalPersons = ticketList.length || 0;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Modal Overlay */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      
      {/* Modal Content */}
      <div className="relative bg-[#2a2a2a] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto z-10 transition-all transform duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition z-20 bg-[#2a2a2a] rounded-full p-2 hover:bg-[#3a3a3a]"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Ticket Content */}
        <div className="bg-[#2a2a2a] rounded-lg overflow-hidden flex flex-col">
          
          {/* Header Section (Movie Info) - NO IMAGE as requested */}
          <div className="px-8 py-8 border-b border-dashed border-[#4a4a4a] text-center bg-[#222]">
            <h3 className="text-3xl font-bold text-[#FFCA20] mb-2 uppercase tracking-wide">
                {bookingDetails.movieName || 'Unknown Movie'}
            </h3>
            <p className="text-sm text-gray-400 font-medium">
               {bookingDetails.cinemaName || 'N/A'} • {bookingDetails.type || '2D'}
            </p>
          </div>

          {/* Ticket Body */}
          <div className="p-8 space-y-8">
              
              {/* Customer & Show Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                  {/* Customer Info */}
                  <div className="md:col-span-2 text-center pb-4 border-b border-[#3a3a3a]">
                      <p className="text-xl font-bold text-white mb-1">{bookingDetails.name || 'Guest'}</p>
                      <p className="text-sm text-gray-400">{bookingDetails.email}</p>
                      <p className="text-sm text-gray-400">{bookingDetails.mobileNo}</p>
                  </div>

                  {/* Show Date & Time */}
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Date</p>
                    <p className="text-white font-bold text-lg">{formatDate(bookingDetails.showDate)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Time</p>
                    <p className="text-white font-bold text-lg">{formatTime(bookingDetails.showTime || bookingDetails.time)}</p>
                  </div>
                  
                  {/* Reference & Booking ID */}
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Reference No</p>
                    <p className="text-[#FFCA20] font-mono font-bold text-lg tracking-wider">{referenceNo}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Booking ID</p>
                    <p className="text-white font-mono font-bold text-lg">{bookingDetails.bookingID || 'N/A'}</p>
                  </div>
              </div>

              {/* Seats Section */}
              <div className="bg-[#333] rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Seats</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {seatDisplay.length > 0 ? (
                      seatDisplay.map((group, idx) => (
                        <div key={idx} className="inline-flex items-center bg-[#222] px-3 py-1.5 rounded border border-[#444]">
                           <span className="text-gray-400 text-xs mr-2">{group.type}</span>
                           <span className="text-[#FFCA20] font-bold">{group.seats.join(', ')}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-gray-500">No seat information</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{totalPersons} Person(s)</p>
              </div>

               {/* Detailed Price Breakdown Table */}
               {ticketList.length > 0 && (
                   <div className="border-t border-[#3a3a3a] pt-6">
                       <h4 className="text-[#FFCA20] text-sm font-bold uppercase tracking-wider mb-3">Ticket Details</h4>
                       <div className="overflow-x-auto">
                           <table className="w-full text-xs">
                               <thead className="bg-[#222] border-b border-[#3a3a3a]">
                                   <tr>
                                       <th className="py-2 px-3 text-left text-gray-400 font-medium">Hall</th>
                                       <th className="py-2 px-3 text-left text-gray-400 font-medium">Seat</th>
                                       <th className="py-2 px-3 text-left text-gray-400 font-medium">Type</th>
                                       <th className="py-2 px-3 text-right text-gray-400 font-medium">Price</th>
                                       <th className="py-2 px-3 text-right text-gray-400 font-medium">Surcharge</th>
                                       <th className="py-2 px-3 text-right text-gray-400 font-medium">Total</th>
                                   </tr>
                               </thead>
                               <tbody className="divide-y divide-[#3a3a3a]">
                                   {(() => {
                                       let calcSubCharge = 0;
                                       let calcGrandTotal = 0;
                                       
                                       const rows = ticketList.map((t, index) => {
                                           // 1. Price Components
                                           const price = parseFloat(t.Price || t.price || t.TicketPrice || t.ticketPrice || 0);
                                           const eTax = parseFloat(t.entertainmentTax || t.EntertainmentTax || 0);
                                           const gTax = parseFloat(t.govtTax || t.GovtTax || 0);
                                           
                                           // 2. Charge Components
                                           const onlineCharge = parseFloat(t.onlineCharge || t.OnlineCharge || 0);
                                           const sur = parseFloat(t.Surcharge || t.surcharge || t.surCharge || 0);
                                           const ticketTotal = parseFloat(t.totalTicketPrice || t.TotalTicketPrice || 0);
                                           
                                           // 3. Display Logic
                                           // Price = Base + Entertainment Tax + Govt Tax
                                           const displayPrice = price + eTax + gTax;
                                           
                                           // Surcharge = Surcharge ONLY (exclude Online Charge)
                                           const displaySurcharge = sur;
                                           
                                           // Row Total = Ticket Total - Online Charge (or fallback)
                                           // Strictly separating Online Charge for the footer
                                           const rowTotal = ticketTotal ? (ticketTotal - onlineCharge) : (displayPrice + displaySurcharge);
                                           
                                           // Accumulate totals
                                           calcSubCharge += onlineCharge; 
                                           calcGrandTotal += ticketTotal || (rowTotal + onlineCharge);

                                           const type = t.ticketTypeName || t.TicketTypeName || t.TicketType || t.ticketType || t.Type || t.type || 'Adult';
                                           const seat = t.SeatNo || t.seatNo || t.Seat || t.seat || '';
                                           const hall = bookingDetails.hallName || 'Hall';

                                           return (
                                               <tr key={index} className="hover:bg-[#333]/50">
                                                   <td className="py-2 px-3 text-gray-300">{hall}</td>
                                                   <td className="py-2 px-3 text-[#FFCA20] font-bold">
                                                       {seat.replace(/[A-Za-z]+/, '').padStart(2, '0') ? seat : seat}
                                                   </td>
                                                   <td className="py-2 px-3 text-gray-300">{type}</td>
                                                   <td className="py-2 px-3 text-right text-gray-300">
                                                       RM{displayPrice.toFixed(2)}
                                                   </td>
                                                   <td className="py-2 px-3 text-right text-gray-300">
                                                       RM{displaySurcharge.toFixed(2)}
                                                   </td>
                                                   <td className="py-2 px-3 text-right font-bold text-white">
                                                       RM{rowTotal.toFixed(2)}
                                                   </td>
                                               </tr>
                                           );
                                       });

                                       return (
                                           <>
                                               {rows}
                                               {/* Sub Charge Row */}
                                               <tr className="bg-[#222] border-t border-[#4a4a4a]">
                                                   <td colSpan="5" className="py-3 px-3 text-right text-xs uppercase text-gray-400 font-medium">
                                                       Sub Charge
                                                   </td>
                                                   <td className="py-3 px-3 text-right font-bold text-white">
                                                       RM{calcSubCharge.toFixed(2)}
                                                   </td>
                                               </tr>
                                               {/* Grand Total Row */}
                                               <tr className="bg-[#222]">
                                                   <td colSpan="5" className="py-3 px-3 text-right text-sm uppercase text-[#FFCA20] font-bold">
                                                       Grand Total
                                                   </td>
                                                   <td className="py-3 px-3 text-right text-lg font-bold text-[#FFCA20]">
                                                       RM{calcGrandTotal.toFixed(2)}
                                                   </td>
                                               </tr>
                                           </>
                                       );
                                   })()}
                               </tbody>
                           </table>
                       </div>
                   </div>
               )}

              {/* QR Code */}
              <div className="flex flex-col items-center justify-center pt-4 border-t border-[#3a3a3a]">
                <div className="bg-white p-3 rounded-lg shadow-xl">
                  <img
                    src={qrCodeDataUrl || '/placeholder-qr.png'}
                    alt="QR Code"
                    className="w-40 h-40 object-contain" // Fixed size for consistency
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>
                <p className="text-gray-500 text-xs mt-3 uppercase tracking-widest">Scan to enter</p>
              </div>

          </div>
        </div>
      </div>
    </div>
  );
}
