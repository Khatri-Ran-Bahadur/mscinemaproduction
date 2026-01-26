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
      isSuccess: finalStatus==='PAID',
      remarks: finalStatus==='PAID' ? 'Payment successful (return)' : 'Payment failed (return)',
      request
    });

    // Check existing order
    const order = await prisma.order.findUnique({ where:{ orderId: orderid }});
    if(!order) return createRedirectResponse(`${baseUrl}payment/failed?orderid=${encodeURIComponent(orderid)}&error=order_not_found`);

    // ReserveBooking or CancelBooking
    if(finalStatus==='00' || finalStatus==='22' || finalStatus==='PAID'){
      const reserveResult = await callReserveBooking(orderid, returnData.tranID, returnData.channel, returnData.appcode, returnData);
      if(reserveResult.success){
        await prisma.order.update({
          where:{ orderId: orderid },
          data:{ paymentStatus:'PAID', status:'CONFIRMED', transactionNo:returnData.tranID }
        });
      } else {
        await callCancelBooking(orderid, returnData.tranID, returnData.channel, reserveResult.error || 'ReserveBooking failed', returnData);
        await prisma.order.update({
          where:{ orderId: orderid },
          data:{ paymentStatus:'FAILED', status:'CANCELLED', transactionNo:returnData.tranID }
        });
        finalStatus='FAILED';
      }
    } else {
      await callCancelBooking(orderid, returnData.tranID, returnData.channel, returnData.error_desc || 'Payment failed', returnData);
      await prisma.order.update({
        where:{ orderId: orderid },
        data:{ paymentStatus:'FAILED', status:'CANCELLED', transactionNo:returnData.tranID }
      });
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