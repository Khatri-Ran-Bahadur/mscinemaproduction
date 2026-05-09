import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file in the root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
    console.log('--- Order Query Tester ---');
    
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    console.log('Current Time:', now.toISOString());
    console.log('Cutoff Time (24h ago):', twentyFourHoursAgo.toISOString());
    console.log('---------------------------');

    try {
        // 1. Run the specific query the user requested
        console.log('Running query for PAID, email NOT sent, last 24h...');
        const orders = await prisma.order.findMany({
            where: {
                paymentStatus: 'PAID',
                isSendMail: false,
                createdAt: {
                    gte: twentyFourHoursAgo
                }
            },
            take: 5 
        });

        console.log(`Results found: ${orders.length}`);
        
        if (orders.length > 0) {
            orders.forEach((order, index) => {
                console.log(`\n[Order ${index + 1}]`);
                console.log(`ID: ${order.id}`);
                console.log(`Reference: ${order.referenceNo}`);
                console.log(`Payment Status: ${order.paymentStatus}`);
                console.log(`Is Email Sent: ${order.isSendMail}`);
                console.log(`Created At: ${order.createdAt.toISOString()}`);
                console.log(`Customer: ${order.customerName} (${order.customerEmail})`);
            });
        } else {
            console.log('\nNo matching orders found for the 24h criteria.');
            
            console.log('\n--- Debugging Data ---');
            const latestPaid = await prisma.order.findMany({
                where: { paymentStatus: 'PAID' },
                orderBy: { createdAt: 'desc' },
                take: 3
            });
            
            if (latestPaid.length > 0) {
                console.log('Latest PAID orders in DB (ignoring time/email status):');
                latestPaid.forEach((order, i) => {
                    console.log(`${i+1}. Ref: ${order.referenceNo}, Created: ${order.createdAt.toISOString()}, EmailSent: ${order.isSendMail}`);
                });
            } else {
                console.log('No PAID orders found at all in the database.');
            }

            const countPaidNotSent = await prisma.order.count({ 
                where: { 
                    paymentStatus: 'PAID', 
                    isSendMail: false 
                } 
            });
            console.log(`\nTotal PAID and unsent (any time): ${countPaidNotSent}`);
            
            if (countPaidNotSent > 0) {
                const sampleUnsent = await prisma.order.findFirst({
                    where: { paymentStatus: 'PAID', isSendMail: false },
                    orderBy: { createdAt: 'desc' }
                });
                console.log(`Latest unsent PAID order was created at: ${sampleUnsent.createdAt.toISOString()}`);
                console.log(`To test your cron, you could update this order's createdAt to now:`);
                console.log(`await prisma.order.update({ where: { id: ${sampleUnsent.id} }, data: { createdAt: new Date() } });`);
            }
        }
    } catch (error) {
        console.error('Error occurred during testing:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
