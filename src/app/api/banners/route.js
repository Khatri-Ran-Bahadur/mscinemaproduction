/**
 * Public Banner API (for homepage)
 * GET /api/banners - Get active banners for display
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const now = new Date();
    const banners = await prisma.banner.findMany({
      where: {
        isActive: true,
        AND: [
          {
            OR: [
              { startDate: null },
              { startDate: { lte: now } }
            ]
          },
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } }
            ]
          }
        ]
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({
      success: true,
      banners
    });
  } catch (error) {
    console.error('Get public banners error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch banners', message: error.message },
      { status: 500 }
    );
  }
}

