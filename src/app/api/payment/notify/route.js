/**
 * API Route: Payment Notification Handler (Server-to-Server)
 * This endpoint receives payment notifications from Razer Merchant Services (MOLPay)
 * Documentation: https://github.com/RazerMS/SDK-RazerMS_Node_JS/wiki/Installation-Guidance
 */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { API_BASE_URL } from '@/config/api';
import { prisma } from '@/lib/prisma';

import { callReserveBooking, callCancelBooking, writeMolpayLog } from '@/utils/molpay';
import { sendAdminBookingFailureAlert, sendTicketEmail } from '@/utils/email';
import { withLock } from '@/utils/mutex';

// Razer Merchant Services Configuration from environment variables
const RMS_CONFIG = {
  merchantId: process.env.FIUU_MERCHANT_ID || '',
  verifyKey: process.env.FIUU_VERIFY_KEY || '',
  secretKey: process.env.FIUU_SECRET_KEY || '',
};

/**
 * NOTE: This notify route does NOT call ReserveBooking or CancelBooking APIs
 * Those booking operations are handled exclusively by the molpay_return route
 * This route only:
 * - Verifies payment signature
 * - Updates order status in database
 * - Sends confirmation emails
 * - Returns RECEIVEOK to acknowledge receipt
 */

/**
 * Verify payment notification signature (skey)
 * According to official documentation:
 * key0 = md5(tranID + orderid + status + domain + amount + currency)
 * key1 = md5(paydate + domain + key0 + appcode + vkey)
 * skey should equal key1
 */
function verifyNotificationSignature(data) {
  try {
    const {
      tranID,
      orderid,
      status,
      domain,
      amount,
      currency,
      paydate,
      appcode,
      skey
    } = data;

    // All required fields must be present (appcode can be empty string for some channels)
    if (!tranID || !orderid || status === undefined || !domain || !amount || !currency || !paydate || appcode === undefined || skey === undefined) {
      console.error('Missing required fields for signature verification:', { tranID, orderid, status, domain, amount, currency, paydate, appcode, skey });
      return false;
    }

    // Step 1: Calculate key0 = md5(tranID + orderid + status + domain + amount + currency)
    const key0String = `${tranID}${orderid}${status}${domain}${amount}${currency}`;
    const key0 = crypto.createHash('md5').update(key0String, 'utf8').digest('hex');

    // Step 2: Calculate key1 = md5(paydate + domain + key0 + appcode + vkey)
    const safeAppcode = appcode || '';
    const key1String = `${paydate}${domain}${key0}${safeAppcode}${RMS_CONFIG.verifyKey}`;
    const key1 = crypto.createHash('md5').update(key1String, 'utf8').digest('hex');

    // Step 3: Compare skey with key1
    const isValid = skey.toLowerCase() === key1.toLowerCase();

    if (!isValid) {
      console.error('Invalid signature. Expected:', key1, 'Received:', skey);
    }

    return isValid;
  } catch (error) {
    console.error('Error verifying notification signature:', error);
    return false;
  }
}

/**
 * Handle POST request from Fiuu payment gateway (server-to-server notification)
 */
