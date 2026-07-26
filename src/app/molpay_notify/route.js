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

    // Capture raw body
    const rawBody = await request.clone().text().catch(() => "");

    // 2️⃣ POST form or JSON
    if (request.method === 'POST') {
      const contentType = request.headers.get('content-type') || '';
      if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
        const formData = await request.formData().catch(() => null);
        if (formData) {
          for (const [k, v] of formData.entries()) returnData[k] = v;
        }
        
        // Fallback: If formData failed or was empty, parse rawBody
        if (Object.keys(returnData).length === 0 && rawBody) {
          const params = new URLSearchParams(rawBody);
          const obj = Object.fromEntries(params.entries());
          Object.assign(returnData, obj);
        }
      } else if (contentType.includes('application/json')) {
        const jsonBody = await request.json().catch(() => ({}));
        Object.assign(returnData, jsonBody);
      } else {
        // fallback parsing for unknown content types
        const params = new URLSearchParams(rawBody);
        const obj = Object.fromEntries(params.entries());
        if (Object.keys(obj).length) {
          Object.assign(returnData, obj);
        }
      }
    }

    const orderid = returnData.orderid || `unknown_${Date.now()}`;

    // Always log the raw request and parsed data for debugging
    writeMolpayLog(orderid, 'NOTIFY_RAW_REQUEST', {
      method: request.method,
      url: request.url,
      rawBody: rawBody,
      parsedData: returnData,
      headers: Object.fromEntries(request.headers.entries())
    });
    

    // Verify signature
    const isValidSignature = verifyReturnSignature(returnData);
    const SUCCESS_STATUSES = ['00'];
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
        } else if(finalStatus === '22'){
          await prisma.order.update({
            where: { id: order.id },
            data: { paymentStatus: 'PENDING', status: 'PENDING', transactionNo: returnData.tranID }
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