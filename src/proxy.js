import { NextResponse } from 'next/server';

/**
 * Next.js Middleware
 * Used for API protection and session management
 */
export function proxy(request) {
  const { pathname } = request.nextUrl;

  // Protect all API routes
  if (pathname.startsWith('/api')) {
    // 1. Skip protection for login and notification routes (public)
    const publicApiRoutes = [
      '/api/admin/login',
      '/api/payment/notify',
      '/api/payment/verify',
      '/api/molpay_notify',
      '/api/auth/token', // This is used to get public tokens
    ];

    if (publicApiRoutes.some(route => pathname === route || pathname.startsWith(route))) {
      return NextResponse.next();
    }

    // 2. Protect Internal APIs (Orders & Create Request) with API Key
    const internalApiRoutes = [
      '/api/orders',
      '/api/payment/create-request'
    ];

    if (internalApiRoutes.some(route => pathname.startsWith(route))) {
      const apiKey = request.headers.get('x-api-key');
      const secretKey = process.env.API_SECRET_KEY;

      if (!apiKey || apiKey !== secretKey) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Invalid or missing API Key' },
          { status: 401 }
        );
      }
      return NextResponse.next();
    }

    // 3. Admin APIs Protection
    if (pathname.startsWith('/api/admin')) {
      // Allow all GET requests to admin APIs to be public (Promotions, Experiences, etc.)
      if (request.method === 'GET') {
        return NextResponse.next();
      }

      // Protect POST, PUT, DELETE for Admin APIs
      const authHeader = request.headers.get('authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Authentication required' },
          { status: 401 }
        );
      }
      
      const token = authHeader.split(' ')[1];
      try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const [adminId, timestamp] = decoded.split(':');
        
        if (!adminId || isNaN(parseInt(timestamp))) {
          throw new Error('Invalid token format');
        }

        const twentyFourHours = 24 * 60 * 60 * 1000;
        if (Date.now() - parseInt(timestamp) > twentyFourHours) {
          return NextResponse.json(
            { error: 'Unauthorized', message: 'Session expired' },
            { status: 401 }
          );
        }
      } catch (e) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Invalid session token' },
          { status: 401 }
        );
      }
    }
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: '/api/:path*',
};

export default proxy;
