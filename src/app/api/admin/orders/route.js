
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
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const buyFrom = searchParams.get('buyFrom') || 'All';
    const skip = (page - 1) * limit;

    const where = {};
    
    if (status !== 'All') {
        where.status = status;
    }

    if (paymentStatus !== 'All') {
        where.paymentStatus = paymentStatus;
    }

    if (buyFrom !== 'All') {
        where.buy_from = buyFrom;
    }

    // Date Filtering Logic
    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
            const sDate = new Date(startDate);
            if (!isNaN(sDate.getTime())) {
                // Start of startDate (KL time 00:00:00 = UTC-8)
                const startUtc = new Date(sDate.getTime() - (8 * 60 * 60 * 1000));
                where.createdAt.gte = startUtc;
            }
        }
        if (endDate) {
            const eDate = new Date(endDate);
            if (!isNaN(eDate.getTime())) {
                // End of endDate (KL time 23:59:59 = UTC-8 + 24h - 1ms)
                const startOfEndDayUtc = new Date(eDate.getTime() - (8 * 60 * 60 * 1000));
                const endUtc = new Date(startOfEndDayUtc.getTime() + (24 * 60 * 60 * 1000) - 1);
                where.createdAt.lte = endUtc;
            }
        }
    }

    if (search) {
        where.OR = [
            { orderId: { contains: search, mode: 'insensitive' } },
            { referenceNo: { contains: search, mode: 'insensitive' } },
            { customerName: { contains: search, mode: 'insensitive' } },
            { customerEmail: { contains: search, mode: 'insensitive' } }
        ];
    }

    // Generate two additional totals: Paid and non-Paid (for the current search/date filter)
    const baseWhere = { ...where };
    delete baseWhere.paymentStatus; // Remove payment filter for the comparison totals

    const [orders, total, totalStats, paidStats, failedStats] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        take: limit,
        skip: skip,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.order.count({ where }),
      prisma.order.aggregate({
        where,
        _sum: { totalAmount: true }
      }),
      prisma.order.aggregate({
        where: { ...baseWhere, paymentStatus: 'PAID' },
        _sum: { totalAmount: true }
      }),
      prisma.order.aggregate({
        where: { ...baseWhere, paymentStatus: { not: 'PAID' } },
        _sum: { totalAmount: true }
      })
    ]);

    return NextResponse.json({ 
        success: true, 
        orders,
        totalAmountSum: totalStats._sum.totalAmount || 0,
        paidAmountSum: paidStats._sum.totalAmount || 0,
        unpaidAmountSum: failedStats._sum.totalAmount || 0,
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
