/**
 * API Route: MOLPay Return Handler (Legacy PHP compatibility)
 * This endpoint handles return URL callbacks from Razer Merchant Services
 * This is the equivalent of molpay_return.php for Next.js
 * 
 * Documentation: https://github.com/RazerMS/SDK-RazerMS_Node_JS/wiki/Installation-Guidance
 */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { PaymentLogger } from '@/utils/logger';
import { getBookingDetails, deleteBookingDetails } from '@/utils/booking-storage';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

/**
 * Write molpay return logs to workspace logs directory.
 * Each order/reference will have a dedicated file: logs/payment_api_{safeRef}.log
 */
function writeMolpayLog(referenceNo, type, payload) {
  try {
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const safeRef = (referenceNo || 'unknown').toString().replace(/[^a-zA-Z0-9_-]/g, '');
    const filename = `payment_api_${safeRef}.log`;
    const logPath = path.join(logsDir, filename);
    const timestamp = new Date().toISOString();
    const entry = [
      '========================================',
      `TIMESTAMP: ${timestamp}`,
      `TYPE: ${type}`,
      'payload:',
      typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2),
      '========================================',
      ''
    ].join('\n');

    fs.appendFileSync(logPath, entry);
    // also mirror to console for quick visibility
    console.log(`[MOLPay API Log] ${type} -> ${filename}`);
  } catch (err) {
    console.error('[MOLPay API Log] Failed to write log:', err);
  }
}

/**
 * Save payment log to Database (Prisma PaymentLog table)
 */
async function savePaymentLogDB({
  orderid,
  referenceNo,
  transactionNo,
  status,
  amount,
  currency,
  channel,
  method,
  returnData,
  isSuccess,
  remarks,
  request
}) {
  try {
    // For unknown orders, still save log but with minimal data
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const amt = amount ? parseFloat(amount) : null;
    
    await prisma.paymentLog.create({
      data: {
        orderId: orderid || null,
        referenceNo: referenceNo || returnData?.referenceNo || returnData?.refno || null,
        transactionNo: transactionNo || returnData?.tranID || null,
        status: status || null,
        amount: amt,
        currency: currency || returnData?.currency || 'MYR',
        channel: channel || returnData?.channel || 'unknown',
        method: method || request.method || 'UNKNOWN',
        ipAddress,
        userAgent,
        returnData: returnData || {},
        isSuccess: !!isSuccess,
        remarks: remarks || '',
      }
    });
    console.log(`[Payment DB Log] Saved payment log for orderId: ${orderid || 'unknown'}`);
  } catch (err) {
    console.error('[Payment DB Log] Failed to save:', err);
  }
}


// Razer Merchant Services Configuration
// Note: WordPress plugin uses secret_key for skey verification, not verify_key
const RMS_CONFIG = {
  merchantId: process.env.FIUU_MERCHANT_ID || '',
  verifyKey: process.env.FIUU_VERIFY_KEY || '', // Used for vcode creation
  secretKey: process.env.FIUU_SECRET_KEY || '', // Used for skey verification (like WordPress)
};

/**
 * Verify payment return signature (skey)
 * According to official documentation:
 * key0 = md5(tranID + orderid + status + domain + amount + currency)
 * key1 = md5(paydate + domain + key0 + appcode + vkey)
 * skey should equal key1
 */
