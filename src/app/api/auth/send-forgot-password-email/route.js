/**
 * API Route: Send Forgot Password Email
 * This endpoint can be called by the backend or mobile developers
 * It generates a password reset link with encrypted user ID and token, and sends the email
 */

import { NextResponse } from 'next/server';
import { encryptId } from '@/utils/encryption';
import { sendForgotPasswordEmail } from '@/utils/email';

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, email, token } = body;

    if (!userId || !email || !token) {
      return NextResponse.json(
        { error: 'User ID, email, and token are required' },
        { status: 400 }
      );
    }

    // Encrypt the user ID for the reset link
    const encryptedUserId = encryptId(userId);

    // Generate reset password URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?userId=${encryptedUserId}&token=${encodeURIComponent(token)}`;

    // Send forgot password email
    const emailResult = await sendForgotPasswordEmail(email, resetUrl);

    return NextResponse.json({
      success: true,
      message: 'Password reset email sent successfully',
      resetUrl: resetUrl,
      encryptedUserId: encryptedUserId,
      messageId: emailResult.messageId,
    });
  } catch (error) {
    console.error('Send forgot password email error:', error);
    return NextResponse.json(
      { error: 'Failed to send password reset email', message: error.message },
      { status: 500 }
    );
  }
}

