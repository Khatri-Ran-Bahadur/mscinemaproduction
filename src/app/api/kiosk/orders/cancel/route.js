/**
 * Kiosk API: Cancel Order & Release Locked Seats
 * Endpoint: POST /api/kiosk/orders/cancel
 * Triggered when customer cancels the booking on Kiosk or on countdown timeout.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { API_CONFIG } from '@/config/api';

export async function POST(request) {
  try {
    const body = await request.json();
    const { orderId, referenceNo, cinemaId, showId } = body;

    if (!orderId && !referenceNo) {
      return NextResponse.json(
        { success: false, error: 'Order ID or Reference No is required' },
        { status: 400 }
      );
    }

    // 1. Find Order
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          orderId ? { orderId } : undefined,
          referenceNo ? { referenceNo } : undefined,
        ].filter(Boolean),
      },
    });

    if (order && order.paymentStatus === 'PAID') {
      return NextResponse.json(
        { success: false, error: 'Cannot cancel an order that is already PAID' },
        { status: 400 }
      );
    }

    // 2. Update DB Order Status
    if (order) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'CANCELLED',
          paymentStatus: 'FAILED',
          cancel_ticket: true,
        },
      });
    }

    // 3. Release Locked Seats in Upstream Cinema API
    const targetCinemaId = cinemaId || order?.cinemaId;
    const targetShowId = showId || order?.showId;
    const targetRefNo = referenceNo || order?.referenceNo;
    const targetToken = order?.token || '';

    let releaseApiSuccess = false;
    let releaseApiResponse = null;

    if (targetCinemaId && targetShowId && targetRefNo) {
      try {
        const releaseUrl = `${API_CONFIG.API_BASE_URL}/Booking/ReleaseLockedSeats/${targetCinemaId}/${targetShowId}/${targetRefNo}`;
        const headers = {
          'Content-Type': 'application/json',
          'x-api-key': API_CONFIG.API_SECRET_KEY,
        };
        if (targetToken) {
          headers['Authorization'] = `Bearer ${targetToken}`;
        }

        console.log(`[Kiosk Cancel] Releasing seats via: ${releaseUrl}`);
        const releaseRes = await fetch(releaseUrl, {
          method: 'POST',
          headers,
          cache: 'no-store',
        });

        releaseApiSuccess = releaseRes.ok;
        try {
          releaseApiResponse = await releaseRes.json();
        } catch {
          releaseApiResponse = await releaseRes.text();
        }
      } catch (err) {
        console.warn(`[Kiosk Cancel] Upstream release error: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully and locked seats released',
      orderId: order?.orderId || orderId,
      referenceNo: targetRefNo,
      upstreamRelease: {
        success: releaseApiSuccess,
        response: releaseApiResponse,
      },
    });
  } catch (error) {
    console.error('[Kiosk Cancel Route Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
