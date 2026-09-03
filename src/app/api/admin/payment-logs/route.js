import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || '';
        const paymentStatus = searchParams.get('paymentStatus') || ''; // success/failed
        const source = searchParams.get('source') || 'All'; // All / kiosk / online
        const channel = searchParams.get('channel') || 'All';
        const method = searchParams.get('method') || 'All';
        const startDate = searchParams.get('startDate') || '';
        const endDate = searchParams.get('endDate') || '';

        const skip = (page - 1) * limit;

        const where = {};

        if (search) {
            where.OR = [
                { orderId: { contains: search, mode: 'insensitive' } },
                { referenceNo: { contains: search, mode: 'insensitive' } },
                { transactionNo: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (status && status !== 'All') {
            where.status = status;
        }

        if (paymentStatus === 'success') {
            where.isSuccess = true;
        } else if (paymentStatus === 'failed') {
            where.isSuccess = false;
        }

        // Source Filter (Kiosk vs Online)
        if (source === 'kiosk') {
            where.OR = [
                ...(where.OR || []),
                { channel: { contains: 'KIOSK', mode: 'insensitive' } },
                { method: { contains: 'KIOSK', mode: 'insensitive' } },
                { channel: { contains: 'OPA', mode: 'insensitive' } },
                { channel: { contains: 'CARDBIZ', mode: 'insensitive' } },
            ];
        } else if (source === 'online') {
            where.AND = [
                { NOT: { channel: { contains: 'KIOSK', mode: 'insensitive' } } },
                { NOT: { method: { contains: 'KIOSK', mode: 'insensitive' } } },
                { NOT: { channel: { contains: 'OPA', mode: 'insensitive' } } },
                { NOT: { channel: { contains: 'CARDBIZ', mode: 'insensitive' } } },
            ];
        }

        if (channel && channel !== 'All') {
            where.channel = { contains: channel, mode: 'insensitive' };
        }

        if (method && method !== 'All') {
            where.method = { contains: method, mode: 'insensitive' };
        }

        // Date Range Filter
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                const sDate = new Date(startDate);
                if (!isNaN(sDate.getTime())) {
                    const startUtc = new Date(sDate.getTime() - (8 * 60 * 60 * 1000));
                    where.createdAt.gte = startUtc;
                }
            }
            if (endDate) {
                const eDate = new Date(endDate);
                if (!isNaN(eDate.getTime())) {
                    const startOfEndDayUtc = new Date(eDate.getTime() - (8 * 60 * 60 * 1000));
                    const endUtc = new Date(startOfEndDayUtc.getTime() + (24 * 60 * 60 * 1000) - 1);
                    where.createdAt.lte = endUtc;
                }
            }
        }

        const [total, logs] = await Promise.all([
            prisma.paymentLog.count({ where }),
            prisma.paymentLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
        ]);

        return NextResponse.json({
            success: true,
            data: logs,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching payment logs:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch logs' }, { status: 500 });
    }
}
