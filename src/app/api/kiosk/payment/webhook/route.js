/**
 * Kiosk API: Fiuu OPA Webhook / IPN Notification Receiver
 * Endpoint: POST & GET /api/kiosk/payment/webhook
 * Receives asynchronous server-to-server notifications from Fiuu.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyOpaSignature } from '@/utils/fiuu-opa';
import { callReserveBooking, savePaymentLogDB } from '@/utils/molpay';
import { sendMobileTicketEmailForOrder } from '@/utils/order-email';

export async function POST(request) {
  return handleWebhook(request);
}

export async function GET(request) {
  return handleWebhook(request);
}

async function handleWebhook(request) {
  try {
    let payload = {};

    if (request.method === 'POST') {
      const contentType = request.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        payload = await request.json().catch(() => ({}));
      } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
        const formData = await request.formData().catch(() => null);
        if (formData) {
          for (const [key, value] of formData.entries()) {
            payload[key] = value;
          }
        }
      } else {
        const rawText = await request.text().catch(() => '');
        const params = new URLSearchParams(rawText);
        payload = Object.fromEntries(params.entries());
      }
    } else {
      const url = new URL(request.url);
      payload = Object.fromEntries(url.searchParams.entries());
    }

    const {
      referenceId,
      molTransactionId,
      statusCode,
      amount,
      channelId,
      errorCode,
      signature,
    } = payload;

    console.log(`[Fiuu OPA Webhook] Received notification for Ref: ${referenceId}, Status: ${statusCode}`);

    if (!referenceId) {
      return NextResponse.json({ status: false, error: 'Reference ID is missing' }, { status: 400 });
    }

    // 1. Verify Signature
    const isValid = verifyOpaSignature(payload);
    if (!isValid && signature) {
      console.warn(`[Fiuu OPA Webhook] Invalid signature for Ref: ${referenceId}`);
    }

    // 2. Fetch Order
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { orderId: referenceId },
          { referenceNo: referenceId },
        ],
      },
    });

    // 3. Save Log in DB
    await savePaymentLogDB({
      orderid: referenceId,
      referenceNo: order?.referenceNo || null,
      transactionNo: molTransactionId || null,
      status: statusCode,
      amount: amount ? parseFloat(amount) : (order?.totalAmount ? parseFloat(order.totalAmount.toString()) : null),
      currency: payload.currencyCode || 'MYR',
      channel: `FIUU_OPA_${channelId || 'QR'}`,
      method: 'OPA_WEBHOOK',
      returnData: payload,
      isSuccess: statusCode === '00',
      remarks: statusCode === '00' ? 'Webhook payment confirmed' : `Webhook payment status: ${statusCode} (Error: ${errorCode || ''})`,
      request,
    });

    if (!order) {
      console.warn(`[Fiuu OPA Webhook] Order not found for Ref: ${referenceId}`);
      return new NextResponse('OK', { status: 200 });
    }

    // 4. If Successful Payment (statusCode '00')
    if (statusCode === '00') {
      const tranNo = molTransactionId || referenceId;

      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          status: 'CONFIRMED',
          transactionNo: tranNo,
          paymentMethod: 'FIUU_QR',
        },
      });

      // Call Upstream Cinema ReserveBooking if not already reserved
      if (!order.reserve_ticket) {
        const reserveResult = await callReserveBooking(
          order.orderId,
          tranNo,
          'Fiuu QR Webhook',
          payload.authorizationCode || tranNo,
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
        } else {
          console.error(`[Fiuu OPA Webhook] ReserveBooking failed for Order ${order.orderId}:`, reserveResult.error);
        }
      }
    } else if (statusCode !== '11' && statusCode !== '22') {
      // If explicit failure
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'FAILED',
          status: 'CANCELLED',
        },
      });
    }

    // Always acknowledge Fiuu gateway with 200 OK
    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('[Fiuu OPA Webhook Error]:', error);
    return new NextResponse('Error', { status: 500 });
  }
}
