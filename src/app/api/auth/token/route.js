
import { NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';

export async function POST(request) {
  try {
    const { 
      API_BASE_URL, 
      GUEST_CREDENTIALS 
    } = API_CONFIG;

    console.log('[Auth Token] Requesting public token from upstream API...');

    // Call upstream API with credentials (server-side only)
    const response = await fetch(`${API_BASE_URL}/APIUser/GetToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(GUEST_CREDENTIALS),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Auth Token] Upstream error:', response.status, errorText);
      return NextResponse.json(
        { error: `Upstream API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Auth Token] Internal server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
