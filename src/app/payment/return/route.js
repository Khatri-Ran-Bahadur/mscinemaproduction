/**
 * API Route: Payment Return/Callback Handler
 * This endpoint handles return URL callbacks from Razer Merchant Services
 * Documentation: https://github.com/RazerMS/SDK-RazerMS_Node_JS/wiki/Installation-Guidance
 * 
 * This is similar to molpay_return.php in the demo
 */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { getBookingDetails, deleteBookingDetails } from '@/utils/booking-storage';
import fs from 'fs';
import path from 'path';

// Razer Merchant Services Configuration
const RMS_CONFIG = {
  merchantId: process.env.FIUU_MERCHANT_ID || '',
  verifyKey: process.env.FIUU_VERIFY_KEY || '',
  secretKey: process.env.FIUU_SECRET_KEY || '',
};

// Logging utility
function logPayment(orderid, level, message, data = {}) {
  const logDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const logFile = path.join(logDir, `payment-${orderid}.log`);
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message: `[${orderid}] ${message}`,
    data
  };
  
  try {
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n', 'utf8');
    console.log(`[Payment Return] ${level}: ${message}`, data);
  } catch (err) {
    console.error('[Payment Return] Failed to write log:', err);
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

    if (!tranID || !orderid || !status || !domain || !amount || !currency || !paydate || !appcode || !skey) {
      return false;
    }

    // Step 1: Calculate key0
    const key0String = `${tranID}${orderid}${status}${domain}${amount}${currency}`;
    const key0 = crypto.createHash('md5').update(key0String, 'utf8').digest('hex');

    // Step 2: Calculate key1
    const key1String = `${paydate}${domain}${key0}${appcode}${RMS_CONFIG.verifyKey}`;
    const key1 = crypto.createHash('md5').update(key1String, 'utf8').digest('hex');

    // Step 3: Compare
    return skey.toLowerCase() === key1.toLowerCase();
  } catch (error) {
    console.error('Error verifying return signature:', error);
    return false;
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

/**
 * Call ReserveBooking API
 */
async function callReserveBooking(orderid, returnData) {
  logPayment(orderid, 'INFO', 'Step: callReserveBooking - START', {
    orderid,
    tranID: returnData.tranID,
    channel: returnData.channel,
    appcode: returnData.appcode,
    returnDataKeys: Object.keys(returnData)
  });
  
  try {
    // Extract booking details from multiple sources
    let cinemaId = returnData.cinemaId || '';
    let showId = returnData.showId || '';
    let referenceNo = returnData.referenceNo || '';
    let membershipId = returnData.membershipId || '0';
    let token = ''; // Auth token
    
    logPayment(orderid, 'DEBUG', 'Initial extraction from returnData', {
      cinemaId,
      showId,
      referenceNo,
      membershipId
    });
    
    // Always try to retrieve token from storage if available
    const storedDetails = getBookingDetails(orderid);
    if (storedDetails) {
      logPayment(orderid, 'DEBUG', 'Found stored details', { hasToken: !!storedDetails.token });
      // Only overwrite if missing from returnData
      cinemaId = cinemaId || storedDetails.cinemaId;
      showId = showId || storedDetails.showId;
      referenceNo = referenceNo || storedDetails.referenceNo;
      membershipId = membershipId || storedDetails.membershipId;
      token = storedDetails.token || '';
    } else {
      logPayment(orderid, 'DEBUG', 'No stored details found');
    }
    
    // Try to extract from returnUrl if still missing
    if ((!cinemaId || !showId || !referenceNo) && returnData.returnUrl) {
      logPayment(orderid, 'DEBUG', 'Attempting to extract from returnUrl', { returnUrl: returnData.returnUrl });
      try {
        const returnUrl = new URL(returnData.returnUrl);
        cinemaId = returnUrl.searchParams.get('cinemaId') || cinemaId;
        showId = returnUrl.searchParams.get('showId') || showId;
        referenceNo = returnUrl.searchParams.get('referenceNo') || referenceNo;
        membershipId = returnUrl.searchParams.get('membershipId') || membershipId;
        // Token typically not in returnUrl for security, but could be
        logPayment(orderid, 'DEBUG', 'Extracted from returnUrl', { cinemaId, showId, referenceNo, membershipId });
      } catch (e) {
        logPayment(orderid, 'WARN', 'Failed to parse returnUrl', { error: e.message });
      }
    }
    
    // Try to extract from orderid format (if it contains reference number)
    if (!referenceNo) {
      logPayment(orderid, 'DEBUG', 'Attempting to extract from orderid format');
      // If orderid is the reference number itself, use it
      if (orderid && !orderid.startsWith('MS')) {
        referenceNo = orderid;
      }
      logPayment(orderid, 'DEBUG', 'Extracted from orderid', { cinemaId, showId, referenceNo });
    }
    
    // Validate required parameters
    if (!cinemaId || !showId || !referenceNo) {
      logPayment(orderid, 'ERROR', 'Missing booking details for ReserveBooking', {
        cinemaId,
        showId,
        referenceNo,
        returnData
      });
      return { success: false, error: 'Missing booking details (cinemaId, showId, or referenceNo)' };
    }
    
    // Prepare API parameters
    const transactionNo = returnData.tranID || '';
    const cardType = returnData.channel || 'card';
    const authorizeId = returnData.appcode || '';
    const remarks = `Payment successful via ${returnData.channel || 'unknown'}`;
    
    logPayment(orderid, 'DEBUG', 'Prepared API parameters', {
      cinemaId,
      showId,
      referenceNo,
      membershipId,
      transactionNo,
      cardType,
      authorizeId,
      remarks
    });
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    if (transactionNo) queryParams.append('TransactionNo', transactionNo);
    if (cardType) queryParams.append('CardType', cardType);
    if (authorizeId) queryParams.append('AuthorizeId', authorizeId);
    if (remarks) queryParams.append('Remarks', remarks);
    
    const queryString = queryParams.toString();
    
    // API expects: /Booking/ReserveBooking/{CinemaID}/{ShowID}/{ReferenceNo}/{MembershipID}/TransactionNo/CardType/AuthorizeId/Remarks?params
    // Note the literal text "TransactionNo/CardType/AuthorizeId/Remarks" in the path
    const endpoint = `/Booking/ReserveBooking/${cinemaId}/${showId}/${referenceNo}/${membershipId}/TransactionNo/CardType/AuthorizeId/Remarks${queryString ? `?${queryString}` : ''}`;
    
    const { API_BASE_URL } = await import('@/config/api');
    const fullUrl = `${API_BASE_URL}${endpoint}`;
    
    logPayment(orderid, 'INFO', 'API Call: ReserveBooking', { 
      endpoint,
      fullUrl,
      method: 'POST',
      params: {
        cinemaId,
        showId,
        referenceNo,
        membershipId,
        transactionNo,
        cardType,
        authorizeId,
        remarks
      }
    });
    
    // Use apiRequest to handle headers manually
    const { apiRequest } = await import('@/services/api/client');
    
    try {
      const options = {
        method: 'POST'
      };
      
      // If we have a token, add it to headers
      if (token) {
        options.headers = {
          'Authorization': `Bearer ${token}`
        };
        logPayment(orderid, 'DEBUG', 'Using stored auth token for API call');
      } else {
        logPayment(orderid, 'DEBUG', 'No stored auth token available, using default connection');
      }
      
      const data = await apiRequest(endpoint, options);
      
      logPayment(orderid, 'INFO', 'API Success: ReserveBooking', data);
      // Clean up stored booking details after successful reservation
      deleteBookingDetails(orderid);
      return { success: true, data };
    } catch (apiError) {
      logPayment(orderid, 'ERROR', 'API Failed: ReserveBooking', { 
        error: `ReserveBooking failed: ${apiError.status || 'Unknown'} ${apiError.message}`,
        response: {
          status: apiError.status,
          message: apiError.message,
          data: apiError.data
        }
      });
      return { success: false, error: apiError.message || apiError };
    }
  } catch (error) {
    logPayment(orderid, 'ERROR', 'ReserveBooking EXCEPTION', { 
      error: error.message, 
      stack: error.stack 
    });
    return { success: false, error: error.message };
  }
}

/**
 * Call CancelBooking API
 */
async function callCancelBooking(orderid, returnData) {
  logPayment(orderid, 'INFO', 'Step: callCancelBooking - START', {
    orderid,
    tranID: returnData.tranID,
    status: returnData.status,
    error_desc: returnData.error_desc
  });
  
  try {
    // Extract booking details from multiple sources
    let cinemaId = returnData.cinemaId || '';
    let showId = returnData.showId || '';
    let referenceNo = returnData.referenceNo || '';
    let token = '';
    
    logPayment(orderid, 'DEBUG', 'Initial extraction from returnData', {
      cinemaId,
      showId,
      referenceNo
    });
    
    // Always try to retrieve token from storage if available
    const storedDetails = getBookingDetails(orderid);
    if (storedDetails) {
      logPayment(orderid, 'DEBUG', 'Found stored details', { hasToken: !!storedDetails.token });
      // Only overwrite if missing from returnData
      cinemaId = cinemaId || storedDetails.cinemaId;
      showId = showId || storedDetails.showId;
      referenceNo = referenceNo || storedDetails.referenceNo;
      token = storedDetails.token || '';
    } else {
      logPayment(orderid, 'DEBUG', 'No stored details found');
    }
    
    // Try to extract from returnUrl
    if ((!cinemaId || !showId || !referenceNo) && returnData.returnUrl) {
      logPayment(orderid, 'DEBUG', 'Attempting to extract from returnUrl', { returnUrl: returnData.returnUrl });
      try {
        const returnUrl = new URL(returnData.returnUrl);
        cinemaId = returnUrl.searchParams.get('cinemaId') || cinemaId;
        showId = returnUrl.searchParams.get('showId') || showId;
        referenceNo = returnUrl.searchParams.get('referenceNo') || referenceNo;
        logPayment(orderid, 'DEBUG', 'Extracted from returnUrl', { cinemaId, showId, referenceNo });
      } catch (e) {
        logPayment(orderid, 'WARN', 'Failed to parse returnUrl', { error: e.message });
      }
    }
    
    // Validate required parameters
    if (!cinemaId || !showId || !referenceNo) {
      logPayment(orderid, 'ERROR', 'Missing booking details for CancelBooking', {
        cinemaId,
        showId,
        referenceNo,
        returnData
      });
      return { success: false, error: 'Missing booking details (cinemaId, showId, or referenceNo)' };
    }
    
    const transactionNo = returnData.tranID || '';
    const cardType = returnData.channel || 'card';
    const remarks = `Payment failed - ${returnData.error_desc || 'Unknown error'}`;
    
    logPayment(orderid, 'DEBUG', 'Prepared API parameters', {
      cinemaId,
      showId,
      referenceNo,
      transactionNo,
      cardType,
      remarks
    });
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    if (transactionNo) queryParams.append('TransactionNo', transactionNo);
    if (cardType) queryParams.append('CardType', cardType);
    if (remarks) queryParams.append('Remarks', remarks);
    
    const queryString = queryParams.toString();
    
    // API expects: /Booking/CancelBooking/{CinemaID}/{ShowID}/{ReferenceNo}/TransactionNo/CardType/Remarks?params
    // Note the literal text "TransactionNo/CardType/Remarks" in the path
    const endpoint = `/Booking/CancelBooking/${cinemaId}/${showId}/${referenceNo}/TransactionNo/CardType/Remarks${queryString ? `?${queryString}` : ''}`;
    
    const { API_BASE_URL } = await import('@/config/api');
    const fullUrl = `${API_BASE_URL}${endpoint}`;
    
    logPayment(orderid, 'INFO', 'API Call: CancelBooking', { 
      endpoint,
      fullUrl,
      method: 'POST',
      params: {
        cinemaId,
        showId,
        referenceNo,
        transactionNo,
        cardType,
        remarks
      }
    });
    
    // Use apiRequest to handle headers manually
    const { apiRequest } = await import('@/services/api/client');
    
    try {
      const options = {
        method: 'POST'
      };
      
      // If we have a token, add it to headers
      if (token) {
        options.headers = {
          'Authorization': `Bearer ${token}`
        };
        logPayment(orderid, 'DEBUG', 'Using stored auth token for API call');
      } else {
        logPayment(orderid, 'DEBUG', 'No stored auth token available, using default connection');
      }
      
      const data = await apiRequest(endpoint, options);
      
      logPayment(orderid, 'INFO', 'API Success: CancelBooking', data);
      // Clean up stored booking details after cancellation
      deleteBookingDetails(orderid);
      return { success: true, data };
    } catch (apiError) {
      logPayment(orderid, 'ERROR', 'API Failed: CancelBooking', { 
        error: `CancelBooking failed: ${apiError.status || 'Unknown'} ${apiError.message}`,
        response: {
          status: apiError.status,
          message: apiError.message,
          data: apiError.data
        }
      });
      return { success: false, error: apiError.message || apiError };
    }
  } catch (error) {
    logPayment(orderid, 'ERROR', 'CancelBooking EXCEPTION', { 
      error: error.message, 
      stack: error.stack 
    });
    return { success: false, error: error.message };
  }
}

async function handleReturn(request) {
  try {
    // Get payment data from query params (GET) or form data (POST)
    const { searchParams } = new URL(request.url);
    const returnData = {};
    
    // For GET requests, use search params
    searchParams.forEach((value, key) => {
      returnData[key] = value;
    });

    // For POST requests, also check form data
    try {
      const formData = await request.formData();
      for (const [key, value] of formData.entries()) {
        returnData[key] = value;
      }
    } catch (e) {
      // Not form data, continue with search params
    }

    console.log('[Payment Return] Received return data:', returnData);

    const {
      amount,
      orderid,
      tranID,
      domain,
      status,
      appcode,
      paydate,
      currency,
      skey,
      error_code,
      error_desc,
      channel
    } = returnData;

    // Log the payment return
    if (orderid) {
      logPayment(orderid, 'INFO', 'Payment Return Received', {
        status,
        tranID,
        amount,
        channel,
        error_desc: error_desc || 'N/A'
      });
    }

    // Verify signature
    const isValidSignature = verifyReturnSignature(returnData);
    
    if (!isValidSignature) {
      console.error('[Payment Return] Invalid signature - setting status to -1');
      if (orderid) {
        logPayment(orderid, 'ERROR', 'Invalid signature verification');
      }
      // Invalid transaction - set status to -1 as per documentation
      return NextResponse.redirect(
        new URL(`/payment/failed?error=invalid_signature&orderid=${orderid || ''}`, request.url)
      );
    }

    if (orderid) {
      logPayment(orderid, 'INFO', 'Signature verified successfully');
    }
    
    // Process based on status
    // Status '00' means success
    if (status === '00') {
      // Payment successful
      console.log(`[Payment Return] Payment successful - Order: ${orderid}, Transaction: ${tranID}`);
      
      // Call ReserveBooking API immediately
      const reserveResult = await callReserveBooking(orderid, returnData);
      
      if (reserveResult.success) {
        logPayment(orderid, 'INFO', 'ReserveBooking completed successfully');
      } else {
        logPayment(orderid, 'WARN', 'ReserveBooking failed but continuing to success page', {
          error: reserveResult.error
        });
      }
      
      // Update Order in DB to PAID
      try {
          // Attempt to find order by orderid (assuming it matches referenceNo)
          await prisma.order.update({
             where: { referenceNo: orderid },
             data: { 
                 paymentStatus: 'PAID',
                 status: 'CONFIRMED'
             }
          });
          logPayment(orderid, 'INFO', 'Database updated: PAID/CONFIRMED');
      } catch (dbErr) {
          console.error('[Payment Return] DB Update Error:', dbErr);
          logPayment(orderid, 'WARN', 'Database update failed', { error: dbErr.message });
          // Continue to redirect even if DB update fails (client side might resolve or manual check)
      }

      // Extract card type from channel
      let cardType = 'card';
      if (channel) {
        if (channel.includes('credit') || channel.includes('Credit')) {
          cardType = 'credit';
        } else if (channel.includes('master') || channel.includes('Master')) {
          cardType = 'master';
        } else if (channel.includes('visa') || channel.includes('Visa')) {
          cardType = 'visa';
        } else {
          cardType = channel.toLowerCase();
        }
      }
      
      // Redirect to success page with all payment details
      logPayment(orderid, 'INFO', 'Redirecting to success page');
      return NextResponse.redirect(
        new URL(`/payment/success?orderid=${orderid}&tranID=${tranID}&status=${status}&amount=${amount}&currency=${currency}&channel=${channel || ''}&cardType=${cardType}`, request.url)
      );
    } else {
      // Payment failed
      console.log(`[Payment Return] Payment failed - Order: ${orderid}, Status: ${status}, Error: ${error_desc || 'Unknown'}`);

      // Call CancelBooking API immediately
      const cancelResult = await callCancelBooking(orderid, returnData);
      
      if (cancelResult.success) {
        logPayment(orderid, 'INFO', 'CancelBooking completed successfully');
      } else {
        logPayment(orderid, 'WARN', 'CancelBooking failed but continuing to failed page', {
          error: cancelResult.error
        });
      }

      // Update Order in DB to FAILED
      try {
          await prisma.order.update({
             where: { referenceNo: orderid },
             data: { 
                 paymentStatus: 'FAILED'
                 // typically we keep status as PENDING or cancel it. Let's keep PENDING or update to CANCELLED only if sure.
                 // safe to mark paymentStatus FAILED.
             }
          });
          logPayment(orderid, 'INFO', 'Database updated: FAILED');
      } catch (dbErr) {
          console.error('[Payment Return] DB Update Error:', dbErr);
          logPayment(orderid, 'WARN', 'Database update failed', { error: dbErr.message });
      }
      
      // Extract card type from channel if available
      let cardType = 'card';
      if (channel) {
        cardType = channel.toLowerCase();
      }
      
      // Redirect to failure page
      logPayment(orderid, 'INFO', 'Redirecting to failed page');
      return NextResponse.redirect(
        new URL(`/payment/failed?orderid=${orderid}&status=${status}&error_code=${error_code || ''}&error_desc=${encodeURIComponent(error_desc || 'Payment failed')}&tranID=${tranID || ''}&cardType=${cardType}`, request.url)
      );
    }
  } catch (error) {
    console.error('[Payment Return] Error processing return:', error);
    return NextResponse.redirect(
      new URL('/payment/failed?error=processing_error', request.url)
    );
  }
}

