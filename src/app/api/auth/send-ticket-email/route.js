/**
 * API Route: Send Ticket Confirmation Email
 * This endpoint sends a ticket confirmation email with ticket details and barcode
 * Called after successful payment
 */

import { NextResponse } from 'next/server';
import { sendTicketEmail } from '@/utils/email';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, ticketInfo } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    if (!ticketInfo) {
      return NextResponse.json(
        { error: 'Ticket information is required' },
        { status: 400 }
      );
    }

    // Send ticket email
    const emailResult = await sendTicketEmail(email, ticketInfo);

    return NextResponse.json({
      success: true,
      message: 'Ticket email sent successfully',
      messageId: emailResult.messageId,
    });
  } catch (error) {
    console.error('Send ticket email error:', error);
    return NextResponse.json(
      { error: 'Failed to send ticket email', message: error.message },
      { status: 500 }
    );
  }
}

