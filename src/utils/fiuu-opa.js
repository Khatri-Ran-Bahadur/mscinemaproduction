/**
 * Fiuu (Razer Merchant Services) Offline Payment API (OPA) Utility
 * Implements PreCreate Dynamic QR, Status Inquiry, Reversal, and HMAC-SHA256 verification.
 * Adheres to Razer OPA Specification v2.1.6.
 */

import crypto from 'crypto';
import { FIUU_OPA_CONFIG } from '@/config/fiuu-opa';

/**
 * Generate HMAC-SHA256 signature per Razer OPA v2.1.6 specification:
 * 1. Filter out empty/null/undefined parameter values and the 'signature' parameter itself.
 * 2. Sort parameter keys alphabetically (A to Z).
 * 3. Concatenate non-empty values in alphabetical order (without separators).
 * 4. Compute HMAC-SHA256 using the Secret Key.
 */
export function generateOpaSignature(params, secretKey = FIUU_OPA_CONFIG.credentials.secretKey) {
  if (!secretKey) {
    throw new Error('Fiuu OPA Secret Key is required for signature generation');
  }

  const sortedKeys = Object.keys(params)
    .filter((k) => k !== 'signature' && params[k] !== undefined && params[k] !== null && String(params[k]).trim() !== '')
    .sort();

  const concatenatedString = sortedKeys.map((k) => String(params[k]).trim()).join('');

  return crypto.createHmac('sha256', secretKey).update(concatenatedString).digest('hex');
}

/**
 * Verify incoming response or webhook signature
 */
export function verifyOpaSignature(responsePayload, secretKey = FIUU_OPA_CONFIG.credentials.secretKey) {
  try {
    const receivedSignature = responsePayload.signature;
    if (!receivedSignature) return false;

    const expectedSignature = generateOpaSignature(responsePayload, secretKey);
    return receivedSignature.toLowerCase() === expectedSignature.toLowerCase();
  } catch (err) {
    console.error('[Fiuu OPA] verifyOpaSignature error:', err);
    return false;
  }
}

/**
 * Formats amount to standard 2-decimal string (e.g. 25.00)
 */
export function formatOpaAmount(amount) {
  const num = parseFloat(amount);
  if (isNaN(num) || num < 0) {
    throw new Error(`Invalid payment amount: ${amount}`);
  }
  return num.toFixed(2);
}

/**
 * Call Fiuu OPA PreCreate API to generate a Dynamic QR code for the Kiosk screen.
 */
export async function callPreCreateQR({
  referenceId,
  amount,
  channelId = '',
  description = 'MS Cinema Kiosk Ticket',
  terminalId = FIUU_OPA_CONFIG.defaultTerminalId,
  storeId = FIUU_OPA_CONFIG.credentials.storeId,
}) {
  const formattedAmount = formatOpaAmount(amount);
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const requestPayload = {
    amount: formattedAmount,
    applicationCode: FIUU_OPA_CONFIG.credentials.applicationCode,
    businessDate: today,
    currencyCode: FIUU_OPA_CONFIG.currencyCode,
    description: String(description).slice(0, 50),
    hashType: FIUU_OPA_CONFIG.hashType,
    referenceId: String(referenceId).trim(),
    storeId: String(storeId).trim(),
    terminalId: String(terminalId).trim(),
    version: FIUU_OPA_CONFIG.version,
  };

  if (channelId && String(channelId).trim() !== '') {
    requestPayload.channelId = String(channelId).trim();
  }

  // Calculate HMAC-SHA256 signature
  const signature = generateOpaSignature(requestPayload, FIUU_OPA_CONFIG.credentials.secretKey);
  requestPayload.signature = signature;

  console.log(`[Fiuu OPA] PreCreate QR Request for Ref: ${referenceId}, Amount: ${formattedAmount}`);

  const formBody = new URLSearchParams();
  for (const [key, value] of Object.entries(requestPayload)) {
    formBody.append(key, value);
  }

  const response = await fetch(FIUU_OPA_CONFIG.urls.precreate, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: formBody.toString(),
    cache: 'no-store',
  });

  const responseText = await response.text();
  let jsonResponse;
  try {
    jsonResponse = JSON.parse(responseText);
  } catch (parseErr) {
    console.error('[Fiuu OPA] PreCreate non-JSON response:', responseText);
    return {
      success: false,
      error: `Fiuu PreCreate returned HTTP ${response.status}: ${responseText}`,
      raw: responseText,
    };
  }

  // Check Fiuu status code: '00' indicates success
  if (jsonResponse.statusCode === '00') {
    return {
      success: true,
      statusCode: jsonResponse.statusCode,
      molTransactionId: jsonResponse.molTransactionId,
      referenceId: jsonResponse.referenceId,
      amount: jsonResponse.amount,
      imageUrl: jsonResponse.imageUrl || jsonResponse.customImageUrl || jsonResponse.imageUrlBig || '',
      imageUrlSmall: jsonResponse.imageUrlSmall || '',
      qrCode: jsonResponse.authorizationCode || jsonResponse.qrCode || '',
      raw: jsonResponse,
    };
  }

  console.warn('[Fiuu OPA] PreCreate failed:', jsonResponse);
  return {
    success: false,
    statusCode: jsonResponse.statusCode,
    errorCode: jsonResponse.errorCode,
    error: jsonResponse.errorDesc || jsonResponse.error_desc || `Fiuu Error Code: ${jsonResponse.errorCode || jsonResponse.statusCode}`,
    raw: jsonResponse,
  };
}

