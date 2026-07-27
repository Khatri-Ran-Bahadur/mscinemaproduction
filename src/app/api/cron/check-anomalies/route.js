import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { queryPaymentStatus } from '@/utils/molpay';
import { sendEmail } from '@/utils/email';

export async function GET(request) {
    try {
        // Find orders cancelled in the last 24 hours
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        const cancelledOrders = await prisma.order.findMany({
            where: {
                status: 'CANCELLED',
                createdAt: {
                    gte: twentyFourHoursAgo
                },
                // Skip checking if it's already marked as an anomaly
                paymentStatus: {
                    not: 'PAID_BUT_RELEASED'
                }
            },
            take: 50 // Limit to avoid hitting rate limits
        });

        const anomalies = [];

        for (const order of cancelledOrders) {
            let isPaidInGateway = false;
            let tranNo = order.transactionNo;

            // 1. Check current orderId with Fiuu Gateway
            if (order.orderId && order.totalAmount) {
                const fiuuStatus = await queryPaymentStatus(order.orderId, order.totalAmount.toString());
                if (fiuuStatus && fiuuStatus.status === '00') {
                    isPaidInGateway = true;
                    tranNo = fiuuStatus.tranID || tranNo;
                }
            }

            // 2. If current orderId didn't return PAID, check PaymentLog for any paid attempt under referenceNo
            if (!isPaidInGateway && order.referenceNo) {
                const paidLog = await prisma.paymentLog.findFirst({
                    where: {
                        referenceNo: order.referenceNo,
                        isSuccess: true,
                    },
                    orderBy: { createdAt: 'desc' },
                });

                if (paidLog) {
                    isPaidInGateway = true;
                    tranNo = paidLog.transactionNo || tranNo;
                }
            }

            // If Fiuu or PaymentLog says PAID, we found an anomaly!
            if (isPaidInGateway) {
                // Mark it in DB
                await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        paymentStatus: 'PAID_BUT_RELEASED',
                        transactionNo: tranNo,
                    }
                });

                anomalies.push({
                    orderId: order.orderId,
                    referenceNo: order.referenceNo,
                    customerName: order.customerName,
                    phone: order.customerPhone,
                    amount: order.totalAmount,
                    transactionNo: tranNo
                });

                console.log(`[ANOMALY DETECTED] Order ${order.orderId} (Ref: ${order.referenceNo}) was paid on Fiuu but is cancelled locally.`);
            }
        }

        // Alert Admin if anomalies were found
        if (anomalies.length > 0) {
            const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
            
            if (adminEmail) {
                const htmlContent = `
                    <h2>Payment Anomaly Detected</h2>
                    <p>The following orders were marked as CANCELLED and their seats released, but Fiuu reports them as PAID (Status 00). Immediate manual intervention (refund or re-booking) is required.</p>
                    <table border="1" cellpadding="5" style="border-collapse: collapse;">
                        <tr>
                            <th>Order ID</th>
                            <th>Reference No</th>
                            <th>Customer</th>
                            <th>Phone</th>
                            <th>Amount</th>
                            <th>Transaction No</th>
                        </tr>
                        ${anomalies.map(a => `
                            <tr>
                                <td>${a.orderId}</td>
                                <td>${a.referenceNo}</td>
                                <td>${a.customerName || 'N/A'}</td>
                                <td>${a.phone || 'N/A'}</td>
                                <td>RM ${Number(a.amount).toFixed(2)}</td>
                                <td>${a.transactionNo || 'N/A'}</td>
                            </tr>
                        `).join('')}
                    </table>
                `;

                await sendEmail({
                    to: adminEmail,
                    subject: `[CRITICAL] ${anomalies.length} Payment Anomalies Detected`,
                    html: htmlContent
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: `Checked ${cancelledOrders.length} cancelled orders. Found ${anomalies.length} anomalies.`,
            anomalies
        });

    } catch (error) {
        console.error('[Check Anomalies Cron Error]', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
