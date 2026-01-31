import { prisma } from '@/lib/prisma';
import { API_CONFIG } from '@/config/api';
import { sendTicketEmail } from '@/utils/email';

/**
 * Handle sending ticket email for an order
 * Fetches ticket details from external API and sends email
 */
export async function sendTicketEmailForOrder(orderId, tranID = '') {
  try {
    const order = await prisma.order.findUnique({
      where: { orderId: orderId }
    });

    if (!order) {
      console.error(`[Email Service] Order not found: ${orderId}`);
      return { success: false, error: 'Order not found' };
    }

    if (!order.cinemaId || !order.showId || !order.referenceNo) {
      console.error(`[Email Service] Missing critical booking info for order: ${orderId}`);
      return { success: false, error: 'Missing booking details' };
    }

    const ticketApiUrl = `${API_CONFIG.API_BASE_URL}/Booking/GetTickets/${order.cinemaId}/${order.showId}/${order.referenceNo}`;
    console.log(`[Email Service] Fetching tickets from: ${ticketApiUrl}`);
    
    const ticketRes = await fetch(ticketApiUrl);
    if (!ticketRes.ok) {
      throw new Error(`Failed to fetch tickets: ${ticketRes.status}`);
    }

    const t = await ticketRes.json();
    
    // Construct Email Data
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
    } catch(e) { 
      seatsList = [order.seats]; 
    }

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
      finalSeatDisplay = [{ type: 'Standard', seats: seatsList.filter(s => s) }];
    }

    const ticketInfoData = {
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
      trackingId: tranID || order.transactionNo || 'N/A',
      seatDisplay: finalSeatDisplay,
      totalPersons: finalSeatDisplay.reduce((s, g) => s + g.seats.length, 0),
      subCharge: parseFloat(t.SubCharge || 0),
      grandTotal: parseFloat(order.totalAmount || 0),
      ticketDetails: finalTicketDetails
    };

    if (ticketInfoData.customerEmail && ticketInfoData.customerEmail !== 'N/A') {
      await sendTicketEmail(ticketInfoData.customerEmail, ticketInfoData);
      
      // Update order
      await prisma.order.update({
        where: { id: order.id },
        data: {
          emailInfo: ticketInfoData,
          isSendMail: true
        }
      });
      
      return { success: true };
    }

    return { success: false, error: 'No valid email address' };

  } catch (err) {
    console.error(`[Email Service] Error sending ticket email for order ${orderId}:`, err);
    return { success: false, error: err.message };
  }
}
