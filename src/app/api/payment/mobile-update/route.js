/**
 * API Route: Mobile Payment Update
 * This endpoint is called by the mobile app after a successful SDK payment to sync server state.
 * SECURITY: Requires x-api-key header
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { savePaymentLogDB, callReserveBooking, callCancelBooking } from '@/utils/molpay';
import { sendTicketEmailForOrder } from '@/utils/order-email';

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
        orderId, 
        transactionId, 
        status,           // 'SUCCESS' or 'FAILED'
        channel,          // FPX, Credit Card, etc.
        appCode,          // Authorization code from bank
        amount,
        currency = 'MYR',
        errorDescription = '' 
    } = body;

    if (!orderId) {
      return NextResponse.json({ status: false, error: 'Order ID is required' }, { status: 400 });
    }

    // 1. Fetch the Order
    const order = await prisma.order.findUnique({
      where: { orderId: orderId }
    });

    if (!order) {
      return NextResponse.json({ status: false, error: 'Order not found' }, { status: 404 });
    }

    // 2. Log the activity
    await savePaymentLogDB({
      orderid: orderId,
      referenceNo: order.referenceNo,
      transactionNo: transactionId || null,
      status: status,
      amount: amount || order.totalAmount,
      currency: currency,
      channel: channel || 'Mobile SDK',
      method: 'MOBILE_UPDATE',
      returnData: body,
      isSuccess: status === 'SUCCESS',
      remarks: status === 'SUCCESS' ? 'Mobile App success signal' : `Mobile App failed: ${errorDescription}`,
      request
    });

    // 3. Process Status
    if (status === 'SUCCESS') {
      // a. Update Order to PAID/CONFIRMED
      await prisma.order.update({
        where: { orderId: orderId },
        data: {
          paymentStatus: 'PAID',
          status: 'CONFIRMED',
          transactionNo: transactionId,
          paymentMethod: channel || 'Mobile SDK',
          updatedAt: new Date()
        }
      });

      // b. Send Ticket Email (Using new logic)
      await sendTicketEmailForOrder(orderId, transactionId);

      return NextResponse.json({
        status: true,
        message: 'Order updated and ticket sent',
        data: {
          orderId,
          status: 'CONFIRMED'
        }
      });

    } else {
      // Payment Failed case
      await prisma.order.update({
        where: { orderId: orderId },
        data: {
          paymentStatus: 'FAILED',
          status: 'CANCELLED',
          transactionNo: transactionId,
          updatedAt: new Date()
        }
      });

      return NextResponse.json({
        status: true,
        message: 'Order status updated to FAILED',
        data: { orderId, status: 'CANCELLED' }
      });
    }

  } catch (error) {
    console.error('[Mobile Update API] Error:', error);
    return NextResponse.json({ status: false, error: 'Internal server error' }, { status: 500 });
  }
}
