import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requestRefund } from '@/utils/molpay';

export async function POST(request) {
  try {
    const body = await request.json();
    const { orderId, reason } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // 1. Fetch order from DB
    const order = await prisma.order.findUnique({
      where: { orderId: orderId }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.paymentStatus === 'REFUNDED') {
      return NextResponse.json({ error: 'Order is already refunded' }, { status: 400 });
    }

    if (order.paymentStatus !== 'PAID') {
      return NextResponse.json({ error: 'Only PAID orders can be refunded.' }, { status: 400 });
    }

    if (!order.transactionNo) {
      return NextResponse.json({ error: 'Order has no transaction ID. Cannot refund.' }, { status: 400 });
    }

    // 2. Request refund from Fiuu
    // We'll use orderId + timestamp as the unique RefID for the refund attempt
    const refundRef = `REF_${orderId}_${Date.now()}`;
    const amount = order.totalAmount.toString();
    
    // RefundType 'P' is used for both partial and full in advanced API
    const refundResult = await requestRefund('P', order.transactionNo, amount, refundRef);

    if (refundResult.success) {
      // 3. Update Order in DB
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'REFUNDED',
          refund: true,
          // We could store more refund details in a separate Refund model if needed, 
          // but for now we update the Order record.
        }
      });

      // Log the event
      await prisma.paymentLog.create({
        data: {
          orderId: order.orderId,
          referenceNo: order.referenceNo,
          transactionNo: order.transactionNo,
          status: 'REFUNDED',
          amount: parseFloat(amount),
          isSuccess: true,
          remarks: `Refund successful. Ref: ${refundRef}. Reason: ${reason || 'Admin triggered'}`,
          method: 'REFUND_API',
          returnData: refundResult.raw
        }
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Refund processed successfully',
        refundId: refundResult.refundId
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: refundResult.error || 'Refund rejected by payment gateway',
        raw: refundResult.raw
      }, { status: 400 });
    }

  } catch (error) {
    console.error('[Admin Refund Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
