// app/api/molpay_callback/route.js
import { NextResponse } from 'next/server';
import { writeMolpayLog, savePaymentLogDB, verifyReturnSignature, acknowledgeResponse, callReserveBooking, callCancelBooking } from '@/utils/molpay';
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

    // Verify signature
    const isValidSignature = verifyReturnSignature(returnData);
    const SUCCESS_STATUSES = ['00', '22'];
    const finalStatus = SUCCESS_STATUSES.includes(returnData.status) && isValidSignature ? 'PAID' : returnData.status;

    let isSuccess = false;
    
    if (finalStatus === 'PAID' || SUCCESS_STATUSES.includes(returnData.status)) {
      isSuccess = true;
      
    }
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
      isSuccess: isSuccess,
      remarks: isSuccess ? 'Payment successful (callback)' : 'Payment failed (callback)',
      request
    });

    // Check existing order to get token and flags
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
          where: { id: order.id }, // use primary key
          data: {
            orderId: orderid
          }
        });
      }
      
    }
    

    if (order ) {
        // Inject order details for API calls if needed (fallback if returnData is missing them)
        returnData.storedDetails = {
            token: order.token || '',
            cinemaId: order.cinemaId || '',
            showId: order.showId || '',
            referenceNo: order.referenceNo || ''
        };
        
        // Prepare flags for update
        let updateData = { transactionNo: returnData.tranID };
        let reserveSuccess = order.reserve_ticket;
        let cancelSuccess = order.cancel_ticket;

        if (finalStatus === 'PAID' || finalStatus==='00' || finalStatus==='22') {
            updateData.paymentStatus = 'PAID';
            updateData.status = 'CONFIRMED';
            
            // 1. Reserve Booking (Idempotent check)
            
                const reserveResult = await callReserveBooking(orderid, returnData.tranID, returnData.channel, returnData.appcode, returnData);
                if (reserveResult.success) {
                    reserveSuccess = true;
                    updateData.reserve_ticket = true;
                  updateData.cancel_ticket = false;
                } 

            // 2. Cancel Booking (Idempotent check)
           
            // if (!order.cancel_ticket) {
                 
            //      const cancelResult = await callCancelBooking(orderid, returnData.tranID, returnData.channel, 'Callback Auto-Cancel', returnData);
            //      if (cancelResult.success || cancelResult.error?.includes('already')) {
            //          cancelSuccess = true;
            //      }
            // }
           
        } else {
             // Payment Failed
             updateData.paymentStatus = 'FAILED';
             updateData.status = 'CANCELLED';
             
             if (!order.cancel_ticket) {
               let cancelResult = await callCancelBooking(orderid, returnData.tranID, returnData.channel, returnData.error_desc || 'Payment failed (Callback)', returnData);
               
               if (cancelResult.success || cancelResult.error?.includes('already')) {
                cancelSuccess = true;
                updateData.cancel_ticket = true;
              }
             }
        }

        await prisma.order.update({
            where: { orderId: orderid },
            data: updateData
        });

    } else {
        console.warn(`[Callback] Order not found for OrderID: ${orderid}`);
    }

    // Always return RECEIVEOK for MOLPay callbacks
    return acknowledgeResponse();

  } catch (e) {
    console.error('[MOLPay Callback] Error', e);
    return acknowledgeResponse();
  }
}
