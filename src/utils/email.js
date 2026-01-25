/**
 * Email Service Utility
 * Handles sending emails using Nodemailer
 * Supports SMTP, Gmail, SendGrid, and other email services
 */

import nodemailer from 'nodemailer';

/**
 * Create email transporter based on environment configuration
 * Supports multiple email service providers
 */
function createTransporter() {
  const emailService = process.env.EMAIL_SERVICE || 'smtp';
  const emailHost = process.env.EMAIL_HOST;
  const emailPort = parseInt(process.env.EMAIL_PORT || '587');
  const emailSecure = process.env.EMAIL_SECURE === 'true' || emailPort === 465;
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;
  const emailFrom = process.env.EMAIL_FROM || emailUser;

  // Gmail configuration
  if (emailService.toLowerCase() === 'gmail') {
    if (!emailUser || !emailPassword) {
      throw new Error('EMAIL_USER and EMAIL_PASSWORD are required for Gmail configuration');
    }
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });
  }

  // SendGrid configuration
  if (emailService.toLowerCase() === 'sendgrid') {
    const sendgridApiKey = process.env.SENDGRID_API_KEY || emailPassword;
    if (!sendgridApiKey) {
      throw new Error('SENDGRID_API_KEY or EMAIL_PASSWORD is required for SendGrid configuration');
    }
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: sendgridApiKey,
      },
    });
  }

  // Generic SMTP configuration
  if (!emailHost) {
    throw new Error('EMAIL_HOST is required for SMTP configuration');
  }

  return nodemailer.createTransport({
    host: emailHost,
    port: emailPort,
    secure: emailSecure,
    auth: {
      user: emailUser,
      pass: emailPassword,
    },
    // For development/testing with self-signed certificates
    tls: {
      rejectUnauthorized: process.env.EMAIL_REJECT_UNAUTHORIZED !== 'false',
    },
  });
}

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML email content
 * @param {string} options.text - Plain text email content (optional)
 * @param {string} options.from - Sender email address (optional, uses EMAIL_FROM env var)
 * @returns {Promise<Object>} - Send result
 */
