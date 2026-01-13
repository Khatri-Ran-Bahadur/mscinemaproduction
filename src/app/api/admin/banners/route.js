/**
 * Banner API Routes
 * GET /api/admin/banners - Get all banners
 * POST /api/admin/banners - Create new banner
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get all banners
export async function GET(request) {
  try {
    const banners = await prisma.banner.findMany({
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
    console.error('Get banners error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch banners', message: error.message },
      { status: 500 }
    );
  }
}

// Create new banner
export async function POST(request) {
  try {
    const body = await request.json();
    const { image, type, movieId, title, description, link, order, isActive } = body;

    if (!image) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    if (type === 'movie' && !movieId) {
      return NextResponse.json(
        { error: 'Movie ID is required when type is "movie"' },
        { status: 400 }
      );
    }

    const banner = await prisma.banner.create({
      data: {
        image,
        type: type || 'normal',
        movieId: type === 'movie' ? parseInt(movieId) : null,
        title: title || null,
        description: description || null,
        link: link || null,
        order: order || 0,
        isActive: isActive !== undefined ? isActive : true,
      }
    });

    return NextResponse.json({
      success: true,
      banner
    });
  } catch (error) {
    console.error('Create banner error:', error);
    return NextResponse.json(
      { error: 'Failed to create banner', message: error.message },
      { status: 500 }
    );
  }
}

