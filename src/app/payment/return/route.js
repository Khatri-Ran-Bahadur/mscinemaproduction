/**
 * API Route: Payment Return/Callback Handler
 * This endpoint handles return URL callbacks from Razer Merchant Services
 * Documentation: https://github.com/RazerMS/SDK-RazerMS_Node_JS/wiki/Installation-Guidance
 * 
 * This is similar to molpay_return.php in the demo
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

    // Process based on status
    // Status '00' means success
    if (status === '00') {
      // Payment successful
      console.log(`[Payment Return] Payment successful - Order: ${orderid}, Transaction: ${tranID}`);
      
      // TODO: Verify order amount matches (check_cart_amt equivalent)
      // You can also do further checking on the paydate as well
      
      // Redirect to success page
      return NextResponse.redirect(
        new URL(`/payment/success?orderid=${orderid}&tranID=${tranID}&status=${status}&amount=${amount}&currency=${currency}&channel=${channel || ''}`, request.url)
      );
    } else {
      // Payment failed
      console.log(`[Payment Return] Payment failed - Order: ${orderid}, Status: ${status}, Error: ${error_desc || 'Unknown'}`);
      
      // Redirect to failure page
      return NextResponse.redirect(
        new URL(`/payment/failed?orderid=${orderid}&status=${status}&error_code=${error_code || ''}&error_desc=${encodeURIComponent(error_desc || 'Payment failed')}`, request.url)
      );
    }
  } catch (error) {
    console.error('[Payment Return] Error processing return:', error);
    return NextResponse.redirect(
      new URL('/payment/failed?error=processing_error', request.url)
    );
  }
}

