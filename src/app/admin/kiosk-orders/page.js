"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  CreditCard,
  Film,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Trash2,
  RotateCcw,
  Mail,
  RefreshCw,
  Monitor,
  QrCode,
} from "lucide-react";
import TicketModal from "@/components/TicketModal";
import OrderDetailsModal from "@/components/admin/OrderDetailsModal";
import { booking } from "@/services/api";
import { adminFetch } from "@/utils/admin-api";
import { formatMalaysiaShowDateTime } from "@/utils/dateformatter";

export default function AdminKioskOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("All");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
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
  const [totalAmountSum, setTotalAmountSum] = useState(0);
  const [paidAmountSum, setPaidAmountSum] = useState(0);
  const [unpaidAmountSum, setUnpaidAmountSum] = useState(0);

  // Status Modal State
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusOrder, setStatusOrder] = useState(null);
  const [newPaymentStatus, setNewPaymentStatus] = useState("PENDING");
  const [newBookingStatus, setNewBookingStatus] = useState("PENDING");

  // Action Menu State
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchOrders();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [
    page,
    limit,
    searchQuery,
    filterStatus,
    filterPaymentStatus,
    filterPaymentMethod,
    startDate,
    endDate,
  ]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: searchQuery,
        status: filterStatus,
        paymentStatus: filterPaymentStatus,
        buyFrom: "kiosk", // Strictly locked to Kiosk orders
        startDate: startDate,
        endDate: endDate,
      });

      const res = await adminFetch(`/api/admin/orders?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        let list = data.orders || [];
        if (filterPaymentMethod !== "All") {
          list = list.filter((o) =>
            (o.paymentMethod || "").toUpperCase().includes(filterPaymentMethod.toUpperCase())
          );
        }
        setOrders(list);
        setTotalAmountSum(data.totalAmountSum || 0);
        setPaidAmountSum(data.paidAmountSum || 0);
        setUnpaidAmountSum(data.unpaidAmountSum || 0);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalOrders(data.pagination.total);
        }
      } else {
        setOrders([]);
        setTotalAmountSum(0);
        setPaidAmountSum(0);
        setUnpaidAmountSum(0);
      }
    } catch (error) {
      console.error("Failed to fetch kiosk orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handleReset = () => {
    setSearchQuery("");
    setFilterStatus("All");
    setFilterPaymentStatus("All");
    setFilterPaymentMethod("All");
    setStartDate("");
    setEndDate("");
    setPage(1);
    setSelectedOrders([]);
  };

  const handleSelectOrder = (orderId) => {
    setSelectedOrders((prev) => {
      if (prev.includes(orderId)) {
        return prev.filter((id) => id !== orderId);
      } else {
        return [...prev, orderId];
      }
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedOrders(orders.map((order) => order.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleDeleteSingle = async (orderId) => {
    if (!confirm("Are you sure you want to delete this kiosk order?")) return;

    setIsDeleting(true);
    try {
      const res = await adminFetch("/api/admin/orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [orderId] }),
      });

      const data = await res.json();
      if (data.success) {
        alert("Kiosk order deleted successfully");
        fetchOrders();
        setSelectedOrders([]);
      } else {
        alert("Failed to delete kiosk order");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete kiosk order");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedOrders.length === 0) {
      alert("Please select orders to delete");
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedOrders.length} kiosk order(s)?`)) return;

    setIsDeleting(true);
    try {
      const res = await adminFetch("/api/admin/orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedOrders }),
      });

      const data = await res.json();
      if (data.success) {
        alert(`${data.count} kiosk order(s) deleted successfully`);
        fetchOrders();
        setSelectedOrders([]);
      } else {
        alert("Failed to delete kiosk orders");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete kiosk orders");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenViewModal = (order) => {
    setViewOrder(order);
    setShowViewOrderModal(true);
  };

  const handleViewTicket = async (order) => {
    setSelectedOrder(order);
    if (order.cinemaId && order.showId && order.referenceNo) {
      try {
        const fetchedData = await booking.getTickets(
          order.cinemaId,
          order.showId,
          order.referenceNo
        );
        if (fetchedData) {
          const enrichedTicketData = {
            ...fetchedData,
            bookingDetails: {
              ...fetchedData.bookingDetails,
              hallName: order.hallName || fetchedData.bookingDetails?.hallName,
            },
          };
          setTicketData(enrichedTicketData);
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
    setNewPaymentStatus(order.paymentStatus || "PENDING");
    setNewBookingStatus(order.status || "PENDING");
    setShowStatusModal(true);
  };

  const confirmStatusUpdate = async () => {
    if (!statusOrder) return;
    try {
      const res = await adminFetch(`/api/admin/orders/${statusOrder.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentStatus: newPaymentStatus,
          status: newBookingStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Status updated successfully");
        setShowStatusModal(false);
        fetchOrders();
      } else {
        alert(data.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status");
    }
  };

  const handleResendEmail = async (order) => {
    if (!order.customerEmail) {
      alert("This kiosk order does not have an email address associated with it.");
      return;
    }
    if (!confirm(`Resend confirmation email to ${order.customerEmail}?`)) return;

    setActionLoading(true);
    setProcessingId(order.id);
    try {
      const res = await adminFetch(`/api/admin/orders/${order.id}/resend-email`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        alert("Ticket email sent successfully!");
        fetchOrders();
      } else {
        alert(data.error || "Failed to send ticket email");
      }
    } catch (err) {
      alert("Error sending ticket email");
    } finally {
      setActionLoading(false);
      setProcessingId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleString("en-US", {
        timeZone: "Asia/Kuala_Lumpur",
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch (e) {
      return dateString;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "CONFIRMED":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "PENDING":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "CANCELLED":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "REFUNDED":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const getPaymentBadge = (method) => {
    const m = (method || "").toUpperCase();
    if (m.includes("CARD") || m.includes("EDC")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <CreditCard className="w-3 h-3" /> CardBiz EDC
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <QrCode className="w-3 h-3" /> Fiuu OPA QR
      </span>
    );
  };

  return (
    <div className="p-8 relative">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-[#FFCA20]">
              Kiosk Orders & Ticketing
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FFCA20]/15 text-[#FFCA20] border border-[#FFCA20]/30 shadow-sm">
              <Monitor className="w-3.5 h-3.5" /> Self-Service Machine
            </span>
          </div>
          <p className="text-[#888] mt-1 text-sm">
            Manage, audit, and view tickets booked directly via cinema Kiosk terminals
          </p>
        </div>

        {selectedOrders.length > 0 && (
          <button
            onClick={handleBulkDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition disabled:opacity-50 text-sm"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Selected ({selectedOrders.length})</span>
          </button>
        )}
      </div>

      {/* Dedicated Filter Bar (Placed below the title) */}
      <div className="bg-[#242424] border border-[#3a3a3a] p-4 rounded-xl mb-6 shadow-md">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#888]" />
            <input
              type="text"
              placeholder="Search Kiosk order, ref, seat, movie..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-white pl-10 pr-4 py-2.5 rounded-lg focus:border-[#FFCA20] outline-none text-sm placeholder-[#666]"
            />
          </div>

          {/* Date Range */}
          <div className="flex items-center bg-[#1e1e1e] border border-[#3a3a3a] rounded-lg px-3 py-1 gap-2">
            <span className="text-[11px] text-[#888] uppercase font-bold">From</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-white py-1.5 text-xs outline-none cursor-pointer [color-scheme:dark]"
            />
            <span className="text-[#444]">|</span>
            <span className="text-[11px] text-[#888] uppercase font-bold">To</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-white py-1.5 text-xs outline-none cursor-pointer [color-scheme:dark]"
            />
          </div>

          {/* Booking Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#1e1e1e] border border-[#3a3a3a] text-white px-3 py-2.5 rounded-lg focus:border-[#FFCA20] outline-none cursor-pointer text-sm"
          >
            <option value="All">All Booking Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PENDING">Pending</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REFUNDED">Refunded</option>
          </select>

          {/* Payment Status */}
          <select
            value={filterPaymentStatus}
            onChange={(e) => setFilterPaymentStatus(e.target.value)}
            className="bg-[#1e1e1e] border border-[#3a3a3a] text-white px-3 py-2.5 rounded-lg focus:border-[#FFCA20] outline-none cursor-pointer text-sm"
          >
            <option value="All">All Payment Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>

          {/* Payment Method */}
          <select
            value={filterPaymentMethod}
            onChange={(e) => setFilterPaymentMethod(e.target.value)}
            className="bg-[#1e1e1e] border border-[#3a3a3a] text-white px-3 py-2.5 rounded-lg focus:border-[#FFCA20] outline-none cursor-pointer text-sm"
          >
            <option value="All">All Kiosk Methods</option>
            <option value="QR">Fiuu Dynamic QR</option>
            <option value="CARD">CardBiz EDC (Card)</option>
          </select>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#333] border border-[#444] text-white rounded-lg hover:bg-[#444] hover:text-[#FFCA20] transition text-sm font-medium"
            title="Reset Filters"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#2a2a2a] border border-[#3a3a3a] p-4 rounded-xl">
          <div className="flex justify-between items-center text-[#888] mb-2">
            <span className="text-xs font-semibold uppercase">Total Kiosk Orders</span>
            <Monitor className="w-4 h-4 text-[#FFCA20]" />
          </div>
          <div className="text-2xl font-bold text-white">{totalOrders}</div>
        </div>

        <div className="bg-[#2a2a2a] border border-[#3a3a3a] p-4 rounded-xl">
          <div className="flex justify-between items-center text-[#888] mb-2">
            <span className="text-xs font-semibold uppercase">Total Kiosk Revenue</span>
            <CreditCard className="w-4 h-4 text-[#FFCA20]" />
          </div>
          <div className="text-2xl font-bold text-[#FFCA20]">
            RM {totalAmountSum.toFixed(2)}
          </div>
        </div>

        <div className="bg-[#2a2a2a] border border-green-500/20 bg-green-500/5 p-4 rounded-xl">
          <div className="flex justify-between items-center text-green-400 mb-2">
            <span className="text-xs font-semibold uppercase">Paid Amount</span>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-green-400">
            RM {paidAmountSum.toFixed(2)}
          </div>
        </div>

        <div className="bg-[#2a2a2a] border border-red-500/20 bg-red-500/5 p-4 rounded-xl">
          <div className="flex justify-between items-center text-red-400 mb-2">
            <span className="text-xs font-semibold uppercase">Cancelled / Unpaid</span>
            <XCircle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400">
            RM {unpaidAmountSum.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#3a3a3a] bg-[#222] text-[#888] text-xs uppercase font-semibold">
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={orders.length > 0 && selectedOrders.length === orders.length}
                    className="rounded border-[#444] bg-[#333] text-[#FFCA20] focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="p-4">Order ID / Ref No</th>
                <th className="p-4">Movie & Hall</th>
                <th className="p-4">Seats</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Payment Method</th>
                <th className="p-4">Booking Status</th>
                <th className="p-4">Date / Time</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#333] text-sm text-[#ccc]">
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-[#666]">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-[#FFCA20] border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading Kiosk orders...</span>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-[#666]">
                    No Kiosk orders found matching your filters.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const isPaid = order.paymentStatus === "PAID";
                  const isConfirmed = order.status === "CONFIRMED";

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-[#333]/50 transition duration-150"
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order.id)}
                          onChange={() => handleSelectOrder(order.id)}
                          className="rounded border-[#444] bg-[#333] text-[#FFCA20] focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="p-4">
                        <div
                          className="font-semibold text-white hover:text-[#FFCA20] cursor-pointer"
                          onClick={() => handleOpenViewModal(order)}
                        >
                          {order.orderId || "N/A"}
                        </div>
                        <div className="text-xs text-[#888] font-mono mt-0.5">
                          Ref: {order.referenceNo}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-white font-medium flex items-center gap-1.5">
                          <Film className="w-3.5 h-3.5 text-[#FFCA20]" />
                          <span>{order.movieTitle}</span>
                        </div>
                        <div className="text-xs text-[#888] mt-0.5">
                          {order.cinemaName} • {order.hallName}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded text-xs bg-[#333] border border-[#444] font-mono text-[#FFCA20]">
                          {order.seats || "-"}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-white">
                        RM {order.totalAmount ? Number(order.totalAmount).toFixed(2) : "0.00"}
                      </td>
                      <td className="p-4">
                        {getPaymentBadge(order.paymentMethod)}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {isConfirmed ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {order.status}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-[#888]">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="p-4 text-right relative">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenViewModal(order)}
                            className="p-1.5 hover:bg-[#444] rounded text-[#888] hover:text-white transition"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleViewTicket(order)}
                            className="p-1.5 hover:bg-[#444] rounded text-[#888] hover:text-[#FFCA20] transition"
                            title="View Ticket Modal"
                          >
                            <Film className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setOpenActionMenuId(openActionMenuId === order.id ? null : order.id)}
                            className="p-1.5 hover:bg-[#444] rounded text-[#888] hover:text-white transition"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Dropdown Menu */}
                        {openActionMenuId === order.id && (
                          <div className="absolute right-4 top-12 w-48 bg-[#222] border border-[#444] rounded-lg shadow-2xl py-1 z-30 text-left">
                            <button
                              onClick={() => {
                                handleStatusUpdate(order);
                                setOpenActionMenuId(null);
                              }}
                              className="w-full px-4 py-2 text-xs text-[#ccc] hover:bg-[#333] hover:text-white flex items-center gap-2"
                            >
                              <RefreshCw className="w-3.5 h-3.5" /> Change Status
                            </button>

                            {order.customerEmail && (
                              <button
                                onClick={() => {
                                  handleResendEmail(order);
                                  setOpenActionMenuId(null);
                                }}
                                className="w-full px-4 py-2 text-xs text-[#ccc] hover:bg-[#333] hover:text-white flex items-center gap-2"
                              >
                                <Mail className="w-3.5 h-3.5" /> Resend Ticket Email
                              </button>
                            )}

                            <button
                              onClick={() => {
                                handleDeleteSingle(order.id);
                                setOpenActionMenuId(null);
                              }}
                              className="w-full px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete Order
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-[#3a3a3a] flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#888]">
          <div>
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalOrders)} of {totalOrders} Kiosk orders
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

      {/* Modals */}
      {showTicketModal && ticketData && (
        <TicketModal
          isOpen={showTicketModal}
          onClose={() => setShowTicketModal(false)}
          ticketData={ticketData}
        />
      )}

      {showViewOrderModal && viewOrder && (
        <OrderDetailsModal
          isOpen={showViewOrderModal}
          onClose={() => setShowViewOrderModal(false)}
          order={viewOrder}
        />
      )}

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#222] border border-[#444] rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">
              Update Kiosk Order Status
            </h3>
            <p className="text-xs text-[#888] mb-4">
              Order: <span className="text-white font-mono">{statusOrder?.orderId}</span> (Ref: {statusOrder?.referenceNo})
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#888] uppercase mb-1">
                  Payment Status
                </label>
                <select
                  value={newPaymentStatus}
                  onChange={(e) => setNewPaymentStatus(e.target.value)}
                  className="w-full bg-[#333] border border-[#444] text-white p-2.5 rounded-lg text-sm"
                >
                  <option value="PAID">PAID</option>
                  <option value="PENDING">PENDING</option>
                  <option value="FAILED">FAILED</option>
                  <option value="REFUNDED">REFUNDED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#888] uppercase mb-1">
                  Booking Status
                </label>
                <select
                  value={newBookingStatus}
                  onChange={(e) => setNewBookingStatus(e.target.value)}
                  className="w-full bg-[#333] border border-[#444] text-white p-2.5 rounded-lg text-sm"
                >
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="PENDING">PENDING</option>
                  <option value="CANCELLED">CANCELLED</option>
                  <option value="REFUNDED">REFUNDED</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 bg-[#333] text-[#ccc] rounded-lg text-sm hover:bg-[#444]"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusUpdate}
                className="px-4 py-2 bg-[#FFCA20] text-black font-semibold rounded-lg text-sm hover:bg-[#e5b51d]"
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