function verifyReturnSignature(data) {
  try {
    const {
      tranID,
      orderid,
      status,
      domain,
      amount,
      currency,
      paydate,
      appcode,
      skey
    } = data;

    // Validate required fields
    if (!tranID || !orderid || !status || !domain || !amount || !currency || !paydate || !appcode || !skey) {
      const missing = [];
      if (!tranID) missing.push('tranID');
      if (!orderid) missing.push('orderid');
      if (!status) missing.push('status');
      if (!domain) missing.push('domain');
      if (!amount) missing.push('amount');
      if (!currency) missing.push('currency');
      if (!paydate) missing.push('paydate');
      if (!appcode) missing.push('appcode');
      if (!skey) missing.push('skey');
      
      console.error('[MOLPay Return] Missing required fields for signature verification:', missing);
      return false;
    }

    // Helper to check skey against a candidate key
    const checkSignature = (keyName, keySecret, useCurrency = true) => {
      // Step 1: Calculate key0
      // Standard: md5(tranID + orderid + status + domain + amount + currency)
      // Legacy/Single: md5(tranID + orderid + status + domain + amount)
      let key0String = `${tranID}${orderid}${status}${domain}${amount}`;
      if (useCurrency) {
        key0String += currency;
      }
      const key0 = crypto.createHash('md5').update(key0String, 'utf8').digest('hex');

      // Step 2: Calculate key1 = md5(paydate + domain + key0 + appcode + vkey)
      const key1String = `${paydate}${domain}${key0}${appcode}${keySecret}`;
      const key1 = crypto.createHash('md5').update(key1String, 'utf8').digest('hex');

      if (skey === key1) return { match: true, method: 'exact' };
      if (skey.toLowerCase() === key1.toLowerCase()) return { match: true, method: 'case-insensitive' };
      return { match: false, expected: key1 };
    };

    // Attempt 1: Standard Config (Key = SecretKey, Currency = Yes)
    let result = checkSignature('SecretKey', RMS_CONFIG.secretKey, true);
    if (result.match) {
      console.log(`[MOLPay Return] Signature verified using SecretKey (${result.method})`);
      return true;
    }

    // Attempt 2: Swapped Keys (Key = VerifyKey, Currency = Yes)
    // Common mistake: user swaps verify and secret keys
    const result2 = checkSignature('VerifyKey', RMS_CONFIG.verifyKey, true);
    if (result2.match) {
      console.log(`[MOLPay Return] Signature verified using VerifyKey (${result2.method}) - Keys may be swapped in .env`);
      return true;
    }

    // Attempt 3: Legacy/Single Currency (Key = SecretKey, Currency = No)
    const result3 = checkSignature('SecretKey_NoCur', RMS_CONFIG.secretKey, false);
    if (result3.match) {
      console.log(`[MOLPay Return] Signature verified using SecretKey without Currency (${result3.method})`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('[MOLPay Return] Error verifying return signature:', error);
    return false;
  }
}

/**
 * Acknowledge response to Razer Merchant Services
 * This sends "RECEIVEOK" back to confirm receipt
 */
function acknowledgeResponse() {
  return new NextResponse('RECEIVEOK', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}

/**
 * Create an HTML redirect response that works in popups/iframes
 * This ensures the redirect happens even when MOLPay opens the return URL in a popup
 * Uses JavaScript to force GET method and handle popup/iframe scenarios
 */
function createRedirectResponse(redirectUrl) {
  // Escape the URL for safe use in HTML/JavaScript
  const escapedUrl = redirectUrl
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
  
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0;url=${escapedUrl}">
  <title>Redirecting...</title>
  <script>
    // Force GET method redirect - window.location.replace() always uses GET
    (function() {
      var url = '${escapedUrl}';
      
      try {
        if (window.opener && !window.opener.closed) {
          // If opened in popup, redirect parent window with GET (replace forces GET)
          window.opener.location.replace(url);
          setTimeout(function() { 
            try { window.close(); } catch(e) {}
          }, 100);
        } else if (window.top !== window.self) {
          // If in iframe, redirect top window with GET (replace forces GET)
          window.top.location.replace(url);
        } else {
          // Normal redirect - replace() forces GET method (doesn't preserve POST)
          window.location.replace(url);
        }
      } catch (e) {
        // Fallback: use replace() which always uses GET
        try {
          window.location.replace(url);
        } catch (e2) {
          // Last resort: use href (but this might preserve POST)
          window.location.href = url;
        }
      }
    })();
  </script>
</head>
<body>
  <p>Redirecting... <a href="${escapedUrl}">Click here if you are not redirected</a></p>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}

/**
 * Extract booking details from orderid and return URL
 * Orderid format: MS{timestamp}{random}_{refNo} or MS{timestamp}{random}_{cinemaId}_{showId}_{refNo}
 * @param {string} orderid - Order ID from payment
 * @param {string} returnUrl - Return URL that may contain query params
 * @returns {object} - Extracted booking details
 */
function extractBookingDetails(orderid, returnUrl = '') {
  // Orderid format: MS{timestamp}{random}_{refNo} or MS{timestamp}{random}_{cinemaId}_{showId}_{refNo}
  const parts = orderid.split('_');
  
  let cinemaId = '';
  let showId = '';
  let referenceNo = '';
  
  // Try to extract from orderid format: MS{timestamp}{random}_{cinemaId}_{showId}_{refNo}
  if (parts.length >= 3) {
    // Format: MS{timestamp}{random}_{cinemaId}_{showId}_{refNo}
    cinemaId = parts[parts.length - 3] || '';
    showId = parts[parts.length - 2] || '';
    referenceNo = parts[parts.length - 1] || '';
  } else if (parts.length === 2) {
    // Format: MS{timestamp}{random}_{refNo}
    referenceNo = parts[parts.length - 1] || '';
  }
  
  // Try to get from return URL query params if not in orderid
  if (returnUrl) {
    try {
      const url = new URL(returnUrl);
      const params = url.searchParams;
      if (!cinemaId) cinemaId = params.get('cinemaId') || params.get('cinema_id') || '';
      if (!showId) showId = params.get('showId') || params.get('show_id') || '';
      if (!referenceNo) referenceNo = params.get('referenceNo') || params.get('reference_no') || params.get('refno') || '';
    } catch (e) {
      // Invalid URL, continue
    }
  }
  
  return {
    cinemaId,
    showId,
    referenceNo,
  };
}

/**
 * Map payment channel to card type
 * @param {string} channel - Payment channel from MOLPay
 * @returns {string} - Card type code
 */
function mapChannelToCardType(channel) {
  // Map MOLPay channels to card types
  // CardType: 4 = Credit/Debit Card (common)
  const channelMap = {
    'credit': '4',
    'creditAN': '4',
    'fpx_mb2u': '5',
    'fpx': '5',
    // Add more mappings as needed
  };
  
  return channelMap[channel] || '4'; // Default to 4 (Credit/Debit Card)
}

/**
 * Call ReserveBooking API (using direct fetch to avoid server-side module issues)
 * REQUIRED: This must succeed before redirecting to success page
 */
async function callReserveBooking(orderid, tranID, channel, appcode, returnData) {
  const logger = new PaymentLogger(orderid);
  
  try {
   
    
    // Extract booking details from returnData (query params from return URL)
    // Booking details are added to return URL in create-request route
    let cinemaId = returnData.cinemaId || returnData.cinema_id || '';
    let showId = returnData.showId || returnData.show_id || '';
    let referenceNo = returnData.referenceNo || returnData.reference_no || returnData.refno || '';
    let membershipId = returnData.membershipId || returnData.membership_id || '0';
    
    
    // If not in returnData, try to retrieve from storage (for callbacks)
    if (!cinemaId || !showId || !referenceNo) {
      const storedDetails = getBookingDetails(orderid);
      if (storedDetails) {
        cinemaId = cinemaId || storedDetails.cinemaId || '';
        showId = showId || storedDetails.showId || '';
        referenceNo = referenceNo || storedDetails.referenceNo || '';
        membershipId = membershipId || storedDetails.membershipId || '0';
        var token = storedDetails.token || '';
        
     
      } 
    }
    
    // If not in returnData, try to extract from return URL
    if (!cinemaId || !showId || !referenceNo) {
      const returnUrl = returnData.returnUrl || returnData.mpsreturnurl || '';
      
      if (returnUrl) {
        try {
          const url = new URL(returnUrl);
          cinemaId = cinemaId || url.searchParams.get('cinemaId') || url.searchParams.get('cinema_id') || '';
          showId = showId || url.searchParams.get('showId') || url.searchParams.get('show_id') || '';
          referenceNo = referenceNo || url.searchParams.get('referenceNo') || url.searchParams.get('reference_no') || url.searchParams.get('refno') || '';
          membershipId = membershipId || url.searchParams.get('membershipId') || url.searchParams.get('membership_id') || '0';
          
        } catch (e) {
          
        }
      }
      
      // Last resort: try to extract from orderid format
      if (!cinemaId || !showId || !referenceNo) {
        const bookingDetails = extractBookingDetails(orderid, returnUrl);
        cinemaId = cinemaId || bookingDetails.cinemaId || '';
        showId = showId || bookingDetails.showId || '';
        referenceNo = referenceNo || bookingDetails.referenceNo || '';
      
      }
    }
    
    // Final validation
    if (!cinemaId || !showId || !referenceNo) {
      const error = 'Missing booking details for ReserveBooking';
      return { success: false, error, skip: false };
    }
    
    const transactionNo = tranID || orderid;
    const cardType = mapChannelToCardType(channel);
    const authorizeId = appcode || tranID || transactionNo;
    const remarks = `Payment successful via ${channel || 'MOLPay'}`;
    
    // Use direct API call instead of booking service to avoid server-side module issues
    const { API_CONFIG } = await import('@/config/api');
    const queryParams = new URLSearchParams();
    queryParams.append('TransactionNo', transactionNo);
    queryParams.append('CardType', cardType);
    queryParams.append('AuthorizeId', authorizeId);
    queryParams.append('Remarks', remarks);
    //http://cinemaapi5.ddns.net/api/Booking/ReserveBooking/7001/31546/U6REPB7G/0/TransactionNo/CardType/AuthorizeId/Remarks?TransactionNo=xfjksdfhsdf&CardType=Credetcard&AuthorizeId=fjhdkfhjksdfsdf&Remarks=sdfsdfs
    const url = `${API_CONFIG.API_BASE_URL}/Booking/ReserveBooking/${cinemaId}/${showId}/${referenceNo}/${membershipId}/TransactionNo/CardType/AuthorizeId/Remarks?${queryParams.toString()}`;
    
    // Use fetch directly to avoid server-side module loading issues
    const headers = {
      'accept': '*/*',
      'Content-Type': 'application/json',
    };
    
    // Add Authorization header if token exists
    // Note: token might be accessed from outer scope variable 'token' if defined, 
    // strictly we should pass it or extract it. 
    // In the block above, I defined 'var token'.
    if (typeof token !== 'undefined' && token) {
       headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      const error = `ReserveBooking failed: ${response.status} ${errorText}`;
      return { success: false, error, skip: false };
    }
    
    const data = await response.json();
    
    // Clean up stored booking details after successful processing
    
    return { success: true, data };
  } catch (error) {
    const errorMsg = error.message || 'Unknown error';
    return { success: false, error: errorMsg, skip: false };
  }
}

/**
 * Call CancelBooking API (using direct fetch to avoid server-side module issues)
 * REQUIRED: This must succeed before redirecting to failed page
 */
async function callCancelBooking(orderid, tranID, channel, errorDesc, returnData) {
  const logger = new PaymentLogger(orderid);
  
  try {
    
    // Extract booking details from returnData (query params from return URL)
    let cinemaId = returnData.cinemaId || returnData.cinema_id || '';
    let showId = returnData.showId || returnData.show_id || '';
    let referenceNo = returnData.referenceNo || returnData.reference_no || returnData.refno || '';
    

    
    // If not in returnData, try to retrieve from storage (for callbacks)
    if (!cinemaId || !showId || !referenceNo) {
      const storedDetails = getBookingDetails(orderid);
      if (storedDetails) {
        cinemaId = cinemaId || storedDetails.cinemaId || '';
        showId = showId || storedDetails.showId || '';
        referenceNo = referenceNo || storedDetails.referenceNo || '';
        var token = storedDetails.token || '';
        
      } 
    }
    
    // If not in returnData, try to extract from return URL
    if (!cinemaId || !showId || !referenceNo) {
      const returnUrl = returnData.returnUrl || returnData.mpsreturnurl || '';
      
      if (returnUrl) {
        try {
          const url = new URL(returnUrl);
          cinemaId = cinemaId || url.searchParams.get('cinemaId') || url.searchParams.get('cinema_id') || '';
          showId = showId || url.searchParams.get('showId') || url.searchParams.get('show_id') || '';
          referenceNo = referenceNo || url.searchParams.get('referenceNo') || url.searchParams.get('reference_no') || url.searchParams.get('refno') || '';
          
        } catch (e) {
        }
      }
      
      // Last resort: try to extract from orderid format
      if (!cinemaId || !showId || !referenceNo) {
        const bookingDetails = extractBookingDetails(orderid, returnUrl);
        cinemaId = cinemaId || bookingDetails.cinemaId || '';
        showId = showId || bookingDetails.showId || '';
        referenceNo = referenceNo || bookingDetails.referenceNo || '';
        
      }
    }
    
    // Final validation
    if (!cinemaId || !showId || !referenceNo) {
      const error = 'Missing booking details for CancelBooking';
      return { success: false, error, skip: false };
    }
    
    const transactionNo = tranID || orderid;
    const cardType = mapChannelToCardType(channel);
    const remarks = errorDesc || `Payment failed via ${channel || 'MOLPay'}`;
    
    
    
    // Use direct API call instead of booking service to avoid server-side module issues
    const { API_CONFIG } = await import('@/config/api');
    const queryParams = new URLSearchParams();
    queryParams.append('TransactionNo', transactionNo);
    queryParams.append('CardType', cardType);
    queryParams.append('Remarks', remarks);
    
    const url = `${API_CONFIG.API_BASE_URL}/Booking/CancelBooking/${cinemaId}/${showId}/${referenceNo}/TransactionNo/CardType/Remarks?${queryParams.toString()}`;
    
    // Use fetch directly to avoid server-side module loading issues
    const headers = {
      'accept': '*/*',
      'Content-Type': 'application/json',
    };
    
    if (typeof token !== 'undefined' && token) {
       headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
    });
    
    
    if (!response.ok) {
      const errorText = await response.text();
      const error = `CancelBooking failed: ${response.status} ${errorText}`;
      return { success: false, error, skip: false };
    }
    
    const data = await response.json();
    
    return { success: true, data };
  } catch (error) {
    const errorMsg = error.message || 'Unknown error';
    return { success: false, error: errorMsg, skip: false };
  }
}

/**
 * Handle GET/POST request from Razer Merchant Services return URL
 */
export async function GET(request) {
    
  return handleReturn(request);
}

export async function POST(request) {
  return handleReturn(request);
}

// Helper to write debug logs to file

async function handleReturn(request) {
  let orderid = 'unknown';
  const logData = {};

  try {
    // ============================================
    // STEP 1: Extract all incoming data
    // ============================================
    const returnData = {};   // normalized data for signature/payment
    const rawPostData = {};  // raw POST/form data
    const formDataTest = {}; // formData separately

    const urlObj = new URL(request.url);

    // Get query params (GET/HEAD)
    urlObj.searchParams.forEach((value, key) => {
      returnData[key] = value;
      rawPostData[key] = value;
    });

    // Get POST/form data
    try {
      const contentType = request.headers.get('content-type') || '';
      if (
        request.method === 'POST' &&
        (contentType.includes('application/x-www-form-urlencoded') ||
         contentType.includes('multipart/form-data') ||
         contentType.includes('application/json'))
      ) {
        const formData = await request.formData().catch(() => null);
        if (formData) {
          for (const [key, value] of formData.entries()) {
            returnData[key] = value;
            rawPostData[key] = value;
            formDataTest[key] = value;
          }
        } else if (contentType.includes('application/json')) {
          const jsonBody = await request.json().catch(() => ({}));
          Object.assign(returnData, jsonBody);
          Object.assign(rawPostData, jsonBody);
        }
      }
    } catch (e) {
      console.warn('[handleReturn] Failed to read POST/form data:', e.message);
    }

    // Request details
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'unknown';
    let protocol = 'https';
    const cfVisitor = request.headers.get('cf-visitor');
    if (cfVisitor) {
      try {
        const visitor = JSON.parse(cfVisitor);
        if (visitor.scheme) protocol = visitor.scheme;
      } catch {}
    } else {
      const forwardedProto = request.headers.get('x-forwarded-proto');
      protocol = forwardedProto === 'https' ? 'https' : 'https';
    }
    const actualUrl = `${protocol}://${host}`;

    orderid = returnData.orderid || `unknown_${Date.now()}`;


    const {
      tranID,
      orderid: orderidParam,
      status,
      domain,
      amount,
      currency,
      appcode,
      paydate,
      skey,
      error_code,
      error_desc,
      channel,
      nbcb
    } = returnData;

    const isCallback = nbcb === '1' || nbcb === '2';
    if (isCallback) console.log('[MOLPay Return] CALLBACK DETECTED, will return RECEIVEOK');

    // ============================================
    // STEP 4: Verify signature
    // ============================================
    const signatureData = request.method === 'POST' ? returnData : returnData; // use query params for GET/HEAD
    const isValidSignature = verifyReturnSignature(signatureData);

    const SUCCESS_STATUSES = ['00', '22'];
    let finalStatus = status;

    if (!isValidSignature) {
      console.warn('[MOLPay Return] Invalid signature');
      if (SUCCESS_STATUSES.includes(status)) {
        const successfulOrder = await prisma.order.findUnique({ where: { orderId: orderid } });
        finalStatus = (successfulOrder && successfulOrder.paymentStatus === 'PAID') ? status : '-1';
      } else {
        finalStatus = status;
      }
    }


    // ============================================
    // STEP 5: Process payment
    // ============================================

    // Ignore callbacks that have no valid order id/reference (these are often probe/unknown requests)
    const isUnknownOrder = !orderid || orderid.startsWith('unknown_') || orderid === 'unknown';
    if (isUnknownOrder) {
      // Save to database log
      await savePaymentLogDB({
        orderid: orderid || null,
        referenceNo: returnData.referenceNo || returnData.refno || null,
        transactionNo: returnData.tranID || null,
        status: finalStatus || null,
        amount: returnData.amount || null,
        currency: returnData.currency || null,
        channel: returnData.channel || null,
        method: request.method,
        returnData: returnData,
        isSuccess: false,
        remarks: 'Unknown callback - waiting for actual payment response',
        request: request
      });


      // For ALL unknown requests (callback or browser), just acknowledge and do nothing.
      // Wait for the actual payment response to arrive.
      // Always acknowledge - don't redirect browser, don't take any action
      // The actual payment callback with valid data will arrive shortly after
      return acknowledgeResponse();
    }

    if (finalStatus === '00' || finalStatus === '22') {
      // Save payment log to database
      await savePaymentLogDB({
        orderid,
        referenceNo: returnData.referenceNo || returnData.refno || null,
        transactionNo: tranID || null,
        status: finalStatus,
        amount: amount || null,
        currency: currency || null,
        channel: channel || null,
        method: request.method,
        returnData: returnData,
        isSuccess: true,
        remarks: 'Payment successful',
        request: request
      });

      if (!isValidSignature) {
        // Save payment log to database (invalid signature but status indicates success)
        await savePaymentLogDB({
          orderid,
          referenceNo: returnData.referenceNo || returnData.refno || null,
          transactionNo: tranID || null,
          status: finalStatus,
          amount: amount || null,
          currency: currency || null,
          channel: channel || null,
          method: request.method,
          returnData: returnData,
          isSuccess: false,
          remarks: 'Invalid signature - cannot verify payment',
          request: request
        });
        
        if (isCallback) return acknowledgeResponse();
        return createRedirectResponse(`${actualUrl}/payment/failed?orderid=${encodeURIComponent(orderid)}&error=invalid_signature`);
      }

      const reserveResult = await callReserveBooking(orderid, tranID, channel, appcode, returnData);

      if (!reserveResult.success) {
        // ReserveBooking failed
        if (isCallback) return acknowledgeResponse();
        const existingOrder = await prisma.order.findUnique({ where: { orderId: orderid } });
        if (existingOrder?.paymentStatus === 'PAID') return createRedirectResponse(`${actualUrl}/payment/success?orderid=${encodeURIComponent(orderid)}`);
        return createRedirectResponse(`${actualUrl}/payment/failed?orderid=${encodeURIComponent(orderid)}&error=reserve_booking_failed`);
      }

      // ReserveBooking success -> update DB
      try {
        await prisma.order.update({
          where: { orderId: orderid },
          data: { paymentStatus: 'PAID', status: 'CONFIRMED', transactionNo: tranID }
        });
      } catch (e) { console.error(e); }

      if (isCallback) return acknowledgeResponse();
      return createRedirectResponse(`${actualUrl}/payment/success?orderid=${encodeURIComponent(orderid)}`);
    } else if (finalStatus === '11') {
      // PAYMENT PENDING
      // Save payment log to database
      await savePaymentLogDB({
        orderid,
        referenceNo: returnData.referenceNo || returnData.refno || null,
        transactionNo: tranID || null,
        status: finalStatus,
        amount: amount || null,
        currency: currency || null,
        channel: channel || null,
        method: request.method,
        returnData: returnData,
        isSuccess: false,
        remarks: 'Payment pending',
        request: request
      });

      // If order exists and already FAILED, skip cancel
      try {
        const existingOrder = await prisma.order.findUnique({ where: { orderId: orderid } });
        if (existingOrder && existingOrder.paymentStatus === 'FAILED') {
          if (isCallback) return acknowledgeResponse();
          return createRedirectResponse(`${actualUrl}/payment/failed?orderid=${encodeURIComponent(orderid)}&status=${finalStatus}`);
        }
      } catch (e) { console.error('[MOLPay Return] DB check failed for pending:', e); }

      // Otherwise attempt CancelBooking (best-effort)
      await callCancelBooking(orderid, tranID, channel, 'Payment pending', returnData);
      if (isCallback) return acknowledgeResponse();
      return createRedirectResponse(`${actualUrl}/payment/failed?orderid=${encodeURIComponent(orderid)}&status=${finalStatus}`);
    } else {
      // PAYMENT FAILED
      const errorMessage = error_desc || `Payment failed with status: ${finalStatus}`;
      
      // Save payment log to database
      await savePaymentLogDB({
        orderid,
        referenceNo: returnData.referenceNo || returnData.refno || null,
        transactionNo: tranID || null,
        status: finalStatus,
        amount: amount || null,
        currency: currency || null,
        channel: channel || null,
        method: request.method,
        returnData: returnData,
        isSuccess: false,
        remarks: errorMessage,
        request: request
      });

      // If order exists and already PAID, skip cancel
      try {
        const existingOrder = await prisma.order.findUnique({ where: { orderId: orderid } });
        if (existingOrder && existingOrder.paymentStatus === 'PAID') {
          if (isCallback) return acknowledgeResponse();
          return createRedirectResponse(`${actualUrl}/payment/success?orderid=${encodeURIComponent(orderid)}`);
        }
      } catch (e) { console.error('[MOLPay Return] DB check failed for failed-case:', e); }

      // If order does not exist (unknown), do not call CancelBooking; just ack or redirect
      try {
        const existingOrder = await prisma.order.findUnique({ where: { orderId: orderid } });
        if (!existingOrder) {
          if (isCallback) return acknowledgeResponse();
          return createRedirectResponse(`${actualUrl}/payment/failed?orderid=${encodeURIComponent(orderid)}&status=${finalStatus}&error_desc=${encodeURIComponent(errorMessage)}`);
        }
      } catch (e) {
        console.error('[MOLPay Return] DB lookup error before CancelBooking:', e);
      }

      // Otherwise attempt CancelBooking
      await callCancelBooking(orderid, tranID, channel, errorMessage, returnData);
      if (isCallback) return acknowledgeResponse();
      return createRedirectResponse(`${actualUrl}/payment/failed?orderid=${encodeURIComponent(orderid)}&status=${finalStatus}&error_desc=${encodeURIComponent(errorMessage)}`);
    }

  } catch (error) {
    console.error('[MOLPay Return] Error processing return:', error);
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'unknown';
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const baseUrl = `${protocol}://${host}`;
    const errorUrl = `${baseUrl}/payment/failed?error=processing_error&error_desc=${encodeURIComponent(error.message || 'Processing error')}`;
    return createRedirectResponse(errorUrl);
  }
}

// ------------------------
// Serialize request helper
// ------------------------
async function serializeRequest(request) {
  const headers = Object.fromEntries(request.headers.entries());

  const url = new URL(request.url);
  const query = {};
  url.searchParams.forEach((v, k) => (query[k] = v));

  const cookies = {};
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) cookieHeader.split(';').forEach(c => { const [k, v] = c.trim().split('='); cookies[k] = v; });

  let body = null;
  let bodyType = 'none';

  try {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) { bodyType = 'json'; body = await request.clone().json(); }
    else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      bodyType = 'formData';
      const fd = await request.clone().formData();
      body = {};
      for (const [k, v] of fd.entries()) body[k] = v;
    } else if (contentType.includes('text')) { bodyType = 'text'; body = await request.clone().text(); }
  } catch (e) { body = `BODY_READ_ERROR: ${e.message}`; }

  return { method: request.method, url: request.url, pathname: url.pathname, query, headers, cookies, bodyType, body };
}