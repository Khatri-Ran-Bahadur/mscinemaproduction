
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Update promotion
export async function PUT(request, { params }) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    const body = await request.json();
    const { image, title, description, link, order, isActive } = body;

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid promotion ID' },
        { status: 400 }
      );
    }

    const promotion = await prisma.promotion.update({
      where: { id },
      data: {
        image,
        title: title || null,
        description: description || null,
        link: link || null,
        order: order !== undefined ? parseInt(order) : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      }
    });

    return NextResponse.json({
      success: true,
      promotion
    });
  } catch (error) {
    console.error('Update promotion error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Promotion not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update promotion', message: error.message },
      { status: 500 }
    );
  }
}

// Delete promotion
export async function DELETE(request, { params }) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid promotion ID' },
        { status: 400 }
      );
    }

    await prisma.promotion.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Promotion deleted successfully'
    });
  } catch (error) {
    console.error('Delete promotion error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Promotion not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to delete promotion', message: error.message },
      { status: 500 }
    );
  }
}
