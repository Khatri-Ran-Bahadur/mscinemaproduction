import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { callReserveBooking } from '@/utils/molpay';

export async function POST(request, { params }) {
  try {
    const { id } = params;
    
    // 1. Fetch the order
    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) }
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    if (!order.orderId) {
      return NextResponse.json({ success: false, error: 'Order has no Order ID' }, { status: 400 });
    }

    // 2. Fetch the latest successful payment log to get MolPay details
    const paymentLog = await prisma.paymentLog.findFirst({
        where: { 
            orderId: order.orderId,
            status: { in: ['00', '22', 'PAID'] } 
        },
        orderBy: { createdAt: 'desc' }
    });

    // Default values if no log found (fallback to Order details)
    let tranID = order.transactionNo || order.orderId;
    let channel = order.paymentMethod || 'manual';
    let appcode = '';
    let returnData = {
        cinemaId: order.cinemaId,
        showId: order.showId,
        referenceNo: order.referenceNo,
        storedDetails: {
            token: order.token || '',
            cinemaId: order.cinemaId,
            showId: order.showId,
            referenceNo: order.referenceNo
        }
    };

    if (paymentLog && paymentLog.returnData) {
        // Extract better values from actual payment return data
        const logData = paymentLog.returnData;
        if (logData.tranID) tranID = logData.tranID;
        if (logData.channel) channel = logData.channel;
        if (logData.appcode) appcode = logData.appcode;
        
        // Merge returnData
        returnData = { ...returnData, ...logData };
    }

    // 3. Call ReserveBooking
    const result = await callReserveBooking(
        order.orderId,
        tranID,
        channel,
        appcode,
        returnData
    );

    if (result.success) {
      // 4. Update Order status
      await prisma.order.update({
        where: { id: parseInt(id) },
        data: {
          reserve_ticket: true,
          status: 'CONFIRMED', 
          // Ensure payment status is PAID if we are reserving
          paymentStatus: 'PAID'
        }
      });

      return NextResponse.json({ success: true, data: result.data });
    } else {
      return NextResponse.json({ success: false, error: result.error });
    }

  } catch (error) {
    console.error('[Manual Reserve] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
