
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Update experience
export async function PUT(request, { params }) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const { image, fallbackImage, title, description, order, isActive } = body;

    const experience = await prisma.experience.update({
      where: { id },
      data: {
        image,
        fallbackImage: fallbackImage || null,
        title,
        description,
        order: order !== undefined ? parseInt(order) : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      }
    });

    return NextResponse.json({
      success: true,
      experience
    });
  } catch (error) {
    console.error('Update experience error:', error);
    return NextResponse.json(
      { error: 'Failed to update experience', message: error.message },
      { status: 500 }
    );
  }
}

// Delete experience
export async function DELETE(request, { params }) {
  try {
    const id = parseInt(params.id);

    await prisma.experience.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Experience deleted successfully'
    });
  } catch (error) {
    console.error('Delete experience error:', error);
    return NextResponse.json(
      { error: 'Failed to delete experience', message: error.message },
      { status: 500 }
    );
  }
}
