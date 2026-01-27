import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getBookingDetails } from '@/utils/booking-storage';
import { API_CONFIG } from '@/config/api';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

async function logPayloadToFile(referenceNo, type, payload) {
    if (!referenceNo) return;
    try {
        if(referenceNo.includes('unknown')) return;
        const logsDir = path.join(process.cwd(), 'logs');
        if (!fs.existsSync(logsDir)) {
             fs.mkdirSync(logsDir, { recursive: true });
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const safeRef = referenceNo.replace(/[^a-zA-Z0-9_-]/g, '');
        const filename = `payment_api_${safeRef}.log`;
        const logPath = path.join(logsDir, filename);
        
        const logEntry = `
========================================
TIMESTAMP: ${new Date().toISOString()}
TYPE: ${type}
payload:
${typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2)}
========================================
`;
        fs.appendFileSync(logPath, logEntry);
    } catch(e) {
        console.error('[API Log] Failed to write log:', e);
    }
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const cinemaId = searchParams.get('cinemaId');
    const showId = searchParams.get('showId');
    const referenceNo = searchParams.get('referenceNo');
    const orderId = searchParams.get('orderId');
    const redirectUrl = searchParams.get('redirect') || '/payment/failed';

    if (!cinemaId || !showId || !referenceNo) {
        return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    try {
        console.log(`[Payment Cancel] User cancelled payment. Releasing seats for Ref: ${referenceNo}`);

        let token = '';
        if (orderId) {
            const details = getBookingDetails(orderId);
            if (details && details.token) {
                token = details.token;
            }
        }

        const transactionNo = orderId || 'CANCELLED_BY_USER';
        const cardType = 'UserCancel';
        const remarks = 'User cancelled payment explicitly';
        
        const endpoint = `/Booking/CancelBooking/${cinemaId}/${showId}/${referenceNo}/TransactionNo/CardType/Remarks`;
        const urlObj = new URL(`${API_CONFIG.API_BASE_URL}${endpoint}`);
        urlObj.searchParams.append('TransactionNo', transactionNo);
        urlObj.searchParams.append('CardType', cardType);
        urlObj.searchParams.append('Remarks', remarks);
        
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(urlObj.toString(), {
            method: 'POST',
            headers
        });
        
        let responseBody = null;
        try { responseBody = await res.json(); } catch(e) { responseBody = await res.text(); }

        await logPayloadToFile(referenceNo, 'CancelBooking_USER_CANCEL', {
            status: res.status,
            ok: res.ok,
            response: responseBody
        });

        if (orderId) {
            await prisma.order.update({
                where: { orderId: orderId },
                data: {
                    status: 'CANCELLED',
                    paymentStatus: 'FAILED',
                    updatedAt: new Date()
                }
            }).catch(e => console.error('DB Update failed:', e));
            
            await prisma.paymentLog.create({
                data: {
                    orderId: orderId,
                    referenceNo: referenceNo,
                    status: 'USER_CANCEL',
                    isSuccess: false,
                    remarks: `User cancelled payment. Seats released. Status: ${res.status}`,
                    returnData: responseBody || {},
                    method: 'GET'
                }
            }).catch(e => console.error('Payment Log failed:', e));
        }

    } catch (error) {
        console.error('[Payment Cancel] Error:', error);
        await logPayloadToFile(referenceNo, 'CancelBooking_ERROR', { error: error.message });
    }

    return NextResponse.redirect(new URL(redirectUrl, request.url));
}
