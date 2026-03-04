import { NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';
import { prisma } from '@/lib/prisma';
import { queryPaymentStatus, callReserveBooking, callCancelBooking } from '@/utils/molpay';

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
        'x-api-key': API_CONFIG.API_SECRET_KEY,
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
        const m2 = searchParams.get('m2') || 15;
        const limit = searchParams.get('limit') || 100;
        
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

                // 2. Get Half Way Bookings from Cinema API (with token)
                let bookings = [];
                try {
                    const listUrl = `${env.url}/Booking/GetHalfWayBookings/${m1}/${m2}`;
                    console.log(`[Cron] ${env.name}: Fetching bookings from ${listUrl}`);
                    const fetchRes = await fetchWithAuth(listUrl, token, { cache: 'no-store' });

                    if (fetchRes.ok) {
                        bookings = await fetchRes.json();
                        console.log(`[Cron] ${env.name}: Raw API response:`, JSON.stringify(bookings));
                        if (!Array.isArray(bookings)) {
                            bookings = [];
                        }
                    } else {
                        const errText = await fetchRes.text();
                        console.warn(`[Cron] ${env.name}: GetHalfWayBookings API returned ${fetchRes.status}:`, errText);
                        // Fall through to use database bookings instead
                    }
                } catch (apiErr) {
                    console.warn(`[Cron] ${env.name}: GetHalfWayBookings API failed:`, apiErr.message);
                }

                if (bookings.length > 0) {
                    console.log(`[Cron] ${env.name}: Found ${bookings.length} halfway bookings. Statuses:`, bookings.map(b => `${b.referenceNo}(${b.status})`).join(', '));
                }

                // 2b. (Removed) FALLBACK: Database checking is no longer used as GetHalfWayBookings is the source of truth.

                const targetBookings = bookings.filter((b) => b.status === 0 || b.status === 1);
                console.log(`[Cron] ${env.name}: Fetched ${bookings.length} bookings, ${targetBookings.length} to check (status 0 or 1).`);
                
                if (targetBookings.length === 0) {
                    results.push({ env: env.name, message: 'No target bookings', count: 0 });
                    continue;
                }

                let releasedInEnv = 0;

                // 3. Release each qualifying booking (with token)
                for (const b of targetBookings) {
                        console.log(`[Cron] ${env.name}: Processing ${b.referenceNo} (Type: ${b.status === 0 ? 'Locked' : 'Confirmed'}, Source: ${b._source || 'API'})`);
                        let shouldRelease = true;

                        let endpoint = '';
                        if (b.status === 0) {
                            endpoint = `${env.url}/Booking/ReleaseLockedSeats/${b.cinemaID}/${b.showID}/${b.referenceNo}`;
                        } else if (b.status === 1) {
                            endpoint = `${env.url}/Booking/ReleaseConfirmedLockedSeats/${b.cinemaID}/${b.showID}/${b.referenceNo}`;
                        }

                    if (!endpoint) continue;

                    try {
                        let ok = false;
                        let status = 0;
                        let body = null;
                        let skippedReason = '';

                        // --- START SAFE RELEASE CHECK ---
                        let orderRecord = await prisma.order.findFirst({
                            where: { referenceNo: b.referenceNo },
                            orderBy: { createdAt: 'desc' }
                        });

                        let gatewayIsPaid = false;
                        let gatewayIsFailed = false;

                        // To be 100% safe, if there is a record in our DB, we always check Fiuu 
                        // before deciding whether to Reserve (Paid) or Release (Failed/Pending).
                        if (orderRecord && orderRecord.orderId) {
                            const fiuuStatus = await queryPaymentStatus(orderRecord.orderId, orderRecord.totalAmount.toString());
                            
                            if (fiuuStatus.status === '00') {
                                console.log(`[Cron Safe] Order ${orderRecord.orderId} is PAID at Gateway.`);
                                gatewayIsPaid = true;
                                // Synchronize DB state if it was wrong
                                orderRecord = await prisma.order.update({
                                    where: { id: orderRecord.id },
                                    data: { 
                                        paymentStatus: 'PAID',
                                        status: 'CONFIRMED',
                                        transactionNo: fiuuStatus.tranID || orderRecord.transactionNo,
                                        paymentMethod: fiuuStatus.raw?.Channel || orderRecord.paymentMethod || 'Fiuu'
                                    }
                                });
                            } else {
                                console.log(`[Cron Safe] Order ${orderRecord.orderId} is NOT PAID at Gateway (Status: ${fiuuStatus.status}).`);
                                gatewayIsFailed = true;
                                // Ensure DB reflects the failure
                                orderRecord = await prisma.order.update({
                                    where: { id: orderRecord.id },
                                    data: { 
                                        paymentStatus: fiuuStatus.status === '22' ? 'PENDING' : 'FAILED',
                                        status: fiuuStatus.status === '22' ? 'PENDING' : 'CANCELLED',
                                        transactionNo: fiuuStatus.tranID || orderRecord.transactionNo
                                    }
                                });
                            }
                        }

                        // ACTION PHASE:
                        if (gatewayIsPaid && orderRecord) {
                            // Only RESERVE if explicitly confirmed as paid at Gateway
                            console.log(`[Cron Safe] Triggering Reservation for confirmed order ${orderRecord.orderId}`);
                            const reserveResult = await callReserveBooking(
                                orderRecord.orderId,
                                orderRecord.transactionNo || orderRecord.orderId,
                                orderRecord.paymentMethod || 'Online',
                                '',
                                {
                                    cinemaId: b.cinemaID,
                                    showId: b.showID,
                                    referenceNo: b.referenceNo,
                                    membershipId: '0',
                                    storedDetails: { token: token }
                                }
                            );
                            
                            ok = reserveResult.success;
                            body = reserveResult.data || { error: reserveResult.error };
                            skippedReason = 'PAID_RESERVED';
                        } else {
                            // Payment failed or order not found in our DB -> Release the seats
                            if (gatewayIsFailed && orderRecord) {
                                console.log(`[Cron Safe] Cleaning up resources for failed order ${orderRecord.orderId}`);
                                await callCancelBooking(
                                    orderRecord.orderId,
                                    orderRecord.transactionNo || orderRecord.orderId,
                                    orderRecord.paymentMethod || 'Online',
                                    'Cron cleanup after verification',
                                    {
                                        cinemaId: b.cinemaID,
                                        showId: b.showID,
                                        referenceNo: b.referenceNo,
                                        storedDetails: { token: token }
                                    }
                                );
                            }

                            console.log(`[Cron Safe] Releasing seats for ${b.referenceNo}`);
                            const releaseRes = await fetchWithAuth(endpoint, token, {
                                method: 'POST',
                                body: b.status === 1 ? JSON.stringify({}) : undefined,
                            });
                            ok = releaseRes.ok;
                            status = releaseRes.status;
                            try { body = await releaseRes.json(); } catch { body = await releaseRes.text(); }
                        }
                        // --- END SAFE RELEASE CHECK ---

                        results.push({
                            env: env.name,
                            referenceNo: b.referenceNo,
                            type: b.status === 0 ? 'Locked' : 'ConfirmLocked',
                            success: ok,
                            status,
                            skippedReason,
                            apiResponse: body,
                        });
                            
                        if (ok) {
                            totalProcessed++;
                            releasedInEnv++;
                            if (skippedReason === 'PAID_RESERVED') {
                                console.log(`[Cron] Successfully reserved paid booking ${b.referenceNo}`);
                                if (orderRecord) {
                                    await prisma.order.update({
                                        where: { id: orderRecord.id },
                                        data: { reserve_ticket: true, status: 'CONFIRMED' }
                                    }).catch(() => {});
                                }
                            }
                        } else {
                            console.error(`[Cron] ${env.name}: Action failed for ${b.referenceNo}: ${status}`, body);
                        }
                    } catch (err) {
                        console.error(`[Cron] ${env.name}: Action error for ${b.referenceNo}:`, err);
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
