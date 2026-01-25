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
 * Log payload to file (Persistent logs in public/payment-api-logs)
 */
async function logPayloadToFile(referenceNo, type, payload) {
    if (!referenceNo) return;
    try {
        const logsDir = path.join(process.cwd(), 'logs');
        if (!fs.existsSync(logsDir)) {
             fs.mkdirSync(logsDir, { recursive: true });
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        // Sanitise reference no to be safe filename
        const safeRef = referenceNo.replace(/[^a-zA-Z0-9_-]/g, '');
        const filename = `payment_api_${safeRef}.log`;
        const logPath = path.join(logsDir, filename);
        
        const logEntry = `
========================================
TIMESTAMP: ${new Date().toISOString()}
TYPE: ${type}
payload:
${typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2)}
========================================
`;
        fs.appendFileSync(logPath, logEntry);
        console.log(`[MOLPay API Log] Written to ${filename}`);
    } catch(e) {
        console.error('[MOLPay API Log] Failed to write log:', e);
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
 * Save payment log to Database
 */
async function savePaymentLog({
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
    // Safety check for unknown orderid
    if (!orderid || orderid === 'unknown' || orderid.startsWith('unknown_')) {
        // We still try to log if we have some data
        if (!returnData) return; 
    }

    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // format amount
    let amt = 0;
    if (amount) {
        amt = parseFloat(amount);
    }
    
    await prisma.paymentLog.create({
      data: {
        orderId: orderid || 'unknown',
        referenceNo: referenceNo || returnData?.referenceNo || '',
        transactionNo: transactionNo || returnData?.tranID || '',
        status: status || '',
        amount: amt,
        currency: currency || 'MYR',
        channel: channel || 'unknown',
        method: method || 'UNKNOWN',
        ipAddress: ipAddress, // truncate if too long? Prisma handles string text
        userAgent: userAgent,
        returnData: returnData || {},
        isSuccess: !!isSuccess,
        remarks: remarks || '',
      }
    });
    console.log(`[MOLPay Log] Saved DB Log for ${orderid}: ${remarks}`);
  } catch (err) {
    console.error('[MOLPay Log] Failed to save DB log:', err);
  }
}

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

    console.error('[MOLPay Return] Signature verification failed on all attempts.', {
      received: skey,
      expectedStandard: result.expected,
      expectedSwap: result2.expected,
      expectedNoCur: result3.expected
    });

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
    
    // Clean up stored booking details after successful processing
    
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
async function writeDebugLog(filename, data) {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const logsDir = path.join(process.cwd(), 'public', 'payment-logs');
    
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    const logFile = path.join(logsDir, filename);
    const logEntry = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    
    // Append if file exists, otherwise create
    if (fs.existsSync(logFile)) {
        fs.appendFileSync(logFile, '\n\n' + '--- ' + new Date().toISOString() + ' ---\n' + logEntry);
    } else {
        fs.writeFileSync(logFile, '--- ' + new Date().toISOString() + ' ---\n' + logEntry);
    }
    
    console.log(`[MOLPay Debug] Log written to ${filename}`);
  } catch (error) {
    console.error('[MOLPay Debug] Failed to write log:', error);
  }
}

async function handleReturn(request) {
  let orderid = 'unknown';
  
  try {
    // ============================================
    // STEP 1: Extract POST data (like PHP $_POST)
    // ============================================
    const returnData = {};
    const rawPostData = {};
    
    // Get data from URL query params (GET request)
    const { searchParams } = new URL(request.url);
    searchParams.forEach((value, key) => {
      returnData[key] = value;
      rawPostData[key] = value;
    });

    // Get data from form data (POST request - like PHP $_POST)
    try {
      const formData = await request.formData();
      for (const [key, value] of formData.entries()) {
        returnData[key] = value;
        rawPostData[key] = value;
      }
    } catch (e) {
      // Not form data, continue
    }

    // Capture Request details
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'unknown';
    // Always use HTTPS for production - Cloudflare handles SSL termination
    let protocol = 'https';
    const cfVisitor = request.headers.get('cf-visitor');
    if (cfVisitor) {
      try {
        const visitor = JSON.parse(cfVisitor);
        if (visitor.scheme) {
          protocol = visitor.scheme;
        }
      } catch (e) {}
    } else {
      const forwardedProto = request.headers.get('x-forwarded-proto');
      protocol = forwardedProto === 'https' ? 'https' : 'https';
    }
    const actualUrl = `${protocol}://${host}`;
    
    orderid = returnData.orderid || `unknown_${Date.now()}`;

    // Debug Log: Incoming Request (Comprehensive)
    // const logFilename = `debug-${orderid}.log`;
    // await writeDebugLog(logFilename, {
    //     stage: 'INCOMING_REQUEST_FULL',
    //     method: request.method,
    //     url: request.url,
    //     headers: {
    //         'content-type': request.headers.get('content-type'),
    //         'host': host,
    //         'user-agent': request.headers.get('user-agent'),
    //         'x-forwarded-for': request.headers.get('x-forwarded-for'),
    //         'x-forwarded-proto': request.headers.get('x-forwarded-proto'),
    //         'cf-visitor': request.headers.get('cf-visitor'),
    //     },
    //     returnData,
    //     rawPostData
    // });

    // ============================================
    // STEP 2: Extract all fields (like PHP)
    // ============================================
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

    // If this is a callback or notification (nbcb=1 or 2), we need to process it but return RECEIVEOK
    // IMPORTANT: We still need to call ReserveBooking/CancelBooking for callbacks!
    const isCallback = nbcb === '1' || nbcb === '2';
    
    if (isCallback) {
      console.log('[MOLPay Return] ===== CALLBACK DETECTED (nbcb=' + nbcb + ') =====');
      console.log('[MOLPay Return] Will process booking and return RECEIVEOK');
    }

    // ============================================
    // STEP 3: Verify signature (like PHP)
    // ============================================
    const isValidSignature = verifyReturnSignature(returnData);
    
    // If signature is invalid, attempt DB fallback (Backend Callback might have already succeeded)
    let finalStatus = status;
    if (!isValidSignature) {
       console.warn('[MOLPay Return] Signature validation failed. Checking DB for successful payment...');
       
       let dbVerified = false;
       // Fallback: Check DB if we have a valid order ID
       if (orderid && orderid !== 'unknown' && !orderid.startsWith('unknown_')) {
           try {
              const successfulOrder = await prisma.order.findUnique({
                  where: { orderId: orderid }
              });
              
              // Check if order is already paid/confirmed
              if (successfulOrder && (successfulOrder.paymentStatus === 'PAID' || successfulOrder.status === 'CONFIRMED')) {
                  console.log(`[MOLPay Return] Signature failed but Order ${orderid} is PAID in DB. Accepting as SUCCESS.`);
                  finalStatus = '00'; // Override to Success
                  dbVerified = true;
                  
                  // If we need missing params (like tranID) for logging/next steps, we can pull them from DB if saved
                  if (!returnData.tranID && successfulOrder.transactionNo) {
                      returnData.tranID = successfulOrder.transactionNo;
                  }
              }
           } catch (dbErr) {
              console.error('[MOLPay Return] DB Fallback Check Error:', dbErr);
           }
       }

       if (!dbVerified) {
          finalStatus = '-1'; // Invalid transaction
          console.error('[MOLPay Return] Invalid signature and DB check failed/skipped - Status set to -1');
       }
    }

    // Prepare common log data
    const logData = {
        orderid,
        referenceNo: returnData.referenceNo || returnData.refno || '',
        transactionNo: tranID,
        status: finalStatus,
        amount,
        currency,
        channel,
        method: request.method,
        returnData,
        request
    };

    if (finalStatus !== status) {
        logData.remarks = `Signature mismatch (Status: ${status}), but DB check passed/failed. Final Status: ${finalStatus}`;
    }

    if (finalStatus === '-1') {
         await savePaymentLog({
            ...logData,
            isSuccess: false,
            remarks: 'Invalid Signature. Verification failed.'
         });
         return createRedirectResponse(`${actualUrl}/payment/failed?orderid=${orderid}&error=invalid_signature`);
    }

    // LOG: Verification Result
    // await writeDebugLog(logFilename, {
    //     stage: 'SIGNATURE_VERIFICATION',
    //     isValidSignature,
    //     status: finalStatus,
    //     verificationParams: {
    //          tranID, orderid: orderidParam, status, domain, amount, currency, appcode, paydate, skey
    //     }
    // });

    // ============================================
    // STEP 4: Process based on status (like PHP)
    // ============================================
    if (finalStatus === '00' || finalStatus === '22') {
      // Payment successful (like PHP: if ( $status == "00" ))
      // REQUIRED: Call ReserveBooking API - MUST succeed before redirecting
      console.log('[MOLPay Return] ===== PAYMENT SUCCESS - Calling ReserveBooking =====');
      
      // await writeDebugLog(logFilename, {
      //   stage: 'PAYMENT_SUCCESS',
      //   action: 'Calling ReserveBooking',
      //   params: { orderid, tranID, channel, appcode }
      // });

      const reserveResult = await callReserveBooking(orderid, tranID, channel, appcode, returnData);
      
      // await writeDebugLog(logFilename, {
      //   stage: 'RESERVE_BOOKING_RESULT',
      //   result: reserveResult
      // });
      
      if (!reserveResult.success) {
        // ReserveBooking failed
        console.error('[MOLPay Return] ReserveBooking FAILED');
        if (isCallback) {
          // For callbacks, return RECEIVEOK even on failure
          console.log('[MOLPay Return] Callback - returning RECEIVEOK despite failure');
          await savePaymentLog({
            ...logData,
            isSuccess: false,
            remarks: `ReserveBooking API Failed (Callback). Error: ${reserveResult.error}`
          });
          return acknowledgeResponse();
        }
        // Check if order is already PAID/CONFIRMED in DB (handling duplicate calls)
        try {
            const existingOrder = await prisma.order.findUnique({
                where: { orderId: orderid }
            });
            
            if (existingOrder && (existingOrder.paymentStatus === 'PAID' || existingOrder.status === 'CONFIRMED')) {
                console.log('[MOLPay Return] Order already PAID in DB - treating validation failure as duplicate success');
                // Redirect to success
                const redirectUrl = `${actualUrl}/payment/success?orderid=${encodeURIComponent(orderid)}`;
                
                await savePaymentLog({
                    ...logData,
                    isSuccess: true,
                    remarks: `ReserveBooking Failed (${reserveResult.error}), but Order was already PAID in DB. Treated as Success.`
                });
                return createRedirectResponse(redirectUrl);
            }
        } catch (dbCheckErr) {
            console.error('[MOLPay Return] Database check failed:', dbCheckErr);
        }
        
        // Log API Response to file (Failure)
        await logPayloadToFile(logData.referenceNo, 'ReserveBooking_FAILED', {
             error: reserveResult.error,
             response: reserveResult.data || 'No Data',
             orderId: orderid
        });

        const redirectUrl = `${actualUrl}/payment/failed?orderid=${encodeURIComponent(orderid)}&error=reserve_booking_failed&error_desc=${encodeURIComponent(reserveResult.error || 'ReserveBooking failed')}`;
        
        await savePaymentLog({
            ...logData,
            isSuccess: false,
            remarks: `ReserveBooking Failed. Error: ${reserveResult.error}`
        });
        return createRedirectResponse(redirectUrl);
      }
      
      // ReserveBooking successful
      console.log('[MOLPay Return] ReserveBooking SUCCESS');
      
      // Log API Response to file (Success)
      await logPayloadToFile(logData.referenceNo, 'ReserveBooking_SUCCESS', reserveResult.data);
      
      // Update Order in DB to PAID
      // Use UPSERT to handle missing order case
      try {
          const orderData = {
              paymentStatus: 'PAID',
              status: 'CONFIRMED',
              transactionNo: tranID,
              updatedAt: new Date()
          };

          // Try to extract extra details from ReserveBooking response if needed
          /* 
             Example Response data might contain: 
             { TicketPrintInfo: { MovieName: "...", HallName: "...", SeatInfo: "..." } }
          */
          let movieTitle = '';
          let cinemaName = '';
          let hallName = '';
          let seats = '';
          
          if (reserveResult.data && reserveResult.data.TicketPrintInfo) {
               const info = reserveResult.data.TicketPrintInfo;
               if (info.MovieName) movieTitle = info.MovieName;
               if (info.CinemaName) cinemaName = info.CinemaName;
               if (info.HallName) hallName = info.HallName;
               if (info.SeatInfo) seats = info.SeatInfo;
          }

          // If upserting (creating new), we need mandatory fields
          const createData = {
               orderId: orderid || `MS${Date.now()}`,
               referenceNo: returnData.referenceNo || returnData.refno || `REF_${Date.now()}`,
               transactionNo: tranID || returnData.tranID,
               totalAmount: amount ? parseFloat(amount) : 0,
               customerName: returnData.bill_name || 'Guest',
               customerEmail: returnData.bill_email || '',
               customerPhone: returnData.bill_mobile || '',
               paymentStatus: 'PAID',
               status: 'CONFIRMED',
               paymentMethod: channel || 'Fiuu/MolPay',
               
               // Use extracted or default values for movie details
               movieTitle: movieTitle || 'Unknown Movie',
               cinemaId: returnData.cinemaId || '',
               showId: returnData.showId || '',
               cinemaName: cinemaName || 'Unknown Cinema',
               hallName: hallName || 'Standard Hall',
               seats: seats || 'Unspecified',
               // We don't have movieID, ticketType easily unless parsed.
          };

          // UPSERT: Update if exists, Create if missing
          const updatedOrder = await prisma.order.upsert({
             where: { orderId: orderid },
             update: orderData,
             create: createData
          });
          
          console.log('[MOLPay Return] Database updated/created: PAID/CONFIRMED', updatedOrder.id);
      } catch (dbErr) {
          console.error('[MOLPay Return] DB Update Error:', dbErr);
          // Continue even if DB update fails
          await savePaymentLog({
            ...logData,
            isSuccess: true, // Payment was success, DB fail
            remarks: `Payment Success. DB Update Failed: ${dbErr.message}`
          });
      }

      if (isCallback) {
        // For callbacks, return RECEIVEOK
        console.log('[MOLPay Return] Callback - returning RECEIVEOK');
        await savePaymentLog({
            ...logData,
            isSuccess: true,
            remarks: 'Payment Successful (Callback). Booking Reserved.'
        });
        return acknowledgeResponse();
      }
      const redirectUrl = `${actualUrl}/payment/success?orderid=${encodeURIComponent(orderid)}`;
      
      await savePaymentLog({
        ...logData,
        isSuccess: true,
        remarks: 'Payment Successful. Redirecting to success page.'
      });
      return createRedirectResponse(redirectUrl);
    } else if (finalStatus === '11') {
      // Payment pending
      console.log('[MOLPay Return] ===== PAYMENT PENDING - Calling CancelBooking =====');
      // await writeDebugLog(logFilename, {
      //   stage: 'PAYMENT_PENDING',
      //   status: finalStatus
      // });
      const cancelResult = await callCancelBooking(orderid, tranID, channel, 'Payment is pending', returnData);
      
      // Log API Response (Pending/Cancel)
      await logPayloadToFile(logData.referenceNo, 'CancelBooking_PENDING', cancelResult);

      // Return response based on callback status
      if (isCallback) {
        console.log('[MOLPay Return] Callback - returning RECEIVEOK for pending payment');
        await savePaymentLog({
            ...logData,
            isSuccess: false,
            remarks: 'Payment Pending (Callback).'
        });
        return acknowledgeResponse();
      }
      const redirectUrl = `${actualUrl}/payment/failed?orderid=${encodeURIComponent(orderid)}&status=${finalStatus}`;
      await savePaymentLog({
        ...logData,
        isSuccess: false,
        remarks: 'Payment Pending. Redirecting to failed/pending page.'
      });
      return createRedirectResponse(redirectUrl);
    } else {
      // Payment failed or invalid signature
      const errorMessage = error_desc || `Payment failed with status: ${finalStatus}`;
      console.log('[MOLPay Return] ===== PAYMENT FAILED - Calling CancelBooking =====');
      //  await writeDebugLog(logFilename, {
      //   stage: 'PAYMENT_FAILED',
      //   status: finalStatus,
      //   errorMessage
      // });
      const cancelResult = await callCancelBooking(orderid, tranID, channel, errorMessage, returnData);
      
      // Log API Response (Failed/Cancel)
      await logPayloadToFile(logData.referenceNo, 'CancelBooking_FAILED', cancelResult);

      // Return response based on callback status
      if (isCallback) {
        console.log('[MOLPay Return] Callback - returning RECEIVEOK for failed payment');
        await savePaymentLog({
            ...logData,
            isSuccess: false,
            remarks: `Payment Failed (Callback). Status: ${finalStatus}, Error: ${errorMessage}`
        });
        return acknowledgeResponse();
      }
      const redirectUrl = `${actualUrl}/payment/failed?orderid=${encodeURIComponent(orderid)}&status=${finalStatus}&error_desc=${encodeURIComponent(errorMessage)}`;
      
      await savePaymentLog({
        ...logData,
        isSuccess: false,
        remarks: `Payment Failed. Status: ${finalStatus}, Error: ${errorMessage}`
      });
      return createRedirectResponse(redirectUrl);
    }
  } catch (error) {
    console.error('[MOLPay Return] Error processing return:', error);
    // Try to get actual URL, fallback to request.url if headers not available
    let errorRedirectUrl;
    try {
      const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'unknown';
      const protocol = request.headers.get('x-forwarded-proto') || 'https';
      const baseUrl = `${protocol}://${host}`;
      errorRedirectUrl = new URL('/payment/failed?error=processing_error&error_desc=' + encodeURIComponent(error.message || 'An error occurred processing your payment'), baseUrl);
    } catch (e) {
      const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'unknown';
      const protocol = request.headers.get('x-forwarded-proto') || 'https';
      const baseUrl = `${protocol}://${host}`;
      errorRedirectUrl = `${baseUrl}/payment/failed?error=processing_error&error_desc=${encodeURIComponent(error.message || 'An error occurred processing your payment')}`;
    }
    
    // Attempt to log exception if possible
    try {
        await savePaymentLog({
            orderid: orderid || 'unknown',
            method: request.method,
            isSuccess: false,
            remarks: `Exception in handleReturn: ${error.message}`,
            request
        });
    } catch(e) {}

    return createRedirectResponse(errorRedirectUrl.toString());
  }
}

