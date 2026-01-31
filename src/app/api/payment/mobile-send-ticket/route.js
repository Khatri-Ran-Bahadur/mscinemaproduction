/**
 * API Route: Send Mobile Ticket Email
 * Standalone API to trigger ticket email for mobile bookings.
 * This fetches fresh ticket details from the cinema system and sends the formatted HTML email.
 * SECURITY: Requires x-api-key header
 */

import { NextResponse } from 'next/server';
import { sendTicketEmailForOrder } from '@/utils/order-email';

export async function POST(request) {
  try {
    const body = await request.json();
    const { orderId, transactionId } = body;

    if (!orderId) {
      return NextResponse.json({ status: false, error: 'Order ID is required' }, { status: 400 });
    }

    console.log(`[Mobile Send Email API] Triggering email for Order: ${orderId}`);
    
    // Use the optimized order-email utility
    const result = await sendTicketEmailForOrder(orderId, transactionId || '');

    if (result.success) {
      return NextResponse.json({
        status: true,
        message: 'Ticket email sent successfully'
      });
    } else {
      return NextResponse.json({
        status: false,
        error: result.error || 'Failed to send email'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('[Mobile Send Email API] Error:', error);
    return NextResponse.json({ status: false, error: 'Internal server error' }, { status: 500 });
  }
}
