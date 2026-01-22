/**
 * Experiences API Routes
 * GET /api/admin/experiences - Get all experiences
 * POST /api/admin/experiences - Create new experience
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get all experiences
export async function GET(request) {
  try {
    const experiences = await prisma.experience.findMany({
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({
      success: true,
      experiences
    });
  } catch (error) {
    console.error('Get experiences error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch experiences', message: error.message },
      { status: 500 }
    );
  }
}

// Create new experience
export async function POST(request) {
  try {
    const body = await request.json();
    const { image, fallbackImage, title, description, order, isActive } = body;

    if (!image) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }
    
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and Description are required' },
        { status: 400 }
      );
    }

    const experience = await prisma.experience.create({
      data: {
        image,
        fallbackImage: fallbackImage || null,
        title,
        description,
        order: order || 0,
        isActive: isActive !== undefined ? isActive : true,
      }
    });

    return NextResponse.json({
      success: true,
      experience
    });
  } catch (error) {
    console.error('Create experience error:', error);
    return NextResponse.json(
      { error: 'Failed to create experience', message: error.message },
      { status: 500 }
    );
  }
}
