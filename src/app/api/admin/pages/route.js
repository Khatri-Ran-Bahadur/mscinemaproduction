import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const pages = await prisma.page.findMany({
      orderBy: { updatedAt: 'desc' }
    });
    return NextResponse.json({ success: true, pages });
  } catch (error) {
    console.error('Get pages error:', error);
    return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { slug, title, content, isActive } = body;

    // Simple validation
    if (!slug || !title) {
        return NextResponse.json({ error: 'Slug and Title are required' }, { status: 400 });
    }

    // Check if slug exists
    const existing = await prisma.page.findUnique({ where: { slug } });
    if (existing) {
        return NextResponse.json({ error: 'Slug already in use' }, { status: 400 });
    }

    const page = await prisma.page.create({
      data: {
        slug,
        title,
        content: content || '',
        isActive: isActive !== undefined ? isActive : true
      }
    });

    return NextResponse.json({ success: true, page });
  } catch (error) {
    console.error('Create page error:', error);
    return NextResponse.json({ error: 'Failed to create page' }, { status: 500 });
  }
}
