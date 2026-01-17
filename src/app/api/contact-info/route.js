
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const contactInfos = await prisma.contactInfo.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
    return NextResponse.json(contactInfos);
  } catch (error) {
    console.error('Contact Info API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { type, title, value, icon, order, isActive } = body;

    // Simple validation
    if (!type || !title || !value) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if type exists to update or create
    // upsert requires a unique identifier. type is unique.
    const contactInfo = await prisma.contactInfo.upsert({
      where: { type: type },
      update: {
        title,
        value,
        icon,
        order: parseInt(order || 0),
        isActive: isActive !== undefined ? isActive : true,
      },
      create: {
        type,
        title,
        value,
        icon,
        order: parseInt(order || 0),
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({ success: true, data: contactInfo });
  } catch (error) {
    console.error('Contact Info POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
