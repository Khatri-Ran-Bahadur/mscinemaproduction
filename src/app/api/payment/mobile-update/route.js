/**
 * API Route: Mobile Payment Update
 * This endpoint is called by the mobile app after a SDK payment to sync server state.
 * SECURITY: Requires x-api-key header
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { savePaymentLogDB } from '@/utils/molpay';

const API_SECRET_KEY = process.env.API_SECRET_KEY;

export async function POST(req) {
  try {
    // 0. Security Check
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey || apiKey !== API_SECRET_KEY) {
      return NextResponse.json({ status: false, error: 'Unauthorized: Invalid API Key' }, { status: 401 });
    }

    const body = await req.json();
    const { 
        orderId, 
        transactionId, 
        status,           // 'SUCCESS' or 'FAILED'
        channel,          // FPX, Credit Card, etc.
        appCode,          // Authorization code from bank
        amount,
        currency = 'MYR',
        errorDescription = '',
        fiuuRequest = {}
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
      request: fiuuRequest
    });

    // 3. Process Status
    if (status === 'SUCCESS') {
      // Update Order in DB to PAID
      await prisma.order.update({
        where: { orderId: orderId },
        data: {
          paymentStatus: 'PAID',
          status: 'CONFIRMED',
          transactionNo: transactionId,
          paymentMethod: channel || 'Mobile App',
          updatedAt: new Date()
        }
      });

      return NextResponse.json({
        status: true,
        message: 'Payment status updated to SUCCESS',
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
          paymentMethod: channel || 'Mobile App',
          updatedAt: new Date()
        }
      });

      return NextResponse.json({
        status: true,
        message: 'Payment status updated to FAILED',
        data: { orderId, status: 'CANCELLED' }
      });
    }

  } catch (error) {
    console.error('[Mobile Update API] Error:', error);
    return NextResponse.json({ status: false, error: 'Internal server error' }, { status: 500 });
  }
}
