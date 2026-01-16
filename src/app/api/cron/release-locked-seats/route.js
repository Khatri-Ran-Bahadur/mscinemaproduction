import { NextResponse } from 'next/server';
import { getHalfWayBookings, releaseLockedSeats } from '@/services/api/booking'; // Wait, importing client side service in server route?
// ERROR: @/services/api/booking uses 'client' (axios/fetch) which might work in node but usually we should call the external API directly or use the service if it's compatible.
// However, the external API (C#) handles the logic. The Next.js API route here acts as a proxy/controller for the cron job.
// Since @/services/api/client uses fetch, it should work in Node (Next.js 13+).
// BUT, better to fetch directly to avoid auth/header issues if any, or just reuse the service if it only does fetch.

// Re-implementing fetch logic here to be safe and independent of client-side auth tokens if needed.
// But actually, the C# API seems open or uses headers? The client code doesn't show complex auth headers being set dynamically for EVERY request, except maybe in client.js wrapper.
// Let's assume we can validly call the External API from here.

const API_BASE_URL = 'http://cinemaapi5.ddns.net/api';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        // Default to same defaults: 2 and 15
        const m1 = searchParams.get('m1') || 2;
        const m2 = searchParams.get('m2') || 15;

        // 1. Get Half Way Bookings
        const fetchRes = await fetch(`${API_BASE_URL}/Booking/GetHalfWayBookings/${m1}/${m2}`, {
            cache: 'no-store'
        });

        if (!fetchRes.ok) {
            return NextResponse.json({ success: false, error: 'Failed to fetch halfway bookings' }, { status: 500 });
        }

        const bookings = await fetchRes.json();
        
        if (!Array.isArray(bookings)) {
            return NextResponse.json({ success: true, message: 'No bookings found or invalid format', processed: 0 });
        }

        // 2. Filter for Status 0 (Locked Seats) ONLY
        const lockedSeats = bookings.filter(b => b.status === 0);
        
        const results = [];

        // 3. Process Releasing
        for (const b of lockedSeats) {
            try {
                 // Endpoint: /Booking/ReleaseLockedSeats/{CinemaID}/{ShowID}/{referenceNo}
                 // Note: Check lockType param? Service uses LockType?
                 // Service: /Booking/ReleaseLockedSeats/${cinemaId}/${showId}/${referenceNo}
                 // Let's call the ID-based endpoint.
                 const releaseRes = await fetch(`${API_BASE_URL}/Booking/ReleaseLockedSeats/${b.cinemaID}/${b.showID}/${b.referenceNo}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                 });

                 results.push({
                    referenceNo: b.referenceNo,
                    success: releaseRes.ok,
                    status: releaseRes.status
                 });

            } catch (err) {
                console.error(`Failed to release ${b.referenceNo}`, err);
                results.push({ referenceNo: b.referenceNo, success: false, error: err.message });
            }
        }

        return NextResponse.json({
            success: true,
            message: `Processed ${lockedSeats.length} locked bookings`,
            processed: lockedSeats.length,
            results
        });

    } catch (error) {
        console.error('Cron job error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