/**
 * Inquire payment status directly from Fiuu OPA (Active Polling)
 */
export async function callOpaInquiry({ referenceId, molTransactionId = '' }) {
  if (!referenceId) {
    throw new Error('Reference ID is required for Fiuu OPA Inquiry');
  }

  const requestPayload = {
    applicationCode: FIUU_OPA_CONFIG.credentials.applicationCode,
    hashType: FIUU_OPA_CONFIG.hashType,
    referenceId: String(referenceId).trim(),
    version: FIUU_OPA_CONFIG.version,
  };

  if (molTransactionId && String(molTransactionId).trim() !== '') {
    requestPayload.molTransactionId = String(molTransactionId).trim();
  }

  const signature = generateOpaSignature(requestPayload, FIUU_OPA_CONFIG.credentials.secretKey);
  requestPayload.signature = signature;

  const queryParams = new URLSearchParams(requestPayload).toString();
  const inquiryUrl = `${FIUU_OPA_CONFIG.urls.inquiry}?${queryParams}`;

  const response = await fetch(inquiryUrl, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  const responseText = await response.text();
  let jsonResponse;
  try {
    jsonResponse = JSON.parse(responseText);
  } catch (parseErr) {
    return {
      success: false,
      error: `Inquiry returned HTTP ${response.status}: ${responseText}`,
      raw: responseText,
    };
  }

  // statusCode '00' = Paid, '11' = Pending, others = Failed/Cancelled
  const isPaid = jsonResponse.statusCode === '00';
  const isPending = jsonResponse.statusCode === '11' || jsonResponse.statusCode === '22';

  return {
    success: isPaid,
    isPending,
    statusCode: jsonResponse.statusCode,
    molTransactionId: jsonResponse.molTransactionId,
    referenceId: jsonResponse.referenceId,
    amount: jsonResponse.amount,
    channelId: jsonResponse.channelId,
    paidAt: jsonResponse.transactionDateTime,
    raw: jsonResponse,
  };
}

/**
 * Call Fiuu OPA Reversal (Auto-Void) if upstream reservation fails
 */
export async function callOpaReversal({ referenceId, paymentReferenceId }) {
  const requestPayload = {
    applicationCode: FIUU_OPA_CONFIG.credentials.applicationCode,
    hashType: FIUU_OPA_CONFIG.hashType,
    paymentReferenceId: String(paymentReferenceId || referenceId).trim(),
    referenceId: `REV_${String(referenceId).trim()}`.slice(0, 40),
    version: FIUU_OPA_CONFIG.version,
  };

  const signature = generateOpaSignature(requestPayload, FIUU_OPA_CONFIG.credentials.secretKey);
  requestPayload.signature = signature;

  const formBody = new URLSearchParams(requestPayload);

  console.log(`[Fiuu OPA Reversal] Voiding transaction for Ref: ${referenceId}`);

  const response = await fetch(FIUU_OPA_CONFIG.urls.reversal, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: formBody.toString(),
    cache: 'no-store',
  });

  const responseText = await response.text();
  let jsonResponse;
  try {
    jsonResponse = JSON.parse(responseText);
  } catch {
    jsonResponse = { raw: responseText };
  }

  return {
    success: jsonResponse.statusCode === '00',
    statusCode: jsonResponse.statusCode,
    raw: jsonResponse,
  };
}
