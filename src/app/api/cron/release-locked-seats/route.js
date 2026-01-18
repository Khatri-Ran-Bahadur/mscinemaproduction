import { NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        // Default to same defaults: 2 and 15
        const m1 = searchParams.get('m1') || 2;
        const m2 = searchParams.get('m2') || 50;
        
        // Check BOTH environments
        const environments = [
            { name: 'Test', url: API_CONFIG.TEST_API_URL },
            { name: 'Live', url: API_CONFIG.LIVE_API_URL }
        ];

        console.log(`[Cron] Starting check for ${environments.length} environments. Params: m1=${m1}, m2=${m2}`);
        
        const results = [];
        let totalProcessed = 0;

        for (const env of environments) {
             console.log(`[Cron] Checking ${env.name} API: ${env.url}`);

             try {
                // 1. Get Half Way Bookings
                const fetchRes = await fetch(`${env.url}/Booking/GetHalfWayBookings/${m1}/${m2}`, {
                    cache: 'no-store'
                });

                if (!fetchRes.ok) {
                    console.error(`[Cron] Failed to fetch halfway bookings from ${env.name}: ${fetchRes.status}`);
                    results.push({ env: env.name, error: `Fetch failed: ${fetchRes.status}` });
                    continue; // Try next env
                }

                const bookings = await fetchRes.json();
                console.log(`[Cron] ${env.name}: Fetched ${bookings?.length || 0} bookings.`);
                
                if (!Array.isArray(bookings)) {
                    continue;
                }

                // 2. Filter for Status 0 (Locked) and Status 1 (Confirm Locked)
                const targetBookings = bookings.filter(b => b.status === 0 || b.status === 1);
                
                if (targetBookings.length > 0) {
                     console.log(`[Cron] ${env.name}: processing ${targetBookings.length} target bookings.`);
                }

                // 3. Process Releasing
                for (const b of targetBookings) {
                    try {
                        // Check time condition
                        let shouldRelease = false;
                        
                        if (b.bookingDateTime) {
                            const [datePart, timePart] = b.bookingDateTime.split(' ');
                            if (datePart && timePart) {
                                const [d, m, y] = datePart.split('-');
                                const bookingTime = new Date(`${y}-${m}-${d}T${timePart}+08:00`);
                                const now = new Date();
                                const diffMinutes = (now - bookingTime) / (1000 * 60);
                                
                                if (diffMinutes > 10) {
                                    shouldRelease = true;
                                }
                            }
                        }

                        if (!shouldRelease) continue;

                        let endpoint = '';
                        
                        if (b.status === 0) {
                            endpoint = `${env.url}/Booking/ReleaseLockedSeats/${b.cinemaID}/${b.showID}/${b.referenceNo}`;
                        } else if (b.status === 1) {
                            endpoint = `${env.url}/Booking/ReleaseConfirmedLockedSeats/${b.cinemaID}/${b.showID}/${b.referenceNo}`;
                        }

                        if (endpoint) {
                            const releaseRes = await fetch(endpoint, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' }
                            });

                            results.push({
                                env: env.name,
                                referenceNo: b.referenceNo,
                                type: b.status === 0 ? 'Locked' : 'ConfirmLocked',
                                success: releaseRes.ok,
                                status: releaseRes.status
                            });
                            
                            if (releaseRes.ok) totalProcessed++;
                        }

                    } catch (err) {
                        console.error(`Failed to release ${b.referenceNo} on ${env.name}`, err);
                        results.push({ env: env.name, referenceNo: b.referenceNo, success: false, error: err.message });
                    }
                }
             } catch (envErr) {
                 console.error(`[Cron] Error checking ${env.name}:`, envErr);
                 results.push({ env: env.name, error: envErr.message });
             }
        }

        return NextResponse.json({
            success: true,
            message: `Processed ${totalProcessed} bookings total`,
            processed: totalProcessed,
            results
        });

    } catch (error) {
        console.error('Cron job error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
