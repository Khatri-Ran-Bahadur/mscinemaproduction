
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'All';
    const paymentStatus = searchParams.get('paymentStatus') || 'All';
    const date = searchParams.get('date') || '';
    const skip = (page - 1) * limit;

    const where = {};
    
    if (status !== 'All') {
        where.status = status;
    }

    if (paymentStatus !== 'All') {
        where.paymentStatus = paymentStatus;
    }

    if (date) {
        // Create start and end of the day based on the input date string (YYYY-MM-DD)
        // We want to find records matching the date in Asia/Kuala_Lumpur (UTC+8)
        
        const targetDate = new Date(date); // This parses as UTC midnight: e.g., 2023-01-01T00:00:00.000Z
        
        if (!isNaN(targetDate.getTime())) {
            // KL is UTC+8.
            // 00:00:00 KL = 16:00:00 UTC (Previous Day)
            // So we take the UTC midnight timestamp and subtract 8 hours.
            const startUtc = new Date(targetDate.getTime() - (8 * 60 * 60 * 1000));
            
            // End of day is Start + 24 hours - 1ms
            const endUtc = new Date(startUtc.getTime() + (24 * 60 * 60 * 1000) - 1);
            
            where.createdAt = {
                gte: startUtc,
                lte: endUtc
            };
        }
    }

    if (search) {
        where.OR = [
            { referenceNo: { contains: search, mode: 'insensitive' } },
            { customerName: { contains: search, mode: 'insensitive' } },
            { customerEmail: { contains: search, mode: 'insensitive' } }
        ];
    }

    const [orders, total] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        take: limit,
        skip: skip,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.order.count({ where })
    ]);

    return NextResponse.json({ 
        success: true, 
        orders,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    });
  } catch (error) {
    console.error('Get admin orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

// DELETE endpoint for single or bulk delete
export async function DELETE(request) {
  try {
    const body = await request.json();
    const { ids } = body; // Array of order IDs

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Invalid order IDs' }, { status: 400 });
    }

    // Delete orders
    const result = await prisma.order.deleteMany({
      where: {
        id: {
          in: ids
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: `${result.count} order(s) deleted successfully`,
      count: result.count
    });
  } catch (error) {
    console.error('Delete orders error:', error);
    return NextResponse.json({ error: 'Failed to delete orders' }, { status: 500 });
  }
}
