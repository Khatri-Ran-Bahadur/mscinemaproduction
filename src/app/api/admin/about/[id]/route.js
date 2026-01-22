/**
 * About Content API Routes (Single Section)
 * GET /api/admin/about/[id] - Get single section
 * PUT /api/admin/about/[id] - Update section
 * DELETE /api/admin/about/[id] - Delete section
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get single section
export async function GET(request, { params }) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid section ID' },
        { status: 400 }
      );
    }

    const section = await prisma.aboutContent.findUnique({
      where: { id }
    });

    if (!section) {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      section
    });
  } catch (error) {
    console.error('Get about section error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch section', message: error.message },
      { status: 500 }
    );
  }
}

// Update section
export async function PUT(request, { params }) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    const body = await request.json();

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid section ID' },
        { status: 400 }
      );
    }

    const { section, title, content, image, order, isActive } = body;

    const updateData = {};
    if (section !== undefined) updateData.section = section;
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (image !== undefined) updateData.image = image;
    if (order !== undefined) updateData.order = order;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedSection = await prisma.aboutContent.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      section: updatedSection
    });
  } catch (error) {
    console.error('Update about section error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update section', message: error.message },
      { status: 500 }
    );
  }
}

// Delete section
export async function DELETE(request, { params }) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid section ID' },
        { status: 400 }
      );
    }

    await prisma.aboutContent.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Section deleted successfully'
    });
  } catch (error) {
    console.error('Delete about section error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to delete section', message: error.message },
      { status: 500 }
    );
  }
}

