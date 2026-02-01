// app/api/molpay_return/route.ts
import { NextResponse } from 'next/server';
import { writeMolpayLog, savePaymentLogDB, verifyReturnSignature, callReserveBooking, callCancelBooking, createRedirectResponse } from '@/utils/molpay';
import prisma from '@/lib/prisma';

export async function GET(request){ return handleReturn(request); }
export async function POST(request){ return handleReturn(request); }

async function handleReturn(request) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  let orderid = 'unknown';
  try {
    const url = new URL(request.url);
    const returnData = {};
    url.searchParams.forEach((v,k)=> returnData[k] = v);
    if(request.method==='POST'){
      const formData = await request.formData().catch(()=>null);
      if(formData) for(const [k,v] of formData.entries()) returnData[k] = v;
    }

    orderid = returnData.orderid || `unknown_${Date.now()}`;
    writeMolpayLog(orderid,'RETURN',returnData);

    const isValidSignature = verifyReturnSignature(returnData);
    const SUCCESS_STATUSES = ['00','22'];
    let finalStatus = SUCCESS_STATUSES.includes(returnData.status) && isValidSignature ? 'PAID' : returnData.status;

    // Save payment log
    let isSuccess=false;
    if (finalStatus === 'PAID' || SUCCESS_STATUSES.includes(returnData.status)) {
      isSuccess = true;
    }
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
      remarks: isSuccess ? 'Payment successful (return)' : 'Payment failed (return)',
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
          where: { id: order.id }, // use primary key
          data: {
            orderId: orderid
          }
        });
      }

    }
    
    if(!order) return createRedirectResponse(`${baseUrl}payment/failed?orderid=${encodeURIComponent(orderid)}&error=order_not_found`);

    // Inject order details for API calls
    returnData.storedDetails = {
      token: order.token || '',
      cinemaId: order.cinemaId || '',
      showId: order.showId || '',
      referenceNo: order.referenceNo || ''
    };

    // ReserveBooking or CancelBooking
    if(finalStatus==='00' || finalStatus==='22' || finalStatus==='PAID'){
      let updateData = { paymentStatus:'PAID', status:'CONFIRMED', transactionNo:returnData.tranID };
      let updated = false;

      // 1. Reserve Booking
        const reserveResult = await callReserveBooking(orderid, returnData.tranID, returnData.channel, returnData.appcode, returnData);
        if(reserveResult.success){
          updateData.reserve_ticket = true;
          updateData.cancel_ticket = false;
          updated = true;
        } 

      // // 2. Cancel Booking (Confirmation step)
      // // Only call if not already cancelled
      // if(!order.cancel_ticket){
      //     const cancelResult = await callCancelBooking(orderid, returnData.tranID, returnData.channel, 'Automatic Post-Reserve Cancel (Return)', returnData);
      //     // We mark cancel_ticket true if success or if it says "already"
      //     if(cancelResult.success || cancelResult.error?.includes('already')){
      //        updateData.cancel_ticket = true;
      //        updated = true;
      //     }
      // }

      // Commit updates if any flags changed or if we need to confirm payment status
      if(updated || order.paymentStatus !== 'PAID'){
          await prisma.order.update({
            where:{ orderId: orderid },
            data: updateData
          });
      }

    } else {
        // Payment Failed Case
        if(!order.cancel_ticket && order.paymentStatus!=='PAID'){
          let cancelData = await callCancelBooking(orderid, returnData.tranID, returnData.channel, returnData.error_desc || 'Payment failed', returnData);
          let iscancel = false;
          if (cancelData.success) {
            iscancel = true;
          }
          
            await prisma.order.update({
                where:{ orderId: orderid },
                data:{ 
                paymentStatus:'FAILED', 
                status:'CANCELLED', 
                transactionNo:returnData.tranID,
                cancel_ticket: iscancel
                }
            });
        } else if(order.paymentStatus !== 'FAILED') {
             // Just ensure status is updated even if cancel was done by callback
             await prisma.order.update({
                where:{ orderId: orderid },
                data:{ paymentStatus:'FAILED', status:'CANCELLED' }
            });
        }
    }

    if(returnData.status==='00' || returnData.status==='22') {
      return createRedirectResponse(`${baseUrl}payment/success?orderid=${encodeURIComponent(orderid)}`);
    } else {
      return createRedirectResponse(`${baseUrl}payment/failed?orderid=${encodeURIComponent(orderid)}&error=payment_failed`);
    }
    
  }
  catch(e){
    console.error('[MOLPay Return] Error', e);
      return createRedirectResponse(`${baseUrl}payment/failed?orderid=${encodeURIComponent(orderid)}&error=processing_error`);
  }
}