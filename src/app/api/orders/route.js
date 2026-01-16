
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
    const existing = await prisma.order.findUnique({ where: { orderId } });
    if (existing) {
        return NextResponse.json({ message: 'Order already exists', order: existing });
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
