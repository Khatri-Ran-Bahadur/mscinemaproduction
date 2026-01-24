
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request, { params }) {
  try {
    const paramsData = await params;
    const id = parseInt(paramsData.id);

    if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    // Check if we need to parse body
    const { status } = await request.json();

    if (!['PAID', 'PENDING', 'FAILED', 'CANCELLED'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const order = await prisma.order.update({
        where: { id: id },
        data: { paymentStatus: status }
    });
    
    return NextResponse.json({ success: true, order });

  } catch (error) {
    console.error('Update Status Error:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
