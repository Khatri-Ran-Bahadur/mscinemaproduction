import React from 'react';
import { X, Calendar, User, CreditCard, Film, Clock, MapPin, Hash, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function OrderDetailsModal({ isOpen, onClose, order }) {
    if (!isOpen || !order) return null;

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            return new Date(dateString).toLocaleString('en-US', {
                timeZone: 'Asia/Kuala_Lumpur',
                dateStyle: 'medium',
                timeStyle: 'medium'
            });
        } catch (e) {
            return dateString;
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toUpperCase()) {
            case 'CONFIRMED': return 'text-green-500 bg-green-500/10 border-green-500/20';
            case 'PENDING': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
            case 'CANCELLED': return 'text-red-500 bg-red-500/10 border-red-500/20';
            default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
        }
    };

    const StatusIcon = ({ status }) => {
        switch (status?.toUpperCase()) {
            case 'CONFIRMED': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'PENDING': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
            case 'CANCELLED': return <XCircle className="w-5 h-5 text-red-500" />;
            default: return <AlertCircle className="w-5 h-5 text-gray-500" />;
        }
    };

    const parseSeats = (seatsData) => {
        try {
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#1a1a1a] rounded-xl border border-[#333] w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[#333] sticky top-0 bg-[#1a1a1a] z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#FFCA20]/10 rounded-lg">
                            <Film className="w-6 h-6 text-[#FFCA20]" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Order Details</h2>
                            <p className="text-sm text-[#888]">REF: {order.referenceNo}</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-[#888] hover:text-white hover:bg-[#333] rounded-lg transition"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 grid gap-6 md:grid-cols-2">
                    {/* Status Section */}
                    <div className="md:col-span-2">
                        <div className="flex flex-wrap gap-4 items-center justify-between bg-[#222] p-4 rounded-lg border border-[#333]">
                            <div>
                                <p className="text-sm text-[#888] mb-1">Order Status</p>
                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-md border text-sm font-medium ${getStatusColor(order.status)}`}>
                                    <StatusIcon status={order.status} />
                                    {order.status}
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-[#888] mb-1">Total Amount</p>
                                <p className="text-2xl font-bold text-[#FFCA20]">RM {parseFloat(order.totalAmount).toFixed(2)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Movie Information */}
                    <div className="space-y-4">
                        <h3 className="text-[#FFCA20] font-bold flex items-center gap-2">
                            <Film className="w-4 h-4" /> Movie Information
                        </h3>
                        <div className="bg-[#2a2a2a] p-4 rounded-lg border border-[#3a3a3a] space-y-3">
                            <div>
                                <p className="text-xs text-[#888]">Movie Title</p>
                                <p className="text-white font-medium">{order.movieTitle}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-[#888]">Cinema</p>
                                    <p className="text-white">{order.cinemaName}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-[#888]">Hall</p>
                                    <p className="text-white">{order.hallName}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-[#888]">Show Time</p>
                                <div className="flex items-center gap-2 text-white">
                                    <Clock className="w-4 h-4 text-[#888]" />
                                    {formatDate(order.showTime)}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-[#888]">Seats</p>
                                <p className="text-white font-mono bg-[#333] inline-block px-2 py-1 rounded mt-1">
                                    {parseSeats(order.seats)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-[#888]">Ticket Types</p>
                                <p className="text-white text-sm mt-1">
                                    {parseTicketType(order.ticketType)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Customer Information */}
                    <div className="space-y-4">
                        <h3 className="text-[#FFCA20] font-bold flex items-center gap-2">
                            <User className="w-4 h-4" /> Customer Information
                        </h3>
                        <div className="bg-[#2a2a2a] p-4 rounded-lg border border-[#3a3a3a] space-y-3">
                            <div>
                                <p className="text-xs text-[#888]">Name</p>
                                <p className="text-white font-medium">{order.customerName || 'Guest'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-[#888]">Email</p>
                                <p className="text-white">{order.customerEmail}</p>
                            </div>
                            <div>
                                <p className="text-xs text-[#888]">Phone</p>
                                <p className="text-white">{order.customerPhone}</p>
                            </div>
                        </div>
                    </div>

                    {/* Transaction Details */}
                    <div className="md:col-span-2 space-y-4">
                        <h3 className="text-[#FFCA20] font-bold flex items-center gap-2">
                            <CreditCard className="w-4 h-4" /> Transaction Details
                        </h3>
                        <div className="bg-[#2a2a2a] p-4 rounded-lg border border-[#3a3a3a] grid md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-[#888]">Order ID</p>
                                <p className="text-white font-mono text-sm">{order.orderId || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-[#888]">Transaction No</p>
                                <p className="text-white font-mono text-sm">{order.transactionNo || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-[#888]">Payment Method</p>
                                <p className="text-white">{order.paymentMethod}</p>
                            </div>
                            <div>
                                <p className="text-xs text-[#888]">Payment Status</p>
                                <p className={`font-medium ${
                                    order.paymentStatus === 'PAID' ? 'text-green-500' : 
                                    order.paymentStatus === 'FAILED' ? 'text-red-500' : 'text-yellow-500'
                                }`}>
                                    {order.paymentStatus}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-[#888]">Created At</p>
                                <p className="text-white text-sm">{formatDate(order.createdAt)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-[#888]">Updated At</p>
                                <p className="text-white text-sm">{formatDate(order.updatedAt)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-[#333] flex justify-end">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2 bg-[#333] hover:bg-[#444] text-white rounded-lg transition font-medium"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
