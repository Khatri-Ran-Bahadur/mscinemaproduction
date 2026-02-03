/**
 * Promotions API Routes
 * GET /api/admin/promotions - Get all promotions
 * POST /api/admin/promotions - Create new promotion
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

import { unstable_cache } from 'next/cache';

const getCachedPromotions = unstable_cache(
  async () => {
    return await prisma.promotion.findMany({
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ]
    });
  },
  ['public-promotions'],
  { revalidate: 300, tags: ['promotions'] }
);

// Get all promotions
export async function GET(request) {
  try {
    const promotions = await getCachedPromotions();

    return NextResponse.json({
      success: true,
      promotions
    });
  } catch (error) {
    console.error('Get promotions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch promotions', message: error.message },
      { status: 500 }
    );
  }
}

// Create new promotion
export async function POST(request) {
  try {
    const body = await request.json();
    const { image, title, description, link, order, isActive } = body;

    if (!image) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    const promotion = await prisma.promotion.create({
      data: {
        image,
        title: title || null,
        description: description || null,
        link: link || null,
        order: order || 0,
        isActive: isActive !== undefined ? isActive : true,
      }
    });

    return NextResponse.json({
      success: true,
      promotion
    });
  } catch (error) {
    console.error('Create promotion error:', error);
    return NextResponse.json(
      { error: 'Failed to create promotion', message: error.message },
      { status: 500 }
    );
  }
}
