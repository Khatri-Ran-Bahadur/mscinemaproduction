import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Fetch main content
    const mainContent = await prisma.aboutContent.findUnique({
      where: { section: 'main' }
    });

    // Fetch contact info
    const contactInfos = await prisma.contactInfo.findMany({
      where: {
        type: { in: ['email', 'phone', 'address'] }
      }
    });

    const contactMap = contactInfos.reduce((acc, curr) => {
      acc[curr.type] = curr.value;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
        title: mainContent?.title || '',
        description: mainContent?.content || '',
        image: mainContent?.image || '',
        email: contactMap.email || '',
        phone: contactMap.phone || '',
        address: contactMap.address || ''
      }
    });

  } catch (error) {
    console.error('Error fetching general about data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { title, description, image, email, phone, address } = body;

    // 1. Upsert Main Content
    await prisma.aboutContent.upsert({
      where: { section: 'main' },
      update: {
        title,
        content: description,
        image,
        isActive: true
      },
      create: {
        section: 'main',
        title,
        content: description,
        image,
        isActive: true,
        order: 1
      }
    });

    // 2. Upsert Contact Info
    const updates = [
      { type: 'email', title: 'Email', value: email, icon: 'Mail' },
      { type: 'phone', title: 'Phone', value: phone, icon: 'Phone' },
      { type: 'address', title: 'Address', value: address, icon: 'MapPin' }
    ];

    for (const item of updates) {
      if (item.value) {
        await prisma.contactInfo.upsert({
          where: { type: item.type },
          update: {
            value: item.value,
            title: item.title,
            isActive: true
          },
          create: {
            type: item.type,
            value: item.value,
            title: item.title,
            icon: item.icon,
            isActive: true
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'About page updated successfully'
    });

  } catch (error) {
    console.error('Error updating general about data:', error);
    return NextResponse.json(
      { error: 'Failed to update data', details: error.message },
      { status: 500 }
    );
  }
}
