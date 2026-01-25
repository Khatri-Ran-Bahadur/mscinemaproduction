
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
        orderId,
        referenceNo, 
        transactionNo,
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
        totalAmount,
        paymentStatus,
        paymentMethod
    } = body;

    // Simple validation
    if (!orderId || !referenceNo || !movieTitle || !totalAmount) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if duplicate
    // Check if orderId already exists
    const existingById = await prisma.order.findUnique({ where: { orderId } });
    if (existingById) {
        return NextResponse.json({ message: 'Order already exists', order: existingById });
    }

    // CRITICAL: Check if referenceNo already has an active order (prevent multiples for same booking)
    // We allow if the previous one was FAILED, but normally unique constraint or logic should hold.
    // If user clicks Pay multiple times for same reference number, we should arguably update or return existing.
    
    // Let's check if there is any CONFIRMED or PENDING order for this referenceNo
    const existingByRef = await prisma.order.findFirst({
        where: { 
            referenceNo: referenceNo,
            status: { notIn: ['CANCELLED', 'FAILED'] }
        }
    });

    if (existingByRef) {
        console.warn(`[Order API] Blocked duplicate order creation for existing ref: ${referenceNo}`);
        // Return success with the EXISTING order to handle idempotency gracefully
        return NextResponse.json({ success: true, order: existingByRef, message: 'Order already exists for this reference' });
    }

    const order = await prisma.order.create({
      data: {
        orderId,
        referenceNo,
        transactionNo,
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
        totalAmount: parseFloat(totalAmount),
        paymentStatus: paymentStatus || 'PAID',
        paymentMethod: paymentMethod || 'Online',
        status: 'CONFIRMED'
      }
    });

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
