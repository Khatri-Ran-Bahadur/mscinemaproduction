import { prisma } from '../src/lib/prisma.js';
import { API_CONFIG } from '../src/config/api.js';
import { sendTicketEmail } from '../src/utils/email.js';

async function testSendEmail() {
  const targetEmail = 'ranbdrkc201@gmail.com';
  const targetRef = 'T02KHOOF';
  const targetOrderId = 'T02KHOOF_85131776EDO';
  const targetTranId = '3898917024';

  console.log(`[Test Email] Searching database for order ${targetRef}...`);
  
  const order = await prisma.order.findFirst({
    where: {
      OR: [
        { referenceNo: targetRef },
        { orderId: targetOrderId }
      ]
    }
  });

  if (order) {
    console.log(`[Test Email] Found DB Order: ID ${order.id}, Ref: ${order.referenceNo}, Status: ${order.paymentStatus}`);
  } else {
    console.log('[Test Email] Order not found in DB, using fallback data for test email.');
  }

  // Fetch ticket details from Cinema API
  let apiTicketData = null;
  const cinemaId = order?.cinemaId || '7001';
  const showId = order?.showId || '40628';
  const refNo = order?.referenceNo || targetRef;

  try {
    const ticketApiUrl = `${API_CONFIG.API_BASE_URL}/Booking/GetTickets/${cinemaId}/${showId}/${refNo}`;
    console.log(`[Test Email] Querying Cinema API: ${ticketApiUrl}`);
    const res = await fetch(ticketApiUrl);
    if (res.ok) {
      apiTicketData = await res.json();
      console.log('[Test Email] Successfully retrieved ticket data from Cinema API.');
    } else {
      console.warn('[Test Email] Cinema API returned status:', res.status);
    }
  } catch (err) {
    console.error('[Test Email] Error querying Cinema API:', err.message);
  }

  const t = apiTicketData || {};
  const b = t.bookingDetails || {};
  const ticketDetails = t.TicketDetails || t.ticketDetails || [];

  const seatGroups = {};
  if (ticketDetails.length > 0) {
    ticketDetails.forEach((ticket) => {
      const type = ticket.TicketType || ticket.ticketType || ticket.Type || ticket.type || 'Adult';
      const seatNo = ticket.SeatNo || ticket.seatNo || ticket.Seat || ticket.seat || '';
      if (seatNo) {
        if (!seatGroups[type]) seatGroups[type] = [];
        seatGroups[type].push(seatNo);
      }
    });
  }

  const ticketInfoData = {
    customerName: b.name || t.CustomerName || order?.customerName || 'Jalal',
    customerPhone: b.mobileNo || t.CustomerPhone || order?.customerPhone || '07200937758',
    customerEmail: targetEmail,
    movieName: b.movieName || t.MovieName || order?.movieTitle || 'KOKUHO (JAPANESE)',
    movieImage: t.MovieImage || '/img/banner.jpg',
    genre: t.Genre || 'N/A',
    duration: t.Duration || 'N/A',
    language: t.Language || 'Japanese',
    experienceType: t.ExperienceType || 'Standard',
    hallName: t.HallName || order?.hallName || 'HALL - 7',
    cinemaName: b.cinemaName || t.CinemaName || order?.cinemaName || 'MS Cinemas',
    showDate: b.showDate || t.ShowDate || '2026-07-27',
    showTime: b.showTime || t.ShowTime || '2026-07-27 17:45:00',
    bookingId: order?.orderId || targetOrderId || 'T02KHOOF_85131776EDO',
    referenceNo: refNo,
    trackingId: targetTranId || order?.transactionNo || '3898917024',
    seatDisplay: Object.keys(seatGroups).length > 0
      ? Object.entries(seatGroups).map(([type, seats]) => ({ type, seats }))
      : [{ type: 'ADULT', seats: ['H15'] }],
    totalPersons: ticketDetails.length || 1,
    subCharge: parseFloat(t.SubCharge || 1.00),
    grandTotal: parseFloat(t.GrandTotal || order?.totalAmount || 16.00),
    ticketDetails: ticketDetails.length > 0 ? ticketDetails : [
      {
        ticketTypeName: 'ADULT',
        seatNo: 'H15',
        price: 15.00,
        surcharge: 0.00,
        totalTicketPrice: 15.00
      }
    ]
  };

  console.log(`[Test Email] Sending ticket email to ${targetEmail}...`);
  console.log('[Test Email] Final Data Payload:', {
    OrderNo: ticketInfoData.bookingId,
    RefNo: ticketInfoData.referenceNo,
    TransactionNo: ticketInfoData.trackingId,
    ShowTime: ticketInfoData.showTime,
    EmailTo: ticketInfoData.customerEmail
  });

  const result = await sendTicketEmail(targetEmail, ticketInfoData);
  console.log('[Test Email] Email Sent Successfully! Message ID:', result?.messageId || result);
  process.exit(0);
}

testSendEmail().catch(err => {
  console.error('[Test Email] Error:', err);
  process.exit(1);
});
