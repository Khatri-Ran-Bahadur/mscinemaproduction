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
      console.error('[MOLPay Return] Missing required fields for signature verification');
      return false;
    }

    // Step 1: Calculate key0
    const key0String = `${tranID}${orderid}${status}${domain}${amount}${currency}`;
    const key0 = crypto.createHash('md5').update(key0String, 'utf8').digest('hex');

    // Step 2: Calculate key1
    const key1String = `${paydate}${domain}${key0}${appcode}${RMS_CONFIG.verifyKey}`;
    const key1 = crypto.createHash('md5').update(key1String, 'utf8').digest('hex');

    // Step 3: Compare
    const isValid = skey.toLowerCase() === key1.toLowerCase();
    
    if (!isValid) {
      console.error('[MOLPay Return] Signature mismatch', {
        received: skey.toLowerCase(),
        expected: key1.toLowerCase(),
        key0String,
        key1String
      });
    }
    
    return isValid;
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
 * Handle GET/POST request from Razer Merchant Services return URL
 */
export async function GET(request) {
  return handleReturn(request);
}

export async function POST(request) {
  return handleReturn(request);
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

    console.log('[MOLPay Return] Received return data:', {
      orderid: returnData.orderid,
      status: returnData.status,
      tranID: returnData.tranID,
      amount: returnData.amount,
      domain: returnData.domain
    });

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
      channel,
      nbcb // Notification type: 0=return, 1=callback, 2=notification
    } = returnData;

    // If this is a callback or notification (nbcb=1 or 2), just acknowledge
    if (nbcb === '1' || nbcb === '2') {
      console.log('[MOLPay Return] Callback/Notification received, acknowledging...');
      return acknowledgeResponse();
    }

    // Verify signature for return URL
    const isValidSignature = verifyReturnSignature(returnData);
    
    if (!isValidSignature) {
      console.error('[MOLPay Return] Invalid signature - redirecting to failed page');
      // Invalid transaction - redirect to failure page
      return NextResponse.redirect(
        new URL(`/payment/failed?error=invalid_signature&orderid=${orderid || ''}&error_desc=${encodeURIComponent('Invalid payment signature')}`, request.url)
      );
    }

    // Process based on status
    // Status '00' means success, '11' means pending (may need inquiry)
    if (status === '00' || status === '22') {
      // Payment successful
      console.log(`[MOLPay Return] Payment successful - Order: ${orderid}, Transaction: ${tranID}, Status: ${status}`);
      
      // Redirect to success page
      return NextResponse.redirect(
        new URL(`/payment/success?orderid=${orderid}&tranID=${tranID}&status=${status}&amount=${amount}&currency=${currency || 'MYR'}&channel=${channel || ''}`, request.url)
      );
    } else if (status === '11') {
      // Payment pending - may need inquiry
      console.log(`[MOLPay Return] Payment pending - Order: ${orderid}, Transaction: ${tranID}`);
      // TODO: Implement inquiry API call to check actual status
      // For now, redirect to pending/failed page
      return NextResponse.redirect(
        new URL(`/payment/failed?orderid=${orderid}&status=${status}&error_desc=${encodeURIComponent('Payment is pending. Please contact support.')}`, request.url)
      );
    } else {
      // Payment failed
      const errorMessage = error_desc || `Payment failed with status: ${status}`;
      console.log(`[MOLPay Return] Payment failed - Order: ${orderid}, Status: ${status}, Error: ${errorMessage}`);
      
      // Redirect to failure page
      return NextResponse.redirect(
        new URL(`/payment/failed?orderid=${orderid}&status=${status}&error_code=${error_code || ''}&error_desc=${encodeURIComponent(errorMessage)}`, request.url)
      );
    }
  } catch (error) {
    console.error('[MOLPay Return] Error processing return:', error);
    return NextResponse.redirect(
      new URL('/payment/failed?error=processing_error&error_desc=' + encodeURIComponent(error.message || 'An error occurred processing your payment'), request.url)
    );
  }
}