export async function sendEmail({ to, subject, html, text, from, attachments }) {
  try {
    // Validate required environment variables
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error('Email Utils: Missing EMAIL_USER or EMAIL_PASSWORD');
      console.log('Environment:', {
        EMAIL_USER_SET: !!process.env.EMAIL_USER,
        EMAIL_PASSWORD_SET: !!process.env.EMAIL_PASSWORD,
        EMAIL_SERVICE: process.env.EMAIL_SERVICE,
        EMAIL_HOST: process.env.EMAIL_HOST,
        EMAIL_PORT: process.env.EMAIL_PORT,
      });
      throw new Error('Email configuration is missing. Please set EMAIL_USER and EMAIL_PASSWORD environment variables.');
    }

    const transporter = createTransporter();
    
    // Log transporter details (safe)
    const emailService = process.env.EMAIL_SERVICE || 'smtp';
    console.log(`Email Utils: specific transporter created for service: ${emailService}`);

    let emailFrom = from || process.env.EMAIL_FROM || process.env.EMAIL_USER;
    const emailName = process.env.EMAIL_NAME;

    // If we have a name and the email string doesn't already have one (e.g. doesn't contain '<')
    if (emailName && emailFrom && !emailFrom.includes('<')) {
      emailFrom = `"${emailName}" <${emailFrom}>`;
    }

    const mailOptions = {
      from: emailFrom,
      to: to,
      subject: subject,
      html: html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for plain text fallback
      attachments: attachments,
    };

    console.log('Email Utils: Verifying transporter...');
    // Verify transporter configuration
    await transporter.verify();
    console.log('Email Utils: Transporter verified. Sending email...');

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent successfully:', {
      messageId: info.messageId,
      to: to,
      subject: subject,
      response: info.response,
    });

    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
    };
  } catch (error) {
    console.error('Email sending error:', error);
    if (error.code) console.error('Error Code:', error.code);
    if (error.command) console.error('Error Command:', error.command);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Send activation email
 * @param {string} to - Recipient email
 * @param {string} name - User name
 * @param {string} activationUrl - Activation URL
 * @returns {Promise<Object>} - Send result
 */
export async function sendActivationEmail(to, name, activationUrl) {
  const subject = 'Activate Your MS Cinema Account';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Activate Your Account</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #1a1a1a; padding: 30px; border-radius: 10px;">
        <h2 style="color: #FFCA20; margin-top: 0;">Welcome to MS Cinema, ${name || 'User'}!</h2>
        <p style="color: #FAFAFA;">Thank you for registering with MS Cinema. To complete your registration, please activate your account by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${activationUrl}" style="background-color: #FFCA20; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">Activate Account</a>
        </div>
        <p style="color: #D3D3D3; font-size: 14px;">Or copy and paste this link into your browser:</p>
        <p style="color: #FFCA20; word-break: break-all; font-size: 12px; background-color: #2a2a2a; padding: 10px; border-radius: 5px;">${activationUrl}</p>
        <p style="color: #D3D3D3; font-size: 14px; margin-top: 30px;">This activation link will expire in 24 hours.</p>
        <p style="color: #D3D3D3; font-size: 14px;">If you didn't create an account with MS Cinema, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #3a3a3a; margin: 30px 0;">
        <p style="color: #D3D3D3; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} MS Cinema. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
  const text = `Welcome to MS Cinema, ${name || 'User'}! Please activate your account by visiting: ${activationUrl}`;

  return await sendEmail({ to, subject, html, text });
}

/**
 * Send forgot password email
 * @param {string} to - Recipient email
 * @param {string} resetUrl - Password reset URL
 * @returns {Promise<Object>} - Send result
 */
export async function sendForgotPasswordEmail(to, resetUrl) {
  const subject = 'Reset Your MS Cinema Password';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #1a1a1a; padding: 30px; border-radius: 10px;">
        <h2 style="color: #FFCA20; margin-top: 0;">Password Reset Request</h2>
        <p style="color: #FAFAFA;">You requested to reset your password for your MS Cinema account. Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #FFCA20; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">Reset Password</a>
        </div>
        <p style="color: #D3D3D3; font-size: 14px;">Or copy and paste this link into your browser:</p>
        <p style="color: #FFCA20; word-break: break-all; font-size: 12px; background-color: #2a2a2a; padding: 10px; border-radius: 5px;">${resetUrl}</p>
        <p style="color: #D3D3D3; font-size: 14px; margin-top: 30px;">This password reset link will expire in 1 hour.</p>
        <p style="color: #D3D3D3; font-size: 14px;">If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
        <hr style="border: none; border-top: 1px solid #3a3a3a; margin: 30px 0;">
        <p style="color: #D3D3D3; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} MS Cinema. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
  const text = `Reset your MS Cinema password by visiting: ${resetUrl}`;

  return await sendEmail({ to, subject, html, text });
}

/**
 * Send ticket confirmation email with ticket details and QR code
 * @param {string} to - Recipient email
 * @param {object} ticketInfo - Ticket information object
 * @param {string} ticketInfo.customerName - Customer name
 * @param {string} ticketInfo.movieName - Movie name
 * @param {string} ticketInfo.movieImage - Movie poster URL
 * @param {string} ticketInfo.genre - Movie genre
 * @param {string} ticketInfo.duration - Movie duration
 * @param {string} ticketInfo.language - Movie language
 * @param {string} ticketInfo.experienceType - Experience type (2D, 3D, etc.)
 * @param {string} ticketInfo.hallName - Hall name
 * @param {string} ticketInfo.cinemaName - Cinema name
 * @param {string} ticketInfo.showDate - Show date
 * @param {string} ticketInfo.showTime - Show time
 * @param {array} ticketInfo.seatDisplay - Array of seat groups [{type, seats: []}]
 * @param {number} ticketInfo.totalPersons - Total number of persons
 * @param {string} ticketInfo.bookingId - Booking ID
 * @param {string} ticketInfo.trackingId - Tracking/Transaction ID
 * @returns {Promise<Object>} - Send result
 */
// ... imports
import QRCode from 'qrcode';

// ... existing code ...

/**
 * Send ticket confirmation email with ticket details and QR code
 */
export const sendTicketEmail = async (to, ticketData, corporateInfoPassed = null) => {
  const {
    customerName = 'Guest',
    customerPhone = '',
    customerEmail = '',
    movieName = 'Unknown Movie',
    movieImage = '/img/banner.jpg', // Ideally this should be a full URL
    genre = 'N/A',
    duration = 'N/A',
    language = 'English',
    experienceType = 'Standard',
    hallName = 'N/A',
    cinemaName = 'MS Cinemas',
    showDate = '',
    showTime = '',
    seatDisplay = [],
    ticketDetails = [], 
    totalPersons = 0,
    bookingId = 'N/A',
    referenceNo = 'N/A',
    trackingId = 'N/A',
    subCharge = 0,
    grandTotal = 0,
  } = ticketData;

  // Format date and time
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    try {
      const [hours, minutes] = timeStr.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  // If no ticket details, try to get from booking data
  if (ticketDetails.length === 0 && bookingData) {
    const seats = bookingData?.seats || [];
    const selectedTickets = bookingData?.selectedTickets || [];
    const seatGroups = {}; // Temporary object to build seatDisplay

    seats.forEach((seat, index) => {
      const ticket = selectedTickets[index];
      const ticketType = ticket?.ticketTypeName || ticket?.TicketTypeName || ticket?.ticketType || ticket?.type || 'Adult';
      const seatNo = ticket?.seatNo || seat?.seatNo || seat?.seat || '';
      const price = ticket?.price || 0;
      const surcharge = ticket?.surcharge || 0;

      if (seatNo) {
        if (!seatGroups[ticketType]) {
          seatGroups[ticketType] = [];
        }
        seatGroups[ticketType].push(seatNo);

        // Populate ticketDetails for the table
        ticketDetails.push({
            TicketType: ticketType,
            SeatNo: seatNo,
            Price: price,
            Surcharge: surcharge
        });
      }
    });

    // Format seat display
    const formatSeats = () => {
      const parts = [];
      Object.entries(seatGroups).forEach(([type, seatList]) => {
        const seatNumbers = seatList.map(s => {
          const seatStr = String(s);
          const match = seatStr.match(/([A-Z])(\d+)/);
          if (match) {
            return match[1] + match[2];
          }
          return seatStr;
        });
        parts.push({ type, seats: seatNumbers });
      });
      return parts;
    };

    ticketData.seatDisplay = formatSeats();
    ticketData.totalPersons = Object.values(seatGroups).reduce((sum, seats) => sum + seats.length, 0) || ticketDetails.length || 0;
    
    // Add ticket details with pricing for email template
    ticketData.ticketDetails = ticketDetails.length > 0 ? ticketDetails : [];
    
    // Calculate totals correctly including taxes
    let totalPrice = 0;
    let totalSurcharge = 0;
    let calculatedGrandTotal = 0;
    
    if (ticketDetails.length > 0) {
      ticketDetails.forEach(t => {
        // Price components extraction for verification/fallback
        const price = parseFloat(t.Price || t.price || t.TicketPrice || t.ticketPrice || 0);
        const eTax = parseFloat(t.entertainmentTax || t.EntertainmentTax || 0);
        const gTax = parseFloat(t.govtTax || t.GovtTax || 0);
        const onlineCharge = parseFloat(t.onlineCharge || t.OnlineCharge || 0);
        const sur = parseFloat(t.Surcharge || t.surcharge || t.surCharge || 0);
        const ticketTotal = parseFloat(t.totalTicketPrice || t.TotalTicketPrice || 0);

        // Fallback row calculations
        const displayPrice = price + eTax + gTax;
        const displaySurcharge = sur;
        const rowTotal = ticketTotal ? (ticketTotal - onlineCharge) : (displayPrice + displaySurcharge);
        
        // Use Ticket Total for Grand Total sum (Source of Truth)
        calculatedGrandTotal += ticketTotal || (rowTotal + onlineCharge);
        
        // Sum Online Charges for Sub Charge display
        totalSurcharge += onlineCharge; 
      });
      
      // Update ticketData values
      // subCharge field -> Total Online Charges
      ticketData.subCharge = totalSurcharge;
      ticketData.grandTotal = calculatedGrandTotal;
    } else {
        // Fallback or existing values
       ticketData.subCharge = parseFloat(bookingData?.subCharge || ticketData?.subCharge || subCharge || 0);
       ticketData.grandTotal = parseFloat(bookingData?.grandTotal || ticketData?.grandTotal || grandTotal || 0);
    }
  }


  // Generate QR code as Buffer for attachment
  const qrCodeData = referenceNo !== 'N/A' ? referenceNo : bookingId;
  let qrCodeBuffer;
  try {
    qrCodeBuffer = await QRCode.toBuffer(qrCodeData, {
      width: 300,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.error('Error generating QR code for email:', err);
    // Continue without QR buffer if fails (shouldn't happen)
  }

  // Fetch Corporate Info
  let corporateInfo = {
    companyName: 'MS Cinemas Sdn. Bhd.',
    displayName: 'MS Cinemas',
    address: 'TK1 7-01, Terminal Kampar Putra, 31900 Kampar, Perak',
    email: 'admin@mscinemas.my',
    phone: '',
    website: 'www.mscinemas.my',
    logo: 'https://image.mscinemas.my/webimg/graphics_web/MSCinemas178_100.png'
  };

  try {
    const corpResponse = await fetch('http://cinemaapi5.ddns.net/api/CorporateDetails/GetCorporateInfo');
    if (corpResponse.ok) {
      const corpData = await corpResponse.json();
      corporateInfo = {
        companyName: corpData.companyName || corporateInfo.companyName,
        displayName: corpData.displayName || corporateInfo.displayName,
        address: corpData.address || corporateInfo.address,
        city: corpData.city || '',
        state: corpData.state || '',
        zip: corpData.zip || '',
        country: corpData.country || '',
        email: corpData.email || corporateInfo.email,
        phone: corpData.phone || corporateInfo.phone,
        website: corpData.webUrl || corporateInfo.website,
        logo: corpData.logo || corporateInfo.logo
      };
    }
  } catch (error) {
    console.warn('Failed to fetch corporate info for email:', error);
  }

  // Format full address
  const formatAddressHtml = (info) => {
    let addr = info.address || '';
    // Replace \r<br> or \n with <br>
    addr = addr.replace(/\\r<br>/g, '<br>').replace(/\r\n/g, '<br>').replace(/\n/g, '<br>');
    
    const cityStateZip = [info.zip, info.city, info.state].filter(Boolean).join(' ');
    const country = info.country || '';
    
    return `${addr}<br>${cityStateZip}<br>${country}`;
  };

  const formatAddressText = (info) => {
    let addr = info.address || '';
    // Replace \r<br> or <br> with \n
    addr = addr.replace(/\\r<br>/g, '\n').replace(/<br>/g, '\n').replace(/\r\n/g, '\n');
    
    const cityStateZip = [info.zip, info.city, info.state].filter(Boolean).join(' ');
    const country = info.country || '';
    
    return `${addr}\n${cityStateZip}\n${country}`;
  };

  const fullAddressHtml = formatAddressHtml(corporateInfo);
  const fullAddressText = formatAddressText(corporateInfo);

  const printedDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  // Seats string
  const seatsString = seatDisplay.map(g => `${g.type}: ${g.seats.join(', ')}`).join(' | ');

  /* CSS Styles for Dark Theme */
  const colors = {
    gold: '#FFCA20',
    dark: '#1a1a1a',
    darker: '#111111',
    light: '#ffffff',
    gray: '#888888',
    border: '#333333',
    tableHeader: '#000000',
    tableRow: '#222222'
  };

  const subject = `Your Ticket: ${movieName} - ${corporateInfo.displayName}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Ticket Confirmation</title>
    </head>
    <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.5; color: ${colors.light}; margin: 0; padding: 0; background-color: ${colors.darker};">
      
      <!-- Main Container -->
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: ${colors.darker}; padding: 20px;">
        <tr>
          <td align="center">
            
            <div style="max-width: 600px; margin: 0 auto; background-color: ${colors.dark}; border: 1px solid ${colors.border}; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
              
              <!-- Header -->
              <div style="background-color: #000000; padding: 30px 20px; text-align: center; border-bottom: 3px solid ${colors.gold};">
                <img src="${corporateInfo.logo || 'https://image.mscinemas.my/webimg/graphics_web/MSCinemas178_100.png'}" alt="${corporateInfo.displayName}" style="max-height: 80px; width: auto; display: block; margin: 0 auto 15px auto;" />
                <div style="color: ${colors.gray}; font-size: 11px; line-height: 1.4;">
                  <strong style="color: ${colors.light}; font-size: 14px;">MS CINEMAS SDN BHD</strong><br>

                 
TK1 7-01, <br>
Terminal Kampar Putra,<br>
PT53493 & PT53494,<br>
Jalan Putra Permata 9,<br>
Taman Kampar<br>
31900 Kampar, Perak<br>
Malaysia
                </div>
              </div>

              <div style="padding: 30px;">
                
                <p style="color: ${colors.gray}; font-size: 13px; margin-bottom: 25px; text-align: center;">
                  Dear Customer, thank you for choosing <strong style="color: ${colors.gold};">${corporateInfo.displayName}</strong>.<br>
                  Please exchange this receipt at the box office for your ticket.
                </p>

                <!-- Info Grid -->
                <table width="100%" border="0" cellspacing="0" cellpadding="5" style="margin-bottom: 30px; border-collapse: collapse;">
                  <tr>
                    <td width="35%" style="color: ${colors.gray}; font-weight: bold; border-bottom: 1px solid ${colors.border};">Name:</td>
                    <td style="color: ${colors.light}; border-bottom: 1px solid ${colors.border};">${customerName}</td>
                  </tr>
                  <tr>
                    <td style="color: ${colors.gray}; font-weight: bold; border-bottom: 1px solid ${colors.border};">Tel. No:</td>
                    <td style="color: ${colors.light}; border-bottom: 1px solid ${colors.border};">${customerPhone}</td>
                  </tr>
                  <tr>
                    <td style="color: ${colors.gray}; font-weight: bold; border-bottom: 1px solid ${colors.border};">Email:</td>
                    <td style="color: ${colors.light}; border-bottom: 1px solid ${colors.border};">${customerEmail}</td>
                  </tr>
                  <tr>
                    <td style="color: ${colors.gray}; font-weight: bold; border-bottom: 1px solid ${colors.border};">Order No:</td>
                    <td style="color: ${colors.gold}; font-family: monospace; font-size: 14px; border-bottom: 1px solid ${colors.border};">${bookingId}</td>
                  </tr>
                  <tr>
                    <td style="color: ${colors.gray}; font-weight: bold; border-bottom: 1px solid ${colors.border};">Transaction No:</td>
                    <td style="color: ${colors.light}; font-family: monospace; border-bottom: 1px solid ${colors.border};">${trackingId}</td>
                  </tr>
                  <tr>
                    <td style="color: ${colors.gray}; font-weight: bold; border-bottom: 1px solid ${colors.border};">Printed On:</td>
                    <td style="color: ${colors.light}; border-bottom: 1px solid ${colors.border};">${printedDate}</td>
                  </tr>
                </table>

                <!-- QR Code Section -->
                <div style="text-align: center; margin-bottom: 30px; padding: 20px; background-color: #000000; border-radius: 8px; border: 1px dashed ${colors.border};">
                  <div style="color: ${colors.gold}; font-weight: bold; font-size: 18px; margin-bottom: 15px; letter-spacing: 2px; font-family: monospace;">${referenceNo}</div>
                  <div style="background-color: ${colors.light}; padding: 10px; display: inline-block; border-radius: 4px;">
                    <img src="cid:qrcode" alt="QR Code" width="160" height="160" style="display: block;" />
                  </div>
                  <div style="color: ${colors.gray}; font-size: 11px; margin-top: 10px; text-transform: uppercase; letter-spacing: 1px;">Scan at Entrance</div>
                </div>

                <!-- Booking Details Table -->
                <h3 style="color: ${colors.gold}; margin-top: 0; border-bottom: 1px solid ${colors.border}; padding-bottom: 10px; font-size: 16px; text-transform: uppercase;">Booking Details</h3>
                <table width="100%" border="0" cellspacing="0" cellpadding="10" style="margin-bottom: 20px; border-collapse: separate; border-spacing: 0; width: 100%;">
                  <thead>
                    <tr style="background-color: ${colors.tableHeader};">
                      <th align="left" style="color: ${colors.gray}; font-size: 11px; text-transform: uppercase; padding: 10px; border-top-left-radius: 4px;">Date</th>
                      <th align="left" style="color: ${colors.gray}; font-size: 11px; text-transform: uppercase; padding: 10px;">Time</th>
                      <th align="left" style="color: ${colors.gray}; font-size: 11px; text-transform: uppercase; padding: 10px; border-top-right-radius: 4px;">Movie</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style="background-color: ${colors.tableRow};">
                      <td style="border-bottom: 1px solid ${colors.border}; color: ${colors.light}; font-weight: bold;">${formatDate(showDate)}</td>
                      <td style="border-bottom: 1px solid ${colors.border}; color: ${colors.light}; font-weight: bold;">${formatTime(showTime)}</td>
                      <td style="border-bottom: 1px solid ${colors.border}; color: ${colors.gold}; font-weight: bold;">${movieName.toUpperCase()}</td>
                    </tr>
                  </tbody>
                </table>

                <!-- Ticket Details Table -->
                <table width="100%" border="0" cellspacing="0" cellpadding="10" style="border-collapse: separate; border-spacing: 0; width: 100%; margin-bottom: 20px;">
                  <thead>
                     <tr style="background-color: ${colors.tableHeader};">
                       <th align="left" style="color: ${colors.gray}; font-size: 11px; text-transform: uppercase; padding: 10px; border-top-left-radius: 4px;">Hall</th>
                       <th align="left" style="color: ${colors.gray}; font-size: 11px; text-transform: uppercase; padding: 10px;">Seat</th>
                       <th align="left" style="color: ${colors.gray}; font-size: 11px; text-transform: uppercase; padding: 10px;">Type</th>
                       <th align="right" style="color: ${colors.gray}; font-size: 11px; text-transform: uppercase; padding: 10px;">Price</th>
                       <th align="right" style="color: ${colors.gray}; font-size: 11px; text-transform: uppercase; padding: 10px;">Surcharge</th>
                       <th align="right" style="color: ${colors.gray}; font-size: 11px; text-transform: uppercase; padding: 10px; border-top-right-radius: 4px;">Total</th>
                     </tr>
                  </thead>
                  <tbody>
                    ${(() => {
                        let calcSubCharge = 0;
                        let calcGrandTotal = 0;
                        
                        // Render Rows
                        const rows = ticketDetails.map((t, index) => {
                           // 1. Price Components
                           const price = parseFloat(t.Price || t.price || t.TicketPrice || t.ticketPrice || 0);
                           const eTax = parseFloat(t.entertainmentTax || t.EntertainmentTax || 0);
                           const gTax = parseFloat(t.govtTax || t.GovtTax || 0);
                           
                           // 2. Charge Components
                           const onlineCharge = parseFloat(t.onlineCharge || t.OnlineCharge || 0);
                           const sur = parseFloat(t.Surcharge || t.surcharge || t.surCharge || 0);
                           const ticketTotal = parseFloat(t.totalTicketPrice || t.TotalTicketPrice || 0);
                           
                           // 3. Display Logic
                           // Price = Base + Entertainment Tax + Govt Tax
                           const displayPrice = price + eTax + gTax;
                           
                           // Surcharge = Surcharge ONLY (exclude Online Charge)
                           const displaySurcharge = sur;
                           
                           // Row Total = Total Ticket Price - Online Charge
                           // If totalTicketPrice is missing of 0, fallback to (Price + Tax + Surcharge)
                           // NOTE: User said totalTicketPrice is always correct.
                           const rowTotal = ticketTotal ? (ticketTotal - onlineCharge) : (displayPrice + displaySurcharge);
                           
                           // Accumulate totals
                           calcSubCharge += onlineCharge; 
                           // Grand Total = Sum of all Ticket Total Prices
                           calcGrandTotal += ticketTotal || (rowTotal + onlineCharge);

                           const rowColor = index % 2 === 0 ? colors.tableRow : '#2a2a2a';
                           
                           // Fix Ticket Type Mapping (Added ticketTypeName support)
                           const type = t.ticketTypeName || t.TicketTypeName || t.TicketType || t.ticketType || t.Type || t.type || 'Adult';
                           const seat = t.SeatNo || t.seatNo || t.Seat || t.seat || '';
                           
                           return `
                           <tr style="background-color: ${rowColor};">
                             <td style="border-bottom: 1px solid ${colors.border}; color: ${colors.light};">${hallName}</td>
                             <td style="border-bottom: 1px solid ${colors.border}; color: ${colors.gold}; font-weight: bold;">${seat.replace(/[A-Za-z]+/, '').padStart(2, '0') ? seat : seat}</td>
                             <td style="border-bottom: 1px solid ${colors.border}; color: ${colors.light}; font-size: 12px;">${type}</td>
                             <td align="right" style="border-bottom: 1px solid ${colors.border}; color: ${colors.light};">RM${displayPrice.toFixed(2)}</td>
                             <td align="right" style="border-bottom: 1px solid ${colors.border}; color: ${colors.light};">RM${displaySurcharge.toFixed(2)}</td>
                             <td align="right" style="border-bottom: 1px solid ${colors.border}; color: ${colors.light}; font-weight: bold;">RM${rowTotal.toFixed(2)}</td>
                           </tr>
                           `;
                        }).join('');

                        // Output with calculated totals
                        return `
                          ${rows}
                          <!-- Totals -->
                          <tr style="background-color: #000000;">
                            <td colspan="5" align="right" style="padding: 15px; text-transform: uppercase; font-size: 12px; color: ${colors.gray}; border-top: 1px solid ${colors.gold};">Sub Charge</td>
                            <td align="right" style="padding: 15px; color: ${colors.light}; border-top: 1px solid ${colors.gold};">RM${calcSubCharge.toFixed(2)}</td>
                          </tr>
                          <tr style="background-color: #000000;">
                            <td colspan="5" align="right" style="padding: 15px; text-transform: uppercase; font-size: 14px; color: ${colors.gold}; font-weight: bold;">Grand Total</td>
                            <td align="right" style="padding: 15px; font-size: 18px; color: ${colors.gold}; font-weight: bold;">RM${calcGrandTotal.toFixed(2)}</td>
                          </tr>
                        `;
                    })()}
                  </tbody>
                </table>

                <!-- Terms -->
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px dashed ${colors.border};">
                  <h3 style="color: ${colors.gray}; font-size: 12px; text-transform: uppercase; margin-bottom: 15px;">Terms & Conditions</h3>
                  
                  <div style="font-size: 10px; color: #666; line-height: 1.6; text-align: justify;">
                    <p style="margin-bottom: 10px;">This document contains the terms and conditions governing your use of this Website and your purchase of any movie tickets, goods or services from MS Cinemas Sdn. Bhd. using this Website.</p>
                    
                    <strong style="color: #888;">APPLICATION OF THESE TERMS AND CONDITIONS</strong>
                    <ol>
                      <li>Your agree that your use of this Website and the purchase of any movie ticket, goods or services will be governed by these terms and conditions ("Terms of Use").</li>
                      <li>If MS Cinemas suffers or incurs any loss or damage in connection with any breach of these Terms of Use you agree to indemnify MS Cinemas for those losses and damages.</li>
                    </ol>

                    <strong style="color: #888;">REGISTRATION</strong>
                    <ol>
                      <li>You may be asked to provide Personal Information to MS Cinemas before purchasing any movie ticket, goods or services from this Website, before entering any competition on the Website or before registering as a member of this Website. If you do not provide that Personal Information to MS Cinemas, MS Cinemas may not be able to sell you movie tickets, goods or services, enter you into that competition or register you as a member. </li>
                      <li>All Personal Information MS Cinemas collects from this Website will be maintained in accordance with MS Cinema's Privacy Policy.</li>
                      <li>You acknowledge that if you do not register as a member of this Website, parts of this Website designed for registered members may not be accessible to you. Employees of MS Cinemas and its related bodies corporate are entitled to become members of the Website, but are not entitled to enter any competitions on the Website.</li>
                      <li>MS Cinemas will use its reasonable endeavors to maintain the security of any Personal Information that you provide. This Website has security measures in place to protect the loss, misuse and alteration of the information under MS Cinema's control. However, no data transmission over the internet can be completely secure, and MS Cinemas cannot give an absolute assurance that the information you provide to us will be secure at all times.</li>
                      <li>MS Cinemas may use techniques designed to identify fraudulent activities on the Website, such as fraudulent activities on the Website, such as fraudulent credit card use. If any unauthorized use of your credit card occurs as a result of your credit card purchase on the Website, you should notify your credit card provider in accordance with its reporting rules and procedures.</li>
                      <li>You agree that MS Cinemas may cancel your registration as a member and/or refuse you access to this Website at any time in its sole discretion.</li>
                    </ol>
                  </div>
                </div>

              </div>
            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const text = `
    
    Ref No: ${referenceNo}
    Date: ${formatDate(showDate)}
    Time: ${formatTime(showTime)}
    Hall: ${hallName}
    Seats: ${seatsString}
    
    Cinema: ${cinemaName}
    Total Paid: RM${parseFloat(ticketData.grandTotal).toFixed(2)}
    
    Please show the QR Code attached to this email at the entrance.
    
    ${corporateInfo.companyName}
    ${fullAddressText}
  `;

  // Attachments array
  const attachments = [];
  if (qrCodeBuffer) {
    attachments.push({
      filename: 'qrcode.png',
      content: qrCodeBuffer,
      cid: 'qrcode' // Matches src="cid:qrcode"
    });
  }

  // Pass attachments to sendEmail 
  // IMPORTANT: We need to modify sendEmail to support attachments or assume it passes ...options through
  
  // Checking sendEmail implementation:
  // It constructs mailOptions manually. We need to make sure it handles 'attachments'.
  // We'll update calls below.
  
  const emailFrom = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  
  // Since sendEmail wrapper might not support attachments directly in its arguments deconstruction,
  // we might need to bypass it or update it. 
  // Let's check sendEmail again. It takes { to, subject, html, text, from }.
  // We need to update sendEmail to accept 'attachments'.
  
  // For now, let's assume we update sendEmail to accept 'attachments' (I will do this in the same file step).
  // Send email with attachments (QR code)
  return await sendEmail({ 
    to, 
    subject, 
    html, 
    text, 
    attachments 
  });
}

// ... sendEmail implementation needs small update to accept attachments


export const resendTicketEmail = async (to, ticketData) => {
  console.log(`[Email Service] Resending ticket to ${to}`);
  return await sendTicketEmail(to, ticketData);
};

export default {
  sendEmail,
  sendActivationEmail,
  sendForgotPasswordEmail,
  sendTicketEmail,
  resendTicketEmail
};