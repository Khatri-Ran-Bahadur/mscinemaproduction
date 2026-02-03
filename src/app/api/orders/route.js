
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
        paymentMethod,
        token
    } = body;

    // Simple validation
    if (!orderId || !referenceNo || !movieTitle || !totalAmount) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Let's check if there is any order for this referenceNo
    // Use findFirst to get the most recent one if multiple exist (though referenceNo should be unique)
    const existingByRef = await prisma.order.findFirst({
      where: {
        referenceNo: referenceNo
      },
      orderBy: { createdAt: 'desc' }
    });
     

    if (existingByRef) {        
        try {
            console.log(`[Order API] Updating existing order ${existingByRef.id} for reference: ${referenceNo}`);
            const updatedOrder = await prisma.order.update({
                where: { id: existingByRef.id },
                data: {
                    orderId: orderId, // Update with new MS order ID if necessary
                    paymentMethod: paymentMethod || existingByRef.paymentMethod,
                    paymentStatus: paymentStatus || 'PENDING',
                    status: 'PENDING', // Reset to PENDING for retry
                    token: token || existingByRef.token,
                    updatedAt: new Date(),
                    // Update customer details in case they changed during retry
                    customerName: customerName || existingByRef.customerName,
                    customerEmail: customerEmail || existingByRef.customerEmail,
                    customerPhone: customerPhone || existingByRef.customerPhone,
                }
            });
            return NextResponse.json({ success: true, order: updatedOrder, message: 'Order updated for retry' });
        } catch(e) {
            console.error('[Order API] Failed to update existing order:', e);
            throw e;
        }
    }

    // If no existing order, create a new one
    // Ensure default status is PENDING, not PAID
    const order = await prisma.order.create({
      data: {
        orderId,
        referenceNo,
        transactionNo: transactionNo || null,
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
        paymentStatus: paymentStatus || 'PENDING',
        paymentMethod: paymentMethod || 'Online',
        status: 'PENDING',
        token
      }
    });

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
