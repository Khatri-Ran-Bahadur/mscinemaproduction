import { prisma } from '@/lib/prisma';
import { API_CONFIG } from '@/config/api';
import { sendTicketEmail } from '@/utils/email';
import { formatHallName } from '@/utils/hall';

/**
 * Handle sending ticket email for an order (Mobile Version)
 * Uses data directly from the Order table instead of external API
 */
export async function sendMobileTicketEmailForOrder(orderId, tranID = '') {
  try {
    const order = await prisma.order.findUnique({
      where: { orderId: orderId }
    });

    if (!order) {
      console.error(`[Mobile Email Service] Order not found: ${orderId}`);
      return { success: false, error: `Order not found:${orderId}` };
    }

    // 1. Fetch fresh ticket data from Cinema API (Highly Recommended for accuracy)
    let apiTicketData = null;
    if (order.cinemaId && order.showId && order.referenceNo) {
      try {
        const ticketApiUrl = `${API_CONFIG.API_BASE_URL}/Booking/GetTickets/${order.cinemaId}/${order.showId}/${order.referenceNo}`;
        console.log(`[Mobile Email Service] Fetching from API: ${ticketApiUrl}`);
        const ticketRes = await fetch(ticketApiUrl);
        if (ticketRes.ok) {
          apiTicketData = await ticketRes.json();
        }
      } catch (apiErr) {
        console.warn(`[Mobile Email Service] API fetch failed: ${apiErr.message}`);
      }
    }

    const t = apiTicketData || {};

    // 2. Resolve Ticket Details & Seat Mapping (API DATA REQUIRED)
    const ticketDetails = t.TicketDetails || t.ticketDetails || [];
    const seatGroups = {};
    const finalTicketDetails = [];

    if (ticketDetails.length > 0) {
      ticketDetails.forEach((ticket) => {
        const type = ticket.TicketType || ticket.ticketType || ticket.Type || ticket.type || 'Adult';
        const seatNo = ticket.SeatNo || ticket.seatNo || ticket.Seat || ticket.seat || '';
        if (seatNo) {
          if (!seatGroups[type]) seatGroups[type] = [];
          seatGroups[type].push(seatNo);
          finalTicketDetails.push(ticket);
        }
      });
    }

    // The user wants "proper" information from the API. Fallback results in poor quality.
    if (finalTicketDetails.length === 0) {
      console.error(`[Mobile Email Service] Proper ticket details not found in API for order: ${orderId}`);
      return {
        success: false,
        error: 'Ticket details not available in cinema system. Please verify the booking status.'
      };
    }

    // 4. Formatting Helpers
    // Parse API date format "2025-12-10" to "10 Dec 2025"
    const parseApiDate = (dateStr) => {
      if (!dateStr) return '';
      const parts = dateStr.split('-');
      if (parts.length !== 3) return dateStr;
      const [year, month, day] = parts;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIndex = parseInt(month) - 1;
      return `${parseInt(day)} ${months[monthIndex]} ${year}`;
    };

    // 5. Build ticketInfoData payload (Casing compatible with email.js)
    const ticketInfoData = {
      customerName: t.CustomerName || t.customerName || order.customerName || 'Guest',
      customerPhone: t.CustomerPhone || t.customerPhone || order.customerPhone || 'N/A',
      customerEmail: t.CustomerEmail || t.customerEmail || order.customerEmail || 'N/A',
      movieName: t.MovieName || t.movieName || order.movieTitle || 'Movie',
      movieImage: t.MovieImage || t.movieImage || '/img/banner.jpg',
      genre: t.Genre || t.genre || 'N/A',
      duration: t.Duration || t.duration || 'N/A',
      language: t.Language || t.language || 'English',
      experienceType: t.ExperienceType || t.experienceType || order.ticketType || 'Standard',
      hallName: formatHallName(t.HallName || t.hallName || order.hallName || 'Hall'),
      cinemaName: t.CinemaName || t.cinemaName || order.cinemaName || 'Cinema',

      // Use API formatted values directly, or parse API date format (YYYY-MM-DD to "D Mon YYYY")
      showDate: t.bookingDetails.showDate || '',
      showTime: t.bookingDetails.showTime || '',

      bookingId: order.referenceNo,
      referenceNo: t.ReferenceNo || t.referenceNo || order.referenceNo,
      trackingId: tranID || order.transactionNo || 'N/A',
      seatDisplay: Object.entries(seatGroups).map(([type, seats]) => ({ type, seats })),
      totalPersons: finalTicketDetails.length,
      subCharge: parseFloat(t.SubCharge || t.subCharge || 0),
      grandTotal: parseFloat(t.GrandTotal || t.grandTotal || order.totalAmount || 0),
      ticketDetails: finalTicketDetails
    };

    // 6. Send Email
    if (ticketInfoData.customerEmail && ticketInfoData.customerEmail !== 'N/A') {
      await sendTicketEmail(ticketInfoData.customerEmail, ticketInfoData);

      await prisma.order.update({
        where: { id: order.id },
        data: {
          isSendMail: true
        }
      });

      return { success: true };
    }

    return { success: false, error: 'Customer email address not found.' };

  } catch (err) {
    console.error(`[Mobile Email Service] Error:`, err);
    return { success: false, error: err.message };
  }
}

