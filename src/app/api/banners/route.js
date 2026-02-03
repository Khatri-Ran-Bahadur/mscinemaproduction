/**
 * Public Banner API (for homepage)
 * GET /api/banners - Get active banners for display
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';

const getCachedBanners = unstable_cache(
  async () => {
    const now = new Date();
    return await prisma.banner.findMany({
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
  },
  ['public-banners'],
  { revalidate: 300, tags: ['banners'] }
);

export async function GET(request) {
  try {
    const banners = await getCachedBanners();

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

