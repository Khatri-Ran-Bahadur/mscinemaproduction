"use client";

import React, { useState, useEffect } from 'react';
import { 
    Search, 
    Filter, 
    ChevronLeft,
    ChevronRight,
    Eye,
    RotateCcw,
    CheckCircle,
    XCircle,
    Info,
    Monitor,
    CreditCard,
    QrCode,
    Globe
} from 'lucide-react';
import { timeAgo } from '@/utils/timeAgo';
import { adminFetch } from '@/utils/admin-api';

export default function PaymentLogsPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All'); // MolPay/Fiuu Status Code
    const [filterPaymentStatus, setFilterPaymentStatus] = useState('All'); // Success/Failed
    const [filterSource, setFilterSource] = useState('All'); // All / kiosk / online
    const [filterChannel, setFilterChannel] = useState('All');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    // Pagination State
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [totalPages, setTotalPages] = useState(1);
    const [totalLogs, setTotalLogs] = useState(0);

    // View Modal
    const [selectedLog, setSelectedLog] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchLogs();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [page, limit, searchQuery, filterStatus, filterPaymentStatus, filterSource, filterChannel, startDate, endDate]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                search: searchQuery,
                status: filterStatus !== 'All' ? filterStatus : '',
                paymentStatus: filterPaymentStatus !== 'All' ? filterPaymentStatus : '',
                source: filterSource !== 'All' ? filterSource : '',
                channel: filterChannel !== 'All' ? filterChannel : '',
                startDate: startDate,
                endDate: endDate,
            });
            
            const res = await adminFetch(`/api/admin/payment-logs?${params.toString()}`);
            const data = await res.json();
            if (data.success) {
                setLogs(data.data);
                if (data.pagination) {
                    setTotalPages(data.pagination.totalPages);
                    setTotalLogs(data.pagination.total);
                }
            } else {
                setLogs([]);
            }
        } catch (error) {
            console.error('Failed to fetch logs:', error);
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setPage(1);
    };

    const handleReset = () => {
        setSearchQuery('');
        setFilterStatus('All');
        setFilterPaymentStatus('All');
        setFilterSource('All');
        setFilterChannel('All');
        setStartDate('');
        setEndDate('');
        setPage(1);
    };

    const openDetails = (log) => {
        setSelectedLog(log);
        setShowModal(true);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('en-US', {
            timeZone: 'Asia/Kuala_Lumpur',
            dateStyle: 'medium',
            timeStyle: 'medium'
        });
    };

    const getStatusColor = (status) => {
        if (status === '00') return 'bg-green-500/10 text-green-500 border-green-500/20';
        if (status === '11' || status === '22') return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
        return 'bg-red-500/10 text-red-500 border-red-500/20';
    };

    const getChannelBadge = (channel, method) => {
        const ch = (channel || '').toUpperCase();
        const m = (method || '').toUpperCase();

        if (ch.includes('OPA') || ch.includes('KIOSK') || m.includes('KIOSK')) {
            if (ch.includes('CARD') || ch.includes('EDC')) {
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                        <CreditCard className="w-3 h-3" /> Kiosk Card (EDC)
                    </span>
                );
            }
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FFCA20]/15 text-[#FFCA20] border border-[#FFCA20]/30">
                    <Monitor className="w-3 h-3" /> Kiosk QR (OPA)
                </span>
            );
        }

        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                <Globe className="w-3 h-3" /> Online Web/App
            </span>
        );
    };

    return (
        <div className="p-8">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#FFCA20] mb-2">Payment Transaction Logs</h1>
                    <p className="text-[#888]">Audit real-time payment gateway responses, callbacks, and kiosk transaction logs</p>
                </div>
                
                {/* Advanced Filters */}
                <div className="flex gap-2 flex-wrap items-center">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#666]" />
                        <input 
                            type="text" 
                            placeholder="Search Order, Ref, Tx..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="bg-[#2a2a2a] border border-[#3a3a3a] text-white pl-10 pr-4 py-2 rounded-lg focus:border-[#FFCA20] outline-none w-56 text-sm"
                        />
                    </div>

                    {/* Date Filters */}
                    <div className="flex items-center bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg px-2 gap-1 h-10">
                        <span className="text-[10px] text-[#666] uppercase font-bold pl-1">From</span>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                            className="bg-transparent text-white py-1 text-xs outline-none cursor-pointer"
                        />
                    </div>

                    <div className="flex items-center bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg px-2 gap-1 h-10">
                        <span className="text-[10px] text-[#666] uppercase font-bold pl-1">To</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                            className="bg-transparent text-white py-1 text-xs outline-none cursor-pointer"
                        />
                    </div>

                    {/* Source Filter: Kiosk vs Online */}
                    <select 
                        value={filterSource} 
                        onChange={(e) => { setFilterSource(e.target.value); setPage(1); }}
                        className="bg-[#2a2a2a] border border-[#3a3a3a] text-white px-3 py-2 rounded-lg focus:border-[#FFCA20] outline-none cursor-pointer text-sm h-10"
                    >
                        <option value="All">All Sources</option>
                        <option value="kiosk">Kiosk Only (QR & EDC)</option>
                        <option value="online">Online Web & Mobile</option>
                    </select>

                    {/* Channel Filter */}
                    <select 
                        value={filterChannel} 
                        onChange={(e) => { setFilterChannel(e.target.value); setPage(1); }}
                        className="bg-[#2a2a2a] border border-[#3a3a3a] text-white px-3 py-2 rounded-lg focus:border-[#FFCA20] outline-none cursor-pointer text-sm h-10"
                    >
                        <option value="All">All Channels</option>
                        <option value="FIUU_OPA_QR">Fiuu OPA QR</option>
                        <option value="CARDBIZ">CardBiz EDC (Card)</option>
                        <option value="credit">Credit Card</option>
                        <option value="fpx">FPX Online Banking</option>
                    </select>

                    {/* Outcome Filter */}
                    <select 
                        value={filterPaymentStatus} 
                        onChange={(e) => { setFilterPaymentStatus(e.target.value); setPage(1); }}
                        className="bg-[#2a2a2a] border border-[#3a3a3a] text-white px-3 py-2 rounded-lg focus:border-[#FFCA20] outline-none cursor-pointer text-sm h-10"
                    >
                        <option value="All">All Outcomes</option>
                        <option value="success">Success</option>
                        <option value="failed">Failed</option>
                    </select>
                    
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-1.5 px-3 py-2 bg-[#333] border border-[#3a3a3a] text-white rounded-lg hover:bg-[#444] hover:text-[#FFCA20] transition h-10 text-sm"
                        title="Reset Filters"
                    >
                        <RotateCcw className="w-4 h-4" />
                        <span>Reset</span>
                    </button>
                </div>
            </div>

            {loading && logs.length === 0 ? (
                <div className="text-center py-20 text-[#888]">
                    <div className="w-6 h-6 border-2 border-[#FFCA20] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <span>Loading payment logs...</span>
                </div>
            ) : (
                <div className="bg-[#2a2a2a] rounded-xl border border-[#3a3a3a] overflow-hidden flex flex-col shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#222] border-b border-[#3a3a3a]">
                                <tr>
                                    <th className="px-4 py-3 text-[#888] font-medium text-xs">Outcome</th>
                                    <th className="px-4 py-3 text-[#888] font-medium text-xs">Source / Channel</th>
                                    <th className="px-4 py-3 text-[#888] font-medium text-xs">Order ID</th>
                                    <th className="px-4 py-3 text-[#888] font-medium text-xs hidden md:table-cell">Ref No</th>
                                    <th className="px-4 py-3 text-[#888] font-medium text-xs">Gateway Status</th>
                                    <th className="px-4 py-3 text-[#888] font-medium text-xs hidden sm:table-cell">Amount</th>
                                    <th className="px-4 py-3 text-[#888] font-medium text-xs hidden lg:table-cell">Remarks (Audit)</th>
                                    <th className="px-4 py-3 text-[#888] font-medium text-xs hidden xl:table-cell">Date</th>
                                    <th className="px-4 py-3 text-[#888] font-medium text-xs text-right">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#3a3a3a]">
                                {logs.length > 0 ? (
                                    logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-[#333] transition">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    {log.isSuccess ? (
                                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                                    ) : (
                                                        <XCircle className="w-5 h-5 text-red-500" />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {getChannelBadge(log.channel, log.method)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    <span className="font-mono text-white text-xs font-semibold">{log.orderId || '-'}</span>
                                                    {log.transactionNo && (
                                                        <span className="text-[10px] text-[#888] font-mono">
                                                            Tx: {log.transactionNo}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 hidden md:table-cell">
                                                <span className="text-xs text-[#ccc] font-mono">{log.referenceNo || '-'}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded text-[10px] border font-mono ${getStatusColor(log.status)}`}>
                                                    {log.status || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 hidden sm:table-cell">
                                                <div className="flex flex-col">
                                                    <span className="text-white font-bold text-xs">
                                                        RM {parseFloat(log.amount || 0).toFixed(2)}
                                                    </span>
                                                    <span className="text-[10px] text-[#888]">{log.channel || log.method}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 hidden lg:table-cell max-w-[280px]">
                                                <p className="text-xs text-[#ccc] truncate" title={log.remarks}>{log.remarks || '-'}</p>
                                            </td>
                                            <td className="px-4 py-3 hidden xl:table-cell">
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-[#ccc]">{formatDate(log.createdAt)}</span>
                                                    <span className="text-[10px] text-[#888]">{timeAgo(log.createdAt)}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button 
                                                    onClick={() => openDetails(log)}
                                                    className="p-1.5 bg-[#444] hover:bg-[#555] rounded text-white transition"
                                                    title="View Full Payload Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="9" className="text-center py-12 text-[#888]">
                                            No payment logs found matching your filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="p-4 border-t border-[#3a3a3a] flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#888]">
                        <div>
                            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalLogs)} of {totalLogs} payment logs
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 bg-[#333] hover:bg-[#444] text-white rounded disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="px-3 py-1 bg-[#222] border border-[#3a3a3a] rounded text-white font-medium">
                                Page {page} of {totalPages || 1}
                            </span>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="p-2 bg-[#333] hover:bg-[#444] text-white rounded disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Log Details Modal */}
            {showModal && selectedLog && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#222] border border-[#444] rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
                        <div className="p-6 border-b border-[#333] flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <span>Log Details:</span>
                                    <span className="font-mono text-[#FFCA20]">{selectedLog.orderId}</span>
                                </h3>
                                <p className="text-xs text-[#888] mt-1">Recorded at {formatDate(selectedLog.createdAt)}</p>
                            </div>
                            <button 
                                onClick={() => setShowModal(false)}
                                className="text-[#888] hover:text-white text-2xl"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6 flex-1">
                            {/* Summary Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-[#1a1a1a] p-4 rounded-lg border border-[#333]">
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-[#666]">Status</span>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        {selectedLog.isSuccess ? (
                                            <span className="text-xs text-green-500 font-semibold flex items-center gap-1">
                                                <CheckCircle className="w-3.5 h-3.5" /> Success
                                            </span>
                                        ) : (
                                            <span className="text-xs text-red-500 font-semibold flex items-center gap-1">
                                                <XCircle className="w-3.5 h-3.5" /> Failed
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-[#666]">Gateway Code</span>
                                    <p className="text-sm font-mono text-white mt-1">{selectedLog.status || 'N/A'}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-[#666]">Amount</span>
                                    <p className="text-sm font-bold text-white mt-1">
                                        RM {parseFloat(selectedLog.amount || 0).toFixed(2)}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-[#666]">Channel</span>
                                    <p className="text-xs font-semibold text-white mt-1">{selectedLog.channel || '-'}</p>
                                </div>
                            </div>

                            {/* Remarks */}
                            <div>
                                <h4 className="text-xs font-bold text-[#888] uppercase mb-2">Remarks & Explanation</h4>
                                <div className="bg-[#1a1a1a] p-3 rounded-lg border border-[#333] text-sm text-[#ccc]">
                                    {selectedLog.remarks || 'No remarks recorded.'}
                                </div>
                            </div>

                            {/* Raw Return Data JSON */}
                            <div>
                                <h4 className="text-xs font-bold text-[#888] uppercase mb-2">Raw Return Data (Payload)</h4>
                                <pre className="bg-[#111] p-4 rounded-lg border border-[#333] text-xs font-mono text-green-400 overflow-x-auto max-h-64">
                                    {JSON.stringify(selectedLog.returnData, null, 2) || '{}'}
                                </pre>
                            </div>
                        </div>

                        <div className="p-4 border-t border-[#333] flex justify-end">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-5 py-2 bg-[#333] hover:bg-[#444] text-white rounded-lg text-sm transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
