import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { queryPaymentStatus } from '@/utils/molpay';

export async function POST(request) {
  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { orderId: orderId }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Query Fiuu for real-time status
    const amount = order.totalAmount.toString();
    const fiuuStatus = await queryPaymentStatus(orderId, amount);

    let dbUpdated = false;
    let newStatus = order.paymentStatus;
    const updateData = {};

    // 1. If we found a transaction ID and we don't have one locally, capture it
    // This is useful for refunds even if the status isn't PAID yet
    if (fiuuStatus.tranID && !order.transactionNo) {
      updateData.transactionNo = fiuuStatus.tranID;
      dbUpdated = true;
    }

    // 2. Capture payment method if missing
    if (fiuuStatus.raw?.Channel && !order.paymentMethod) {
      updateData.paymentMethod = fiuuStatus.raw.Channel;
      dbUpdated = true;
    }

    // 3. Sync DB if Fiuu says PAID but we didn't know
    if (fiuuStatus.success && order.paymentStatus !== 'PAID') {
      updateData.paymentStatus = 'PAID';
      updateData.transactionNo = fiuuStatus.tranID || updateData.transactionNo;
      updateData.paymentMethod = fiuuStatus.raw?.Channel || updateData.paymentMethod || order.paymentMethod;
      dbUpdated = true;
      newStatus = 'PAID';
    }

    if (dbUpdated) {
      await prisma.order.update({
        where: { id: order.id },
        data: updateData
      });
    }

    return NextResponse.json({
      success: true,
      currentStatus: newStatus,
      fiuuStatus: fiuuStatus,
      dbUpdated,
      // Check if it's a "Paid but failed booking" case
      isPaidButNotReserved: newStatus === 'PAID' && !order.reserve_ticket
    });

  } catch (error) {
    console.error('[Admin Status Check Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
