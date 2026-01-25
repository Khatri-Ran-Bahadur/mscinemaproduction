import { NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Get a fresh Bearer token for the given API using guest credentials.
 * Required because cinema API (GetHalfWayBookings, ReleaseLockedSeats, etc.) requires Authorization.
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
 * Fetch with Bearer token. Retries once with a fresh token on 401.
 */
async function fetchWithAuth(url, token, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
    };
    const res = await fetch(url, { ...options, headers });
    return res;
}

export async function GET(request) {
    try {
        // Optional: require CRON_SECRET to avoid unauthorized hits (set in .env)
        const cronSecret = process.env.CRON_SECRET;
        if (cronSecret) {
            const reqSecret = request.headers.get('x-cron-secret') || new URL(request.url).searchParams.get('secret');
            if (reqSecret !== cronSecret) {
                return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
            }
        }

        const { searchParams } = new URL(request.url);
        const m1 = searchParams.get('m1') || 2;
        const m2 = searchParams.get('m2') || 50;

        const environments = [
            { name: 'Test', url: API_CONFIG.TEST_API_URL, credentials: API_CONFIG.TEST_GUEST_CREDENTIALS },
            { name: 'Live', url: API_CONFIG.LIVE_API_URL, credentials: API_CONFIG.LIVE_GUEST_CREDENTIALS },
        ];

        console.log(`[Cron] Starting release-locked-seats. Params: m1=${m1}, m2=${m2}`);

        const results = [];
        let totalProcessed = 0;

        for (const env of environments) {
            try {
                // 1. Get token for this environment (required for cinema API)
                let token;
                try {
                    token = await getTokenForApi(env.url, env.credentials);
                    console.log(`[Cron] ${env.name}: Got token.`);
                } catch (tokenErr) {
                    console.error(`[Cron] ${env.name}: GetToken failed:`, tokenErr.message);
                    results.push({ env: env.name, error: `GetToken failed: ${tokenErr.message}` });
                    continue;
                }

                // 2. Get Half Way Bookings (with token)
                const listUrl = `${env.url}/Booking/GetHalfWayBookings/${m1}/${m2}`;
                const fetchRes = await fetchWithAuth(listUrl, token, { cache: 'no-store' });

                if (!fetchRes.ok) {
                    const errText = await fetchRes.text();
                    console.error(`[Cron] ${env.name}: GetHalfWayBookings failed: ${fetchRes.status}`, errText);
                    results.push({ env: env.name, error: `GetHalfWayBookings failed: ${fetchRes.status}` });
                    continue;
                }

                const bookings = await fetchRes.json();
                if (!Array.isArray(bookings)) {
                    results.push({ env: env.name, message: 'No bookings array', count: 0 });
                    continue;
                }

                const targetBookings = bookings.filter((b) => b.status === 0 || b.status === 1);
                console.log(`[Cron] ${env.name}: Fetched ${bookings.length} bookings, ${targetBookings.length} to check (status 0 or 1).`);

                if (targetBookings.length === 0) {
                    results.push({ env: env.name, message: 'No target bookings', count: 0 });
                    continue;
                }

                let releasedInEnv = 0;

                // 3. Release each qualifying booking (with token)
                for (const b of targetBookings) {
                    let shouldRelease = false;

                    if (b.bookingDateTime) {
                        const [datePart, timePart] = String(b.bookingDateTime).split(' ');
                        if (datePart && timePart) {
                            const [d, m, y] = datePart.split('-');
                            if (d && m && y) {
                                // 1. Parse the Booking Time (It is physically "25-01-2026 11:55:33" in MYT)
                                // We create a Date object where the internal numbers match this face value.
                                const bookingDateObj = new Date(`${y}-${m}-${d}T${timePart}`);

                                // 2. Get Current Time as "Malaysia Time" string
                                // This ensures we are getting the "Wall Clock" time in Malaysia right now.
                                const now = new Date();
                                const mytNow = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kuala_Lumpur"}));
                                
                                if (!isNaN(bookingDateObj.getTime()) && !isNaN(mytNow.getTime())) {
                                    const diffMs = mytNow.getTime() - bookingDateObj.getTime();
                                    const diffMinutes = diffMs / (1000 * 60);
                                    
                                    // Rule: "this time is malesian time ... add 15 minute to delete"
                                    if (diffMinutes > 15) {
                                        shouldRelease = true;
                                        console.log(`[Cron] ${env.name}: releasing ${b.referenceNo} (Age: ${diffMinutes.toFixed(1)}m > 15m)`);
                                    } else {
                                        console.log(`[Cron] ${env.name}: Keeping ${b.referenceNo}. Age: ${diffMinutes.toFixed(1)}m. (Booking: ${bookingDateObj.toLocaleTimeString()} vs Now: ${mytNow.toLocaleTimeString()} MYT)`);
                                    }
                                }
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

                    if (!endpoint) continue;

                    try {
                        const releaseRes = await fetchWithAuth(endpoint, token, {
                            method: 'POST',
                            body: b.status === 1 ? JSON.stringify({}) : undefined, // ReleaseConfirmedLockedSeats expects {}; ReleaseLockedSeats no body
                        });

                        const ok = releaseRes.ok;
                        const status = releaseRes.status;
                        let body = null;
                        try { body = await releaseRes.json(); } catch { body = await releaseRes.text(); }

                        results.push({
                            env: env.name,
                            referenceNo: b.referenceNo,
                            type: b.status === 0 ? 'Locked' : 'ConfirmLocked',
                            success: ok,
                            status,
                            apiResponse: body,
                        });

                        if (ok) {
                            totalProcessed++;
                            releasedInEnv++;
                            
                            // Update local DB status to ensure user cannot pay for this released booking
                            try {
                                await prisma.order.update({
                                    where: { referenceNo: b.referenceNo },
                                    data: {
                                        status: 'CANCELLED',
                                        paymentStatus: 'FAILED',
                                        updatedAt: new Date(),
                                    },
                                });
                                console.log(`[Cron] ${env.name}: Updated local order ${b.referenceNo} to CANCELLED/FAILED.`);
                            } catch (dbErr) {
                                // It's possible the order doesn't exist locally if it was a ghost booking or cleaned up
                                console.warn(`[Cron] ${env.name}: Could not update local order ${b.referenceNo}:`, dbErr.message);
                            }
                        } else {
                            console.error(`[Cron] ${env.name}: Release failed for ${b.referenceNo}: ${status}`, body);
                        }
                    } catch (err) {
                        console.error(`[Cron] ${env.name}: Release error for ${b.referenceNo}:`, err);
                        results.push({ env: env.name, referenceNo: b.referenceNo, success: false, error: err.message });
                    }
                }

                results.push({ env: env.name, message: `Checked ${targetBookings.length}, released ${releasedInEnv}` });
            } catch (envErr) {
                console.error(`[Cron] Error for ${env.name}:`, envErr);
                results.push({ env: env.name, error: envErr.message });
            }
        }

        return NextResponse.json({
            success: true,
            message: `Release run complete. Released: ${totalProcessed}`,
            processed: totalProcessed,
            results,
        });
    } catch (error) {
        console.error('[Cron] release-locked-seats error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
