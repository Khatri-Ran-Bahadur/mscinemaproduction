import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const id = parseInt(params.id);
    const page = await prisma.page.findUnique({ where: { id } });
    if (!page) {
        return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, page });
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching page' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const { slug, title, content, isActive } = body;

    const page = await prisma.page.update({
      where: { id },
      data: {
        slug: slug || undefined,
        title: title || undefined,
        content: content || undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      }
    });

    return NextResponse.json({ success: true, page });
  } catch (error) {
    console.error('Update page error:', error);
    return NextResponse.json({ error: 'Failed to update page' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const id = parseInt(params.id);
    await prisma.page.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete page' }, { status: 500 });
  }
}
