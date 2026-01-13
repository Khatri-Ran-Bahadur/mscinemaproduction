"use client";

import React, { useState, useEffect } from 'react';
import { 
    Search, 
    Filter, 
    ChevronDown, 
    MoreVertical, 
    Calendar,
    CreditCard,
    Film,
    User,
    CheckCircle,
    XCircle,
    Clock
} from 'lucide-react';

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await fetch('/api/admin/orders');
            const data = await res.json();
            if (data.success) {
                setOrders(data.orders);
            }
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
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

    const filteredOrders = orders.filter(order => {
        const matchesSearch = 
            order.referenceNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesFilter = filterStatus === 'All' || order.status === filterStatus;
        
        return matchesSearch && matchesFilter;
    });

    const parseSeats = (seatsData) => {
        try {
            // If it's a JSON string array e.g. "[\"A1\",\"A2\"]"
            const parsed = JSON.parse(seatsData);
            if (Array.isArray(parsed)) return parsed.join(', ');
            return seatsData;
        } catch (e) {
            // If it's already a simple string e.g. "A1, A2"
            return seatsData;
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
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-[#2a2a2a] border border-[#3a3a3a] text-white pl-10 pr-4 py-2 rounded-lg focus:border-[#FFCA20] outline-none w-64"
                        />
                    </div>
                    <div className="relative">
                        <select 
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
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

            {loading ? (
                <div className="text-center py-20 text-[#888]">Loading orders...</div>
            ) : (
                <div className="bg-[#2a2a2a] rounded-xl border border-[#3a3a3a] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#222] border-b border-[#3a3a3a]">
                                <tr>
                                    <th className="p-4 text-[#888] font-medium text-sm">Order Ref</th>
                                    <th className="p-4 text-[#888] font-medium text-sm">Customer</th>
                                    <th className="p-4 text-[#888] font-medium text-sm">Movie Details</th>
                                    <th className="p-4 text-[#888] font-medium text-sm">Details</th>
                                    <th className="p-4 text-[#888] font-medium text-sm">Amount</th>
                                    <th className="p-4 text-[#888] font-medium text-sm">Status</th>
                                    <th className="p-4 text-[#888] font-medium text-sm">Date</th>
                                    <th className="p-4 text-[#888] font-medium text-sm text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#3a3a3a]">
                                {filteredOrders.length > 0 ? (
                                    filteredOrders.map((order) => (
                                        <tr key={order.id} className="hover:bg-[#333] transition">
                                            <td className="p-4">
                                                <span className="font-mono text-[#FFCA20]">{order.referenceNo}</span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="text-white font-medium">{order.customerName || 'Guest'}</span>
                                                    <span className="text-xs text-[#888]">{order.customerEmail}</span>
                                                    <span className="text-xs text-[#888]">{order.customerPhone}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
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
                                            <td className="p-4">
                                                 <div className="text-sm text-[#ccc]">
                                                    <span className="block">Seats: <span className="text-white">{parseSeats(order.seats)}</span></span>
                                                    <span className="text-xs text-[#888]">{order.ticketType}</span>
                                                 </div>
                                            </td>
                                            <td className="p-4">
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
                                            <td className="p-4">
                                                <span className="text-sm text-[#888]">{formatDate(order.createdAt)}</span>
                                            </td>
                                            <td className="p-4 text-right">
                                                {order.paymentStatus === 'PAID' && (
                                                    <button 
                                                        onClick={() => setSelectedOrder(order)}
                                                        className="px-3 py-1.5 bg-[#FFCA20] text-black text-xs font-bold rounded hover:bg-[#FFCA20]/90 transition inline-flex items-center gap-1"
                                                    >
                                                        View Ticket
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="p-8 text-center text-[#666]">
                                            No orders found matching your criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Ticket Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-[#1a1a1a] w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl border border-[#333] relative flex flex-col md:flex-row">
                        <button 
                            onClick={() => setSelectedOrder(null)}
                            className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition"
                        >
                            <XCircle className="w-6 h-6" />
                        </button>

                        {/* Left Side: Ticket Visual */}
                        <div className="w-full md:w-1/3 bg-[#FFCA20] p-6 flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('/img/pattern.png')] bg-repeat"></div>
                            <div className="relative z-10 text-center">
                                <h3 className="text-black font-black text-2xl uppercase tracking-tighter leading-none mb-1">CINEMA</h3>
                                <p className="text-black/60 text-xs font-bold tracking-widest uppercase">TICKET</p>
                            </div>
                            
                            <div className="relative z-10 my-8 flex justify-center">
                                {/* Simulated QR Code */}
                                <div className="bg-white p-2 rounded-lg shadow-lg">
                                    <div className="w-32 h-32 bg-white flex items-center justify-center border-4 border-black">
                                       <span className="text-xs font-mono text-center break-all p-1 text-black">
                                           {selectedOrder.referenceNo}
                                       </span>
                                    </div>
                                </div>
                            </div>

                            <div className="relative z-10 text-center">
                                <p className="text-black font-bold text-lg">ADMIT ONE</p>
                                <p className="text-black/60 text-xs">Scan this QR at the entrance</p>
                            </div>
                            
                            {/* Jagged edge visual */}
                            <div className="absolute right-[-10px] top-0 bottom-0 w-[20px] bg-[#1a1a1a] hidden md:block" 
                                 style={{background: 'radial-gradient(circle, #1a1a1a 10px, transparent 11px) -10px 0 / 100% 30px repeat-y'}}>
                            </div>
                        </div>

                        {/* Right Side: Details */}
                        <div className="w-full md:w-2/3 p-8 flex flex-col justify-center">
                            <div className="mb-6 border-b border-[#333] pb-4">
                                <h2 className="text-2xl font-bold text-white mb-2">{selectedOrder.movieTitle}</h2>
                                <div className="flex flex-wrap gap-4 text-sm text-[#888]">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        {formatDate(selectedOrder.showTime)}
                                    </span>
                                    <span className="px-2 py-0.5 bg-[#333] rounded text-xs text-[#ccc]">
                                        {selectedOrder.ticketType || 'Standard'}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <div>
                                    <p className="text-[#666] text-xs uppercase tracking-wider mb-1">Cinema</p>
                                    <p className="text-white font-medium">{selectedOrder.cinemaName}</p>
                                </div>
                                <div>
                                    <p className="text-[#666] text-xs uppercase tracking-wider mb-1">Hall</p>
                                    <p className="text-white font-medium">{selectedOrder.hallName}</p>
                                </div>
                                <div>
                                    <p className="text-[#666] text-xs uppercase tracking-wider mb-1">Seat(s)</p>
                                    <p className="text-[#FFCA20] font-bold text-lg">{parseSeats(selectedOrder.seats)}</p>
                                </div>
                                <div>
                                    <p className="text-[#666] text-xs uppercase tracking-wider mb-1">Price</p>
                                    <p className="text-white font-bold">RM {parseFloat(selectedOrder.totalAmount).toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="bg-[#222] p-4 rounded-lg border border-[#333]">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[#888] text-sm">Booking Ref:</span>
                                    <span className="text-white font-mono">{selectedOrder.referenceNo}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[#888] text-sm">Customer:</span>
                                    <span className="text-white">{selectedOrder.customerName}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
