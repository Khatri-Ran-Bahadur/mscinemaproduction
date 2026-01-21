"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, X, Clock, CheckCircle, XCircle } from 'lucide-react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import TicketModal from '@/components/TicketModal';
import { getUserData } from '@/utils/storage';
import { booking } from '@/services/api';
import Loader from '@/components/Loader';

export default function MyTicketsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('All');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [ticketData, setTicketData] = useState(null);
    const [isLoadingTicket, setIsLoadingTicket] = useState(false);
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Get status label and color
    const getStatusInfo = (status) => {
        switch(status) {
            case 1:
                return { label: 'Processing', color: 'text-yellow-400', bgColor: 'bg-yellow-400/10', borderColor: 'border-yellow-400/30', icon: Clock };
            case 2:
                return { label: 'Success', color: 'text-green-400', bgColor: 'bg-green-400/10', borderColor: 'border-green-400/30', icon: CheckCircle };
            case 3:
                return { label: 'Failed', color: 'text-red-400', bgColor: 'bg-red-400/10', borderColor: 'border-red-400/30', icon: XCircle };
            default:
                return { label: 'Unknown', color: 'text-gray-400', bgColor: 'bg-gray-400/10', borderColor: 'border-gray-400/30', icon: Clock };
        }
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch (e) {
            return dateString;
        }
    };

    // Format datetime
    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return 'N/A';
        try {
            // Check if ISO string, replace T with space for easier parsing if needed, but Date constructor handles T
            const date = new Date(dateTimeString);
            
            // Check for Invalid Date
            if (isNaN(date.getTime())) {
                // Try parsing custom formats if needed, or return original
                // For now, assume common formats
                const parts = dateTimeString.split(/[- :T]/);
                if (parts.length >= 6) {
                   const d = new Date(parts[0], parts[1]-1, parts[2], parts[3], parts[4], parts[5]);
                   if (!isNaN(d.getTime())) {
                       return d.toLocaleString('en-GB', { 
                           day: 'numeric', 
                           month: 'short', 
                           year: 'numeric',
                           hour: '2-digit',
                           minute: '2-digit',
                           hour12: true
                       });
                   }
                }
                return dateTimeString;
            }

            return date.toLocaleString('en-GB', { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch (e) {
            return dateTimeString;
        }
    };

    // Load bookings from API
    useEffect(() => {
        const loadBookings = async () => {
            setIsLoading(true);
            setError('');
            try {
                const userData = getUserData();
                if (!userData || !userData.userID) {
                    setError('User not logged in');
                    setIsLoading(false);
                    return;
                }

                const data = await booking.getMyBookings(userData.userID);
                
                // Transform API data to match expected format
                const transformedBookings = Array.isArray(data) ? data.map((booking) => ({
                    id: booking.BookingID || booking.bookingID || booking.id,
                    bookingId: booking.BookingID || booking.bookingID,
                    referenceNo: booking.ReferenceNo || booking.referenceNo,
                    bookingDateTime: booking.BookingDateTime || booking.bookingDateTime,
                    cinemaName: booking.CinemaName || booking.cinemaName,
                    movieName: booking.MovieName || booking.movieName,
                    type: booking.Type || booking.type,
                    showDate: booking.ShowDate || booking.showDate,
                    showTime: booking.ShowTime || booking.showTime,
                    status: booking.Status || booking.status,
                    cinemaID: booking.CinemaID || booking.cinemaID,
                    showID: booking.ShowID || booking.showID,
                })) : [];

                setBookings(transformedBookings);
            } catch (err) {
                console.error('Error loading bookings:', err);
                setError(err.message || 'Failed to load bookings. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        loadBookings();
    }, []);

    // Filter bookings by status
    const getFilteredBookings = () => {
        if (activeTab === 'All') {
            return bookings;
        } else if (activeTab === 'Processing') {
            return bookings.filter(b => b.status === 1);
        } else if (activeTab === 'Success') {
            return bookings.filter(b => b.status === 2);
        } else if (activeTab === 'Failed') {
            return bookings.filter(b => b.status === 3);
        }
        return bookings;
    };

    // Sample ticket data - kept for modal structure if needed
    const tickets = {
        Upcoming: [
            {
                id: 1,
                movieTitle: "PREDATOR: BADLANDS",
                movieImage: "img/movies1.png",
                genre: "Action, Sci-Fi",
                duration: "1 hr 50 mins",
                language: "English",
                cinema: "Kampar Putra",
                experience: "IMAX",
                date: "12 Nov 2025",
                time: "1:15 PM",
                cinemaId: "TC9200334477",
                showId: "TE7088112233",
                bookingId: "TB8199225566",
                referenceNo: "TR0011HA5665",
                status: "Confirmed",
                // Booking Summary Details
                seats: [
                    { type: "Adult", seat: "H3" },
                    { type: "Student", seat: "H4" }
                ],
                netPrice: 40.80,
                tax: 4.00,
                totalTicketPrice: 44.80,
                reservationFee: 2.10,
                grandTotal: 46.90,
                bookingDate: "Nov 05 2025",
                bookingTime: "10:27 AM",
                transactionId: "TC9200334477",
                paymentMethod: "Net banking",
                paymentStatus: "Successful"
            },
            {
                id: 2,
                movieTitle: "PREDATOR: BADLANDS",
                movieImage: "img/movies1.png",
                genre: "Action, Sci-Fi",
                duration: "1 hr 50 mins",
                language: "English",
                cinema: "Kampar putra",
                experience: "IMAX",
                date: "12 Nov 2025",
                time: "1:15 PM",
                cinemaId: "TC9200334477",
                showId: "TE7088112233",
                bookingId: "TB8199225566",
                referenceNo: "TR0011HA5665",
                status: "Confirmed",
                seats: [
                    { type: "Adult", seat: "H3" },
                    { type: "Student", seat: "H4" }
                ],
                netPrice: 40.80,
                tax: 4.00,
                totalTicketPrice: 44.80,
                reservationFee: 2.10,
                grandTotal: 46.90,
                bookingDate: "Nov 05 2025",
                bookingTime: "10:27 AM",
                transactionId: "TC9200334477",
                paymentMethod: "Net banking",
                paymentStatus: "Successful"
            },
            {
                id: 3,
                movieTitle: "PREDATOR: BADLANDS",
                movieImage: "img/movies1.png",
                genre: "Action, Sci-Fi",
                duration: "1 hr 50 mins",
                language: "English",
                cinema: "Kampar putra",
                experience: "IMAX",
                date: "12 Nov 2025",
                time: "1:15 PM",
                cinemaId: "TC9200334477",
                showId: "TE7088112233",
                bookingId: "TB8199225566",
                referenceNo: "TR0011HA5665",
                status: "Confirmed",
                seats: [
                    { type: "Adult", seat: "H3" },
                    { type: "Student", seat: "H4" }
                ],
                netPrice: 40.80,
                tax: 4.00,
                totalTicketPrice: 44.80,
                reservationFee: 2.10,
                grandTotal: 46.90,
                bookingDate: "Nov 05 2025",
                bookingTime: "10:27 AM",
                transactionId: "TC9200334477",
                paymentMethod: "Net banking",
                paymentStatus: "Successful"
            },
            {
                id: 4,
                movieTitle: "PREDATOR: BADLANDS",
                movieImage: "img/movies1.png",
                genre: "Action, Sci-Fi",
                duration: "1 hr 50 mins",
                language: "English",
                cinema: "Kampar putra",
                experience: "IMAX",
                date: "12 Nov 2025",
                time: "1:15 PM",
                cinemaId: "TC9200334477",
                showId: "TE7088112233",
                bookingId: "TB8199225566",
                referenceNo: "TR0011HA5665",
                status: "Confirmed",
                seats: [
                    { type: "Adult", seat: "H3" },
                    { type: "Student", seat: "H4" }
                ],
                netPrice: 40.80,
                tax: 4.00,
                totalTicketPrice: 44.80,
                reservationFee: 2.10,
                grandTotal: 46.90,
                bookingDate: "Nov 05 2025",
                bookingTime: "10:27 AM",
                transactionId: "TC9200334477",
                paymentMethod: "Net banking",
                paymentStatus: "Successful"
            },
            {
                id: 5,
                movieTitle: "PREDATOR: BADLANDS",
                movieImage: "img/movies1.png",
                genre: "Action, Sci-Fi",
                duration: "1 hr 50 mins",
                language: "English",
                cinema: "Kampar putra",
                experience: "IMAX",
                date: "12 Nov 2025",
                time: "1:15 PM",
                cinemaId: "TC9200334477",
                showId: "TE7088112233",
                bookingId: "TB8199225566",
                referenceNo: "TR0011HA5665",
                status: "Confirmed",
                seats: [
                    { type: "Adult", seat: "H3" },
                    { type: "Student", seat: "H4" }
                ],
                netPrice: 40.80,
                tax: 4.00,
                totalTicketPrice: 44.80,
                reservationFee: 2.10,
                grandTotal: 46.90,
                bookingDate: "Nov 05 2025",
                bookingTime: "10:27 AM",
                transactionId: "TC9200334477",
                paymentMethod: "Net banking",
                paymentStatus: "Successful"
            },
            {
                id: 6,
                movieTitle: "PREDATOR: BADLANDS",
                movieImage: "img/movies1.png",
                genre: "Action, Sci-Fi",
                duration: "1 hr 50 mins",
                language: "English",
                cinema: "Kampar putra",
                experience: "IMAX",
                date: "12 Nov 2025",
                time: "1:15 PM",
                cinemaId: "TC9200334477",
                showId: "TE7088112233",
                bookingId: "TB8199225566",
                referenceNo: "TR0011HA5665",
                status: "Confirmed",
                seats: [
                    { type: "Adult", seat: "H3" },
                    { type: "Student", seat: "H4" }
                ],
                netPrice: 40.80,
                tax: 4.00,
                totalTicketPrice: 44.80,
                reservationFee: 2.10,
                grandTotal: 46.90,
                bookingDate: "Nov 05 2025",
                bookingTime: "10:27 AM",
                transactionId: "TC9200334477",
                paymentMethod: "Net banking",
                paymentStatus: "Successful"
            }
        ],
        Past: [],
        Cancelled: []
    };

    const filteredBookings = getFilteredBookings();

    const handleViewTransaction = async (bookingItem) => {
        setSelectedTicket(bookingItem);
        setShowModal(true);
        
        // Fetch ticket data for TicketModal
        if (bookingItem.cinemaID && bookingItem.showID && bookingItem.referenceNo) {
            setIsLoadingTicket(true);
            try {
                const fetchedTicketData = await booking.getTickets(
                    bookingItem.cinemaID,
                    bookingItem.showID,
                    bookingItem.referenceNo
                );
                if (fetchedTicketData) {
                    setTicketData(fetchedTicketData);
                    setShowTicketModal(true);
                    setShowModal(false); // Close booking summary modal
                }
            } catch (err) {
                console.error('Error fetching ticket data:', err);
                // Keep booking summary modal open if ticket fetch fails
            } finally {
                setIsLoadingTicket(false);
            }
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedTicket(null);
    };

    const handleCloseTicketModal = () => {
        setShowTicketModal(false);
        setTicketData(null);
    };

    const handleCancelTicket = () => {
        // Add cancel ticket logic here
        console.log('Cancel ticket:', selectedTicket?.bookingId);
        // After cancellation, close modal and refresh tickets
        handleCloseModal();
    };

    return (
        <div className="min-h-screen bg-black text-[#FAFAFA]">
            <Header />

            {/* Main Content */}
            <div className="pt-24 pb-16">
                <div className="container mx-auto px-6">
                    {/* Back Button and Title */}
                    <div className="mb-8">
                        {/* <button
                            onClick={() => router.back()}
                            className="mb-6 text-[#FAFAFA] hover:text-[#FFCA20] flex items-center gap-2 transition"
                        >
                            <ChevronLeft className="w-5 h-5" />
                            <span>Back</span>
                        </button> */}
                        <h1 className="text-3xl md:text-4xl font-bold text-[#FAFAFA] mb-6 text-center md:text-left">
                            My tickets
                        </h1>
                    </div>

                    {/* Loading State */}
                    {isLoading && (
                        <div className="text-center py-16">
                            <Loader size="default" />
                        </div>
                    )}

                    {/* Error State */}
                    {error && !isLoading && (
                        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    {/* Tabs */}
                    {!isLoading && (
                        <div className="flex gap-8 border-b border-[#3a3a3a] mb-8 justify-center md:justify-start overflow-x-auto">
                            <button
                                onClick={() => setActiveTab('All')}
                                className={`pb-4 px-2 text-sm font-medium transition relative whitespace-nowrap ${
                                    activeTab === 'All' 
                                        ? 'text-[#FFCA20]' 
                                        : 'text-[#D3D3D3] hover:text-[#FAFAFA]'
                                }`}
                            >
                                All
                                {activeTab === 'All' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFCA20]"></div>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('Processing')}
                                className={`pb-4 px-2 text-sm font-medium transition relative whitespace-nowrap ${
                                    activeTab === 'Processing' 
                                        ? 'text-[#FFCA20]' 
                                        : 'text-[#D3D3D3] hover:text-[#FAFAFA]'
                                }`}
                            >
                                Processing
                                {activeTab === 'Processing' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFCA20]"></div>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('Success')}
                                className={`pb-4 px-2 text-sm font-medium transition relative whitespace-nowrap ${
                                    activeTab === 'Success' 
                                        ? 'text-[#FFCA20]' 
                                        : 'text-[#D3D3D3] hover:text-[#FAFAFA]'
                                }`}
                            >
                                Success
                                {activeTab === 'Success' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFCA20]"></div>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('Failed')}
                                className={`pb-4 px-2 text-sm font-medium transition relative whitespace-nowrap ${
                                    activeTab === 'Failed' 
                                        ? 'text-[#FFCA20]' 
                                        : 'text-[#D3D3D3] hover:text-[#FAFAFA]'
                                }`}
                            >
                                Failed
                                {activeTab === 'Failed' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFCA20]"></div>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Tickets List */}
                    {!isLoading && (
                        <div className="space-y-4">
                            {filteredBookings.length > 0 ? (
                                filteredBookings.map((booking) => {
                                    const statusInfo = getStatusInfo(booking.status);
                                    const StatusIcon = statusInfo.icon;
                                    
                                    return (
                                        <div
                                            key={booking.id || booking.bookingId}
                                            className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-6 hover:border-[#FFCA20]/50 transition"
                                        >
                                            <div className="flex flex-col md:flex-row gap-6">
                                                {/* Movie Poster Placeholder */}
                                                <div className="flex-shrink-0">
                                                    <div className="w-20 h-28 md:w-24 md:h-32 bg-[#3a3a3a] rounded flex items-center justify-center">
                                                        <span className="text-[#D3D3D3] text-xs text-center px-2">{booking.movieName || 'Movie'}</span>
                                                    </div>
                                                </div>

                                                {/* Ticket Details */}
                                                <div className="flex-1 flex flex-col gap-4">
                                                    {/* Top Row - Movie Info */}
                                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                                        <div className="flex-1">
                                                            <h3 className="text-xl md:text-2xl font-bold text-[#FAFAFA] mb-2">
                                                                {booking.movieName || 'Unknown Movie'}
                                                            </h3>
                                                            <div className="flex flex-wrap items-center gap-2 text-sm text-[#D3D3D3]">
                                                                <span>Type: {booking.type || 'N/A'}</span>
                                                                <span className="text-[#D3D3D3]/30">|</span>
                                                                <span>Cinema: {booking.cinemaName || 'N/A'}</span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleViewTransaction(booking)}
                                                            className="bg-[#FFCA20] text-black px-4 py-2 rounded font-semibold hover:bg-[#FFCA20]/90 transition text-sm whitespace-nowrap"
                                                        >
                                                            View Details
                                                        </button>
                                                    </div>

                                                    {/* Middle Row - Show Date & Time */}
                                                    <div className="flex flex-col md:flex-row md:items-center gap-4 text-sm text-[#D3D3D3]">
                                                        <div className="flex items-center gap-2">
                                                            <span>Show Date: <span className="text-[#FAFAFA]">{formatDate(booking.showDate)}</span></span>
                                                            <span className="text-[#D3D3D3]/30">|</span>
                                                            <span>Show Time: <span className="text-[#FAFAFA]">{booking.showTime || 'N/A'}</span></span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span>Booking Date: <span className="text-[#FAFAFA]">{formatDateTime(booking.bookingDateTime)}</span></span>
                                                        </div>
                                                    </div>

                                                    {/* Bottom Row - Booking Info */}
                                                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#D3D3D3] pt-2 border-t border-[#3a3a3a]">
                                                        <span>Cinema ID: <span className="text-[#FAFAFA]">{booking.cinemaID || 'N/A'}</span></span>
                                                        <span>Show ID: <span className="text-[#FAFAFA]">{booking.showID || 'N/A'}</span></span>
                                                        <span>Booking ID: <span className="text-[#FAFAFA]">{booking.bookingId || 'N/A'}</span></span>
                                                        <span>Reference No: <span className="text-[#FAFAFA]">{booking.referenceNo || 'N/A'}</span></span>
                                                        <div className="ml-auto flex items-center gap-2">
                                                            <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
                                                            <span className={`${statusInfo.color} font-semibold`}>
                                                                {statusInfo.label}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-16 text-[#D3D3D3]">
                                    <p className="text-lg">No {activeTab.toLowerCase()} bookings found.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Ticket Modal */}
            <TicketModal
                ticketData={ticketData}
                isOpen={showTicketModal}
                onClose={handleCloseTicketModal}
            />

            {/* Booking Summary Modal (keep for now, can be removed later) */}
            {showModal && selectedTicket && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="relative w-full max-w-2xl bg-[#2a2a2a] rounded-lg border border-[#3a3a3a] my-8">
                        {/* Close Button */}
                        <button
                            onClick={handleCloseModal}
                            className="absolute top-4 right-4 text-[#D3D3D3] hover:text-[#FAFAFA] transition z-10"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="p-6 md:p-8">
                            <h2 className="text-2xl font-bold text-[#FAFAFA] mb-6">Booking Summary</h2>

                            {/* Movie Details */}
                            <div className="flex flex-col md:flex-row gap-6 mb-6 pb-6 border-b border-[#3a3a3a]">
                                <div className="flex-shrink-0">
                                    <img
                                        src={selectedTicket.movieImage}
                                        alt={selectedTicket.movieTitle}
                                        className="w-32 h-48 object-cover rounded"
                                        onError={(e) => { e.target.src = 'img/movies1.png'; }}
                                    />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl md:text-2xl font-bold text-[#FAFAFA] mb-3">
                                        {selectedTicket.movieTitle}
                                    </h3>
                                    <div className="space-y-2 text-sm text-[#D3D3D3]">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span>{selectedTicket.genre}</span>
                                            <span className="text-[#D3D3D3]/30">|</span>
                                            <span>{selectedTicket.duration}</span>
                                            <span className="text-[#D3D3D3]/30">|</span>
                                            <span>{selectedTicket.language}</span>
                                        </div>
                                        <div>
                                            <span className="text-[#FAFAFA]">Cinema: </span>
                                            <span>{selectedTicket.cinema}</span>
                                        </div>
                                        <div>
                                            <span className="text-[#FAFAFA]">Screen: </span>
                                            <span>{selectedTicket.experience}</span>
                                        </div>
                                        <div>
                                            <span className="text-[#FAFAFA]">Showtime: </span>
                                            <span>{selectedTicket.date}, {selectedTicket.time}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Seat Info */}
                            <div className="mb-6 pb-6 border-b border-[#3a3a3a]">
                                <h4 className="text-lg font-semibold text-[#FAFAFA] mb-3">Seat Info</h4>
                                <div className="flex flex-wrap gap-3">
                                    {selectedTicket.seats?.map((seat, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <span className="text-[#D3D3D3]">{seat.type}:</span>
                                            <span className="bg-[#FFCA20]/20 border border-[#FFCA20] text-[#FFCA20] px-3 py-1 rounded font-semibold">
                                                {seat.seat}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Ticket Price */}
                            <div className="mb-6 pb-6 border-b border-[#3a3a3a]">
                                <h4 className="text-lg font-semibold text-[#FAFAFA] mb-3">Ticket Price</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between text-[#D3D3D3]">
                                        <span>Net Price ({selectedTicket.seats?.length || 0} X Ticket(s))</span>
                                        <span className="text-[#FAFAFA]">RM {selectedTicket.netPrice?.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-[#D3D3D3]">
                                        <span>Tax</span>
                                        <span className="text-[#FAFAFA]">RM {selectedTicket.tax?.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-[#FAFAFA] font-semibold pt-2 border-t border-[#3a3a3a]">
                                        <span>Total Ticket Price</span>
                                        <span>RM {selectedTicket.totalTicketPrice?.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Details */}
                            <div className="mb-6 pb-6 border-b border-[#3a3a3a]">
                                <h4 className="text-lg font-semibold text-[#FAFAFA] mb-3">Payment Details</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between text-[#D3D3D3]">
                                        <span>Sub Total</span>
                                        <span className="text-[#FAFAFA]">RM {selectedTicket.totalTicketPrice?.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-[#D3D3D3]">
                                        <span>RESERVATION FEE</span>
                                        <span className="text-[#FAFAFA]">RM {selectedTicket.reservationFee?.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-[#FAFAFA] font-semibold pt-2 border-t border-[#3a3a3a]">
                                        <span>Grand total</span>
                                        <span>RM {selectedTicket.grandTotal?.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Booking Details */}
                            <div className="mb-6 pb-6 border-b border-[#3a3a3a]">
                                <h4 className="text-lg font-semibold text-[#FAFAFA] mb-3">Booking Details</h4>
                                <div className="space-y-2 text-sm text-[#D3D3D3]">
                                    <div className="flex justify-between">
                                        <span>Date of booking</span>
                                        <span className="text-[#FAFAFA]">{selectedTicket.bookingDate}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Time of booking</span>
                                        <span className="text-[#FAFAFA]">{selectedTicket.bookingTime}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Status</span>
                                        <span className="text-green-500 font-semibold">{selectedTicket.status}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Transaction Details */}
                            <div className="mb-6">
                                <h4 className="text-lg font-semibold text-[#FAFAFA] mb-3">Transaction Details</h4>
                                <div className="space-y-2 text-sm text-[#D3D3D3]">
                                    <div className="flex justify-between">
                                        <span>Transaction ID</span>
                                        <span className="text-[#FAFAFA]">{selectedTicket.transactionId}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Payment method</span>
                                        <span className="text-[#FAFAFA]">{selectedTicket.paymentMethod}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Payment status</span>
                                        <span className="text-green-500 font-semibold">{selectedTicket.paymentStatus}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Cancel Ticket Button */}
                            <button
                                onClick={handleCancelTicket}
                                className="w-full border-2 border-red-500 text-red-500 bg-transparent py-3 rounded font-semibold hover:bg-red-500/10 transition"
                            >
                                Cancel ticket
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}
