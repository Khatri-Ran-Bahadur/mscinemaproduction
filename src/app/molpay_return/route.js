/**
 * API Route: MOLPay Return Handler (Legacy PHP compatibility)
 * This endpoint handles return URL callbacks from Razer Merchant Services
 * This is the equivalent of molpay_return.php for Next.js
 * 
 * Documentation: https://github.com/RazerMS/SDK-RazerMS_Node_JS/wiki/Installation-Guidance
 */

import { NextResponse } from 'next/server';
import crypto from 'crypto';


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

    // Step 1: Calculate key0 = md5(tranID + orderid + status + domain + amount + currency)
    // IMPORTANT: Use exact values as received, no trimming or modification
    const key0String = `${tranID}${orderid}${status}${domain}${amount}${currency}`;
    const key0 = crypto.createHash('md5').update(key0String, 'utf8').digest('hex');

    // Step 2: Calculate key1 = md5(paydate + domain + key0 + appcode + vkey)
    // IMPORTANT: WordPress plugin uses secret_key for verification, not verify_key
    // Using secret_key to match WordPress plugin behavior
    const vkey = RMS_CONFIG.secretKey; // Use secret_key like WordPress plugin
    const key1String = `${paydate}${domain}${key0}${appcode}${vkey}`;
    const key1 = crypto.createHash('md5').update(key1String, 'utf8').digest('hex');

    // Step 3: Compare (PHP uses case-sensitive comparison: $skey != $key1)
    // However, some MOLPay implementations use case-insensitive, so we check both
    const isValid = skey === key1;
    const isValidCaseInsensitive = skey.toLowerCase() === key1.toLowerCase();
    
    // Use case-insensitive if it matches (some MOLPay configurations require this)
    const finalIsValid = isValid || isValidCaseInsensitive;
    
    if (!isValid) {
      console.error('[MOLPay Return] Signature mismatch', {
        received: skey,
        expected: key1,
        caseInsensitiveMatch: isValidCaseInsensitive
      });
    }
    
    if (!isValid && isValidCaseInsensitive) {
      console.warn('[MOLPay Return] Case-sensitive verification failed, but case-insensitive matches');
    }
    
    return finalIsValid;
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
  try {
    // Extract booking details from returnData (query params from return URL)
    // Booking details are added to return URL in create-request route
    let cinemaId = returnData.cinemaId || returnData.cinema_id || '';
    let showId = returnData.showId || returnData.show_id || '';
    let referenceNo = returnData.referenceNo || returnData.reference_no || returnData.refno || '';
    let membershipId = returnData.membershipId || returnData.membership_id || '0';
    
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
          // Invalid URL, continue
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
    
    if (!cinemaId || !showId || !referenceNo) {
      const error = 'Missing booking details for ReserveBooking';
      console.error('[MOLPay Return] ReserveBooking ERROR:', error, { orderid, returnData });
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
    
    const url = `${API_CONFIG.API_BASE_URL}/Booking/ReserveBooking/${cinemaId}/${showId}/${referenceNo}/${membershipId}?${queryParams.toString()}`;
    
    console.log('[MOLPay Return] ===== CALLING ReserveBooking API =====');
    console.log('[MOLPay Return] URL:', url);
    console.log('[MOLPay Return] Params:', { cinemaId, showId, referenceNo, membershipId, transactionNo, cardType, authorizeId, remarks });
    
    // Use fetch directly to avoid server-side module loading issues
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      const error = `ReserveBooking failed: ${response.status} ${errorText}`;
      console.error('[MOLPay Return] ReserveBooking ERROR:', error);
      return { success: false, error, skip: false };
    }
    
    const data = await response.json();
    console.log('[MOLPay Return] ReserveBooking SUCCESS:', data);
    return { success: true, data };
  } catch (error) {
    const errorMsg = error.message || 'Unknown error';
    console.error('[MOLPay Return] ReserveBooking EXCEPTION:', errorMsg, error);
    return { success: false, error: errorMsg, skip: false };
  }
}

/**
 * Call CancelBooking API (using direct fetch to avoid server-side module issues)
 * REQUIRED: This must succeed before redirecting to failed page
 */
