
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
    
    // Let's check if there is any CONFIRMED or PENDING order for this referenceNo
    const existingByRef = await prisma.order.findFirst({
        where: { 
            referenceNo: referenceNo,
            status: { notIn: ['CANCELLED', 'FAILED'] }
        }
    });

    if (existingByRef) {        
        try {
            const updatedOrder = await prisma.order.update({
                where: { id: existingByRef.id },
                data: {
                    orderId: orderId, // Critical: Update to new Payment Request ID
                    paymentMethod: paymentMethod || existingByRef.paymentMethod,
                    updatedAt: new Date()
                }
            });
            return NextResponse.json({ success: true, order: updatedOrder, message: 'Order updated with new Payment ID' });
        } catch(e) {
            console.error('[Order API] Failed to update existing order:', e);
            throw e;
        }
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
