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
    console.log('API /api/auth/send-ticket-email received request:', JSON.stringify(body, null, 2));

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

