/**
 * API Route: Create Fiuu Payment Request
 * Generates payment request with signature (server-side for security)
 */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { storeBookingDetails } from '@/utils/booking-storage';
import { prisma } from '@/lib/prisma';


// Fiuu Payment Gateway Configuration from environment variables
const FIUU_CONFIG = {
  merchantId: process.env.FIUU_MERCHANT_ID || '',
  verifyKey: process.env.FIUU_VERIFY_KEY || '',
  secretKey: process.env.FIUU_SECRET_KEY || '',
  returnUrl: process.env.FIUU_RETURN_URL || '',
  cancelUrl: process.env.FIUU_CANCEL_URL || '',
};

// Validate configuration
if (!FIUU_CONFIG.merchantId || !FIUU_CONFIG.verifyKey || !FIUU_CONFIG.secretKey) {
  console.error('Fiuu payment gateway credentials are not configured in environment variables');
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
      cinemaId = '', // Cinema ID for ReserveBooking API
      showId = '', // Show ID for ReserveBooking API
      membershipId = '', // Membership ID for ReserveBooking API
      token = '', // Auth token from client
    } = paymentData;

    // Generate order ID if not provided - shorter and unique format
    // Format: MS{timestamp(10 digits)}{random(6 chars)} = ~16 characters total
    let orderId = paymentData.orderId;
    const existingByRef = await prisma.order.findFirst({
      where: {
        referenceNo: referenceNo
      },
      orderBy: { createdAt: 'desc' }
    });
      
      
    if (existingByRef) {
      orderId = existingByRef.orderId; // 👈 reuse
    }
    if (!orderId) {
      // Use last 10 digits of timestamp (milliseconds since epoch)
      const timestamp = Date.now().toString().slice(-10);
      // Generate 6-character random string (base36)
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      orderId = `MS${timestamp}${random}`;
    }

    // Use return URL and cancel URL from env if provided, otherwise use from request
    let finalReturnUrl = FIUU_CONFIG.returnUrl || returnUrl;
    let finalCancelUrl = FIUU_CONFIG.cancelUrl || cancelUrl;
    
    // Add booking details to return URL if provided (for ReserveBooking/CancelBooking API calls)
    if (finalReturnUrl && (cinemaId || showId || referenceNo)) {
      try {
        const returnUrlObj = new URL(finalReturnUrl);
        if (cinemaId) returnUrlObj.searchParams.set('cinemaId', cinemaId);
        if (showId) returnUrlObj.searchParams.set('showId', showId);
        if (referenceNo) returnUrlObj.searchParams.set('referenceNo', referenceNo);
        if (membershipId) returnUrlObj.searchParams.set('membershipId', membershipId);
        
        // Use 'orderid' (lowercase) to match MolPay standard convention
        if (orderId) returnUrlObj.searchParams.set('orderid', orderId);

        finalReturnUrl = returnUrlObj.toString();
        
        // Store booking details for retrieval during callbacks
        const bookingDetails = {
          cinemaId,
          showId,
          referenceNo,
          membershipId,
          returnUrl: finalReturnUrl,
          token // Store the token
        };
        
        const stored = storeBookingDetails(orderId, bookingDetails);
        
        if (stored) {
          console.log('[Payment Create] ✅ Booking details stored successfully for:', orderId);
        } else {
          console.error('[Payment Create] ❌ Failed to store booking details for:', orderId);
        }
      } catch (e) {
        // Invalid URL, use as is
        console.warn('[Payment Create] Invalid return URL, cannot add booking details:', e);
      }
    } else {
      console.warn('[Payment Create] ⚠️ No booking details to store - missing cinemaId, showId, or referenceNo', {
        orderId,
        cinemaId,
        showId,
        referenceNo,
        hasReturnUrl: !!finalReturnUrl
      });
    }

   
    // Validate required fields (matching process_order.php logic)
    // Note: payment_options is optional for seamless - plugin will show all available methods
    if (!total_amount || !billingEmail || !finalReturnUrl || !referenceNo) {
      return NextResponse.json(
        { 
          status: false,
          error_code: '400',
          error_desc: 'Missing required payment parameters. Required: total_amount, billingEmail, returnUrl (or FIUU_RETURN_URL in env)',
          failureurl: finalCancelUrl || `${new URL(request.url).origin}/payment/failed`
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
    const amount =   parseFloat(total_amount);

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { 
          status: false,
          error_code: '400',
          error_desc: 'Invalid amount',
          failureurl: finalCancelUrl || `${new URL(request.url).origin}/payment/failed`
        },
        { status: 400 }
      );
    }

    // Get request origin for URLs
    const requestOrigin = new URL(request.url).origin;
    
    // Currency validation - ensure it's supported
    const upperCurrency = currency.toUpperCase();
    const supportedCurrencies = ['MYR', 'USD', 'SGD', 'THB', 'PHP', 'IDR', 'VND', 'CNY', 'HKD', 'JPY', 'KRW', 'EUR', 'GBP', 'AUD', 'NZD'];
    // Currency validation - ensure it's supported
    
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
      mpsreturnurl: finalReturnUrl?.replace('http://', 'https://') || finalReturnUrl,
      mpscancelurl: (finalCancelUrl || `${requestOrigin}/payment/failed`)?.replace('http://', 'https://'),
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
    // Signature is generated using MD5: amount + merchantid + orderid + verifykey + currency
    // Note: Domain is NOT included in vcode calculation for seamless API
    const vcodeString = `${params.mpsamount}${params.mpsmerchantid}${params.mpsorderid}${FIUU_CONFIG.verifyKey}${params.mpscurrency}`;
    const vcode = crypto.createHash('md5').update(vcodeString, 'utf8').digest('hex');
    params.mpsvcode = vcode;

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

