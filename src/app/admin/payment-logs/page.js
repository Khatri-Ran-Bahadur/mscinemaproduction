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
    Info
} from 'lucide-react';
import { timeAgo } from '@/utils/timeAgo';
import { adminFetch } from '@/utils/admin-api';

export default function PaymentLogsPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All'); // MolPay Status Code
    const [filterPaymentStatus, setFilterPaymentStatus] = useState('All'); // Success/Failed
    
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
    }, [page, limit, searchQuery, filterStatus, filterPaymentStatus]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                search: searchQuery,
                status: filterStatus !== 'All' ? filterStatus : '',
                paymentStatus: filterPaymentStatus !== 'All' ? filterPaymentStatus : ''
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
        if (status === '11') return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
        if (status === '-1') return 'bg-red-500/10 text-red-500 border-red-500/20';
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    };

    return (
        <div className="p-8 relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#FFCA20] mb-2">Payment Logs</h1>
                    <p className="text-[#888]">View raw MolPay return logs and outcomes</p>
                </div>
                
                <div className="flex gap-3 flex-wrap">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#666]" />
                        <input 
                            type="text" 
                            placeholder="Search Order ID, Ref..." 
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="bg-[#2a2a2a] border border-[#3a3a3a] text-white pl-10 pr-4 py-2 rounded-lg focus:border-[#FFCA20] outline-none w-64"
                        />
                    </div>

                    <div className="relative">
                        <select 
                            value={filterPaymentStatus}
                            onChange={(e) => { setFilterPaymentStatus(e.target.value); setPage(1); }}
                            className="bg-[#2a2a2a] border border-[#3a3a3a] text-white pl-4 pr-10 py-2 rounded-lg focus:border-[#FFCA20] outline-none appearance-none cursor-pointer"
                        >
                            <option value="All">All Outcomes</option>
                            <option value="success">Success</option>
                            <option value="failed">Failed</option>
                        </select>
                        <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#666] pointer-events-none" />
                    </div>
                    
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-3 py-2 bg-[#333] border border-[#3a3a3a] text-white rounded-lg hover:bg-[#444] hover:text-[#FFCA20] transition h-10"
                    >
                        <RotateCcw className="w-4 h-4" />
                        <span className="hidden xl:inline text-sm">Reset</span>
                    </button>
                </div>
            </div>

            {loading && logs.length === 0 ? (
                <div className="text-center py-20 text-[#888]">Loading logs...</div>
            ) : (
                <div className="bg-[#2a2a2a] rounded-xl border border-[#3a3a3a] overflow-hidden flex flex-col">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#222] border-b border-[#3a3a3a]">
                                <tr>
                                    <th className="px-4 py-3 text-[#888] font-medium text-xs">Outcome</th>
                                    <th className="px-4 py-3 text-[#888] font-medium text-xs">Order ID</th>
                                    <th className="px-4 py-3 text-[#888] font-medium text-xs hidden md:table-cell">Ref No</th>
                                    <th className="px-4 py-3 text-[#888] font-medium text-xs">MolPay Status</th>
                                    <th className="px-4 py-3 text-[#888] font-medium text-xs hidden sm:table-cell">Amount</th>
                                    <th className="px-4 py-3 text-[#888] font-medium text-xs hidden lg:table-cell">Remarks (Why)</th>
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
                                                <div className="flex flex-col">
                                                    <span className="font-mono text-white text-xs">{log.orderId}</span>
                                                    {log.transactionNo && (
                                                        <span className="text-[10px] text-[#666] font-mono">
                                                            Tx: {log.transactionNo}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 hidden md:table-cell">
                                                <span className="text-sm text-[#ccc]">{log.referenceNo || '-'}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded text-[10px] border font-mono ${getStatusColor(log.status)}`}>
                                                    {log.status || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 hidden sm:table-cell">
                                                <div className="flex flex-col">
                                                    <span className="text-white font-bold text-xs">
                                                        {parseFloat(log.amount || 0).toFixed(2)} {log.currency}
                                                    </span>
                                                    <span className="text-[10px] text-[#666]">{log.channel}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 hidden lg:table-cell max-w-[300px]">
                                                <p className="text-xs text-[#ccc] truncate" title={log.remarks}>{log.remarks}</p>
                                            </td>
                                            <td className="px-4 py-3 hidden xl:table-cell">
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-[#ccc]">{formatDate(log.createdAt)}</span>
                                                    <span className="text-[10px] text-[#666]">{timeAgo(log.createdAt)}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button 
                                                    onClick={() => openDetails(log)}
                                                    className="p-1.5 bg-[#444] hover:bg-[#555] rounded text-white transition"
                                                    title="View Full Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="p-8 text-center text-[#666]">
                                            No logs found matching criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="p-4 border-t border-[#3a3a3a] flex items-center justify-between bg-[#222]">
                        <div className="text-xs text-[#888]">
                            Showing <span className="text-white">{(page - 1) * limit + 1}</span> to <span className="text-white">{Math.min(page * limit, totalLogs)}</span> of <span className="text-white">{totalLogs}</span>
                        </div>
                        <div className="flex items-center gap-2">
                             <div className="flex items-center gap-2 mr-4">
                                <span className="text-xs text-[#888]">Per page:</span>
                                <select
                                    value={limit}
                                    onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                                    className="bg-[#333] border border-[#444] text-white text-xs rounded px-2 py-1 focus:border-[#FFCA20] outline-none cursor-pointer"
                                >
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>

                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 rounded bg-[#333] text-white disabled:opacity-50 hover:bg-[#444] transition"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-xs text-[#888] px-2">Page {page} of {totalPages}</span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-2 rounded bg-[#333] text-white disabled:opacity-50 hover:bg-[#444] transition"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* JSON Details Modal */}
            {showModal && selectedLog && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setShowModal(false)}>
                    <div className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-[#3a3a3a] flex justify-between items-center bg-[#222] rounded-t-xl">
                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Info className="w-5 h-5 text-[#FFCA20]" />
                                    Transaction Details
                                </h3>
                                <p className="text-sm text-[#888] font-mono mt-1">{selectedLog.orderId}</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-[#888] hover:text-white transition">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="space-y-4">
                                    <div className="bg-[#2a2a2a] p-4 rounded-lg border border-[#333]">
                                        <h4 className="text-[#FFCA20] text-sm font-bold mb-3 uppercase tracking-wider">Summary</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between border-b border-[#333] pb-2">
                                                <span className="text-[#888]">Status</span>
                                                <span className={selectedLog.isSuccess ? "text-green-500 font-bold" : "text-red-500 font-bold"}>
                                                    {selectedLog.isSuccess ? 'SUCCESS' : 'FAILED'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between border-b border-[#333] pb-2">
                                                <span className="text-[#888]">MolPay Status</span>
                                                <span className="text-white font-mono">{selectedLog.status}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-[#333] pb-2">
                                                <span className="text-[#888]">Amount</span>
                                                <span className="text-white font-bold">{selectedLog.amount} {selectedLog.currency}</span>
                                            </div>
                                            <div className="flex justify-between pt-1">
                                                <span className="text-[#888]">Channel</span>
                                                <span className="text-white uppercase">{selectedLog.channel}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-[#2a2a2a] p-4 rounded-lg border border-[#333]">
                                        <h4 className="text-[#FFCA20] text-sm font-bold mb-3 uppercase tracking-wider">Request Info</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between border-b border-[#333] pb-2">
                                                <span className="text-[#888]">Method</span>
                                                <span className="text-white font-mono bg-[#333] px-2 rounded text-xs">{selectedLog.method}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-[#333] pb-2">
                                                <span className="text-[#888]">IP Address</span>
                                                <span className="text-white font-mono text-xs">{selectedLog.ipAddress}</span>
                                            </div>
                                            <div className="flex justify-between pt-1">
                                                <span className="text-[#888]">User Agent</span>
                                                <span className="text-white text-xs truncate max-w-[200px]" title={selectedLog.userAgent}>{selectedLog.userAgent}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[#2a2a2a] p-4 rounded-lg border border-[#333]">
                                    <h4 className="text-[#FFCA20] text-sm font-bold mb-3 uppercase tracking-wider">System Remarks</h4>
                                    <div className="bg-[#111] p-3 rounded border border-[#333] text-sm text-gray-300 min-h-[100px]">
                                        {selectedLog.remarks}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-[#FFCA20] text-sm font-bold mb-3 uppercase tracking-wider">Raw Return Data (MolPay)</h4>
                                <div className="bg-[#111] p-4 rounded-lg border border-[#333] overflow-x-auto">
                                    <pre className="text-xs font-mono text-green-400 whitespace-pre-wrap">
                                        {JSON.stringify(selectedLog.returnData, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-4 border-t border-[#3a3a3a] bg-[#222] flex justify-end">
                            <button 
                                onClick={() => setShowModal(false)}
                                className="px-6 py-2 bg-[#333] hover:bg-[#444] text-white rounded-lg transition"
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
