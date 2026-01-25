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

    // Send ticket email
    console.log(`API: Attempting to send ticket email to ${email}`);
    const emailResult = await sendTicketEmail(email, ticketInfo);
    console.log('API: sendTicketEmail result:', emailResult);

    // Update Database Status
    try {
        const refNo = ticketInfo.referenceNo !== 'N/A' ? ticketInfo.referenceNo : null;
        const bookingId = ticketInfo.bookingId !== 'N/A' ? ticketInfo.bookingId : null;
        
        if (refNo || bookingId) {
            // Try to find the order
            const order = await prisma.order.findFirst({
                where: {
                    OR: [
                        { referenceNo: refNo },
                        { orderId: bookingId }
                    ]
                }
            });

            if (order) {
                await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        isSendMail: true,
                        emailInfo: ticketInfo // Store the JSON used to send
                    }
                });
                console.log(`API: Updated order ${order.referenceNo} email status to SENT.`);
            } else {
                console.warn(`API: Order not found for Ref: ${refNo} / ID: ${bookingId}, skipped DB update.`);
            }
        }
    } catch (dbErr) {
        console.error('API Error updating DB status:', dbErr);
        // Don't fail the response if email was sent but DB update failed
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

