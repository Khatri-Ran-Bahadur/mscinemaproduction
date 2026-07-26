/**
 * Cron: Reconcile PAID orders that were never reserved in cinema API.
 * Runs ReserveBooking + sends ticket email when reservation succeeds.
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { API_CONFIG } from '@/config/api';
import { queryPaymentStatus, callReserveBooking } from '@/utils/molpay';
import { resendTicketEmail } from '@/utils/email';

export const dynamic = 'force-dynamic';

function writeLog(entry) {
  try {
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    const line = `[${new Date().toISOString()}] ${typeof entry === 'string' ? entry : JSON.stringify(entry)}\n`;
    fs.appendFileSync(path.join(logDir, 'reconcile-paid-orders.log'), line);
  } catch (_) {}
}

async function getTokenForApi(apiBaseUrl, credentials) {
  const res = await fetch(`${apiBaseUrl}/APIUser/GetToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`GetToken failed: ${res.status}`);
  const data = await res.json();
  const token = data?.token || data?.Token || data?.accessToken;
  if (!token) throw new Error('Token not found');
  return token;
}

async function fetchTickets(cinemaId, showId, referenceNo, token) {
  const url = `${API_CONFIG.API_BASE_URL}/Booking/GetTickets/${cinemaId}/${showId}/${referenceNo}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-api-key': API_CONFIG.API_SECRET_KEY,
    },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json();
}

function buildTicketInfo(order, t) {
  const b = t?.bookingDetails || {};
  const ticketDetails = t?.TicketDetails || t?.ticketDetails || [];

  let finalSeatDisplay = [];
  if (ticketDetails.length > 0) {
    const groups = {};
    ticketDetails.forEach((d) => {
      const type = d.TicketType || d.ticketType || 'Standard';
      const seat = d.SeatNo || d.seatNo || '';
      if (seat) {
        if (!groups[type]) groups[type] = [];
        groups[type].push(seat);
      }
    });
    finalSeatDisplay = Object.entries(groups).map(([type, seats]) => ({ type, seats }));
  }

  const displayShowDate =
    b.showDate ||
    t?.ShowDate ||
    (order.showTime instanceof Date
      ? order.showTime.toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur' })
      : order.showTime) ||
    '';
  const displayShowTime =
    b.showTime ||
    t?.ShowTime ||
    (order.showTime instanceof Date
      ? order.showTime.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: 'Asia/Kuala_Lumpur',
        })
      : order.showTime) ||
    '';

  return {
    customerName: b.name || t?.CustomerName || order.customerName || 'Guest',
    customerEmail: b.email || t?.CustomerEmail || order.customerEmail || '',
    customerPhone: b.mobileNo || t?.CustomerPhone || order.customerPhone || 'N/A',
    movieName: b.movieName || t?.MovieName || order.movieTitle || 'Movie',
    movieImage: t?.MovieImage || '/img/banner.jpg',
    genre: t?.Genre || 'N/A',
    duration: t?.Duration || 'N/A',
    language: t?.Language || 'English',
    experienceType: t?.ExperienceType || 'Standard',
    hallName: t?.HallName || order.hallName || 'Hall',
    cinemaName: b.cinemaName || t?.CinemaName || order.cinemaName || 'MS Cinemas',
    showDate: displayShowDate,
    showTime: displayShowTime,
    bookingId: order.referenceNo,
    referenceNo: order.referenceNo,
    trackingId: order.transactionNo || order.orderId || 'N/A',
    seatDisplay: finalSeatDisplay,
    totalPersons: finalSeatDisplay.reduce((s, g) => s + g.seats.length, 0),
    subCharge: parseFloat(t?.SubCharge || 0),
    grandTotal: parseFloat(order.totalAmount || 0),
    ticketDetails,
  };
}

export async function GET(request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const reqSecret =
        request.headers.get('x-cron-secret') ||
        new URL(request.url).searchParams.get('secret');
      if (reqSecret !== cronSecret) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
    }

    const since = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const orders = await prisma.order.findMany({
      where: {
        paymentStatus: 'PAID',
        reserve_ticket: false,
        referenceNo: { not: null },
        cinemaId: { not: null },
        showId: { not: null },
        updatedAt: { gte: since },
      },
      take: 10,
      orderBy: { updatedAt: 'asc' },
    });

    if (orders.length === 0) {
      return NextResponse.json({ success: true, message: 'No paid-unreserved orders.' });
    }

    writeLog(`Processing ${orders.length} paid-unreserved order(s)`);

    let token;
    try {
      token = await getTokenForApi(API_CONFIG.API_BASE_URL, API_CONFIG.GUEST_CREDENTIALS);
    } catch (e) {
      return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }

    const results = [];

    for (const order of orders) {
      try {
        // Re-verify with Fiuu before reserving
        if (order.orderId) {
          const fiuu = await queryPaymentStatus(
            order.orderId,
            order.totalAmount?.toString() || '0',
          );
          if (fiuu.status === '22') {
            results.push({
              id: order.id,
              referenceNo: order.referenceNo,
              action: 'SKIP_PENDING',
            });
            continue;
          }
          if (fiuu.status !== '00') {
            results.push({
              id: order.id,
              referenceNo: order.referenceNo,
              action: 'SKIP_NOT_PAID',
              fiuuStatus: fiuu.status,
            });
            continue;
          }
          if (fiuu.tranID && !order.transactionNo) {
            await prisma.order.update({
              where: { id: order.id },
              data: { transactionNo: fiuu.tranID },
            });
            order.transactionNo = fiuu.tranID;
          }
        }

        const reserveResult = await callReserveBooking(
          order.orderId,
          order.transactionNo || order.orderId,
          order.paymentMethod || 'Online',
          '',
          {
            cinemaId: order.cinemaId,
            showId: order.showId,
            referenceNo: order.referenceNo,
            membershipId: order.membershipId || '0',
            storedDetails: { token: order.token || '' },
          },
        );

        if (!reserveResult.success) {
          writeLog({
            ref: order.referenceNo,
            action: 'RESERVE_FAILED',
            error: reserveResult.error,
          });
          results.push({
            id: order.id,
            referenceNo: order.referenceNo,
            action: 'RESERVE_FAILED',
            error: reserveResult.error,
          });
          continue;
        }

        await prisma.order.update({
          where: { id: order.id },
          data: {
            reserve_ticket: true,
            status: 'CONFIRMED',
            paymentStatus: 'PAID',
          },
        });

        let emailSent = false;
        if (!order.isSendMail) {
          const ticketData = await fetchTickets(
            order.cinemaId,
            order.showId,
            order.referenceNo,
            token,
          );
          const hasTickets =
            ticketData &&
            (ticketData.bookingDetails ||
              (ticketData.ticketDetails && ticketData.ticketDetails.length > 0) ||
              (ticketData.TicketDetails && ticketData.TicketDetails.length > 0));

          if (hasTickets) {
            const ticketInfo = buildTicketInfo(order, ticketData);
            if (ticketInfo.customerEmail) {
              await resendTicketEmail(ticketInfo.customerEmail, ticketInfo);
              emailSent = true;
              await prisma.order.update({
                where: { id: order.id },
                data: { isSendMail: true, emailInfo: ticketInfo },
              });
            }
          }
        }

        writeLog({
          ref: order.referenceNo,
          action: 'RESERVED',
          emailSent,
        });
        results.push({
          id: order.id,
          referenceNo: order.referenceNo,
          action: 'RESERVED',
          emailSent,
        });
      } catch (err) {
        writeLog({ ref: order.referenceNo, action: 'ERROR', error: err.message });
        results.push({
          id: order.id,
          referenceNo: order.referenceNo,
          action: 'ERROR',
          error: err.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: orders.length,
      results,
    });
  } catch (error) {
    writeLog({ action: 'CRITICAL', error: error.message });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
