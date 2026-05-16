import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resendTicketEmail } from '@/utils/email';

const API_BASE_URL = process.env.API_BASE_URL || 'https://apiv5.mscinemas.my/api';

export async function POST(request, { params }) {
  try {
    const paramsData = await params;
    const id = parseInt(paramsData.id);
    
    if (isNaN(id)) {
        return NextResponse.json({ error: 'Invalid Order ID' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
        where: { id: id }
    });

    if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.paymentStatus !== 'PAID') {
        return NextResponse.json({ 
            error: 'Cannot send ticket email because the order status is not PAID.' 
        }, { status: 400 });
    }

    let apiTicketData = null;
    if (order.cinemaId && order.showId && order.referenceNo) {
        try {
            console.log(`Fetching tickets from API: ${API_BASE_URL}/Booking/GetTickets/${order.cinemaId}/${order.showId}/${order.referenceNo}`);
            const res = await fetch(`${API_BASE_URL}/Booking/GetTickets/${order.cinemaId}/${order.showId}/${order.referenceNo}`);
            if (res.ok) {
                apiTicketData = await res.json();
            } else {
                console.warn('API Fetch failed status:', res.status);
            }
        } catch (e) {
            console.warn('API Fetch Error:', e);
        }
    }

    const t = apiTicketData || {};
    
    // Extract booking info from nested bookingDetails if available
    const b = t.bookingDetails || {};

    // Stop if no ticket data was found (User requested: if not ticket no need to send)
    if (!t.bookingDetails && (!t.ticketDetails || t.ticketDetails.length === 0)) {
        return NextResponse.json({ 
            error: 'Cannot send ticket email because the ticket data could not be found in the Cinema API.' 
        }, { status: 404 });
    }

    const o = order;

    // Helper: Parse Seats from Order
    const getOrderSeats = () => {
        try {
             if (o.seats && (o.seats.startsWith('[') || o.seats.startsWith('{'))) {
                const parsed = JSON.parse(o.seats);
                if (Array.isArray(parsed)) {
                    // Check if array of strings or objects
                    if (typeof parsed[0] === 'object') return parsed.map(p => p.seatNo || p.SeatNo || '');
                    return parsed;
                }
                return Object.values(parsed);
             } else if (o.seats) {
                return o.seats.split(',').map(s => s.trim());
             }
        } catch(e) { return o.seats ? [o.seats] : []; }
        return [];
    };

    let finalSeatDisplay = [];
    let finalTicketDetails = t.TicketDetails || t.ticketDetails || [];
    
    if (finalTicketDetails.length > 0) {
        const groups = {};
        finalTicketDetails.forEach(d => {
            const type = d.TicketType || d.ticketType || d.Type || d.type || 'Standard';
            const seat = d.SeatNo || d.seatNo || d.Seat || d.seat || '';
            if (seat) {
                if (!groups[type]) groups[type] = [];
                groups[type].push(seat);
            }
        });
        finalSeatDisplay = Object.entries(groups).map(([type, seats]) => ({ type, seats }));
    } else {
        // Fallback Logic
        const seats = getOrderSeats();
        // Remove empty seat strings
        const validSeats = seats.filter(s => s);
        
        finalSeatDisplay = [{ type: 'Standard', seats: validSeats }];
        
        if (validSeats.length > 0) {
            const types = (o.ticketType || '').split(',').map(s => s.trim());
            const avgPrice = validSeats.length ? (parseFloat(o.totalAmount)/validSeats.length) : 0;
            
            finalTicketDetails = validSeats.map((s, i) => ({
                TicketType: types[i] || types[0] || 'Standard',
                SeatNo: s,
                Price: avgPrice,
                Surcharge: 0,
                TotalTicketPrice: avgPrice,
                // Add fallback fields for email util
                ticketTypeName: types[i] || types[0] || 'Standard',
                price: avgPrice,
                surcharge: 0
            }));
        }
    }

    const totalPersons = finalSeatDisplay.reduce((sum, g) => sum + g.seats.length, 0);

    // Format Dates: Use API strings if available, otherwise format DB Date object for Malaysia time
    const displayShowDate = b.showDate || t.ShowDate || t.showDate || (o.showTime instanceof Date ? o.showTime.toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur' }) : o.showTime) || '';
    const displayShowTime = b.showTime || t.ShowTime || t.showTime || (o.showTime instanceof Date ? o.showTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kuala_Lumpur' }) : o.showTime) || '';

    const ticketInfo = order.emailInfo ? 
        (typeof order.emailInfo === 'string' ? JSON.parse(order.emailInfo) : order.emailInfo) 
        : {
        customerName: b.name || t.CustomerName || t.customerName || o.customerName || 'Guest',
        customerEmail: b.email || t.CustomerEmail || o.customerEmail || 'N/A',
        customerPhone: b.mobileNo || t.CustomerPhone || o.customerPhone || 'N/A',
        
        movieName: b.movieName || t.MovieName || t.movieName || o.movieTitle || o.movieName || 'Unknown Movie',
        movieImage: t.MovieImage || t.movieImage || t.poster || '/img/banner.jpg',
        
        genre: t.Genre || t.genre || 'N/A',
        duration: t.Duration || t.duration || t.runningTime || 'N/A',
        language: t.Language || t.language || 'English',
        experienceType: t.ExperienceType || t.experienceType || 'Standard',
        
        hallName: t.HallName || t.hallName || o.hallName || 'Hall',
        cinemaName: b.cinemaName || t.CinemaName || t.cinemaName || o.cinemaName || 'MS Cinemas',
        
        showDate: displayShowDate,
        showTime: displayShowTime,
        
        bookingId: b.bookingID || o.bookingId || o.referenceNo || 'N/A',
        referenceNo: b.referenceNo || t.ReferenceNo || t.referenceNo || o.referenceNo || 'N/A',
        trackingId: t.TrackingID || t.trackingID || t.TransactionNo || o.transactionNo || 'N/A',
        
        seatDisplay: finalSeatDisplay,
        totalPersons: totalPersons,
        
        subCharge: parseFloat(t.SubCharge || t.subCharge || o.subCharge || 0),
        grandTotal: parseFloat(t.GrandTotal || t.grandTotal || o.totalAmount || 0),
        
        ticketDetails: finalTicketDetails
    };

    // CRITICAL: Always overwrite showDate and showTime with fresh API values
    ticketInfo.showDate = displayShowDate;
    ticketInfo.showTime = displayShowTime;

    const emailTo =  ticketInfo.customerEmail;
    if (!emailTo || emailTo === 'N/A') {
        return NextResponse.json({ error: 'No email address found.' }, { status: 400 });
    }

    console.log(`Resending ticket email to ${emailTo} (Ref: ${ticketInfo.referenceNo})`);
    
    // Use the resendTicketEmail helper (which reuses sendTicketEmail template logic)
    await resendTicketEmail(emailTo, ticketInfo);
    
    // Update isSendMail status
    await prisma.order.update({
        where: { id: id },
        data: { isSendMail: true }
    });
    
    return NextResponse.json({ success: true, message: 'Email sent successfully' });

  } catch (error) {
    console.error('Resend Email Error:', error);
    return NextResponse.json({ error: 'Failed to send email: ' + error.message }, { status: 500 });
  }
}