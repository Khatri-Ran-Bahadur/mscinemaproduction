import { NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        // Default to same defaults: 2 and 15
        const m1 = searchParams.get('m1') || 2;
        const m2 = searchParams.get('m2') || 50;
        
        const API_BASE_URL = API_CONFIG.API_BASE_URL;
        console.log(`[Cron] Using API URL: ${API_BASE_URL}`);

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

        // 2. Filter for Status 0 (Locked) and Status 1 (Confirm Locked)
        const targetBookings = bookings.filter(b => b.status === 0 || b.status === 1);
        
        const results = [];

        // 3. Process Releasing
        for (const b of targetBookings) {
            try {
                 // Check time condition: Release only if older than 10 minutes
                 // bookingDateTime format: "dd-MM-yyyy HH:mm:ss"
                 let shouldRelease = false;
                 
                 if (b.bookingDateTime) {
                     const [datePart, timePart] = b.bookingDateTime.split(' ');
                     if (datePart && timePart) {
                         const [d, m, y] = datePart.split('-');
                         // Create date object assuming Malaysian Time (+08:00)
                         const bookingTime = new Date(`${y}-${m}-${d}T${timePart}+08:00`);
                         const now = new Date();
                         
                         // Calculate difference in minutes
                         const diffMinutes = (now - bookingTime) / (1000 * 60);
                         
                         if (diffMinutes > 10) {
                             shouldRelease = true;
                         } else {
                             // console.log(`Skipping ${b.referenceNo}: Only ${diffMinutes.toFixed(1)} mins old`);
                         }
                     }
                 }

                 if (!shouldRelease) continue;

                 let endpoint = '';
                 
                 if (b.status === 0) {
                    endpoint = `${API_BASE_URL}/Booking/ReleaseLockedSeats/${b.cinemaID}/${b.showID}/${b.referenceNo}`;
                 } else if (b.status === 1) {
                    // Correct endpoint is ReleaseConfirmedLockedSeats (with 'ed')
                    endpoint = `${API_BASE_URL}/Booking/ReleaseConfirmedLockedSeats/${b.cinemaID}/${b.showID}/${b.referenceNo}`;
                 }

                 if (endpoint) {
                     const releaseRes = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                     });

                     results.push({
                        referenceNo: b.referenceNo,
                        type: b.status === 0 ? 'Locked' : 'ConfirmLocked',
                        success: releaseRes.ok,
                        status: releaseRes.status
                     });
                 }

            } catch (err) {
                console.error(`Failed to release ${b.referenceNo}`, err);
                results.push({ referenceNo: b.referenceNo, success: false, error: err.message });
            }
        }

        return NextResponse.json({
            success: true,
            message: `Processed ${targetBookings.length} bookings`,
            processed: targetBookings.length,
            results
        });

    } catch (error) {
        console.error('Cron job error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
