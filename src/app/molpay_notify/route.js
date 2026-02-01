// app/api/molpay_callback/route.js
import { NextResponse } from 'next/server';
import { writeMolpayLog, savePaymentLogDB, verifyReturnSignature, acknowledgeResponse } from '@/utils/molpay';
import prisma from '@/lib/prisma';

export async function POST(request) {
  return handleCallback(request);
}

export async function GET(request) {
  return handleCallback(request);
}

async function handleCallback(request) {
  try {
    const returnData = {};

    // 1️⃣ GET query params
    const url = new URL(request.url);
    url.searchParams.forEach((value, key) => {
      returnData[key] = value;
    });

    // 2️⃣ POST form or JSON
    if (request.method === 'POST') {
      const contentType = request.headers.get('content-type') || '';
      if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
        const formData = await request.formData().catch(() => null);
        if (formData) {
          for (const [k, v] of formData.entries()) returnData[k] = v;
        }
      } else if (contentType.includes('application/json')) {
        const jsonBody = await request.json().catch(() => ({}));
        Object.assign(returnData, jsonBody);
      }
    }

    const orderid = returnData.orderid || `unknown_${Date.now()}`;

      // Log callback
    if(returnData.orderid){
        writeMolpayLog(orderid, 'NOTIFY', returnData);
    }
    

    // Verify signature
    const isValidSignature = verifyReturnSignature(returnData);
    const SUCCESS_STATUSES = ['00', '22'];
    const finalStatus = SUCCESS_STATUSES.includes(returnData.status) && isValidSignature ? 'PAID' : returnData.status;

    // Save payment log
    await savePaymentLogDB({
      orderid,
      referenceNo: returnData.referenceNo || returnData.refno || null,
      transactionNo: returnData.tranID || null,
      status: finalStatus,
      amount: returnData.amount || null,
      currency: returnData.currency || null,
      channel: returnData.channel || null,
      method: request.method,
      returnData,
      isSuccess: finalStatus === 'PAID',
      remarks: finalStatus === 'PAID' ? 'Payment successful (callback)' : 'Payment failed (callback)',
      request
    });

    // Check existing order
    let order = await prisma.order.findUnique({
      where: { orderId: orderid }
    });
    
    if (!order && returnData.referenceNo) {
      order = await prisma.order.findFirst({
        where: { referenceNo: returnData.referenceNo },
        orderBy: { createdAt: 'desc' }
      });

      if (order) {
        order = await prisma.order.update({
          where: { id: order.id },
          data: { orderId: orderid }
        });
      }
    }

    if (order) {
        if (finalStatus === 'PAID') {
          await prisma.order.update({
            where: { id: order.id },
            data: { paymentStatus: 'PAID', status: 'CONFIRMED', transactionNo: returnData.tranID }
          });
        } else {
          await prisma.order.update({
            where: { id: order.id },
            data: { paymentStatus: 'FAILED', status: 'CANCELLED', transactionNo: returnData.tranID }
          });
        }
    } else {
        console.warn(`[Notify] Order not found for OrderID: ${orderid}`);
    }

    // Always return RECEIVEOK for MOLPay callbacks
    return acknowledgeResponse();

  } catch (e) {
    console.error('[MOLPay Callback] Error', e);
    return acknowledgeResponse();
  }
}