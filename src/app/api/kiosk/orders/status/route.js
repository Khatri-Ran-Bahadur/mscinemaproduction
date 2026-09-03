/**
 * Kiosk API: Payment Status Inquiry & Ticket Reservation
 * Endpoint: POST /api/kiosk/orders/status
 * Used by Kiosk app to poll Fiuu QR payment status or process CardBiz EDC card approval.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { callOpaInquiry, callOpaReversal } from '@/utils/fiuu-opa';
import { callReserveBooking, savePaymentLogDB } from '@/utils/molpay';
import { sendMobileTicketEmailForOrder } from '@/utils/order-email';
import { API_CONFIG } from '@/config/api';

export async function POST(request) {
  try {
    const body = await request.json();
    const { orderId, referenceNo, cardPaymentResult } = body;

    if (!orderId && !referenceNo) {
      return NextResponse.json(
        { success: false, error: 'Order ID or Reference No is required' },
        { status: 400 }
      );
    }

    // 1. Fetch Order from Database
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          orderId ? { orderId } : undefined,
          referenceNo ? { referenceNo } : undefined,
        ].filter(Boolean),
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found in system' },
        { status: 404 }
      );
    }

    // Helper to fetch ticket details from Cinema API for the Kiosk thermal printer
    const fetchCinemaTicketData = async (cinemaId, showId, refNo) => {
      try {
        if (!cinemaId || !showId || !refNo) return null;
        const ticketUrl = `${API_CONFIG.API_BASE_URL}/Booking/GetTickets/${cinemaId}/${showId}/${refNo}`;
        const res = await fetch(ticketUrl, { cache: 'no-store' });
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn('[Kiosk Status] Could not fetch cinema ticket data:', err.message);
      }
      return null;
    };

    // 2. Already Paid & Reserved check (Idempotent response)
    if (order.paymentStatus === 'PAID' && order.reserve_ticket) {
      const ticketData = await fetchCinemaTicketData(order.cinemaId, order.showId, order.referenceNo);
      return NextResponse.json({
        success: true,
        status: 'PAID',
        isReserved: true,
        orderId: order.orderId,
        referenceNo: order.referenceNo,
        transactionNo: order.transactionNo,
        amount: order.totalAmount ? order.totalAmount.toString() : '0.00',
        ticketData: ticketData || {
          movieTitle: order.movieTitle,
          cinemaName: order.cinemaName,
          hallName: order.hallName,
          showTime: order.showTime,
          seats: order.seats,
          referenceNo: order.referenceNo,
        },
      });
    }

    // 3. Case A: CardBiz EDC Card Payment Result submitted from Kiosk
    if (cardPaymentResult) {
      const isCardSuccess = cardPaymentResult.statusCode === 0 || cardPaymentResult.responseCode === '00';
      const tranNo = cardPaymentResult.traceNo || cardPaymentResult.approvalCode || `EDC_${Date.now()}`;

      await savePaymentLogDB({
        orderid: order.orderId,
        referenceNo: order.referenceNo,
        transactionNo: tranNo,
        status: isCardSuccess ? '00' : cardPaymentResult.responseCode || '-1',
        amount: order.totalAmount ? parseFloat(order.totalAmount.toString()) : null,
        currency: 'MYR',
        channel: 'CARDBIZ_UPT1000',
        method: 'KIOSK_EDC',
        returnData: cardPaymentResult,
        isSuccess: isCardSuccess,
        remarks: isCardSuccess ? 'CardBiz EDC payment approved' : 'CardBiz EDC payment declined',
        request,
      });

      if (!isCardSuccess) {
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: 'FAILED', status: 'CANCELLED' },
        });

        return NextResponse.json({
          success: false,
          status: 'FAILED',
          error: cardPaymentResult.statusMessage || 'Card transaction was declined',
        });
      }

      // Mark order as PAID
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          status: 'CONFIRMED',
          transactionNo: tranNo,
          paymentMethod: 'CARDBIZ_EDC',
        },
      });

      // Call Upstream Cinema ReserveBooking
      const reserveResult = await callReserveBooking(
        order.orderId,
        tranNo,
        'CardBiz EDC',
        cardPaymentResult.approvalCode || '',
        {
          cinemaId: order.cinemaId,
          showId: order.showId,
          referenceNo: order.referenceNo,
          membershipId: order.membershipId || '0',
          token: order.token || '',
        }
      );

      if (reserveResult.success) {
        await prisma.order.update({
          where: { id: order.id },
          data: { reserve_ticket: true },
        });

        if (order.customerEmail) {
          sendMobileTicketEmailForOrder(order.orderId).catch(() => {});
        }

        const ticketData = await fetchCinemaTicketData(order.cinemaId, order.showId, order.referenceNo);

        return NextResponse.json({
          success: true,
          status: 'PAID',
          isReserved: true,
          orderId: order.orderId,
          referenceNo: order.referenceNo,
          transactionNo: tranNo,
          ticketData: ticketData || {
            movieTitle: order.movieTitle,
            cinemaName: order.cinemaName,
            hallName: order.hallName,
            showTime: order.showTime,
            seats: order.seats,
            referenceNo: order.referenceNo,
          },
        });
      } else {
        return NextResponse.json({
          success: false,
          status: 'RESERVE_FAILED',
          error: `Card was charged but Cinema seat reservation failed: ${reserveResult.error}`,
        }, { status: 500 });
      }
    }

    // 4. Case B: Fiuu OPA Dynamic QR Status Inquiry (Active Polling)
    const fiuuInquiry = await callOpaInquiry({ referenceId: order.orderId });

    if (fiuuInquiry.isPending) {
      return NextResponse.json({
        success: true,
        status: 'PENDING',
        isPending: true,
        orderId: order.orderId,
      });
    }

    if (fiuuInquiry.success) {
      // Payment Confirmed at Fiuu Gateway!
      const tranNo = fiuuInquiry.molTransactionId || order.orderId;

      await savePaymentLogDB({
        orderid: order.orderId,
        referenceNo: order.referenceNo,
        transactionNo: tranNo,
        status: fiuuInquiry.statusCode,
        amount: fiuuInquiry.amount ? parseFloat(fiuuInquiry.amount) : null,
        currency: 'MYR',
        channel: 'FIUU_OPA_QR',
        method: 'KIOSK_INQUIRY',
        returnData: fiuuInquiry.raw,
        isSuccess: true,
        remarks: 'Payment confirmed via Fiuu OPA Inquiry',
        request,
      });

      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          status: 'CONFIRMED',
          transactionNo: tranNo,
          paymentMethod: 'FIUU_QR',
        },
      });

      // Call Upstream Cinema ReserveBooking
      const reserveResult = await callReserveBooking(
        order.orderId,
        tranNo,
        'Fiuu QR',
        fiuuInquiry.raw?.authorizationCode || tranNo,
        {
          cinemaId: order.cinemaId,
          showId: order.showId,
          referenceNo: order.referenceNo,
          membershipId: order.membershipId || '0',
          token: order.token || '',
        }
      );

      if (!reserveResult.success) {
        console.error(`[Kiosk Reserve Failure] Order ${order.orderId} failed upstream reservation:`, reserveResult.error);

        // Instant Auto-Reversal (Void) to refund customer automatically
        const reversalResult = await callOpaReversal({
          referenceId: order.orderId,
          paymentReferenceId: tranNo,
        });

        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'CANCELLED',
            paymentStatus: reversalResult.success ? 'REFUNDED' : 'PAID',
            refund: reversalResult.success,
          },
        });

        return NextResponse.json({
          success: false,
          status: 'RESERVE_FAILED_REFUNDED',
          error: 'Seat reservation failed on cinema system. Your payment has been automatically reversed.',
          reversal: reversalResult,
        }, { status: 409 });
      }

      // Reservation Succeeded!
      await prisma.order.update({
        where: { id: order.id },
        data: { reserve_ticket: true },
      });

      if (order.customerEmail) {
        sendMobileTicketEmailForOrder(order.orderId).catch(() => {});
      }

      const ticketData = await fetchCinemaTicketData(order.cinemaId, order.showId, order.referenceNo);

      return NextResponse.json({
        success: true,
        status: 'PAID',
        isReserved: true,
        orderId: order.orderId,
        referenceNo: order.referenceNo,
        transactionNo: tranNo,
        amount: fiuuInquiry.amount || (order.totalAmount ? order.totalAmount.toString() : '0.00'),
        ticketData: ticketData || {
          movieTitle: order.movieTitle,
          cinemaName: order.cinemaName,
          hallName: order.hallName,
          showTime: order.showTime,
          seats: order.seats,
          referenceNo: order.referenceNo,
        },
      });
    }

    // 5. Payment Failed or Expired at Fiuu Gateway
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'FAILED',
        status: 'CANCELLED',
      },
    });

    return NextResponse.json({
      success: false,
      status: 'FAILED',
      statusCode: fiuuInquiry.statusCode,
      error: fiuuInquiry.raw?.errorDesc || 'Payment was not completed or expired',
    });
  } catch (error) {
    console.error('[Kiosk Status Route Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
