import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const date = new Date();
  
  // Use Intl.DateTimeFormat to get the time in the configured timezone explicitly if needed,
  // but new Date().toString() should reflect the process.env.TZ if Node respects it.
  // However, Node doesn't always automatically use TZ env var for Date.toString() immediately without specific setup or on some systems.
  // Better to use toLocaleString with the timeZone option to be completely sure what we are sending.
  
  // We want to check if the system timezone (TZ env var) is correctly applying to Date operations.
  // If TZ is working, new Date().toString() should show GMT+8 (Malaysia Standard Time).
  
  const malaysiaTime = date.toString(); // Should reflect process.env.TZ

  return NextResponse.json({
    serverTime: date.toString(),
    malaysiaTime: malaysiaTime,
    timezoneOffset: date.getTimezoneOffset(),
    timezoneEnv: process.env.TZ || 'Not Set',
    dateISO: date.toISOString()
  });
}
