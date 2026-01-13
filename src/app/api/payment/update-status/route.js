
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
  try {
    const body = await request.json();
    const { referenceNo, paymentStatus, paymentMethod } = body;

    if (!referenceNo) {
        return NextResponse.json({ error: 'Missing reference number' }, { status: 400 });
    }

    const order = await prisma.order.update({
      where: { referenceNo },
      data: {
        paymentStatus,
        paymentMethod: paymentMethod || undefined
      }
    });

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('Update order payment status error:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
