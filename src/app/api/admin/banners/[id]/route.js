/**
 * Banner API Routes (Single Banner)
 * GET /api/admin/banners/[id] - Get single banner
 * PUT /api/admin/banners/[id] - Update banner
 * DELETE /api/admin/banners/[id] - Delete banner
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get single banner
export async function GET(request, { params }) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid banner ID' },
        { status: 400 }
      );
    }

    const banner = await prisma.banner.findUnique({
      where: { id }
    });

    if (!banner) {
      return NextResponse.json(
        { error: 'Banner not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      banner
    });
  } catch (error) {
    console.error('Get banner error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch banner', message: error.message },
      { status: 500 }
    );
  }
}

// Update banner
export async function PUT(request, { params }) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    const body = await request.json();

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid banner ID' },
        { status: 400 }
      );
    }

    const { image, type, movieId, title, description, link, order, isActive } = body;

    // Validate movie ID if type is movie
    if (type === 'movie' && !movieId) {
      return NextResponse.json(
        { error: 'Movie ID is required when type is "movie"' },
        { status: 400 }
      );
    }

    const updateData = {};
    if (image !== undefined) updateData.image = image;
    if (type !== undefined) updateData.type = type;
    if (movieId !== undefined) updateData.movieId = type === 'movie' ? parseInt(movieId) : null;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (link !== undefined) updateData.link = link;
    if (order !== undefined) updateData.order = order;
    if (isActive !== undefined) updateData.isActive = isActive;

    const banner = await prisma.banner.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      banner
    });
  } catch (error) {
    console.error('Update banner error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Banner not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update banner', message: error.message },
      { status: 500 }
    );
  }
}

// Delete banner
export async function DELETE(request, { params }) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid banner ID' },
        { status: 400 }
      );
    }

    await prisma.banner.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Banner deleted successfully'
    });
  } catch (error) {
    console.error('Delete banner error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Banner not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to delete banner', message: error.message },
      { status: 500 }
    );
  }
}

