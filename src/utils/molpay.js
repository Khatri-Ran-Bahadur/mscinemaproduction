// utils/molpay.ts
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';

export function writeMolpayLog(referenceNo, type, payload) {
  try {
    /*
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

    const safeRef = (referenceNo || 'unknown').toString().replace(/[^a-zA-Z0-9_-]/g, '');
    const logPath = path.join(logsDir, `payment_api_${safeRef}.log`);
    const entry = [
      '========================================',
      `TIMESTAMP: ${new Date().toISOString()}`,
      `TYPE: ${type}`,
      'payload:',
      typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2),
      '========================================',
      ''
    ].join('\n');
    */

    // fs.appendFileSync(logPath, entry);
    console.log(`[MOLPay API Log] ${type} -> ${logPath}`);
  } catch (err) {
    console.error('[MOLPay API Log] Failed:', err);
  }
}

export async function savePaymentLogDB({ orderid, referenceNo, transactionNo, status, amount, currency, channel, method, returnData, isSuccess, remarks, request }) {
  try {
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const amt = amount ? parseFloat(amount) : null;

    if (orderid.includes('unknown')) {
      return null;
    }

    await prisma.paymentLog.create({
      data: {
        orderId: orderid || null,
        referenceNo: referenceNo || returnData?.referenceNo || returnData?.refno || null,
        transactionNo: transactionNo || returnData?.tranID || null,
        status: status || null,
        amount: amt,
        currency: currency || returnData?.currency || 'MYR',
        channel: channel || returnData?.channel || 'unknown',
        method: method || 'UNKNOWN',
        ipAddress,
        userAgent,
        returnData: returnData || {},
        isSuccess: !!isSuccess,
        remarks: remarks || '',
      }
    });
    console.log(`[Payment DB Log] Saved payment log for orderId: ${orderid || 'unknown'}`);
  } catch (err) {
    console.error('[Payment DB Log] Failed:', err);
  }
}

const RMS_CONFIG = {
  merchantId: process.env.FIUU_MERCHANT_ID || '',
  verifyKey: process.env.FIUU_VERIFY_KEY || '',
  secretKey: process.env.FIUU_SECRET_KEY || '',
};

export function verifyReturnSignature(data) {
  try {
    const { tranID, orderid, status, domain, amount, currency, paydate, appcode, skey } = data;
    if (!tranID || !orderid || !status || !domain || !amount || !currency || !paydate || !appcode || !skey) return false;

    const md5 = (str) => crypto.createHash('md5').update(str, 'utf8').digest('hex');

    const key0 = md5(`${tranID}${orderid}${status}${domain}${amount}${currency}`);
    const key1 = md5(`${paydate}${domain}${key0}${appcode}${RMS_CONFIG.secretKey}`);
    return skey === key1 || skey.toLowerCase() === key1.toLowerCase();
  } catch (e) {
    console.error('[MOLPay Return] verifyReturnSignature error:', e);
    return false;
  }
}

export async function callReserveBooking(orderid, tranID, channel, appcode, returnData) {
  try {
    let cinemaId = returnData.cinemaId || returnData.cinema_id || '';
    let showId = returnData.showId || returnData.show_id || '';
    let referenceNo = returnData.referenceNo || returnData.refno || '';
    let membershipId = returnData.membershipId || returnData.membership_id || '0';
    let token = '';

    if(!cinemaId || !showId || !referenceNo){
      const stored = returnData.storedDetails;
      if(stored){
        cinemaId = cinemaId || stored.cinemaId;
        showId = showId || stored.showId;
        referenceNo = referenceNo || stored.referenceNo;
        membershipId = membershipId || stored.membershipId || '0';
        token = stored.token || '';
      }
    }

    if(!cinemaId || !showId || !referenceNo) return { success: false, error:'Missing booking details', skip:false };

    const transactionNo = tranID || orderid;
    const cardType = '4'; // default credit/debit
    const authorizeId = appcode || tranID || transactionNo;
    const remarks = `Payment successful via ${channel || 'MOLPay'}`;

    const queryParams = new URLSearchParams();
    queryParams.append('TransactionNo', transactionNo);
    queryParams.append('CardType', cardType);
    queryParams.append('AuthorizeId', authorizeId);
    queryParams.append('Remarks', remarks);

    const url = `${API_CONFIG.API_BASE_URL}/Booking/ReserveBooking/${cinemaId}/${showId}/${referenceNo}/${membershipId}/TransactionNo/CardType/AuthorizeId/Remarks?${queryParams.toString()}`;

    const headers = {'accept':'*/*','Content-Type':'application/json'};
    if(token) headers['Authorization'] = `Bearer ${token}`;

    const resp = await fetch(url, { method:'POST', headers });
    if(!resp.ok) return { success:false, error:`ReserveBooking failed: ${resp.status}`, skip:false };

    const data = await resp.json();
    return { success:true, data };
  } catch(e){
    return { success:false, error:e.message || 'Unknown error', skip:false };
  }
}

export async function callCancelBooking(orderid, tranID, channel, errorDesc, returnData) {
  try {
    let cinemaId = returnData.cinemaId || returnData.cinema_id || '';
    let showId = returnData.showId || returnData.show_id || '';
    let referenceNo = returnData.referenceNo || returnData.refno || '';
    let token = '';

    if(!cinemaId || !showId || !referenceNo){
      const stored = returnData.storedDetails;
      if(stored){
        cinemaId = cinemaId || stored.cinemaId;
        showId = showId || stored.showId;
        referenceNo = referenceNo || stored.referenceNo;
        token = stored.token || '';
      }
    }

    if(!cinemaId || !showId || !referenceNo) return { success: false, error:'Missing booking details', skip:false };

    const transactionNo = tranID || orderid;
    const cardType = '4';
    const remarks = errorDesc || `Payment failed via ${channel || 'MOLPay'}`;

    const queryParams = new URLSearchParams();
    queryParams.append('TransactionNo', transactionNo);
    queryParams.append('CardType', cardType);
    queryParams.append('Remarks', remarks);

    const url = `${API_CONFIG.API_BASE_URL}/Booking/CancelBooking/${cinemaId}/${showId}/${referenceNo}/TransactionNo/CardType/Remarks?${queryParams.toString()}`;

    const headers = {'accept':'*/*','Content-Type':'application/json'};
    if(token) headers['Authorization'] = `Bearer ${token}`;

    const resp = await fetch(url,{ method:'POST', headers });
    if(!resp.ok) return { success:false, error:`CancelBooking failed: ${resp.status}`, skip:false };

    const data = await resp.json();
    return { success:true, data };
  } catch(e){
    return { success:false, error:e.message || 'Unknown error', skip:false };
  }
}

export function acknowledgeResponse(){
  return new NextResponse('RECEIVEOK',{ status:200, headers:{'Content-Type':'text/plain'} });
}

export function createRedirectResponse(redirectUrl){
  const escapedUrl = redirectUrl.replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'\\"');
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Redirecting...</title></head><body>
  <script>try{window.top.location.replace('${escapedUrl}');}catch(e){window.location.href='${escapedUrl}';}</script>
  <p>Redirecting... <a href="${escapedUrl}">Click here if not redirected</a></p>
  </body></html>`;
  return new NextResponse(html, { status:200, headers:{'Content-Type':'text/html; charset=utf-8'} });
}