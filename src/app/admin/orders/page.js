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
    Eye,
    Trash2,
    RotateCcw,
    Edit,
    Mail
} from 'lucide-react';
import TicketModal from '@/components/TicketModal';
import OrderDetailsModal from '@/components/admin/OrderDetailsModal';
import { booking } from '@/services/api';
import { timeAgo } from '@/utils/timeAgo';

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterPaymentStatus, setFilterPaymentStatus] = useState('All');
    const [dateFilter, setDateFilter] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [ticketData, setTicketData] = useState(null);
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [viewOrder, setViewOrder] = useState(null);
    const [showViewOrderModal, setShowViewOrderModal] = useState(false);
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [isDeleting, setIsDeleting] = useState(false);
    
    // Pagination State
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalOrders, setTotalOrders] = useState(0);

    // Status Modal State
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [statusOrder, setStatusOrder] = useState(null);
    const [newStatus, setNewStatus] = useState('PENDING');

    // Action Menu State
    const [openActionMenuId, setOpenActionMenuId] = useState(null);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchOrders();
        }, 300); // Debounce search
        return () => clearTimeout(timeoutId);
    }, [page, limit, searchQuery, filterStatus, filterPaymentStatus, dateFilter]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                search: searchQuery,
                status: filterStatus,
                paymentStatus: filterPaymentStatus,
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

    const handlePaymentStatusChange = (e) => {
        setFilterPaymentStatus(e.target.value);
        setPage(1);
    };

    const handleDateChange = (e) => {
        setDateFilter(e.target.value);
        setPage(1);
    };

    const handleReset = () => {
        setSearchQuery('');
        setFilterStatus('All');
        setFilterPaymentStatus('All');
        setDateFilter('');
        setPage(1);
        setSelectedOrders([]);
    };

    const handleSelectOrder = (orderId) => {
        setSelectedOrders(prev => {
            if (prev.includes(orderId)) {
                return prev.filter(id => id !== orderId);
            } else {
                return [...prev, orderId];
            }
        });
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedOrders(orders.map(order => order.id));
        } else {
            setSelectedOrders([]);
        }
    };

    const handleDeleteSingle = async (orderId) => {
        if (!confirm('Are you sure you want to delete this order?')) return;
        
        setIsDeleting(true);
        try {
            const res = await fetch('/api/admin/orders', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: [orderId] })
            });
            
            const data = await res.json();
            if (data.success) {
                alert('Order deleted successfully');
                fetchOrders();
                setSelectedOrders([]);
            } else {
                alert('Failed to delete order');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete order');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedOrders.length === 0) {
            alert('Please select orders to delete');
            return;
        }

        if (!confirm(`Are you sure you want to delete ${selectedOrders.length} order(s)?`)) return;
        
        setIsDeleting(true);
        try {
            const res = await fetch('/api/admin/orders', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedOrders })
            });
            
            const data = await res.json();
            if (data.success) {
                alert(`${data.count} order(s) deleted successfully`);
                fetchOrders();
                setSelectedOrders([]);
            } else {
                alert('Failed to delete orders');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete orders');
        } finally {
            setIsDeleting(false);
        }
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

    const parseTicketType = (ticketTypeData) => {
        if (!ticketTypeData) return '-';
        try {
            const parsed = JSON.parse(ticketTypeData);
            
            // Case 1: Array of Strings ["Adult", "Child"]
            if (Array.isArray(parsed) && typeof parsed[0] === 'string') {
                return parsed.join(', ');
            }

            // Case 2: Array of Objects [{ type: "Adult", price: 10 }, ...]
            if (Array.isArray(parsed) && typeof parsed[0] === 'object') {
                return parsed.map(p => {
                    const type = p.ticketType || p.type || p.name || p.Name || 'Ticket';
                    const price = p.price || p.amount || p.Price || '';
                    return price ? `${type} (RM${price})` : type;
                }).join(', ');
            }

            // Case 3: Object { "Adult": 2, "Child": 1 }
            if (typeof parsed === 'object' && !Array.isArray(parsed)) {
                return Object.entries(parsed).map(([key, val]) => `${key}: ${val}`).join(', ');
            }

            return ticketTypeData;
        } catch (e) {
            // Not JSON, return as is
            return ticketTypeData;
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
            alert("This order is missing CinemaID/ShowID to fetch details.");
        }
    };

    const handleStatusUpdate = (order) => {
        setStatusOrder(order);
        setNewStatus(order.paymentStatus || 'PENDING');
        setShowStatusModal(true);
    };

    const confirmStatusUpdate = async () => {
        if (!statusOrder) return;

        try {
            const res = await fetch(`/api/admin/orders/${statusOrder.id}/status`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ status: newStatus })
            });
            const data = await res.json();
            if (data.success) {
                alert("Status updated successfully");
                fetchOrders();
                setShowStatusModal(false);
                setStatusOrder(null);
            } else {
                alert(data.error || "Failed to update status");
            }
        } catch(e) {
            console.error(e);
            alert("Error updating status");
        }
    };

    const handleResendEmail = async (order) => {
        if (!confirm(`Resend ticket email to ${order.customerEmail}?`)) return;
        
        try {
            const res = await fetch(`/api/admin/orders/${order.id}/resend-email`, {
                method: 'POST'
            });
            const data = await res.json();
            if (data.success) {
                alert("Email sent successfully");
            } else {
                alert(data.error || "Failed to send email");
            }
        } catch(e) {
            console.error(e);
            alert("Error sending email");
        }
    };

    return (
        <div className="p-8 relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#FFCA20] mb-2">Booking Orders</h1>
                    <p className="text-[#888]">Manage and view all customer ticket bookings</p>
                </div>
                
                <div className="flex gap-3 flex-wrap">
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
                    <div className="relative">
                        <select 
                            value={filterPaymentStatus}
                            onChange={handlePaymentStatusChange}
                            className="bg-[#2a2a2a] border border-[#3a3a3a] text-white pl-4 pr-10 py-2 rounded-lg focus:border-[#FFCA20] outline-none appearance-none cursor-pointer"
                        >
                            <option value="All">All Payments</option>
                            <option value="PAID">Paid</option>
                            <option value="PENDING">Pending</option>
                            <option value="FAILED">Failed</option>
                            <option value="REFUNDED">Refunded</option>
                        </select>
                        <CreditCard className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#666] pointer-events-none" />
                    </div>
                    
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-3 py-2 bg-[#333] border border-[#3a3a3a] text-white rounded-lg hover:bg-[#444] hover:text-[#FFCA20] transition h-10"
                        title="Reset Filters"
                    >
                        <RotateCcw className="w-4 h-4" />
                        <span className="hidden xl:inline text-sm">Reset</span>
                    </button>

                    {selectedOrders.length > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            disabled={isDeleting}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition disabled:opacity-50"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete ({selectedOrders.length})
                        </button>
                    )}
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
                                    <th className="px-3 py-3 text-[#888] font-medium text-xs w-[40px]">
                                        <input
                                            type="checkbox"
                                            checked={selectedOrders.length === orders.length && orders.length > 0}
                                            onChange={handleSelectAll}
                                            className="w-4 h-4 rounded border-[#666] bg-[#333] text-[#FFCA20] focus:ring-[#FFCA20] focus:ring-offset-0 cursor-pointer"
                                        />
                                    </th>
                                    <th className="px-3 py-3 text-[#888] font-medium text-xs w-[180px]">Ticket / Payment Ref</th>
                                    <th className="px-3 py-3 text-[#888] font-medium text-xs hidden md:table-cell">Customer</th>
                                    <th className="px-3 py-3 text-[#888] font-medium text-xs hidden sm:table-cell">Movie Details</th>
                                    <th className="px-3 py-3 text-[#888] font-medium text-xs hidden lg:table-cell">Details</th>
                                    <th className="px-3 py-3 text-[#888] font-medium text-xs hidden sm:table-cell">Amount</th>
                                    <th className="px-3 py-3 text-[#888] font-medium text-xs hidden md:table-cell">Payment</th>
                                    <th className="px-3 py-3 text-[#888] font-medium text-xs hidden lg:table-cell">Flags</th>
                                   
                                    <th className="px-3 py-3 text-[#888] font-medium text-xs">Status</th>
                                    <th className="px-3 py-3 text-[#888] font-medium text-xs hidden xl:table-cell">Date</th>
                                        <th className="px-3 py-3 text-[#888] font-medium text-xs hidden lg:table-cell">Time Ago</th>
                                         <th className="px-3 py-3 text-[#888] font-medium text-xs">Email</th>
                                    <th className="px-3 py-3 text-[#888] font-medium text-xs text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#3a3a3a]">
                                {orders.length > 0 ? (
                                    orders.map((order) => (
                                        <tr key={order.id} className="hover:bg-[#333] transition">
                                            <td className="px-3 py-2">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedOrders.includes(order.id)}
                                                    onChange={() => handleSelectOrder(order.id)}
                                                    className="w-4 h-4 rounded border-[#666] bg-[#333] text-[#FFCA20] focus:ring-[#FFCA20] focus:ring-offset-0 cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="flex flex-col">
                                                    <span className="font-mono text-[#FFCA20] font-bold text-xs">{order.referenceNo}</span>
                                                    <span className="text-[10px] text-[#888] font-mono mt-0.5" title="Payment Order ID">
                                                        {order.orderId || '-'}
                                                    </span>
                                                    {order.transactionNo && (
                                                        <span className="text-[10px] text-[#666] font-mono" title="Transaction ID">
                                                            Tx: {order.transactionNo}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 hidden md:table-cell">
                                                <div className="flex flex-col">
                                                    <span className="text-white font-medium text-xs">{order.customerName || 'Guest'}</span>
                                                    <span className="text-[10px] text-[#888]">{order.customerEmail}</span>
                                                    <span className="text-[10px] text-[#888]">{order.customerPhone}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 hidden sm:table-cell">
                                                <div className="flex flex-col">
                                                    <span className="text-white flex items-center gap-1 text-xs">
                                                        <Film className="w-3 h-3 text-[#FFCA20]" />
                                                        {order.movieTitle}
                                                    </span>
                                                    <span className="text-[10px] text-[#888]">{order.cinemaName} - {order.hallName}</span>
                                                    <span className="text-[10px] text-[#888] flex items-center gap-1 mt-0.5">
                                                        <Clock className="w-3 h-3" />
                                                        {formatDate(order.showTime)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 hidden lg:table-cell">
                                                 <div className="text-xs text-[#ccc]">
                                                    <span className="block">Seats: <span className="text-white">{parseSeats(order.seats)}</span></span>
                                                    <span className="text-[10px] text-[#888]">{parseTicketType(order.ticketType)}</span>
                                                 </div>
                                            </td>
                                            <td className="px-3 py-2 hidden sm:table-cell">
                                                <span className="text-white font-bold text-xs">
                                                    RM {parseFloat(order.totalAmount).toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 hidden md:table-cell">
                                                <div className="flex flex-col">
                                                    <span className={`text-[10px] font-medium flex items-center gap-1 ${getPaymentStatusColor(order.paymentStatus)}`}>
                                                        {order.paymentStatus}
                                                    </span>
                                                    <span className="text-[#666] text-[10px] font-normal">{order.paymentMethod}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 hidden lg:table-cell">
                                                <div className="flex flex-col gap-1 items-start">
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${order.reserve_ticket ? 'text-green-400 bg-green-900/30' : 'text-gray-500 bg-[#333]'}`}>
                                                        Res: {order.reserve_ticket ? 'Yes' : 'No'}
                                                    </span>
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${order.cancel_ticket ? 'text-red-400 bg-red-900/30' : 'text-gray-500 bg-[#333]'}`}>
                                                        Can: {order.cancel_ticket ? 'Yes' : 'No'}
                                                    </span>
                                                </div>
                                            </td>
                                           
                                            <td className="px-3 py-2">
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] border ${getStatusColor(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 hidden xl:table-cell">
                                                <span className="text-xs text-[#888]">{formatDate(order.createdAt)}</span>
                                            </td>
                                            <td className="px-3 py-2 hidden lg:table-cell">
                                                <span className="text-[10px] font-mono text-gray-400 bg-[#333] px-1.5 py-0.5 rounded whitespace-nowrap">
                                                    {timeAgo(order.createdAt)}
                                                </span>
                                            </td>
                                             <td className="px-3 py-2">
                                                <div className="flex items-center justify-between gap-2">
                                                    {order.isSendMail ? (
                                                        <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/10 text-green-500 shrink-0" title="Email Sent">
                                                            <CheckCircle className="w-3 h-3" />
                                                        </div>
                                                    ) : (
                                                        <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/10 text-red-500 shrink-0" title="Not Sent">
                                                            <XCircle className="w-3 h-3" />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                <div className="flex items-center justify-end gap-2 relative">
                                                    {order.paymentStatus === 'PAID' && (
                                                        <button 
                                                            onClick={() => handleViewTicket(order)}
                                                            className="px-3 py-1 bg-[#FFCA20] text-black text-xs font-bold rounded hover:bg-[#FFCA20]/90 transition inline-flex items-center gap-1 shadow-sm"
                                                        >
                                                            Ticket
                                                        </button>
                                                    )}

                                                    <div className="relative">
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setOpenActionMenuId(openActionMenuId === order.id ? null : order.id);
                                                            }}
                                                            className={`p-1.5 rounded transition ${openActionMenuId === order.id ? 'bg-[#444] text-white' : 'text-[#888] hover:text-white hover:bg-[#333]'}`}
                                                        >
                                                            <MoreVertical className="w-4 h-4" />
                                                        </button>
                                                        
                                                        {openActionMenuId === order.id && (
                                                            <>
                                                                <div className="fixed inset-0 z-40 cursor-default" onClick={() => setOpenActionMenuId(null)}></div>
                                                                <div className="absolute right-0 top-full mt-2 w-48 bg-[#1a1a1a] border border-[#444] rounded-lg shadow-xl z-50 flex flex-col py-1 overflow-hidden">
                                                                    <button 
                                                                        onClick={() => { handleOpenViewModal(order); setOpenActionMenuId(null); }} 
                                                                        className="text-left px-4 py-2.5 hover:bg-[#333] text-sm flex items-center gap-2 text-gray-300 hover:text-white transition"
                                                                    >
                                                                        <Eye className="w-4 h-4" /> View Details
                                                                    </button>
                                                                    
                                                                    <button 
                                                                        onClick={() => { handleStatusUpdate(order); setOpenActionMenuId(null); }} 
                                                                        className="text-left px-4 py-2.5 hover:bg-[#333] text-sm flex items-center gap-2 text-blue-400 hover:text-blue-300 transition"
                                                                    >
                                                                        <Edit className="w-4 h-4" /> Edit Status
                                                                    </button>
                                                                    
                                                                    <button 
                                                                        onClick={() => { handleResendEmail(order); setOpenActionMenuId(null); }} 
                                                                        // Enable only if PAID and NOT yet sent
                                                                        disabled={order.paymentStatus !== 'PAID' || order.isSendMail}
                                                                        className={`text-left px-4 py-2.5 hover:bg-[#333] text-sm flex items-center gap-2 transition ${
                                                                            order.paymentStatus === 'PAID' && !order.isSendMail 
                                                                                ? 'text-yellow-400 hover:text-yellow-300' 
                                                                                : 'text-gray-600 cursor-not-allowed opacity-50'
                                                                        }`}
                                                                    >
                                                                        <Mail className="w-4 h-4" /> Resend Email
                                                                    </button>
                                                                    
                                                                    <div className="border-t border-[#333] my-1"></div>
                                                                    
                                                                    <button 
                                                                        onClick={() => { handleDeleteSingle(order.id); setOpenActionMenuId(null); }} 
                                                                        className="text-left px-4 py-2.5 hover:bg-red-500/10 text-sm flex items-center gap-2 text-red-400 hover:text-red-300 transition"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" /> Delete Order
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="10" className="p-8 text-center text-[#666]">
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
                            {/* Rows per page selector */}
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

                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1 || loading}
                                className="p-2 rounded bg-[#333] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#444] transition"
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

            {/* Status Update Modal */}
            {showStatusModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-6 w-full max-w-sm shadow-2xl transform transition-all scale-100">
                        <h3 className="text-xl font-bold text-white mb-4">Update Payment Status</h3>
                        <p className="text-sm text-gray-400 mb-6">
                            Changing status for Order <span className="text-[#FFCA20] font-mono bg-black/30 px-1 rounded">{statusOrder?.referenceNo}</span>
                        </p>
                        
                        <div className="mb-6">
                            <label className="block text-sm text-gray-400 mb-2 font-medium">New Status</label>
                            <div className="relative">
                                <select
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                    className="w-full bg-[#1a1a1a] border border-[#3a3a3a] text-white rounded-lg px-4 py-3 focus:border-[#FFCA20] focus:ring-1 focus:ring-[#FFCA20] outline-none appearance-none cursor-pointer"
                                >
                                    <option value="PAID">PAID</option>
                                    <option value="PENDING">PENDING</option>
                                    <option value="FAILED">FAILED</option>
                                    <option value="REFUNDED">REFUNDED</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                            </div>
                        </div>
                        
                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => setShowStatusModal(false)}
                                className="px-4 py-2 rounded text-gray-400 hover:text-white hover:bg-[#333] transition font-medium"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmStatusUpdate}
                                className="px-4 py-2 rounded bg-[#FFCA20] text-black font-bold hover:bg-[#FFCA20]/90 transition shadow-lg shadow-[#FFCA20]/20"
                            >
                                Update Status
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