export async function POST(request) {
  try {
    let rawBody = "";
    try {
      rawBody = await request.clone().text();
    } catch (e) {
      // ignore
    }

    let notificationData = {};
    
    try {
      const formData = await request.formData();
      for (const [key, value] of formData.entries()) {
        notificationData[key] = value;
      }
    } catch (e) {
      // Fallback: Try reading as plain text (x-www-form-urlencoded) if formData fails
      const params = new URLSearchParams(rawBody);
      for (const [key, value] of params.entries()) {
        notificationData[key] = value;
      }
    }

    const orderid = notificationData.orderid || `unknown_${Date.now()}`;
    // Always log the raw request and parsed data for debugging
    writeMolpayLog(orderid, 'NOTIFY_RAW_REQUEST', {
      method: request.method,
      url: request.url,
      rawBody: rawBody,
      parsedData: notificationData,
      headers: Object.fromEntries(request.headers.entries())
    });

    console.log('[Payment Notify] Received notification:', notificationData);

    // Extract payment data (per official documentation)
    const {
      amount,
      tranID,
      domain,
      status,
      appcode,
      paydate,
      currency,
      skey,
      error_code,
      error_desc,
      channel
    } = notificationData;

    // Verify signature using official MD5 formula
    const isValidSignature = verifyNotificationSignature(notificationData);
    
    if (!isValidSignature) {
      console.error('[Payment Notify] Invalid signature - setting status to -1');
      // Invalid transaction - set status to -1 as per documentation
      // Merchant might issue a requery to RazerMS to double check payment status
      return NextResponse.json(
        { status: 'INVALID_SIGNATURE', message: 'Invalid transaction signature' },
        { status: 400 }
      );
    }

    console.log('[Payment Notify] Signature verified successfully');

    // Process payment notification based on status
    // Status '00' means success (per official documentation)
    if (status === '00') {
      // Payment successful - update booking status
      console.log(`[Payment Notify] Payment successful - Order: ${orderid}, Transaction: ${tranID}, Amount: ${amount}, Channel: ${channel}`);
      
      // Payment successful - update booking status
      console.log(`[Payment Notify] Payment successful - Order: ${orderid}, Transaction: ${tranID}, Amount: ${amount}, Channel: ${channel}`);
     
      try {
        // 1. Find Order in DB
        // Try exact match by orderId first
        let order = await prisma.order.findUnique({
            where: { orderId: orderid }
        });

        // Fallback: If not found, try finding by referenceNo 
        // We extract referenceNo from orderid (format: {ref}_{ts}_{rand}) or use returned referenceNo
        if (!order) {
            const refFromOrder = orderid.split('_')[0];
            const targetRef = notificationData.referenceNo || refFromOrder;
            
            if (targetRef) {
                console.log(`[Payment Notify] Order ID ${orderid} not found. Falling back to Reference No: ${targetRef}`);
                order = await prisma.order.findUnique({
                    where: { referenceNo: targetRef },
                });

                if (order) {
                    if (order.paymentStatus !== 'PAID') {
                        order = await prisma.order.update({
                            where: { id: order.id },
                            data: { orderId: orderid }
                        });
                    } else {
                        console.warn(`[Notify] Ignoring callback for old OrderID: ${orderid}. Current DB OrderID ${order.orderId} is already PAID.`);
                        order = null;
                    }
                }
            }
        }

        if (order) {
            let reserveSuccess = !!order.reserve_ticket;

            // Reserve seats first — booking is only complete when cinema API confirms
            await withLock(orderid, async () => {
                const currentOrder = await prisma.order.findUnique({
                    where: { orderId: orderid },
                    select: { reserve_ticket: true }
                });
                
                if (!currentOrder?.reserve_ticket && order.cinemaId && order.showId && order.referenceNo) {
                    try {
                        const reserveResult = await callReserveBooking(
                            orderid,
                            tranID || orderid,
                            channel || 'Online',
                            appcode || '',
                            {
                                cinemaId: order.cinemaId,
                                showId: order.showId,
                                referenceNo: order.referenceNo,
                                membershipId: order.membershipId || '0',
                                storedDetails: { token: order.token || '' }
                            }
                        );
                        reserveSuccess = reserveResult.success;
                        if (!reserveSuccess) {
                            console.error('[Payment Notify] ReserveBooking failed for PAID order:', reserveResult.error);
                            sendAdminBookingFailureAlert(order, reserveResult.error).catch(err => 
                                console.error("[Payment Notify] Failed to send admin alert email:", err)
                            );
                        }
                    } catch (e) {
                        console.error('[Payment Notify] ReserveBooking attempt failed:', e);
                        sendAdminBookingFailureAlert(order, e.message).catch(err => 
                            console.error("[Payment Notify] Failed to send admin alert email:", err)
                        );
                    }
                } else if (currentOrder?.reserve_ticket) {
                    reserveSuccess = true;
                }
            });

            await prisma.order.update({
                where: { id: order.id },
                data: {
                    status: reserveSuccess ? 'CONFIRMED' : 'PENDING',
                    paymentStatus: 'PAID',
                    transactionNo: tranID,
                    paymentMethod: channel,
                    reserve_ticket: reserveSuccess,
                    orderId: orderid,
                    updatedAt: new Date()
                }
            });

            // 4. Fetch Ticket Details for Email (External API)
            // We need to construct the exact data structure for sendTicketEmail
            let emailSent = false;
            let ticketInfoData = null;

            if (order.cinemaId && order.showId && order.referenceNo) {
                try {
                    const ticketApiUrl = `${API_BASE_URL}/Booking/GetTickets/${order.cinemaId}/${order.showId}/${order.referenceNo}`;
                    console.log(`[Payment Notify] Fetching tickets: ${ticketApiUrl}`);
                    const ticketRes = await fetch(ticketApiUrl);
                    
                    if (ticketRes.ok) {
                        const t = await ticketRes.json();
                        
                        // Construct Email Data (Matching resend-email logic)
                        let finalSeatDisplay = [];
                        let seatsList = [];
                        try {
                             if (order.seats && (order.seats.startsWith('[') || order.seats.startsWith('{'))) {
                                const parsed = JSON.parse(order.seats);
                                if (Array.isArray(parsed)) seatsList = parsed; 
                                else seatsList = Object.values(parsed);
                             } else if (order.seats) {
                                seatsList = order.seats.split(',').map(s => s.trim());
                             }
                        } catch(e) { seatsList = [order.seats]; }

                        let finalTicketDetails = t.TicketDetails || [];
                        if (finalTicketDetails.length > 0) {
                             const groups = {};
                             finalTicketDetails.forEach(d => {
                                 const type = d.TicketType || 'Standard';
                                 if (d.SeatNo) {
                                     if (!groups[type]) groups[type] = [];
                                     groups[type].push(d.SeatNo);
                                 }
                             });
                             finalSeatDisplay = Object.entries(groups).map(([type, seats]) => ({ type, seats }));
                        } else {
                             finalSeatDisplay = [{ type: 'Standard', seats: seatsList.filter(s=>s) }];
                        }

                        ticketInfoData = {
                            customerName: t.CustomerName || order.customerName || 'Guest',
                            customerEmail: t.CustomerEmail || order.customerEmail || 'N/A',
                            customerPhone: t.CustomerPhone || order.customerPhone || 'N/A',
                            movieName: t.MovieName || order.movieTitle || 'Movie',
                            movieImage: t.MovieImage || '/img/banner.jpg',
                            genre: t.Genre || 'N/A',
                            duration: t.Duration || 'N/A',
                            language: t.Language || 'English',
                            experienceType: t.ExperienceType || 'Standard',
                            hallName: t.HallName || order.hallName || 'Hall',
                            cinemaName: t.CinemaName || order.cinemaName || 'Cinema',
                            showDate: t.ShowDate || t.showDate || (order.showTime instanceof Date ? order.showTime.toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur' }) : order.showTime) || 'N/A',
                            showTime: t.ShowTime || t.showTime || (order.showTime instanceof Date ? order.showTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kuala_Lumpur' }) : order.showTime) || 'N/A',
                            bookingId: t.BookingID || t.bookingID || t.orderId || order.referenceNo,
                            referenceNo: t.ReferenceNo || order.referenceNo,
                            trackingId: tranID || t.TrackingID || t.TransactionNo || order.transactionNo || 'N/A',
                            seatDisplay: finalSeatDisplay,
                            totalPersons: finalSeatDisplay.reduce((s, g) => s + g.seats.length, 0),
                            subCharge: parseFloat(t.SubCharge || 0),
                            grandTotal: parseFloat(amount || 0),
                            ticketDetails: finalTicketDetails
                        };

                        // 5. Send Email (Only if not already sent)
                        if (!order.isSendMail && ticketInfoData.customerEmail && ticketInfoData.customerEmail !== 'N/A') {
                            console.log(`[Payment Notify] Sending email to ${ticketInfoData.customerEmail}`);
                            await sendTicketEmail(ticketInfoData.customerEmail, ticketInfoData);
                            emailSent = true;
                        }
                    } else {
                        console.error('[Payment Notify] Failed to fetch tickets from API');
                    }
                } catch (apiErr) {
                    console.error('[Payment Notify] Error fetching tickets/sending email:', apiErr);
                }
            }

            // 6. Update Order with Email Info & Status
            await prisma.order.update({
                where: { id: order.id },
                data: {
                    emailInfo: ticketInfoData ? ticketInfoData : undefined, // Store JSON
                    isSendMail: emailSent
                }
            });
            console.log(`[Payment Notify] Order updated. Email sent: ${emailSent}`);

        } else {
             // Order not found in DB
             console.warn(`[Payment Notify] Order not found for ID: ${orderid}`);
             // NOTE: ReserveBooking is NOT called here - it's handled by molpay_return route
        }
      } catch (err) {
        console.error('[Payment Notify] Error updating order/sending email:', err);
      }
      
      // Return success response to Razer Merchant Services
      // Merchant is recommended to implement IPN once received the payment status
      // regardless the status to acknowledge RazerMS system
      return new NextResponse('CBRECEIVEOK', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    } else {
      // Payment failed or pending
      console.log(`[Payment Notify] Payment failed - Order: ${orderid}, Status: ${status}, Error: ${error_desc || 'Unknown'}`);
      
      // NOTE: CancelBooking is NOT called here - it's handled by molpay_return route
      // This route only acknowledges receipt of the notification
      
      return new NextResponse('CBRECEIVEOK', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
  } catch (error) {
    console.error('Error processing payment notification:', error);
    return NextResponse.json(
      { status: 'ERROR', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * Handle GET request (for testing or callback verification)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const notificationData = {};
    
    // Convert URL params to object
    searchParams.forEach((value, key) => {
      notificationData[key] = value;
    });

    if (Object.keys(notificationData).length === 0) {
      return NextResponse.json({
        status: 'OK',
        message: 'Payment notification endpoint is active',
      });
    }

    // Verify and process (same as POST)
    const isValid = verifyNotificationSignature(notificationData);
    
    if (!isValid) {
      return NextResponse.json(
        { status: 'INVALID_SIGNATURE', message: 'Invalid transaction signature' },
        { status: 400 }
      );
    }

    return new NextResponse('CBRECEIVEOK', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error) {
    console.error('Error processing GET notification:', error);
    return NextResponse.json(
      { status: 'ERROR', message: error.message },
      { status: 500 }
    );
  }
}

