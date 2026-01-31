/**
 * API Route: Send Activation Email
 * This endpoint can be called by the backend or mobile developers after user registration
 * It generates an activation link with encrypted user ID and sends the email
 */

import { NextResponse } from 'next/server';
import { encryptId } from '@/utils/encryption';
import { sendActivationEmail } from '@/utils/email';

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, email, name, type } = body;

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'User ID and email are required' },
        { status: 400 }
      );
    }

    // Encrypt the user ID for the activation link unless type is provided
    const finalUserId = type ? userId : encryptId(userId);

    // Generate activation URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    let activationUrl = `${baseUrl}/activate?userId=${finalUserId}`;
    
    if (type) {
      activationUrl += `&type=${encodeURIComponent(type)}`;
    }

    // Send activation email
    const emailResult = await sendActivationEmail(email, name || 'User', activationUrl);

    return NextResponse.json({
      success: true,
      message: 'Activation email sent successfully',
      activationUrl: activationUrl,
      encryptedUserId: encryptedUserId,
      messageId: emailResult.messageId,
    });
  } catch (error) {
    console.error('Send activation email error:', error);
    return NextResponse.json(
      { error: 'Failed to send activation email', message: error.message },
      { status: 500 }
    );
  }
}

