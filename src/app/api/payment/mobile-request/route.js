/**
 * API Route: Create Mobile Payment Request for Flutter App
 * Generates payment request data in Razer Merchant Services Mobile SDK format
 * This endpoint is specifically for mobile app integration (Flutter/React Native)
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Razer Merchant Services Configuration from environment variables
const RMS_CONFIG = {
  merchantId: process.env.NEXT_PUBLIC_FIUU_MERCHANT_ID || process.env.FIUU_MERCHANT_ID || '',
  verifyKey: process.env.FIUU_VERIFY_KEY || '',
  secretKey: process.env.FIUU_SECRET_KEY || '',
  appName: process.env.RMS_APP_NAME || 'MSCinemas',
  username: process.env.FIUU_USERNAME || '',
  password: process.env.FIUU_PASSWORD || '',
};

/**
 * Generate unique internal order ID matching the website's logic
 */
function generateInternalOrderId(referenceNo) {
  const shortTs = Math.floor(Date.now() / 1000).toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${referenceNo}_MB${shortTs}${random}`;
}

const API_SECRET_KEY = process.env.API_SECRET_KEY;

export async function POST(request) {
  try {
    // 0. Security Check
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey || apiKey !== API_SECRET_KEY) {
      return NextResponse.json({ status: false, error: 'Unauthorized: Invalid API Key' }, { status: 401 });
    }

    const body = await request.json();

    // Extract payment and booking fields
    const {
      amount,
      referenceNo,     // The B1A... reference from ms-cinema API
      customerName,
      customerEmail,
      customerPhone,
      movieTitle,
      movieId,
      cinemaName,
      cinemaId,
      hallName,
      showId,
      showTime,
      seats,
      ticketType,
      currency = 'MYR',
      country = 'MY',
      sandboxMode = false,
      devMode = false,
      token = '',
      membershipId = '', // Auth token from client
      userId = ''
    } = body;

    // 1. Basic Validation
    if (!amount || !referenceNo || !customerEmail) {
      return NextResponse.json(
        { status: false, error: 'Amount, Reference No, and Email are required' },
        { status: 400 }
      );
    }

    // 2. Create or Update Order in Database (Upsert logic matching website)
    const internalOrderId = generateInternalOrderId(referenceNo);

    console.log(`[Mobile Request] Syncing order for reference: ${referenceNo}, New Order ID: ${internalOrderId}`);

    const existingOrder = await prisma.order.findUnique({
      where: { referenceNo: referenceNo }
    });

    const malaysiaLocalToUTCDate = (dateTimeStr) => {
      if (!dateTimeStr) return null;

      const [datePart, timePart] = dateTimeStr.trim().split(" ");
      if (!datePart || !timePart) return null;

      const [year, month, day] = datePart.split("-").map(Number);
      const [hour, minute, second = 0] = timePart.split(":").map(Number);

      // Malaysia = UTC+8
      // Store as UTC by subtracting 8 hours
      return new Date(Date.UTC(year, month - 1, day, hour - 8, minute, second));
    };

    const order = await prisma.order.upsert({
      where: { referenceNo: referenceNo },
      update: {
        orderId: internalOrderId,
        customerName,
        customerEmail,
        customerPhone,
        movieTitle: movieTitle || undefined,
        movieId: movieId ? parseInt(movieId) : undefined,
        cinemaName: cinemaName || undefined,
        cinemaId: cinemaId ? String(cinemaId) : undefined,
        hallName: hallName || undefined,
        showId: showId ? String(showId) : undefined,
        showTime: showTime ? new Date(showTime) : undefined,
        seats: seats ? (typeof seats === 'object' ? JSON.stringify(seats) : seats) : undefined,
        ticketType: ticketType ? (typeof ticketType === 'object' ? JSON.stringify(ticketType) : ticketType) : undefined,
        totalAmount: parseFloat(amount),
        paymentStatus: existingOrder?.paymentStatus === 'PAID' ? 'PAID' : 'PENDING',
        status: existingOrder?.status === 'CANCELLED' ? 'PENDING' : (existingOrder?.status || 'PENDING'),
        token: token || existingOrder?.token,
        updatedAt: new Date(),
        membershipId: membershipId || null,
        userId: userId || null,
      },
      create: {
        orderId: internalOrderId,
        referenceNo,
        customerName,
        customerEmail,
        customerPhone,
        movieTitle: movieTitle || 'Movie',
        movieId: movieId ? parseInt(movieId) : null,
        cinemaName: cinemaName || '',
        cinemaId: cinemaId ? String(cinemaId) : null,
        hallName: hallName || '',
        showId: showId ? String(showId) : null,
        showTime: showTime ? malaysiaLocalToUTCDate(showTime) : null,
        seats: typeof seats === 'object' ? JSON.stringify(seats) : (seats || ''),
        ticketType: typeof ticketType === 'object' ? JSON.stringify(ticketType) : (ticketType || 'Standard'),
        totalAmount: parseFloat(amount),
        paymentStatus: 'PENDING',
        status: 'PENDING',
        paymentMethod: 'Mobile App',
        token: token,
        membershipId: membershipId || null,
        userId: userId || null,
        buy_from: 'mobile',
      }
    });

    // 3. Build Razer Mobile SDK Payload
    const finalOrderId = order.orderId; // Use the existing or new orderId
    const formattedAmount = parseFloat(amount).toFixed(2);

    const mobilePayload = {
      // Mandatory String. Values obtained from Fiuu.
      mp_dev_mode: false,
      mp_username: RMS_CONFIG.username,
      mp_password: RMS_CONFIG.password,
      mp_merchant_ID: RMS_CONFIG.merchantId,
      mp_app_name: RMS_CONFIG.appName,
      mp_verification_key: RMS_CONFIG.verifyKey,

      // Mandatory String. Payment values.
      mp_amount: formattedAmount,
      mp_order_ID: finalOrderId,
      mp_currency: currency.toUpperCase(),
      mp_country: country.toUpperCase(),

      // Optional values
      mp_channel: body.mp_channel || 'multi', // Use 'multi' for all available channels option
      mp_bill_description: `Booking for ${movieTitle}`,
      mp_bill_name: customerName || '',
      mp_bill_email: customerEmail || '',
      mp_bill_mobile: customerPhone || '',
      mp_channel_editing: false,
      mp_editing_enabled: false,

      // Sandbox mode
      mp_sandbox_mode: false,

      // UI Customization and language
      mp_language: 'EN',

      // Advanced validations
      mp_advanced_email_validation_enabled: true,
      mp_advanced_phone_validation_enabled: true,

      // Control editing (explicitly force disable user input as per your request snippet)
      mp_bill_name_edit_disabled: true,
      mp_bill_email_edit_disabled: true,
      mp_bill_mobile_edit_disabled: true,
      mp_bill_description_edit_disabled: true,

      // Optional, for Escrow.
      mp_is_escrow: body.mp_is_escrow || '0',

      // Optional, for credit card BIN restrictions and campaigns.
      mp_bin_lock: body.mp_bin_lock || [],
      mp_bin_lock_err_msg: body.mp_bin_lock_err_msg || '',

      // Optional, for transaction query use only
      mp_transaction_id: body.mp_transaction_id || '',
      mp_request_type: body.mp_request_type || '',

      // Optional, custom UI theme
      mp_custom_css_url: body.mp_custom_css_url || '',

      // Optional, preferred token
      mp_preferred_token: body.mp_preferred_token || '',

      // Optional, transaction type
      mp_tcctype: body.mp_tcctype || '',

      // Optional, recurring payment
      mp_is_recurring: body.mp_is_recurring || false,

      // Optional, restricted channels
      mp_allowed_channels: body.mp_allowed_channels || [],
      mp_disabled_channels: body.mp_disabled_channels || [],

      // Optional, express mode
      mp_express_mode: body.mp_express_mode !== undefined ? body.mp_express_mode : false,

      // Optional, cash channel wait time
      mp_cash_waittime: body.mp_cash_waittime || 120,

      // Optional, non-3DS bypass
      mp_non_3DS: false,

      // Optional, disable card list
      mp_card_list_disabled: false,
    };

    return NextResponse.json({
      status: true,
      message: 'Mobile payment request created',
      orderId: finalOrderId,
      payload: mobilePayload,
      order: {
        id: order.id,
        referenceNo: order.referenceNo
      }
    });

  } catch (error) {
    console.error('[Mobile Request API] Error:', error);
    return NextResponse.json(
      { status: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
