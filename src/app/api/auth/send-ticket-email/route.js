/**
 * API Route: Send Ticket Confirmation Email
 * This endpoint sends a ticket confirmation email with ticket details and barcode
 * Called after successful payment
 */

import { NextResponse } from 'next/server';
import { sendTicketEmail } from '@/utils/email';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
  try {
    const body = await request.json();

    const { email, ticketInfo } = body;

    if (!email) {
      console.warn('API: Email address is missing');
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    if (!ticketInfo) {
      console.warn('API: Ticket information is missing');
      return NextResponse.json(
        { error: 'Ticket information is required' },
        { status: 400 }
      );
    }

    const refNo = ticketInfo.referenceNo !== 'N/A' ? ticketInfo.referenceNo : null;
    const bookingId = ticketInfo.bookingId !== 'N/A' ? ticketInfo.bookingId : null;
    
    let targetOrder = null;
    if (refNo || bookingId) {
      targetOrder = await prisma.order.findFirst({
        where: {
          OR: [
            refNo ? { referenceNo: refNo } : undefined,
            bookingId ? { orderId: bookingId } : undefined,
          ].filter(Boolean)
        }
      });
    }

    // Only send email if order is PAID, and avoid sending duplicates
    if (targetOrder) {
      if (targetOrder.paymentStatus !== 'PAID') {
        console.warn(`API: Order ${targetOrder.referenceNo} is not PAID (status: ${targetOrder.paymentStatus}). Skipping email.`);
        return NextResponse.json(
          { success: false, message: 'Order is not paid yet. Ticket email skipped.' },
          { status: 400 }
        );
      }
      if (targetOrder.isSendMail) {
        console.log(`API: Email already sent for order ${targetOrder.referenceNo}. Skipping duplicate email.`);
        return NextResponse.json({
          success: true,
          message: 'Ticket email was already sent previously.',
        });
      }
    }

    // Send ticket email
    console.log(`API: Attempting to send ticket email to ${email}`);
    const emailResult = await sendTicketEmail(email, ticketInfo);
    console.log('API: sendTicketEmail result:', emailResult);

    // Update Database Status
    try {
      if (targetOrder) {
        await prisma.order.update({
          where: { id: targetOrder.id },
          data: {
            isSendMail: true,
            emailInfo: ticketInfo
          }
        });
        console.log(`API: Updated order ${targetOrder.referenceNo} email status to SENT.`);
      }
    } catch (dbErr) {
      console.error('API Error updating DB status:', dbErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Ticket email sent successfully',
      messageId: emailResult.messageId,
    });
  } catch (error) {
    console.error('API Error: Send ticket email error:', error);
    console.error('API Error Stack:', error.stack);
    return NextResponse.json(
      { error: 'Failed to send ticket email', message: error.message, details: error.toString() },
      { status: 500 }
    );
  }
}

