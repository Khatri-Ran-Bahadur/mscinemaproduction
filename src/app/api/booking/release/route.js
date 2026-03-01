
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { queryPaymentStatus, callReserveBooking } from '@/utils/molpay';
import { API_CONFIG } from '@/config/api';

export async function POST(request) {
  try {
    const body = await request.json();
    const { cinemaId, showId, referenceNo, orderId, type, force = false } = body;

    if (!cinemaId || !showId || !referenceNo) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    console.log(`[Safe Release] Request for Ref: ${referenceNo}, Order: ${orderId}, Type: ${type}, Force: ${force}`);

    let shouldRelease = true;
    let orderRecord = null;

    // If force is true, we skip all checks and just release
    if (!force) {
      // 1. Check if order exists in DB
      if (orderId) {
        orderRecord = await prisma.order.findUnique({
          where: { orderId: orderId }
        });
      }
      
      if (!orderRecord) {
        orderRecord = await prisma.order.findFirst({
          where: { referenceNo: referenceNo },
          orderBy: { createdAt: 'desc' }
        });
      }

      // 2. Check payment status
      if (orderRecord) {
        if (orderRecord.paymentStatus === 'PAID') {
          console.log(`[Safe Release] Order ${orderRecord.orderId} is PAID in DB. Reserving.`);
          shouldRelease = false;
        } else if (orderRecord.orderId) {
          // Verify with Fiuu Query API
          const fiuuStatus = await queryPaymentStatus(orderRecord.orderId, orderRecord.totalAmount.toString());
          if (fiuuStatus.success) {
            shouldRelease = false;
            
            // Sync DB with Fiuu's truth
            orderRecord = await prisma.order.update({
              where: { id: orderRecord.id },
              data: { 
                paymentStatus: 'PAID', 
                transactionNo: fiuuStatus.tranID,
                paymentMethod: fiuuStatus.raw.channel || 'Fiuu'
              }
            });
          }
        }
      }
    }

    // 3. Action Logic
    if (!shouldRelease && orderRecord) {
      // Attempt Reservation instead of Release
      const reserveResult = await callReserveBooking(
        orderRecord.orderId,
        orderRecord.transactionNo || orderRecord.orderId,
        orderRecord.paymentMethod || 'Online',
        '',
        {
          cinemaId: orderRecord.cinemaId,
          showId: orderRecord.showId,
          referenceNo: orderRecord.referenceNo,
          membershipId: '0',
          storedDetails: { token: orderRecord.token }
        }
      );

      if (reserveResult.success) {
        await prisma.order.update({
          where: { id: orderRecord.id },
          data: { reserve_ticket: true, status: 'CONFIRMED' }
        });
        return NextResponse.json({ success: true, message: 'Payment found. Booking reserved instead of releasing.', action: 'RESERVED' });
      } else {
        return NextResponse.json({ success: false, error: reserveResult.error, action: 'RESERVE_FAILED', message: 'Payment confirmed but Cinema system failed to reserve.' });
      }
    }

    // 3. If we reached here, it's safe to release (or no order found)
    if (shouldRelease) {
      const endpoint = type === 'confirmed' 
        ? `/Booking/ReleaseConfirmedLockedSeats/${cinemaId}/${showId}/${referenceNo}`
        : `/Booking/ReleaseLockedSeats/${cinemaId}/${showId}/${referenceNo}`;
      
      const headers = { 'Content-Type': 'application/json' };
      if (orderRecord?.token) {
        headers['Authorization'] = `Bearer ${orderRecord.token}`;
      }

      const releaseResp = await fetch(`${API_CONFIG.API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers
      });

      if (releaseResp.ok) {
        // Update DB status if order existed
        if (orderRecord) {
           await prisma.order.update({
             where: { id: orderRecord.id },
             data: { status: 'CANCELLED', paymentStatus: 'FAILED', cancel_ticket: true }
           }).catch(() => {});
        }
        return NextResponse.json({ success: true, message: 'Seats released successfully', action: 'RELEASED' });
      } else {
        const errText = await releaseResp.text();
        return NextResponse.json({ success: false, error: `Cinema API error: ${errText}`, action: 'RELEASE_FAILED' }, { status: releaseResp.status });
      }
    }

    return NextResponse.json({ error: 'Unexpected flow' }, { status: 500 });

  } catch (error) {
    console.error('[Safe Release] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
