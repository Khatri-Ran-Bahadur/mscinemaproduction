/**
 * API Route: Save Payment Log
 * Saves payment success/failure data to JSON files in public/payment-logs/
 * For testing purposes only - will be removed later
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    const body = await request.json();
    const { orderId, status, data } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Create payment-logs directory in public folder if it doesn't exist
    const publicDir = path.join(process.cwd(), 'public');
    const logsDir = path.join(publicDir, 'payment-logs');
    
    // Ensure directory exists
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Create filename: {orderId}-{status}.json
    const filename = `${orderId}-${status || 'unknown'}.json`;
    const filePath = path.join(logsDir, filename);

    // Prepare log data
    const logData = {
      orderId,
      status: status || 'unknown',
      timestamp: new Date().toISOString(),
      data: data || {},
    };

    // Write to file
    fs.writeFileSync(filePath, JSON.stringify(logData, null, 2), 'utf8');

    console.log(`[Payment Log] Saved payment log: ${filename}`);

    return NextResponse.json({
      success: true,
      message: 'Payment log saved',
      filename,
    });
  } catch (error) {
    console.error('[Payment Log] Error saving payment log:', error);
    return NextResponse.json(
      { error: 'Failed to save payment log', message: error.message },
      { status: 500 }
    );
  }
}

