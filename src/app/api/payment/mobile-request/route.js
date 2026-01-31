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
};

/**
 * Generate unique internal order ID
 */
function generateInternalOrderId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `MOB${timestamp}${random}`;
}

export async function POST(request) {
  try {
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
      devMode = false
    } = body;

    // 1. Basic Validation
    if (!amount || !referenceNo || !customerEmail) {
      return NextResponse.json(
        { status: false, error: 'Amount, Reference No, and Email are required' },
        { status: 400 }
      );
    }

    // 2. Create or Update Order in Database (PENDING status)
    const internalOrderId = generateInternalOrderId();
    
    // Check if an order with this reference number already exists to avoid duplicates
    const existingOrder = await prisma.order.findFirst({
        where: { referenceNo: referenceNo }
    });

    let order;
    if (existingOrder) {
        console.log(`[Mobile Request] Updating existing order for reference: ${referenceNo}`);
        order = await prisma.order.update({
            where: { id: existingOrder.id },
            data: {
                customerName,
                customerEmail,
                customerPhone,
                movieTitle,
                movieId: movieId ? parseInt(movieId) : null,
                cinemaName,
                cinemaId: cinemaId ? String(cinemaId) : null,
                hallName,
                showId: showId ? String(showId) : null,
                showTime: showTime ? new Date(showTime) : null,
                seats: typeof seats === 'object' ? JSON.stringify(seats) : seats,
                ticketType,
                totalAmount: parseFloat(amount),
                paymentStatus: 'PENDING', // Reset status in case they are retrying
                status: 'PENDING',
            }
        });
    } else {
        console.log(`[Mobile Request] Creating new order for reference: ${referenceNo}`);
        order = await prisma.order.create({
            data: {
                orderId: internalOrderId,
                referenceNo,
                customerName,
                customerEmail,
                customerPhone,
                movieTitle,
                movieId: movieId ? parseInt(movieId) : null,
                cinemaName,
                cinemaId: cinemaId ? String(cinemaId) : null,
                hallName,
                showId: showId ? String(showId) : null,
                showTime: showTime ? new Date(showTime) : null,
                seats: typeof seats === 'object' ? JSON.stringify(seats) : seats,
                ticketType,
                totalAmount: parseFloat(amount),
                paymentStatus: 'PENDING',
                status: 'PENDING',
                paymentMethod: 'Mobile App',
            }
        });
    }

    // 3. Build Razer Mobile SDK Payload
    const finalOrderId = order.orderId; // Use the existing or new orderId
    const formattedAmount = parseFloat(amount).toFixed(2);

    const mobilePayload = {
      mp_merchant_ID: RMS_CONFIG.merchantId,
      mp_app_name: RMS_CONFIG.appName,
      mp_verification_key: RMS_CONFIG.verifyKey,
      mp_amount: formattedAmount,
      mp_order_ID: finalOrderId,
      mp_currency: currency.toUpperCase(),
      mp_country: country.toUpperCase(),
      mp_bill_name: customerName || '',
      mp_bill_email: customerEmail || '',
      mp_bill_mobile: customerPhone || '',
      mp_bill_description: `Booking for ${movieTitle}`,
      mp_sandbox_mode: sandboxMode,
      mp_dev_mode: devMode
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
