
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const now = new Date();
    
    // Start of Today (00:00:00)
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    // Start of Week (Sunday)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Start of Month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch orders from last 30 days for chart + stats
    // We only count 'PAID' orders as real sales
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 29);
    thirtyDaysAgo.setHours(0,0,0,0);

    const orders = await prisma.order.findMany({
      where: {
        paymentStatus: 'PAID',
        createdAt: { gte: thirtyDaysAgo }
      },
      select: {
        createdAt: true,
        totalAmount: true,
        seats: true,
        id: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // Helper functions
    const sumAmount = (ords) => ords.reduce((acc, o) => acc + Number(o.totalAmount), 0);
    const countSeats = (ords) => ords.reduce((acc, o) => {
        try {
            // seats can be JSON string '["A1","A2"]' or plain string 'A1, A2'
            if (o.seats.startsWith('[') || o.seats.startsWith('{')) {
               const s = JSON.parse(o.seats);
               if (Array.isArray(s)) return acc + s.length;
               if (typeof s === 'object') return acc + Object.values(s).reduce((a,b)=>a+Number(b),0);
            }
            return acc + (o.seats.split(',').length);
        } catch { 
            return acc + 1; // Fallback
        }
    }, 0);

    // Filtering
    const todayOrders = orders.filter(o => new Date(o.createdAt) >= startOfDay);
    const weekOrders = orders.filter(o => new Date(o.createdAt) >= startOfWeek);
    const monthOrders = orders.filter(o => new Date(o.createdAt) >= startOfMonth);

    // Structure Response
    const stats = {
      today: {
        sales: sumAmount(todayOrders),
        orders: todayOrders.length,
        tickets: countSeats(todayOrders)
      },
      week: {
        sales: sumAmount(weekOrders),
        orders: weekOrders.length,
        tickets: countSeats(weekOrders)
      },
      month: {
        sales: sumAmount(monthOrders),
        orders: monthOrders.length,
        tickets: countSeats(monthOrders)
      },
      chart: []
    };

    // Calculate Chart Data (Daily Sales for last 30 days)
    const salesMap = {};
    orders.forEach(o => {
      // Use local date string for aggregation bucket
      // Note: This relies on server timezone. To be precise, fetch User timezone or stick to UTC.
      // Using ISO string date part is UTC.
      const d = new Date(o.createdAt);
      // Adjust to local manual aggregation? Let's use ISO date component (UTC based) for consistency
      const dateKey = d.toISOString().split('T')[0];
      salesMap[dateKey] = (salesMap[dateKey] || 0) + Number(o.totalAmount);
    });

    // Fill zeros for missing days
    for (let i = 29; i >= 0; i--) {
       const d = new Date(now);
       d.setDate(now.getDate() - i);
       const dateKey = d.toISOString().split('T')[0];
       // Format for display (e.g., "Jan 24" or "24/01")
       const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
       
       stats.chart.push({
         date: dateKey,
         label: displayDate,
         amount: salesMap[dateKey] || 0
       });
    }

    return NextResponse.json({ success: true, stats });

  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
