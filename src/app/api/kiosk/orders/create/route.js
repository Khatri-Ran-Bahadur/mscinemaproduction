/**
 * Kiosk API: Create Booking Order & Generate Fiuu OPA Dynamic QR
 * Endpoint: POST /api/kiosk/orders/create
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { callPreCreateQR } from '@/utils/fiuu-opa';
import { savePaymentLogDB } from '@/utils/molpay';

function generateKioskOrderId(referenceNo) {
  const shortTs = Math.floor(Date.now() / 1000).toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `KSK_${referenceNo}_${shortTs}${random}`;
}

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      referenceNo,
      amount,
      movieTitle,
      movieId,
      cinemaName,
      cinemaId,
      hallName,
      showId,
      showTime,
      seats,
      ticketType,
      customerName = 'Kiosk Customer',
      customerPhone = '',
      customerEmail = '',
      token = '',
      membershipId = '0',
      terminalId = 'KIOSK01',
      paymentMethod = 'FIUU_QR',
    } = body;

    // 1. Validation
    if (!referenceNo || !amount) {
      return NextResponse.json(
        { success: false, error: 'Reference No and Amount are required' },
        { status: 400 }
      );
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid positive amount is required' },
        { status: 400 }
      );
    }

    const internalOrderId = generateKioskOrderId(referenceNo);

    // 2. Parse showTime safely
    let parsedShowTime = null;
    if (showTime) {
      const parsed = new Date(showTime);
      if (!isNaN(parsed.getTime())) {
        parsedShowTime = parsed;
      }
    }

    // 3. Upsert Order in Database (PENDING State)
    const order = await prisma.order.upsert({
      where: { referenceNo },
      update: {
        orderId: internalOrderId,
        customerName,
        customerEmail: customerEmail || null,
        customerPhone: customerPhone || null,
        movieTitle: movieTitle || 'Movie Ticket',
        movieId: movieId ? parseInt(movieId, 10) || null : null,
        cinemaName: cinemaName || null,
        cinemaId: cinemaId || null,
        hallName: hallName || null,
        showId: showId || null,
        showTime: parsedShowTime,
        seats: Array.isArray(seats) ? seats.join(', ') : String(seats || ''),
        ticketType: ticketType || null,
        totalAmount: numericAmount,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        paymentMethod: paymentMethod || 'FIUU_QR',
        buy_from: 'kiosk',
        token: token || null,
        membershipId: membershipId || '0',
        reserve_ticket: false,
        cancel_ticket: false,
      },
      create: {
        orderId: internalOrderId,
        referenceNo,
        customerName,
        customerEmail: customerEmail || null,
        customerPhone: customerPhone || null,
        movieTitle: movieTitle || 'Movie Ticket',
        movieId: movieId ? parseInt(movieId, 10) || null : null,
        cinemaName: cinemaName || null,
        cinemaId: cinemaId || null,
        hallName: hallName || null,
        showId: showId || null,
        showTime: parsedShowTime,
        seats: Array.isArray(seats) ? seats.join(', ') : String(seats || ''),
        ticketType: ticketType || null,
        totalAmount: numericAmount,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        paymentMethod: paymentMethod || 'FIUU_QR',
        buy_from: 'kiosk',
        token: token || null,
        membershipId: membershipId || '0',
        reserve_ticket: false,
        cancel_ticket: false,
      },
    });

    // 4. If Card Payment (CardBiz UPT1000), QR is not needed
    if (paymentMethod === 'CARDBIZ_EDC') {
      return NextResponse.json({
        success: true,
        orderId: internalOrderId,
        referenceNo,
        amount: numericAmount.toFixed(2),
        paymentMethod: 'CARDBIZ_EDC',
        message: 'Order created for CardBiz EDC payment',
      });
    }

    // 5. Generate Fiuu OPA PreCreate Dynamic QR
    const qrResult = await callPreCreateQR({
      referenceId: internalOrderId,
      amount: numericAmount,
      description: `${cinemaName || 'MS Cinema'} - ${movieTitle || 'Ticket'}`.slice(0, 50),
      terminalId,
    });

    // 6. Log Transaction Attempt
    await savePaymentLogDB({
      orderid: internalOrderId,
      referenceNo,
      transactionNo: qrResult.molTransactionId || null,
      status: qrResult.statusCode || (qrResult.success ? '00' : '-1'),
      amount: numericAmount,
      currency: 'MYR',
      channel: 'FIUU_OPA_QR',
      method: 'KIOSK_PRECREATE',
      returnData: qrResult.raw || {},
      isSuccess: qrResult.success,
      remarks: qrResult.success ? 'Fiuu Dynamic QR generated' : `QR Generation failed: ${qrResult.error}`,
      request,
    });

    if (!qrResult.success) {
      return NextResponse.json({
        success: false,
        orderId: internalOrderId,
        referenceNo,
        error: qrResult.error || 'Failed to generate payment QR code from Fiuu',
      }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      orderId: internalOrderId,
      referenceNo,
      amount: numericAmount.toFixed(2),
      molTransactionId: qrResult.molTransactionId,
      imageUrl: qrResult.imageUrl,
      imageUrlSmall: qrResult.imageUrlSmall,
      qrCode: qrResult.qrCode,
      expiresInSeconds: 120, // 2-minute standard kiosk QR countdown
      message: 'Dynamic QR generated successfully',
    });
  } catch (error) {
    console.error('[Kiosk Create Order Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
