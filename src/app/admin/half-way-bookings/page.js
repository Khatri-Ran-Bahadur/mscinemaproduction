"use client";

import React, { useState, useEffect } from 'react';
import { 
    Search, 
    Filter, 
    ChevronLeft,
    ChevronRight,
    Clock,
    AlertCircle,
    CheckCircle,
    XCircle,
    Unlock,
    CreditCard,
    Calendar,
    Film,
    Armchair,
    MoreHorizontal
} from 'lucide-react';
import { booking } from '@/services/api';
import TicketModal from '@/components/TicketModal';
import { timeAgo } from '@/utils/timeAgo';

export default function HalfWayBookingsPage() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDate, setFilterDate] = useState(''); // YYYY-MM-DD
    
    // Config
    const [minutes1, setMinutes1] = useState(2);
    const [minutes2, setMinutes2] = useState(15);
    
    // Pagination
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    
    // Selection
    const [selectedIds, setSelectedIds] = useState([]);
    
    // Enriched Details Cache
    const [enrichedDetails, setEnrichedDetails] = useState({}); // { refNo: { movie, time, seats, count } }

    useEffect(() => {
        const interval = setInterval(() => {
            fetchBookings(false); // Silent refresh
        }, 30000); 
        return () => clearInterval(interval);
    }, [minutes1, minutes2]);

    useEffect(() => {
        fetchBookings();
    }, [minutes1, minutes2]);

    const fetchBookings = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const data = await booking.getHalfWayBookings(minutes1, minutes2);
            if (Array.isArray(data)) {
                // Sort by date desc (newest first)
                // Format: "dd-MM-yyyy HH:mm:ss"
                const sorted = data.sort((a, b) => {
                   return parseDate(b.bookingDateTime) - parseDate(a.bookingDateTime);
                });
                setBookings(sorted);
            } else {
                setBookings([]);
            }
        } catch (error) {
            console.error('Failed to fetch half way bookings:', error);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    // Helper to parse "dd-MM-yyyy HH:mm:ss"
    const parseDate = (dateStr) => {
        if (!dateStr) return 0;
        const [datePart, timePart] = dateStr.split(' ');
        const [d, m, y] = datePart.split('-');
        return new Date(`${y}-${m}-${d}T${timePart}`);
    };

    // Filter Logic
    const filteredBookings = bookings.filter(b => {
        const matchesSearch = 
            b.referenceNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.mobileNo?.includes(searchQuery);
        
        let matchesDate = true;
        if (filterDate) {
            // b.bookingDateTime is "dd-MM-yyyy HH:mm:ss"
            // filterDate is "YYYY-MM-DD"
             const [bDatePart] = b.bookingDateTime.split(' '); // "dd-MM-yyyy"
             const [d, m, y] = bDatePart.split('-');
             const isoDate = `${y}-${m}-${d}`;
             matchesDate = isoDate === filterDate;
        }

        return matchesSearch && matchesDate;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredBookings.length / limit);
    const paginatedBookings = filteredBookings.slice((page - 1) * limit, page * limit);

    // Fetch Details for Visible Page
    useEffect(() => {
        // Fetch details for items on current page that don't have details yet
        const fetchDetails = async () => {
            for (const b of paginatedBookings) {
                if (!enrichedDetails[b.referenceNo]) {
                    try {
                        const data = await booking.getTickets(b.cinemaID, b.showID, b.referenceNo);
                        const details = {
                            movieName: data?.bookingDetails?.movieName || data?.bookingDetails?.MovieName || '-',
                            showTime: data?.bookingDetails?.showTime || '-',
                            seatCount: data?.ticketDetails?.length || 0,
                            seats: data?.ticketDetails?.map(t => t.SeatNo || t.Seat).join(', ') || ''
                        };
                        setEnrichedDetails(prev => ({ ...prev, [b.referenceNo]: details }));
                    } catch (e) {
                         // Ignore error, maybe incomplete booking
                    }
                }
            }
        };
        
        if (paginatedBookings.length > 0) {
            fetchDetails();
        }
    }, [paginatedBookings]); // Depend on paginated list changes

    // Selection Handlers
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(paginatedBookings.map(b => b.referenceNo)); // Select current page only? Or all? Usually current page for safety.
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (refNo) => {
        if (selectedIds.includes(refNo)) {
            setSelectedIds(selectedIds.filter(id => id !== refNo));
        } else {
            setSelectedIds([...selectedIds, refNo]);
        }
    };

    // Bulk Actions
    // Bulk Actions
    const performBulkAction = async (actionType) => { // actionType is 'RELEASE'
        if (!confirm(`Are you sure you want to release ${selectedIds.length} selected bookings?`)) return;

        const selectedItems = bookings.filter(b => selectedIds.includes(b.referenceNo));
        let successCount = 0;
        
        for (const item of selectedItems) {
            try {
                if (item.status === 0) {
                     await booking.releaseLockedSeats(item.cinemaID, item.showID, item.referenceNo);
                     successCount++;
                } else if (item.status === 1) {
                     await booking.releaseConfirmLockedSeats(item.cinemaID, item.showID, item.referenceNo);
                     successCount++;
                }
            } catch (e) {
                console.error(`Failed to release ${item.referenceNo}`, e);
            }
        }
        
        alert(`Action completed. Successfully released ${successCount} items.`);
        setSelectedIds([]);
        fetchBookings();
    };

    // Status helpers
    const getStatusBadge = (status) => {
         if (status === 1) return <span className="bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">Confirmed (1)</span>;
         return <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">Locked (0)</span>;
    };

    const [showModal, setShowModal] = useState(false);
    const [selectedTicketData, setSelectedTicketData] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const handleViewDetails = async (b) => {
        setLoadingDetails(true);
        try {
            const data = await booking.getTickets(b.cinemaID, b.showID, b.referenceNo);
            if (data) {
                // Manually inject missing booking ID or other details if API doesn't return them for halfway bookings
                if (!data.bookingDetails) data.bookingDetails = {};
                data.bookingDetails.bookingID = b.bookingID || '-';
                data.bookingDetails.referenceNo = b.referenceNo;
                
                setSelectedTicketData(data);
                setShowModal(true);
            }
        } catch (e) {
            console.error(e);
            alert('Failed to load details');
        } finally {
            setLoadingDetails(false);
        }
    };

    return (
        <div className="p-8 relative min-h-screen pb-24">
            {/* Header */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#FFCA20] mb-2">Half Way Bookings</h1>
                    <p className="text-[#888]">Manage stuck or incomplete bookings</p>
                </div>
                
                <div className="flex flex-wrap gap-3 items-end">
                    {/* Config */}
                    <div className="flex bg-[#222] p-2 rounded-lg gap-2 border border-[#333]">
                        <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-[#666] uppercase font-bold">Lock Mins</label>
                            <input 
                                type="number" min="1" value={minutes1} onChange={(e) => setMinutes1(Number(e.target.value))}
                                className="bg-[#111] border border-[#333] text-white px-2 py-1 rounded text-xs w-12 text-center focus:border-[#FFCA20] outline-none"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-[#666] uppercase font-bold">Pay Mins</label>
                            <input 
                                type="number" min="1" value={minutes2} onChange={(e) => setMinutes2(Number(e.target.value))}
                                className="bg-[#111] border border-[#333] text-white px-2 py-1 rounded text-xs w-12 text-center focus:border-[#FFCA20] outline-none"
                            />
                        </div>
                    </div>

                    {/* Date Filter */}
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#666]" />
                        <input 
                            type="date" 
                            className="bg-[#2a2a2a] border border-[#3a3a3a] text-white pl-10 pr-4 py-2 rounded-lg focus:border-[#FFCA20] outline-none h-[42px]"
                            value={filterDate}
                            onChange={(e) => {
                                setFilterDate(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#666]" />
                        <input 
                            type="text" 
                            placeholder="Search..." 
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                            className="bg-[#2a2a2a] border border-[#3a3a3a] text-white pl-10 pr-4 py-2 rounded-lg focus:border-[#FFCA20] outline-none w-56 h-[42px]"
                        />
                    </div>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-[#FFCA20] text-black px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-4 animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <span className="font-bold border-r border-black/20 pr-4">{selectedIds.length} Selected</span>
                    <button onClick={() => performBulkAction('RELEASE')} className="hover:bg-black/10 px-3 py-1 rounded text-sm font-semibold flex items-center gap-1">
                        <Unlock className="w-3 h-3" /> Release Seats
                    </button>
                    <button onClick={() => setSelectedIds([])} className="ml-2 bg-black/80 text-white p-1 rounded-full hover:bg-black">
                        <XCircle className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Table */}
            <div className="bg-[#2a2a2a] rounded-xl border border-[#3a3a3a] overflow-hidden flex flex-col">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left">
                        <thead className="bg-[#222] border-b border-[#3a3a3a]">
                            <tr>
                                <th className="p-4 w-10">
                                    <input type="checkbox" onChange={handleSelectAll} checked={paginatedBookings.length > 0 && selectedIds.length === paginatedBookings.length} className="rounded bg-[#333] border-[#444] text-[#FFCA20] focus:ring-0" />
                                </th>
                                <th className="p-4 text-[#888] font-medium text-xs uppercase tracking-wider">Ref No / Date</th>
                                <th className="p-4 text-[#888] font-medium text-xs uppercase tracking-wider">Time Ago</th>
                                <th className="p-4 text-[#888] font-medium text-xs uppercase tracking-wider">Customer</th>
                               
                                <th className="p-4 text-[#888] font-medium text-xs uppercase tracking-wider">Amount</th>
                                <th className="p-4 text-[#888] font-medium text-xs uppercase tracking-wider">Status</th>
                                <th className="p-4 text-[#888] font-medium text-xs uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#3a3a3a]">
                            {loading ? (
                                <tr><td colSpan="8" className="p-12 text-center text-[#666]">Loading bookings...</td></tr>
                            ) : paginatedBookings.length === 0 ? (
                                <tr><td colSpan="8" className="p-12 text-center text-[#666]">No bookings found.</td></tr>
                            ) : (
                                paginatedBookings.map((b) => {
                                    const details = enrichedDetails[b.referenceNo] || {};
                                    return (
                                        <tr key={b.bookingID} className={`hover:bg-[#333] transition ${selectedIds.includes(b.referenceNo) ? 'bg-[#333]/80' : ''}`}>
                                            <td className="p-4">
                                                <input type="checkbox" checked={selectedIds.includes(b.referenceNo)} onChange={() => handleSelectOne(b.referenceNo)} className="rounded bg-[#333] border-[#444] text-[#FFCA20] focus:ring-0" />
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="font-mono text-[#FFCA20] font-bold text-sm">{b.referenceNo}</span>
                                                    <span className="text-[10px] text-[#888] flex items-center gap-1 mt-1">
                                                        <Clock className="w-3 h-3" /> {b.bookingDateTime}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-xs font-mono text-gray-400 bg-[#333] px-2 py-1 rounded">
                                                    {timeAgo(b.bookingDateTime)}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    {b.name ? (
                                                        <>
                                                            <span className="text-white text-sm font-medium">{b.name}</span>
                                                            <span className="text-[10px] text-[#888]">{b.email}</span>
                                                        </>
                                                    ) : <span className="text-[#666] italic text-xs">Guest</span>}
                                                </div>
                                            </td>
                                            
                                            
                                            <td className="p-4">
                                                <span className="text-white font-bold text-sm">RM {b.amount}</span>
                                            </td>
                                            <td className="p-4">
                                                {getStatusBadge(b.status)}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-1 items-center">
                                                    <button onClick={() => { 
                                                        const isLocked = b.status === 0;
                                                        const actionName = isLocked ? 'Release Locked Seat?' : 'Release Confirm Locked?';
                                                        if(confirm(actionName)) {
                                                            const promise = isLocked 
                                                                ? booking.releaseLockedSeats(b.cinemaID, b.showID, b.referenceNo)
                                                                : booking.releaseConfirmLockedSeats(b.cinemaID, b.showID, b.referenceNo);
                                                            
                                                            promise.then(() => { fetchBookings(); alert('Released'); });
                                                        }
                                                    }} className="p-1.5 bg-red-500/10 text-red-500 rounded hover:bg-red-500 hover:text-white transition" title="Release Seat">
                                                        <Unlock className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="p-4 border-t border-[#3a3a3a] bg-[#222] flex items-center justify-between">
                    <span className="text-xs text-[#888]">
                        Showing {Math.min((page - 1) * limit + 1, filteredBookings.length)} to {Math.min(page * limit, filteredBookings.length)} of {filteredBookings.length} records
                    </span>
                    <div className="flex gap-2 items-center">
                        <div className="flex items-center gap-2 mr-4">
                            <span className="text-xs text-[#888]">Rows per page:</span>
                            <select
                                value={limit}
                                onChange={(e) => {
                                    setLimit(Number(e.target.value));
                                    setPage(1);
                                }}
                                className="bg-[#333] border border-[#444] text-white text-xs rounded px-2 py-1 focus:border-[#FFCA20] outline-none cursor-pointer"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                        <div className="flex gap-2">
                         <button 
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="p-2 bg-[#333] text-white rounded disabled:opacity-50 hover:bg-[#444] transition"
                         >
                            <ChevronLeft className="w-4 h-4" />
                         </button>
                            <div className="flex items-center gap-1">
                                {(() => {
                                    // Logic to show max 5 page numbers centered around current page
                                    let startPage = Math.max(1, page - 2);
                                    let endPage = Math.min(totalPages, startPage + 4);
                                    
                                    // Adjust start if close to end
                                    if (endPage - startPage < 4) {
                                        startPage = Math.max(1, endPage - 4);
                                    }

                                    const pages = [];
                                    for (let i = startPage; i <= endPage; i++) {
                                        pages.push(i);
                                    }
                                    return pages.map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setPage(p)}
                                            className={`w-8 h-8 rounded text-xs font-medium transition ${
                                                p === page 
                                                    ? 'bg-[#FFCA20] text-black font-bold' 
                                                    : 'bg-[#333] text-white hover:bg-[#444]'
                                            }`}
                                        >
                                            {p}
                                        </button>
                                    ));
                                })()}
                            </div>
                         <button 
                            disabled={page === totalPages || totalPages === 0}
                            onClick={() => setPage(p => p + 1)}
                            className="p-2 bg-[#333] text-white rounded disabled:opacity-50 hover:bg-[#444] transition"
                         >
                            <ChevronRight className="w-4 h-4" />
                         </button>
                    </div>
                </div>
            </div>
            </div>

            {/* Ticket Modal */}
            {selectedTicketData && (
                <TicketModal 
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    ticketData={selectedTicketData}
                />
            )}
        </div>
    );
}
