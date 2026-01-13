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

// Razer Merchant Services Configuration
const RMS_CONFIG = {
  merchantId: process.env.FIUU_MERCHANT_ID || '',
  verifyKey: process.env.FIUU_VERIFY_KEY || '',
  secretKey: process.env.FIUU_SECRET_KEY || '',
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
async function callReserveBooking(cinemaId, showId, referenceNo, membershipId, transactionNo, cardType, authorizeId, remarks) {
  try {
    const { API_BASE_URL } = await import('@/config/api');
    
    const queryParams = new URLSearchParams();
    if (transactionNo) queryParams.append('TransactionNo', transactionNo);
    if (cardType) queryParams.append('CardType', cardType);
    if (authorizeId) queryParams.append('AuthorizeId', authorizeId);
    if (remarks) queryParams.append('Remarks', remarks);
    
    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/Booking/ReserveBooking/${cinemaId}/${showId}/${referenceNo}/${membershipId}${queryString ? `?${queryString}` : ''}`;
    
    console.log('[Payment Return] Calling ReserveBooking:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    console.log('[Payment Return] ReserveBooking response:', data);
    return { success: response.ok, data };
  } catch (error) {
    console.error('[Payment Return] ReserveBooking error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Call CancelBooking API
 */
async function callCancelBooking(cinemaId, showId, referenceNo, transactionNo, cardType, remarks) {
  try {
    const { API_BASE_URL } = await import('@/config/api');
    
    const queryParams = new URLSearchParams();
    if (transactionNo) queryParams.append('TransactionNo', transactionNo);
    if (cardType) queryParams.append('CardType', cardType);
    if (remarks) queryParams.append('Remarks', remarks);
    
    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/Booking/CancelBooking/${cinemaId}/${showId}/${referenceNo}${queryString ? `?${queryString}` : ''}`;
    
    console.log('[Payment Return] Calling CancelBooking:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    console.log('[Payment Return] CancelBooking response:', data);
    return { success: response.ok, data };
  } catch (error) {
    console.error('[Payment Return] CancelBooking error:', error);
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

    // Verify signature
    const isValidSignature = verifyReturnSignature(returnData);
    
    if (!isValidSignature) {
      console.error('[Payment Return] Invalid signature - setting status to -1');
      // Invalid transaction - set status to -1 as per documentation
      return NextResponse.redirect(
        new URL(`/payment/failed?error=invalid_signature&orderid=${orderid || ''}`, request.url)
      );
    }

    // Extract booking data from orderid
    // OrderID format: MS{timestamp}{random} or contains reference number
    // We need to get booking data - try to extract from orderid or use a mapping
    // For now, we'll pass the orderid and let the success/failed pages handle the API calls
    // The booking data should be stored in localStorage on the client side
    
    // Process based on status
    // Status '00' means success
    if (status === '00') {
      // Payment successful
      console.log(`[Payment Return] Payment successful - Order: ${orderid}, Transaction: ${tranID}`);
      
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
      } catch (dbErr) {
          console.error('[Payment Return] DB Update Error:', dbErr);
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
      // The success page will call ReserveBooking API
      return NextResponse.redirect(
        new URL(`/payment/success?orderid=${orderid}&tranID=${tranID}&status=${status}&amount=${amount}&currency=${currency}&channel=${channel || ''}&cardType=${cardType}`, request.url)
      );
    } else {
      // Payment failed
      console.log(`[Payment Return] Payment failed - Order: ${orderid}, Status: ${status}, Error: ${error_desc || 'Unknown'}`);

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
      } catch (dbErr) {
          console.error('[Payment Return] DB Update Error:', dbErr);
      }
      
      // Extract card type from channel if available
      let cardType = 'card';
      if (channel) {
        cardType = channel.toLowerCase();
      }
      
      // Redirect to failure page
      // The failed page will call CancelBooking API
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

