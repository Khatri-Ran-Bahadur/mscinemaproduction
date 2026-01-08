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
    
    // Extract fields matching process_order.php format (official Fiuu demo)
    const {
      payment_options, // payment channel (e.g., 'credit', 'fpx_mb2u', 'fpx', 'creditAN')
      total_amount, // amount as string
      billingFirstName,
      billingLastName,
      billingEmail,
      billingMobile,
      billingAddress,
      currency = 'MYR',
      molpaytimer = '',
      molpaytimerbox = '',
      razertimer = '', // Alternative name used in demo
      cancelUrl,
      returnUrl,
      notifyUrl = '',
      referenceNo = '', // Booking reference number (optional)
    } = paymentData;

    // Generate order ID if not provided (like process_order.php does)
    // Include reference number in orderid if provided for easier tracking
    let orderId = paymentData.orderId;
    if (!orderId) {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substr(2, 9);
      if (referenceNo) {
        // Include reference number in orderid: MS{timestamp}{random}_{refNo}
        orderId = `MS${timestamp}${random}_${referenceNo}`;
      } else {
        orderId = `MS${timestamp}${random}`;
      }
    }

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

    // For seamless API, channel can be empty or omitted to show all payment methods
    // Some sandbox accounts may not support specific channels, so we'll let the plugin show all
    const selectedPaymentOption = payment_options || ''; // Empty string lets MOLPay show all methods

    // Build bill name from first and last name
    const billName = `${billingFirstName || ''} ${billingLastName || ''}`.trim() || 'Customer';
    const billEmail = billingEmail;
    const billMobile = billingMobile || '';
    const billDesc = billingAddress || 'Payment';
    const amount = 1.01;// parseFloat(total_amount);

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

    // Get request origin for URLs
    const requestOrigin = new URL(request.url).origin;
    
    // Check if sandbox mode
    const isSandbox = FIUU_CONFIG.merchantId.includes('_Dev') || FIUU_CONFIG.merchantId.includes('_Test') || FIUU_CONFIG.merchantId.includes('_Sandbox');
    
    // Currency validation - ensure it's supported
    const upperCurrency = currency.toUpperCase();
    const supportedCurrencies = ['MYR', 'USD', 'SGD', 'THB', 'PHP', 'IDR', 'VND', 'CNY', 'HKD', 'JPY', 'KRW', 'EUR', 'GBP', 'AUD', 'NZD'];
    if (!supportedCurrencies.includes(upperCurrency)) {
      console.warn(`[Payment] Currency ${upperCurrency} might not be supported. Using MYR as fallback.`);
    }
    
    // Build payment parameters for MOLPay Seamless (using mps prefix)
    // NOTE: Based on WooCommerce implementation, mpsdomain is NOT required for seamless API
    // The seamless plugin handles domain automatically
    const params = {
      mpsmerchantid: FIUU_CONFIG.merchantId,
      mpsamount: amount.toFixed(2), // Format amount to 2 decimal places
      mpsorderid: orderId,
      mpsbill_name: billName,
      mpsbill_email: billEmail,
      mpsbill_mobile: billMobile,
      mpsbill_desc: billDesc,
      mpscountry: 'MY', // Malaysia
      mpscurrency: upperCurrency, // Ensure currency is uppercase (MYR not myr)
      // mpsdomain is NOT included - WooCommerce seamless doesn't use it
      mpsvcode: '', // Will be generated below
      mpsreturnurl: returnUrl,
      mpscancelurl: cancelUrl || `${requestOrigin}/payment/failed`,
      mpslangcode: 'en',
      mpsapiversion: '3.28' // Updated to match official SDK documentation
    };
    
    // mpschannel is MANDATORY according to documentation
    // Channel codes must match Fiuu documentation (updated 2025/03/12)
    // Note: "maybank2u" is deprecated - use "fpx_mb2u" instead
    // If not specified, use empty string (which should show all methods)
    if (selectedPaymentOption && selectedPaymentOption.trim() !== '') {
      let channelCode = selectedPaymentOption.trim();
      
      // Map deprecated channel codes to current ones
      const deprecatedChannels = {
        'maybank2u': 'fpx_mb2u', // Deprecated 2025/03/12 - use fpx_mb2u
      };
      
      if (deprecatedChannels[channelCode]) {
        console.warn(`[Payment] Deprecated channel code "${channelCode}" mapped to "${deprecatedChannels[channelCode]}"`);
        channelCode = deprecatedChannels[channelCode];
      }
      
      params.mpschannel = channelCode;
    } else {
      // Use empty string to show all methods
      params.mpschannel = ''; // Empty = show all methods
    }
    
    // Only add timer if specified (matching demo: razertimer or molpaytimer)
    const timerValue = razertimer || molpaytimer;
    if (timerValue && timerValue.trim() !== '') {
      params.mpstimer = parseInt(timerValue) || timerValue;
    }
    const timerBoxValue = molpaytimerbox;
    if (timerBoxValue && timerBoxValue.trim() !== '') {
      params.mpstimerbox = timerBoxValue;
    }

    // Generate vcode (verification code/signature) for MOLPay Seamless
    // Signature is generated using MD5: amount + merchantid + orderid + verifykey (matching process_order.php line 25)
    // Note: Domain is NOT included in vcode calculation for seamless API
    const vcodeString = `${params.mpsamount}${params.mpsmerchantid}${params.mpsorderid}${FIUU_CONFIG.verifyKey}${params.mpscurrency}`;
    const vcode = crypto.createHash('md5').update(vcodeString, 'utf8').digest('hex');

    // this md5 generated code match

    params.mpsvcode = vcode;
    
    
    if (isSandbox) {
      console.warn('[Payment] WARNING: Merchant ID contains "_Dev" but using production endpoint.');
      console.warn('  Ensure your merchant account is active and configured for production.');
      console.warn('  If issues occur, verify:');
      console.warn('    1. Currency "' + upperCurrency + '" is enabled for your merchant account');
      console.warn('    2. Merchant account "' + FIUU_CONFIG.merchantId + '" is active in production');
      console.warn('    3. Return URL domain is registered: ' + requestOrigin.replace(/^https?:\/\//, ''));
    }

    // Return response in format matching process_order.php (index2.html style)
    // Include ALL parameters including mpschannel (which is mandatory)
    const responseData = {
      status: true,
      mpsmerchantid: params.mpsmerchantid,
      mpsamount: params.mpsamount,
      mpsorderid: params.mpsorderid,
      mpsbill_name: params.mpsbill_name,
      mpsbill_email: params.mpsbill_email,
      mpsbill_mobile: params.mpsbill_mobile,
      mpsbill_desc: params.mpsbill_desc,
      mpscountry: params.mpscountry,
      mpsvcode: params.mpsvcode,
      mpscurrency: params.mpscurrency,
      mpschannel: params.mpschannel || '', // Always include (mandatory field)
      // mpsdomain not included - seamless API doesn't require it
      mpslangcode: params.mpslangcode,
      mpscancelurl: params.mpscancelurl,
      mpsreturnurl: params.mpsreturnurl,
      mpsapiversion: params.mpsapiversion,
    };
    
    // Only include timer if specified
    if (params.mpstimer) {
      responseData.mpstimer = params.mpstimer;
    }
    if (params.mpstimerbox) {
      responseData.mpstimerbox = params.mpstimerbox;
    }
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error creating payment request:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment request' },
      { status: 500 }
    );
  }
}

