/**
 * About Page Content API Routes
 * GET /api/admin/about - Get all about content sections
 * POST /api/admin/about - Create new about content section
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get all about content sections
export async function GET(request) {
  try {
    const sections = await prisma.aboutContent.findMany({
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({
      success: true,
      sections
    });
  } catch (error) {
    console.error('Get about content error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch about content', message: error.message },
      { status: 500 }
    );
  }
}

// Create new about content section
export async function POST(request) {
  try {
    const body = await request.json();
    const { section, title, content, image, order, isActive } = body;

    if (!section) {
      return NextResponse.json(
        { error: 'Section name is required' },
        { status: 400 }
      );
    }

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Check if section already exists
    const existing = await prisma.aboutContent.findUnique({
      where: { section }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Section already exists. Use PUT to update.' },
        { status: 400 }
      );
    }

    const aboutContent = await prisma.aboutContent.create({
      data: {
        section,
        title: title || null,
        content,
        image: image || null,
        order: order || 0,
        isActive: isActive !== undefined ? isActive : true,
      }
    });

    return NextResponse.json({
      success: true,
      section: aboutContent
    });
  } catch (error) {
    console.error('Create about content error:', error);
    return NextResponse.json(
      { error: 'Failed to create about content', message: error.message },
      { status: 500 }
    );
  }
}

