/**
 * API Route: Payment Notification Handler (Server-to-Server)
 * This endpoint receives payment notifications from Razer Merchant Services (MOLPay)
 * Documentation: https://github.com/RazerMS/SDK-RazerMS_Node_JS/wiki/Installation-Guidance
 */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { API_BASE_URL } from '@/config/api';
import { prisma } from '@/lib/prisma';
import { sendTicketEmail } from '@/utils/email';

// Razer Merchant Services Configuration from environment variables
const RMS_CONFIG = {
  merchantId: process.env.FIUU_MERCHANT_ID || '',
  verifyKey: process.env.FIUU_VERIFY_KEY || '',
  secretKey: process.env.FIUU_SECRET_KEY || '',
};

/**
 * Call ReserveBooking API
 * Note: In server-to-server notification, we don't have access to localStorage
 * We need to extract booking info from orderid or use a database/cache
 * For now, we'll try to extract reference number from orderid format
 */
async function callReserveBooking(orderid, tranID, channel, amount, currency) {
  try {
    // Extract booking info from orderid
    // OrderID format: MS{timestamp}{random} or may contain reference number
    // We need to get booking data - this should ideally be stored in a database
    // For now, we'll log and skip if we can't extract the info
    
    // TODO: Implement proper booking data storage/retrieval
    // Options:
    // 1. Store booking data in database with orderid as key
    // 2. Encode reference number in orderid format
    // 3. Use Redis/cache to store orderid -> booking data mapping
    
    console.log('[Payment Notify] ReserveBooking - Order:', orderid, 'Transaction:', tranID);
    console.warn('[Payment Notify] ReserveBooking requires booking data - implement storage/retrieval');
    
    // For now, we'll skip the API call if we can't get booking data
    // The return URL handler will handle the ReserveBooking call
    return { success: false, message: 'Booking data not available in server context' };
  } catch (error) {
    console.error('[Payment Notify] ReserveBooking error:', error);
    throw error;
  }
}

/**
 * Call CancelBooking API
 */
async function callCancelBooking(orderid, tranID, channel, errorDesc) {
  try {
    // Similar to ReserveBooking, we need booking data
    // For now, we'll log and skip
    console.log('[Payment Notify] CancelBooking - Order:', orderid, 'Transaction:', tranID);
    console.warn('[Payment Notify] CancelBooking requires booking data - implement storage/retrieval');
    
    // The return URL handler will handle the CancelBooking call
    return { success: false, message: 'Booking data not available in server context' };
  } catch (error) {
    console.error('[Payment Notify] CancelBooking error:', error);
    throw error;
  }
}

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

    // All required fields must be present
    if (!tranID || !orderid || !status || !domain || !amount || !currency || !paydate || !appcode || !skey) {
      console.error('Missing required fields for signature verification');
      return false;
    }

    // Step 1: Calculate key0 = md5(tranID + orderid + status + domain + amount + currency)
    const key0String = `${tranID}${orderid}${status}${domain}${amount}${currency}`;
    const key0 = crypto.createHash('md5').update(key0String, 'utf8').digest('hex');

    // Step 2: Calculate key1 = md5(paydate + domain + key0 + appcode + vkey)
    const key1String = `${paydate}${domain}${key0}${appcode}${RMS_CONFIG.verifyKey}`;
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
    // MOLPay sends notification via POST with form data
    const formData = await request.formData();
    const notificationData = {};
    
    // Convert FormData to object
    for (const [key, value] of formData.entries()) {
      notificationData[key] = value;
    }

    console.log('[Payment Notify] Received notification:', notificationData);

    // Extract payment data (per official documentation)
    const {
      amount,
      orderid,
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
        const order = await prisma.order.findFirst({
            where: { 
                OR: [
                    { orderId: orderid },
                    // Make sure we handle potential prefix nuances if any
                ]
            }
        });

        if (order) {
            // 2. Call ReserveBooking API (Confirm with Cinema System)
            // Ideally callReserveBooking should use order data - kept existing logic placeholder if needed
            // const reserveRes = await callReserveBooking(...) 
            
            // 3. Update Local Order Status
            await prisma.order.update({
                where: { id: order.id },
                data: {
                    status: 'CONFIRMED',
                    paymentStatus: 'PAID',
                    transactionNo: tranID,
                    paymentMethod: channel,
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
                            showDate: t.ShowDate || (order.showTime ? new Date(order.showTime).toLocaleDateString() : 'N/A'),
                            showTime: t.ShowTime || (order.showTime ? new Date(order.showTime).toLocaleTimeString() : 'N/A'),
                            bookingId: order.referenceNo,
                            referenceNo: t.ReferenceNo || order.referenceNo,
                            trackingId: tranID,
                            seatDisplay: finalSeatDisplay,
                            totalPersons: finalSeatDisplay.reduce((s, g) => s + g.seats.length, 0),
                            subCharge: parseFloat(t.SubCharge || 0),
                            grandTotal: parseFloat(amount || 0),
                            ticketDetails: finalTicketDetails
                        };

                        // 5. Send Email
                        if (ticketInfoData.customerEmail !== 'N/A') {
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
             // Fallback if order not found in DB
             console.warn(`[Payment Notify] Order not found for ID: ${orderid}`);
             // Call ReserveBooking API fallback
             try {
                await callReserveBooking(orderid, tranID, channel, amount, currency);
             } catch (err) {
                console.error('[Payment Notify] Error calling ReserveBooking:', err);
             }
        }
      } catch (err) {
        console.error('[Payment Notify] Error updating order/sending email:', err);
      }
      
      // Return success response to Razer Merchant Services
      // Merchant is recommended to implement IPN once received the payment status
      // regardless the status to acknowledge RazerMS system
      return NextResponse.json({
        status: 'RECEIVEOK',
        message: 'Payment notification received and processed successfully',
      });
    } else {
      // Payment failed or pending
      console.log(`[Payment Notify] Payment failed - Order: ${orderid}, Status: ${status}, Error: ${error_desc || 'Unknown'}`);
      
      // Call CancelBooking API
      try {
        await callCancelBooking(orderid, tranID, channel, error_desc || 'Payment failed');
      } catch (err) {
        console.error('[Payment Notify] Error calling CancelBooking:', err);
        // Continue to return success to RazerMS even if CancelBooking fails
      }
      
      return NextResponse.json({
        status: 'RECEIVEOK',
        message: 'Payment notification received',
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

    return NextResponse.json({
      status: 'RECEIVEOK',
      message: 'Payment notification received',
    });
  } catch (error) {
    console.error('Error processing GET notification:', error);
    return NextResponse.json(
      { status: 'ERROR', message: error.message },
      { status: 500 }
    );
  }
}

