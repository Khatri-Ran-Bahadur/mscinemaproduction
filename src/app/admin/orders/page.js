"use client";

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
    Search, 
    Filter, 
    ChevronDown, 
    ChevronLeft,
    ChevronRight,
    MoreVertical, 
    Calendar,
    CreditCard,
    Film,
    User,
    CheckCircle,
    XCircle,
    Clock,
    Eye
} from 'lucide-react';
import TicketModal from '@/components/TicketModal';
import OrderDetailsModal from '@/components/admin/OrderDetailsModal';
import { booking } from '@/services/api';

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [dateFilter, setDateFilter] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [ticketData, setTicketData] = useState(null);
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [viewOrder, setViewOrder] = useState(null);
    const [showViewOrderModal, setShowViewOrderModal] = useState(false);
    
    // Pagination State
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalOrders, setTotalOrders] = useState(0);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchOrders();
        }, 300); // Debounce search
        return () => clearTimeout(timeoutId);
    }, [page, limit, searchQuery, filterStatus, dateFilter]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                search: searchQuery,
                status: filterStatus,
                date: dateFilter
            });
            
            const res = await fetch(`/api/admin/orders?${params.toString()}`);
            const data = await res.json();
            if (data.success) {
                setOrders(data.orders);
                if (data.pagination) {
                    setTotalPages(data.pagination.totalPages);
                    setTotalOrders(data.pagination.total);
                }
            } else {
                setOrders([]);
            }
        } catch (error) {
            console.error('Failed to fetch orders:', error);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setPage(1); // Reset to page 1 on search
    };

    const handleStatusChange = (e) => {
        setFilterStatus(e.target.value);
        setPage(1); // Reset to page 1 on filter change
    };

    const handleDateChange = (e) => {
        setDateFilter(e.target.value);
        setPage(1);
    };

    const handleOpenViewModal = (order) => {
        setViewOrder(order);
        setShowViewOrderModal(true);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            return new Date(dateString).toLocaleString('en-US', {
                timeZone: 'Asia/Kuala_Lumpur',
                dateStyle: 'medium',
                timeStyle: 'short'
            });
        } catch (e) {
            return dateString;
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toUpperCase()) {
            case 'CONFIRMED': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'PENDING': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'CANCELLED': return 'bg-red-500/10 text-red-500 border-red-500/20';
            default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    const getPaymentStatusColor = (status) => {
        switch (status?.toUpperCase()) {
            case 'PAID': return 'text-green-400';
            case 'PENDING': return 'text-yellow-400';
            case 'FAILED': return 'text-red-400';
            default: return 'text-gray-400';
        }
    };

    const parseSeats = (seatsData) => {
        try {
            // If it's a JSON string array e.g. "[\"A1\",\"A2\"]"
            const parsed = JSON.parse(seatsData);
            if (Array.isArray(parsed)) return parsed.join(', ');
            return seatsData;
        } catch (e) {
            return seatsData;
        }
    };

    const handleViewTicket = async (order) => {
        setSelectedOrder(order);
        // Call GetTickets API first
        if (order.cinemaId && order.showId && order.referenceNo) {
             try {
                 const fetchedData = await booking.getTickets(order.cinemaId, order.showId, order.referenceNo);
                 if (fetchedData) {
                     setTicketData(fetchedData);
                     setShowTicketModal(true);
                 } else {
                     alert("Could not fetch details from GetTickets API");
                 }
             } catch (e) {
                 console.error("Error fetching tickets:", e);
                 alert("Error fetching ticket details");
             }
        } else {
            // Fallback if we don't have cinemaId/showId (old orders perhaps)
            // But user wants standardize GetTickets call. 
            // If missing, maybe alert or try best effort. 
            // For now, if missing ID, we can't call GetTickets accurately.
            alert("This order is missing CinemaID/ShowID to fetch details.");
        }
    };

    return (
        <div className="p-8 relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#FFCA20] mb-2">Booking Orders</h1>
                    <p className="text-[#888]">Manage and view all customer ticket bookings</p>
                </div>
                
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#666]" />
                        <input 
                            type="text" 
                            placeholder="Search orders..." 
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="bg-[#2a2a2a] border border-[#3a3a3a] text-white pl-10 pr-4 py-2 rounded-lg focus:border-[#FFCA20] outline-none w-64"
                        />
                    </div>
                    <div className="relative">
                        <input 
                            type="date" 
                            value={dateFilter}
                            onChange={handleDateChange}
                            className="bg-[#2a2a2a] border border-[#3a3a3a] text-white pl-4 pr-4 py-2 rounded-lg focus:border-[#FFCA20] outline-none appearance-none cursor-pointer [color-scheme:dark]"
                        />
                    </div>
                    <div className="relative">
                        <select 
                            value={filterStatus}
                            onChange={handleStatusChange}
                            className="bg-[#2a2a2a] border border-[#3a3a3a] text-white pl-4 pr-10 py-2 rounded-lg focus:border-[#FFCA20] outline-none appearance-none cursor-pointer"
                        >
                            <option value="All">All Status</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="PENDING">Pending</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                        <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#666] pointer-events-none" />
                    </div>
                </div>
            </div>

            {loading && orders.length === 0 ? (
                <div className="text-center py-20 text-[#888]">Loading orders...</div>
            ) : (
                <div className="bg-[#2a2a2a] rounded-xl border border-[#3a3a3a] overflow-hidden flex flex-col">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#222] border-b border-[#3a3a3a]">
                                <tr>
                                    <th className="p-4 text-[#888] font-medium text-sm w-[200px]">Ticket / Payment Ref</th>
                                    <th className="p-4 text-[#888] font-medium text-sm hidden md:table-cell">Customer</th>
                                    <th className="p-4 text-[#888] font-medium text-sm hidden sm:table-cell">Movie Details</th>
                                    <th className="p-4 text-[#888] font-medium text-sm hidden lg:table-cell">Details</th>
                                    <th className="p-4 text-[#888] font-medium text-sm hidden sm:table-cell">Amount</th>
                                    <th className="p-4 text-[#888] font-medium text-sm">Status</th>
                                    <th className="p-4 text-[#888] font-medium text-sm hidden xl:table-cell">Date</th>
                                    <th className="p-4 text-[#888] font-medium text-sm text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#3a3a3a]">
                                {orders.length > 0 ? (
                                    orders.map((order) => (
                                        <tr key={order.id} className="hover:bg-[#333] transition">
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="font-mono text-[#FFCA20] font-bold">{order.referenceNo}</span>
                                                    <span className="text-xs text-[#888] font-mono mt-1" title="Payment Order ID">
                                                        {order.orderId || '-'}
                                                    </span>
                                                    {order.transactionNo && (
                                                        <span className="text-xs text-[#666] font-mono" title="Transaction ID">
                                                            Tx: {order.transactionNo}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 hidden md:table-cell">
                                                <div className="flex flex-col">
                                                    <span className="text-white font-medium">{order.customerName || 'Guest'}</span>
                                                    <span className="text-xs text-[#888]">{order.customerEmail}</span>
                                                    <span className="text-xs text-[#888]">{order.customerPhone}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 hidden sm:table-cell">
                                                <div className="flex flex-col">
                                                    <span className="text-white flex items-center gap-1">
                                                        <Film className="w-3 h-3 text-[#FFCA20]" />
                                                        {order.movieTitle}
                                                    </span>
                                                    <span className="text-xs text-[#888]">{order.cinemaName} - {order.hallName}</span>
                                                    <span className="text-xs text-[#888] flex items-center gap-1 mt-1">
                                                        <Clock className="w-3 h-3" />
                                                        {formatDate(order.showTime)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 hidden lg:table-cell">
                                                 <div className="text-sm text-[#ccc]">
                                                    <span className="block">Seats: <span className="text-white">{parseSeats(order.seats)}</span></span>
                                                    <span className="text-xs text-[#888]">{order.ticketType}</span>
                                                 </div>
                                            </td>
                                            <td className="p-4 hidden sm:table-cell">
                                                <div className="flex flex-col">
                                                    <span className="text-white font-bold">
                                                        RM {parseFloat(order.totalAmount).toFixed(2)}
                                                    </span>
                                                    <span className={`text-xs font-medium flex items-center gap-1 ${getPaymentStatusColor(order.paymentStatus)}`}>
                                                        {order.paymentStatus}
                                                        <span className="text-[#666] font-normal">• {order.paymentMethod}</span>
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs border ${getStatusColor(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="p-4 hidden xl:table-cell">
                                                <span className="text-sm text-[#888]">{formatDate(order.createdAt)}</span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => handleOpenViewModal(order)}
                                                        className="p-1.5 text-[#888] hover:text-white hover:bg-[#444] rounded transition"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    {order.paymentStatus === 'PAID' && (
                                                        <button 
                                                            onClick={() => handleViewTicket(order)}
                                                            className="px-3 py-1.5 bg-[#FFCA20] text-black text-xs font-bold rounded hover:bg-[#FFCA20]/90 transition inline-flex items-center gap-1 whitespace-nowrap"
                                                        >
                                                            Ticket
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="p-8 text-center text-[#666]">
                                            {loading ? 'Searching...' : 'No orders found matching your criteria.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    <div className="p-4 border-t border-[#3a3a3a] flex items-center justify-between bg-[#222]">
                        <div className="text-xs text-[#888]">
                            Showing <span className="text-white">{(page - 1) * limit + 1}</span> to <span className="text-white">{Math.min(page * limit, totalOrders)}</span> of <span className="text-white">{totalOrders}</span> orders
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1 || loading}
                                className="p-2 rounded bg-[#333] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#444] transition"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    return null;
                                })}
                                <span className="text-sm text-[#ccc] px-2">Page {page} of {totalPages}</span>
                            </div>

                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages || loading}
                                className="p-2 rounded bg-[#333] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#444] transition"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Replaced Custom Modal with TicketModal */}
            <TicketModal 
                isOpen={showTicketModal}
                onClose={() => setShowTicketModal(false)}
                ticketData={ticketData}
                bookingId={selectedOrder?.referenceNo}
            />

            <OrderDetailsModal 
                isOpen={showViewOrderModal}
                onClose={() => setShowViewOrderModal(false)}
                order={viewOrder}
            />
        </div>
    );
}
