import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resendTicketEmail } from '@/utils/email';
import { API_CONFIG } from '@/config/api';

export const dynamic = 'force-dynamic';

/**
 * Get a fresh Bearer token for the given API using guest credentials.
 * Copied from release-locked-seats cron logic.
 */
async function getTokenForApi(apiBaseUrl, credentials) {
    const tokenUrl = `${apiBaseUrl}/APIUser/GetToken`;
    const res = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
        cache: 'no-store',
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`GetToken failed: ${res.status} ${text}`);
    }

    const data = await res.json();
    const token = data?.token || data?.Token || data?.accessToken || data?.access_token;
    if (!token) throw new Error('Token not found in GetToken response');
    return token;
}

/**
 * Fetch with Bearer token.
 * Copied from release-locked-seats cron logic.
 */
async function fetchWithAuth(url, token, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-api-key': API_CONFIG.API_SECRET_KEY,
        ...options.headers,
    };
    const res = await fetch(url, { ...options, headers });
    return res;
}

// Helper functions for normalization
const normalizeTime = (val) => {
    if (!val) return '';
    if (val instanceof Date) {
        return val.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    if (typeof val === 'string' && (val.length > 10 || val.includes('GMT') || val.includes('Time'))) {
        const d = new Date(val);
        if (!isNaN(d)) {
            return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        }
    }
    return val;
};

const normalizeDate = (val) => {
    if (!val) return '';
    if (val instanceof Date) return val.toISOString().split('T')[0];
    if (typeof val === 'string' && val.length > 10) {
         const d = new Date(val);
         if (!isNaN(d)) return d.toISOString().split('T')[0];
    }
    return val;
};

export async function GET(request) {
    try {
        // 1. CRON_SECRET validation
        const cronSecret = process.env.CRON_SECRET;
        if (cronSecret) {
            const reqSecret = request.headers.get('x-cron-secret') || new URL(request.url).searchParams.get('secret');
            if (reqSecret !== cronSecret) {
                return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
            }
        }

        // 2. Fetch orders that are PAID but email not sent
        const orders = await prisma.order.findMany({
            where: {
                paymentStatus: 'PAID',
                isSendMail: false
            },
            take: 20
        });

        if (orders.length === 0) {
            return NextResponse.json({ success: true, message: 'No orders pending email resend.' });
        }

        console.log(`[Cron Resend] Found ${orders.length} orders to process.`);

        // 3. Get API Token (using current environment config)
        let token = null;
        try {
            token = await getTokenForApi(API_CONFIG.API_BASE_URL, API_CONFIG.GUEST_CREDENTIALS);
        } catch (tokenErr) {
            console.error(`[Cron Resend] Failed to get API token:`, tokenErr.message);
            return NextResponse.json({ success: false, error: `Auth failed: ${tokenErr.message}` }, { status: 500 });
        }

        const results = [];

        for (const order of orders) {
            try {
                let apiTicketData = null;
                if (order.cinemaId && order.showId && order.referenceNo) {
                    try {
                        const ticketUrl = `${API_CONFIG.API_BASE_URL}/Booking/GetTickets/${order.cinemaId}/${order.showId}/${order.referenceNo}`;
                        const res = await fetchWithAuth(ticketUrl, token, { cache: 'no-store' });
                        if (res.ok) {
                            apiTicketData = await res.json();
                        }
                    } catch (e) {
                        console.warn(`[Cron Resend] API Fetch Error for Order ${order.id}:`, e);
                    }
                }

                const t = apiTicketData || {};
                const o = order;

                const getOrderSeats = () => {
                    try {
                         if (o.seats && (o.seats.startsWith('[') || o.seats.startsWith('{'))) {
                            const parsed = JSON.parse(o.seats);
                            if (Array.isArray(parsed)) {
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
                    const seats = getOrderSeats();
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
                            ticketTypeName: types[i] || types[0] || 'Standard',
                            price: avgPrice,
                            surcharge: 0
                        }));
                    }
                }

                const totalPersons = finalSeatDisplay.reduce((sum, g) => sum + g.seats.length, 0);

                let displayShowDate = t.ShowDate || t.showDate;
                let displayShowTime = t.ShowTime || t.showTime;
                
                if (!displayShowDate && o.showTime) displayShowDate = normalizeDate(o.showTime);
                else displayShowDate = normalizeDate(displayShowDate);

                if (!displayShowTime && o.showTime) displayShowTime = normalizeTime(o.showTime);
                else displayShowTime = normalizeTime(displayShowTime);

                const ticketInfo = order.emailInfo ? 
                    (typeof order.emailInfo === 'string' ? JSON.parse(order.emailInfo) : order.emailInfo) 
                    : {
                    customerName: t.CustomerName || t.customerName || o.customerName || 'Guest',
                    customerEmail: t.CustomerEmail || o.customerEmail || 'N/A',
                    customerPhone: t.CustomerPhone || o.customerPhone || 'N/A',
                    movieName: t.MovieName || t.movieName || o.movieTitle || o.movieName || 'Unknown Movie',
                    movieImage: t.MovieImage || t.movieImage || t.poster || '/img/banner.jpg',
                    genre: t.Genre || t.genre || 'N/A',
                    duration: t.Duration || t.duration || t.runningTime || 'N/A',
                    language: t.Language || t.language || 'English',
                    experienceType: t.ExperienceType || t.experienceType || 'Standard',
                    hallName: t.HallName || t.hallName || o.hallName || 'Hall',
                    cinemaName: t.CinemaName || t.cinemaName || o.cinemaName || 'MS Cinemas',
                    showDate: displayShowDate,
                    showTime: displayShowTime,
                    bookingId: o.bookingId || o.referenceNo || 'N/A',
                    referenceNo: t.ReferenceNo || t.referenceNo || o.referenceNo || 'N/A',
                    trackingId: t.TrackingID || t.trackingID || t.TransactionNo || o.transactionNo || 'N/A',
                    seatDisplay: finalSeatDisplay,
                    totalPersons: totalPersons,
                    subCharge: parseFloat(t.SubCharge || t.subCharge || o.subCharge || 0),
                    grandTotal: parseFloat(t.GrandTotal || t.grandTotal || o.totalAmount || 0),
                    ticketDetails: finalTicketDetails
                };

                const emailTo = ticketInfo.customerEmail;
                if (!emailTo || emailTo === 'N/A') {
                    results.push({ id: order.id, success: false, error: 'No email address found' });
                    continue;
                }

                await resendTicketEmail(emailTo, ticketInfo);
                
                await prisma.order.update({
                    where: { id: order.id },
                    data: { isSendMail: true }
                });

                results.push({ id: order.id, success: true });

            } catch (err) {
                console.error(`[Cron Resend] Error processing order ${order.id}:`, err);
                results.push({ id: order.id, success: false, error: err.message });
            }
        }

        return NextResponse.json({
            success: true,
            processed: orders.length,
            results: results
        });

    } catch (error) {
        console.error('[Cron Resend] Main Loop Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
