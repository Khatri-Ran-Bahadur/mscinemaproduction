
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request, { params }) {
  try {
    const paramsData = await params;
    const id = parseInt(paramsData.id);

    if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    const { paymentStatus: inputPaymentStatus, status: inputBookingStatus } = await request.json();
    
    const paymentStatus = inputPaymentStatus?.toUpperCase();
    const bookingStatus = inputBookingStatus?.toUpperCase();

    const allowedPaymentStatuses = ['PAID', 'PENDING', 'FAILED', 'CANCELLED', 'REFUNDED'];
    const allowedBookingStatuses = ['CONFIRMED', 'PENDING', 'CANCELLED'];

    if (paymentStatus && !allowedPaymentStatuses.includes(paymentStatus)) {
        return NextResponse.json({ error: 'Invalid payment status' }, { status: 400 });
    }

    if (bookingStatus && !allowedBookingStatuses.includes(bookingStatus)) {
        return NextResponse.json({ error: 'Invalid booking status' }, { status: 400 });
    }

    const updateData = {};
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (bookingStatus) updateData.status = bookingStatus;

    const order = await prisma.order.update({
        where: { id: id },
        data: updateData
    });
    
    return NextResponse.json({ success: true, order });

  } catch (error) {
    console.error('Update Status Error:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