async function callCancelBooking(orderid, tranID, channel, errorDesc, returnData) {
  try {
    // Extract booking details from returnData (query params from return URL)
    let cinemaId = returnData.cinemaId || returnData.cinema_id || '';
    let showId = returnData.showId || returnData.show_id || '';
    let referenceNo = returnData.referenceNo || returnData.reference_no || returnData.refno || '';
    
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
          // Invalid URL, continue
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
    
    if (!cinemaId || !showId || !referenceNo) {
      const error = 'Missing booking details for CancelBooking';
      console.error('[MOLPay Return] CancelBooking ERROR:', error, { orderid, returnData });
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
    
    const url = `${API_CONFIG.API_BASE_URL}/Booking/CancelBooking/${cinemaId}/${showId}/${referenceNo}?${queryParams.toString()}`;
    
    console.log('[MOLPay Return] ===== CALLING CancelBooking API =====');
    console.log('[MOLPay Return] URL:', url);
    console.log('[MOLPay Return] Params:', { cinemaId, showId, referenceNo, transactionNo, cardType, remarks });
    
    // Use fetch directly to avoid server-side module loading issues
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      const error = `CancelBooking failed: ${response.status} ${errorText}`;
      console.error('[MOLPay Return] CancelBooking ERROR:', error);
      return { success: false, error, skip: false };
    }
    
    const data = await response.json();
    console.log('[MOLPay Return] CancelBooking SUCCESS:', data);
    return { success: true, data };
  } catch (error) {
    const errorMsg = error.message || 'Unknown error';
    console.error('[MOLPay Return] CancelBooking EXCEPTION:', errorMsg, error);
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

    // Get actual URL from headers (fix localhost issue)
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'unknown';
    // Always use HTTPS for production - Cloudflare handles SSL termination
    // Check cf-visitor header first (most reliable for Cloudflare)
    let protocol = 'https';
    const cfVisitor = request.headers.get('cf-visitor');
    if (cfVisitor) {
      try {
        const visitor = JSON.parse(cfVisitor);
        if (visitor.scheme) {
          protocol = visitor.scheme; // Should be 'https' from Cloudflare
        }
      } catch (e) {
        // Ignore parse error, use https as default
      }
    } else {
      // Fallback: Check x-forwarded-proto, but prefer https for production
      const forwardedProto = request.headers.get('x-forwarded-proto');
      protocol = forwardedProto === 'https' ? 'https' : 'https'; // Force HTTPS for production
    }
    const actualUrl = `${protocol}://${host}`;
    orderid = returnData.orderid || 'unknown';
    
    // Save initial return data to JSON file for debugging
    try {
      const fs = await import('fs');
      const path = await import('path');
      const logsDir = path.join(process.cwd(), 'public', 'payment-logs');
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      const logFile = path.join(logsDir, `molpay-return-${Date.now()}-${orderid}-raw.json`);
      fs.writeFileSync(logFile, JSON.stringify({
        timestamp: new Date().toISOString(),
        orderid: orderid,
        returnData: returnData,
        rawPostData: rawPostData
      }, null, 2), 'utf8');
      console.log(`[MOLPay Return] Raw return data saved: ${logFile}`);
    } catch (logError) {
      console.warn('[MOLPay Return] Failed to save raw return data:', logError.message);
    }

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

    // If this is a callback or notification (nbcb=1 or 2), verify signature first, then acknowledge
    if (nbcb === '1' || nbcb === '2') {
      // Still verify signature for callbacks to ensure data integrity
      verifyReturnSignature(returnData);
      return acknowledgeResponse();
    }

    // ============================================
    // STEP 3: Verify signature (like PHP)
    // ============================================
    const isValidSignature = verifyReturnSignature(returnData);
    
    // If signature is invalid, set status to -1 (like PHP: if( $skey != $key1 ) $status= -1)
    let finalStatus = status;
    if (!isValidSignature) {
      finalStatus = '-1'; // Invalid transaction
      console.error('[MOLPay Return] Invalid signature - Status set to -1');
    }

    // ============================================
    // STEP 4: Process based on status (like PHP)
    // ============================================
    if (finalStatus === '00' || finalStatus === '22') {
      // Payment successful (like PHP: if ( $status == "00" ))
      // REQUIRED: Call ReserveBooking API - MUST succeed before redirecting
      console.log('[MOLPay Return] ===== PAYMENT SUCCESS - Calling ReserveBooking =====');
      const reserveResult = await callReserveBooking(orderid, tranID, channel, appcode, returnData);
      
      // Save debug log
      try {
        const fs = await import('fs');
        const path = await import('path');
        const logsDir = path.join(process.cwd(), 'public', 'payment-logs');
        if (!fs.existsSync(logsDir)) {
          fs.mkdirSync(logsDir, { recursive: true });
        }
        const logFile = path.join(logsDir, `molpay-return-${Date.now()}-${orderid}-success.json`);
        fs.writeFileSync(logFile, JSON.stringify({
          timestamp: new Date().toISOString(),
          orderid,
          status: finalStatus,
          paymentSuccess: true,
          reserveBookingResult: reserveResult,
          returnData: returnData,
          rawPostData: rawPostData
        }, null, 2), 'utf8');
        console.log(`[MOLPay Return] Debug log saved: ${logFile}`);
      } catch (logError) {
        console.warn('[MOLPay Return] Failed to save debug log:', logError.message);
      }
      
      if (!reserveResult.success) {
        // ReserveBooking failed - redirect to failed page
        console.error('[MOLPay Return] ReserveBooking FAILED - redirecting to failed page');
        const redirectUrl = `${actualUrl}/payment/failed?orderid=${encodeURIComponent(orderid)}&error=reserve_booking_failed&error_desc=${encodeURIComponent(reserveResult.error || 'ReserveBooking failed')}`;
        return createRedirectResponse(redirectUrl);
      }
      
      // ReserveBooking successful - redirect to success page
      console.log('[MOLPay Return] ReserveBooking SUCCESS - redirecting to success page');
      const redirectUrl = `${actualUrl}/payment/success?orderid=${encodeURIComponent(orderid)}`;
      return createRedirectResponse(redirectUrl);
    } else if (finalStatus === '11') {
      // Payment pending
      console.log('[MOLPay Return] ===== PAYMENT PENDING - Calling CancelBooking =====');
      const cancelResult = await callCancelBooking(orderid, tranID, channel, 'Payment is pending', returnData);
      
      // Save debug log
      try {
        const fs = await import('fs');
        const path = await import('path');
        const logsDir = path.join(process.cwd(), 'public', 'payment-logs');
        if (!fs.existsSync(logsDir)) {
          fs.mkdirSync(logsDir, { recursive: true });
        }
        const logFile = path.join(logsDir, `molpay-return-${Date.now()}-${orderid}-pending.json`);
        fs.writeFileSync(logFile, JSON.stringify({
          timestamp: new Date().toISOString(),
          orderid,
          status: finalStatus,
          paymentPending: true,
          cancelBookingResult: cancelResult,
          returnData: returnData,
          rawPostData: rawPostData
        }, null, 2), 'utf8');
        console.log(`[MOLPay Return] Debug log saved: ${logFile}`);
      } catch (logError) {
        console.warn('[MOLPay Return] Failed to save debug log:', logError.message);
      }
      
      // Redirect to failed page
      const redirectUrl = `${actualUrl}/payment/failed?orderid=${encodeURIComponent(orderid)}&status=${finalStatus}`;
      return createRedirectResponse(redirectUrl);
    } else {
      // Payment failed or invalid signature
      const errorMessage = error_desc || `Payment failed with status: ${finalStatus}`;
      console.log('[MOLPay Return] ===== PAYMENT FAILED - Calling CancelBooking =====');
      const cancelResult = await callCancelBooking(orderid, tranID, channel, errorMessage, returnData);
      
      // Save debug log
      try {
        const fs = await import('fs');
        const path = await import('path');
        const logsDir = path.join(process.cwd(), 'public', 'payment-logs');
        if (!fs.existsSync(logsDir)) {
          fs.mkdirSync(logsDir, { recursive: true });
        }
        const logFile = path.join(logsDir, `molpay-return-${Date.now()}-${orderid}-failed.json`);
        fs.writeFileSync(logFile, JSON.stringify({
          timestamp: new Date().toISOString(),
          orderid,
          status: finalStatus,
          paymentFailed: true,
          errorMessage: errorMessage,
          cancelBookingResult: cancelResult,
          returnData: returnData,
          rawPostData: rawPostData
        }, null, 2), 'utf8');
        console.log(`[MOLPay Return] Debug log saved: ${logFile}`);
      } catch (logError) {
        console.warn('[MOLPay Return] Failed to save debug log:', logError.message);
      }
      
      // Redirect to failed page
      const redirectUrl = `${actualUrl}/payment/failed?orderid=${encodeURIComponent(orderid)}&status=${finalStatus}&error_desc=${encodeURIComponent(errorMessage)}`;
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
    return createRedirectResponse(errorRedirectUrl);
  }
}

