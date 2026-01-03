/**
 * API Route: Create Fiuu Payment Request
 * Generates payment request with signature (server-side for security)
 */

import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Fiuu Payment Gateway Configuration from environment variables
const FIUU_CONFIG = {
  merchantId: process.env.FIUU_MERCHANT_ID || '',
  verifyKey: process.env.FIUU_VERIFY_KEY || '',
  secretKey: process.env.FIUU_SECRET_KEY || '',
};

// Validate configuration
if (!FIUU_CONFIG.merchantId || !FIUU_CONFIG.verifyKey || !FIUU_CONFIG.secretKey) {
  console.error('Fiuu payment gateway credentials are not configured in environment variables');
  console.error('Missing:', {
    merchantId: !FIUU_CONFIG.merchantId,
    verifyKey: !FIUU_CONFIG.verifyKey,
    secretKey: !FIUU_CONFIG.secretKey
  });
} else {
  console.log('Payment gateway configured with merchant ID:', FIUU_CONFIG.merchantId);
}

/**
 * Generate signature for Fiuu payment request
 */
function generateSignature(params, secretKey) {
  // Sort parameters alphabetically and create query string
  const sortedKeys = Object.keys(params).sort();
  const queryString = sortedKeys
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  // Append secret key
  const stringToSign = `${queryString}${secretKey}`;
  
  // Generate SHA256 hash
  const signature = crypto.createHash('sha256').update(stringToSign, 'utf8').digest('hex');
  return signature;
}

export async function POST(request) {
  try {
    // MOLPay plugin sends form data (application/x-www-form-urlencoded)
    // But we also support JSON for manual API calls
    let paymentData;
    
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      paymentData = await request.json();
    } else {
      // Handle form data (from MOLPay plugin form submission)
      const formData = await request.formData();
      paymentData = {};
      for (const [key, value] of formData.entries()) {
        paymentData[key] = value;
      }
    }
    
    // Extract fields matching process_order.php format
    const {
      payment_options, // payment channel (e.g., 'credit', 'maybank2u', 'fpx')
      total_amount, // amount as string
      billingFirstName,
      billingLastName,
      billingEmail,
      billingMobile,
      billingAddress,
      currency = 'MYR',
      molpaytimer = '',
      molpaytimerbox = '',
      cancelUrl,
      returnUrl,
      notifyUrl = '',
    } = paymentData;

    // Generate order ID if not provided (like process_order.php does)
    const orderId = paymentData.orderId || `TEST${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

    // Validate required fields (matching process_order.php logic)
    // Note: payment_options is optional for seamless - plugin will show all available methods
    if (!total_amount || !billingEmail || !returnUrl) {
      return NextResponse.json(
        { 
          status: false,
          error_code: '400',
          error_desc: 'Missing required payment parameters. Required: total_amount, billingEmail, returnUrl',
          failureurl: cancelUrl || `${new URL(request.url).origin}/test-payment`
        },
        { status: 400 }
      );
    }

    // Use default payment option if not provided (for seamless, plugin will show all methods anyway)
    const selectedPaymentOption = payment_options || 'credit';

    // Build bill name from first and last name
    const billName = `${billingFirstName || ''} ${billingLastName || ''}`.trim() || 'Customer';
    const billEmail = billingEmail;
    const billMobile = billingMobile || '';
    const billDesc = billingAddress || 'Payment';
    const amount = parseFloat(total_amount);

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { 
          status: false,
          error_code: '400',
          error_desc: 'Invalid amount',
          failureurl: cancelUrl || `${new URL(request.url).origin}/test-payment`
        },
        { status: 400 }
      );
    }

    // Build payment parameters for MOLPay Seamless (using mps prefix) - matching process_order.php
    const params = {
      mpsmerchantid: FIUU_CONFIG.merchantId,
      mpschannel: selectedPaymentOption, // Use selected payment option (plugin will still show all methods)
      mpsamount: amount.toFixed(2), // Format amount to 2 decimal places
      mpsorderid: orderId,
      mpsbill_name: billName,
      mpsbill_email: billEmail,
      mpsbill_mobile: billMobile,
      mpsbill_desc: billDesc,
      mpscountry: 'MY',
      mpscurrency: currency,
      mpsvcode: '', // Will be generated below
      mpsreturnurl: returnUrl,
      mpscancelurl: cancelUrl || `${new URL(request.url).origin}/payment/failed`,
      mpslangcode: 'en',
      mpstimer: molpaytimer,
      mpstimerbox: molpaytimerbox,
      mpsapiversion: '3.28' // Updated to match official SDK documentation
    };

    // Generate vcode (verification code/signature) for MOLPay Seamless
    // Signature is generated using MD5: amount + merchantid + orderid + verifykey (matching process_order.php line 25)
    const vcodeString = `${params.mpsamount}${params.mpsmerchantid}${params.mpsorderid}${FIUU_CONFIG.verifyKey}`;
    const vcode = crypto.createHash('md5').update(vcodeString, 'utf8').digest('hex');
    params.mpsvcode = vcode;
    
    console.log('Payment request parameters:', {
      merchantId: params.mpsmerchantid,
      channel: params.mpschannel,
      amount: params.mpsamount,
      orderId: params.mpsorderid,
      vcodeLength: vcode.length
    });

    // Return response in format matching process_order.php (index2.html style)
    return NextResponse.json({
      status: true,
      mpsmerchantid: params.mpsmerchantid,
      mpschannel: params.mpschannel,
      mpsamount: params.mpsamount,
      mpsorderid: params.mpsorderid,
      mpsbill_name: params.mpsbill_name,
      mpsbill_email: params.mpsbill_email,
      mpsbill_mobile: params.mpsbill_mobile,
      mpsbill_desc: params.mpsbill_desc,
      mpscountry: params.mpscountry,
      mpsvcode: params.mpsvcode,
      mpscurrency: params.mpscurrency,
      mpslangcode: params.mpslangcode,
      mpstimer: params.mpstimer,
      mpstimerbox: params.mpstimerbox,
      mpscancelurl: params.mpscancelurl,
      mpsreturnurl: params.mpsreturnurl,
      mpsapiversion: params.mpsapiversion
    });
  } catch (error) {
    console.error('Error creating payment request:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment request' },
      { status: 500 }
    );
  }
}

