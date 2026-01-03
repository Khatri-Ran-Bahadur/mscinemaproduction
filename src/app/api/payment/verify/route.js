/**
 * API Route: Verify Fiuu Payment Response
 * Verifies payment response signature (server-side for security)
 */

import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Fiuu Payment Gateway Configuration from environment variables
const FIUU_CONFIG = {
  merchantId: process.env.FIUU_MERCHANT_ID || '',
  verifyKey: process.env.FIUU_VERIFY_KEY || '',
  secretKey: process.env.FIUU_SECRET_KEY || '',
};

/**
 * Generate signature for verification
 */
function generateSignature(params, secretKey) {
  // Sort parameters alphabetically and create query string
  const sortedKeys = Object.keys(params).sort();
  const queryString = sortedKeys
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  // Append secret key
  const stringToSign = `${queryString}${secretKey}`;
  
  // Generate SHA256 hash
  const signature = crypto.createHash('sha256').update(stringToSign, 'utf8').digest('hex');
  return signature;
}

export async function POST(request) {
  try {
    const responseData = await request.json();
    
    const receivedSignature = responseData.Signature || responseData.signature;
    if (!receivedSignature) {
      return NextResponse.json({ valid: false, error: 'No signature provided' });
    }

    // Create copy without signature for verification
    const paramsForVerification = { ...responseData };
    delete paramsForVerification.Signature;
    delete paramsForVerification.signature;

    // Generate expected signature
    const expectedSignature = generateSignature(paramsForVerification, FIUU_CONFIG.secretKey);

    // Compare signatures (case-insensitive)
    const isValid = receivedSignature.toLowerCase() === expectedSignature.toLowerCase();

    return NextResponse.json({ valid: isValid });
  } catch (error) {
    console.error('Error verifying payment response:', error);
    return NextResponse.json(
      { valid: false, error: error.message || 'Verification failed' },
      { status: 500 }
    );
  }
}

