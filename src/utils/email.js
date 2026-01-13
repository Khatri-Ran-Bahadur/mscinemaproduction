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
export async function sendEmail({ to, subject, html, text, from }) {
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

    const emailFrom = from || process.env.EMAIL_FROM || process.env.EMAIL_USER;

    const mailOptions = {
      from: emailFrom,
      to: to,
      subject: subject,
      html: html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for plain text fallback
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
 * Send ticket confirmation email with ticket details and barcode
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
export async function sendTicketEmail(to, ticketInfo) {
  const {
    customerName = 'Guest',
    customerPhone = '',
    customerEmail = '',
    movieName = 'Unknown Movie',
    movieImage = '/img/banner.jpg',
    genre = 'N/A',
    duration = 'N/A',
    language = 'English',
    experienceType = 'Standard',
    hallName = 'N/A',
    cinemaName = 'N/A',
    showDate = '',
    showTime = '',
    seatDisplay = [],
    ticketDetails = [], // Array of {seatNo, ticketType, price, surcharge}
    totalPersons = 0,
    bookingId = 'N/A',
    trackingId = 'N/A',
    subCharge = 0,
    grandTotal = 0,
  } = ticketInfo;

  // Format date and time
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const day = date.getDate();
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
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

  // Generate barcode URL
  const barcodeUrl = `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(bookingId)}&code=Code128&translate-esc=on`;

  // Format printed date
  const printedDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  // Build ticket details table rows
  const buildTicketRows = () => {
    if (ticketDetails && ticketDetails.length > 0) {
      return ticketDetails.map((ticket, index) => {
        const seatNo = ticket.SeatNo || ticket.seatNo || ticket.Seat || ticket.seat || '';
        const ticketType = ticket.TicketType || ticket.ticketType || ticket.Type || ticket.type || 'ADULT';
        const price = ticket.Price || ticket.price || ticket.TicketPrice || ticket.ticketPrice || 0;
        const surcharge = ticket.Surcharge || ticket.surcharge || 0;
        const total = parseFloat(price) + parseFloat(surcharge);
        
        return `
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px; text-align: left;">${hallName}</td>
            <td style="padding: 8px; text-align: center;">${seatNo}</td>
            <td style="padding: 8px; text-align: center;">${ticketType.toUpperCase()}</td>
            <td style="padding: 8px; text-align: right;">RM${parseFloat(price).toFixed(2)}</td>
            <td style="padding: 8px; text-align: right;">RM${parseFloat(surcharge).toFixed(2)}</td>
            <td style="padding: 8px; text-align: right;">RM${total.toFixed(2)}</td>
          </tr>
        `;
      }).join('');
    }
    
    // Fallback to seatDisplay if ticketDetails not available
    if (seatDisplay && seatDisplay.length > 0) {
      return seatDisplay.map((group) => {
        return group.seats.map((seat) => `
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px; text-align: left;">${hallName}</td>
            <td style="padding: 8px; text-align: center;">${seat}</td>
            <td style="padding: 8px; text-align: center;">${group.type.toUpperCase()}</td>
            <td style="padding: 8px; text-align: right;">RM0.00</td>
            <td style="padding: 8px; text-align: right;">RM0.00</td>
            <td style="padding: 8px; text-align: right;">RM0.00</td>
          </tr>
        `).join('');
      }).join('');
    }
    
    return '<tr><td colspan="6" style="padding: 8px; text-align: center;">No ticket details available</td></tr>';
  };

  const subject = `Your MS Cinema Ticket - ${movieName}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Ticket - ${movieName}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background-color: #ffffff; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <!-- Company Header -->
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
          <h1 style="color: #333; margin: 0 0 10px 0; font-size: 24px; font-weight: bold;">MS CINEMAS SDN BHD</h1>
          <div style="color: #666; font-size: 12px; line-height: 1.8;">
            <p style="margin: 2px 0;">TK1 7-01,</p>
            <p style="margin: 2px 0;">Terminal Kampar Putra,</p>
            <p style="margin: 2px 0;">PT53493 & PT53494,</p>
            <p style="margin: 2px 0;">Jalan Putra Permata 9,</p>
            <p style="margin: 2px 0;">Taman Kampar</p>
            <p style="margin: 2px 0;">31900 Kampar, Perak</p>
            <p style="margin: 2px 0;">Malaysia</p>
          </div>
        </div>

        <!-- Customer Information -->
        <div style="margin-bottom: 20px;">
          <p style="color: #333; font-size: 14px; margin: 5px 0;"><strong>Dear Customer,</strong></p>
          <p style="color: #666; font-size: 12px; margin: 10px 0; line-height: 1.6;">
            Thank you for your interest in MS Cinemas. Please note, this is not your ticket. Exchange this at the box office for your ticket. Your booking details are furnished below.
          </p>
        </div>

        <div style="margin-bottom: 20px; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #FFCA20;">
          <p style="color: #333; font-size: 13px; margin: 5px 0;"><strong>Name:</strong> ${customerName}</p>
          <p style="color: #333; font-size: 13px; margin: 5px 0;"><strong>Tel. No:</strong> ${customerPhone || 'N/A'}</p>
          <p style="color: #333; font-size: 13px; margin: 5px 0;"><strong>Email:</strong> ${customerEmail || to}</p>
          <p style="color: #333; font-size: 13px; margin: 5px 0;"><strong>Order No:</strong> ${bookingId}</p>
          <p style="color: #333; font-size: 13px; margin: 5px 0;"><strong>Payment Transaction No:</strong> ${trackingId}</p>
          <p style="color: #333; font-size: 13px; margin: 5px 0;"><strong>Printed On:</strong> ${printedDate}</p>
        </div>

        <!-- Barcode -->
        <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f9f9f9;">
          <div style="font-family: 'Courier New', monospace; font-size: 24px; font-weight: bold; letter-spacing: 3px; margin-bottom: 10px;">
            ${bookingId}
          </div>
          <img src="${barcodeUrl}" alt="Barcode" style="height: 60px; width: auto; max-width: 100%;" />
        </div>

        <!-- Booking Details -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #333; font-size: 18px; font-weight: bold; margin-bottom: 15px; border-bottom: 2px solid #333; padding-bottom: 5px;">Booking Details</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr style="background-color: #f0f0f0;">
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd; font-weight: bold;">Date</th>
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd; font-weight: bold;">Time</th>
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd; font-weight: bold;">Movie</th>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;">${formatDate(showDate)}</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${formatTime(showTime)}</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${movieName.toUpperCase()}</td>
            </tr>
          </table>

          <table style="width: 100%; border-collapse: collapse;">
            <tr style="background-color: #f0f0f0;">
              <th style="padding: 8px; text-align: left; border: 1px solid #ddd; font-weight: bold;">Hall</th>
              <th style="padding: 8px; text-align: center; border: 1px solid #ddd; font-weight: bold;">Seat No</th>
              <th style="padding: 8px; text-align: center; border: 1px solid #ddd; font-weight: bold;">Ticket Type</th>
              <th style="padding: 8px; text-align: right; border: 1px solid #ddd; font-weight: bold;">Ticket Price</th>
              <th style="padding: 8px; text-align: right; border: 1px solid #ddd; font-weight: bold;">Surcharge</th>
              <th style="padding: 8px; text-align: right; border: 1px solid #ddd; font-weight: bold;">Total</th>
            </tr>
            ${buildTicketRows()}
            <tr style="background-color: #f9f9f9;">
              <td colspan="5" style="padding: 8px; text-align: right; border: 1px solid #ddd; font-weight: bold;">Sub Charge(RM)</td>
              <td style="padding: 8px; text-align: right; border: 1px solid #ddd; font-weight: bold;">RM${parseFloat(subCharge || 0).toFixed(2)}</td>
            </tr>
            <tr style="background-color: #FFCA20; font-weight: bold;">
              <td colspan="5" style="padding: 10px; text-align: right; border: 1px solid #ddd;">Grand Total(RM)</td>
              <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">RM${parseFloat(grandTotal || 0).toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <!-- Terms & Conditions -->
        <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #ddd;">
          <h3 style="color: #333; font-size: 16px; font-weight: bold; margin-bottom: 15px;">Terms & Conditions</h3>
          <div style="color: #666; font-size: 11px; line-height: 1.6;">
            <p style="margin: 8px 0;"><strong>APPLICATION OF THESE TERMS AND CONDITIONS</strong></p>
            <p style="margin: 8px 0;">Your agree that your use of this Website and the purchase of any movie ticket, goods or services will be governed by these terms and conditions ("Terms of Use")</p>
            <p style="margin: 8px 0;">If MS Cinemas suffers or incurs any loss or damage in connection with any breach of these Terms of Use you agree to indemnify MS Cinemas for those losses and damages.</p>
            
            <p style="margin: 8px 0; margin-top: 15px;"><strong>REGISTRATION</strong></p>
            <p style="margin: 8px 0;">You may be asked to provide Personal Information to MS Cinemas before purchasing any movie ticket, goods or services from this Website, before entering any competition on the Website or before registering as a member of this Website. If you do not provide that Personal Information to MS Cinemas, MS Cinemas may not be able to sell you movie tickets, goods or services, enter you into that competition or register you as a member.</p>
            <p style="margin: 8px 0;">All Personal Information MS Cinemas collects from this Website will be maintained in accordance with MS Cinema's Privacy Policy.</p>
            <p style="margin: 8px 0;">You acknowledge that if you do not register as a member of this Website, parts of this Website designed for registered members may not be accessible to you. Employees of MS Cinemas and its related bodies corporate are entitled to become members of the Website, but are not entitled to enter any competitions on the Website.</p>
            <p style="margin: 8px 0;">MS Cinemas will use its reasonable endeavors to maintain the security of any Personal Information that you provide. This Website has security measures in place to protect the loss, misuse and alteration of the information under MS Cinema's control. However, no data transmission over the internet can be completely secure, and MS Cinemas cannot give an absolute assurance that the information you provide to us will be secure at all times.</p>
            <p style="margin: 8px 0;">MS Cinemas may use techniques designed to identify fraudulent activities on the Website, such as fraudulent activities on the Website, such as fraudulent credit card use. If any unauthorized use of your credit card occurs as a result of your credit card purchase on the Website, you should notify your credit card provider in accordance with its reporting rules and procedures.</p>
            <p style="margin: 8px 0;">You agree that MS Cinemas may cancel your registration as a member and/or refuse you access to this Website at any time in its sole discretion.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  const text = `
MS CINEMAS SDN BHD
TK1 7-01, Terminal Kampar Putra, PT53493 & PT53494, Jalan Putra Permata 9, Taman Kampar, 31900 Kampar, Perak, Malaysia

Dear Customer,

Thank you for your interest in MS Cinemas. Please note, this is not your ticket. Exchange this at the box office for your ticket. Your booking details are furnished below.

Name: ${customerName}
Tel. No: ${customerPhone || 'N/A'}
Email: ${customerEmail || to}
Order No: ${bookingId}
Payment Transaction No: ${trackingId}
Printed On: ${printedDate}

${bookingId}

Booking Details
Date: ${formatDate(showDate)}
Time: ${formatTime(showTime)}
Movie: ${movieName.toUpperCase()}

Hall | Seat No | Ticket Type | Ticket Price | Surcharge | Total
${ticketDetails && ticketDetails.length > 0 ? ticketDetails.map(t => 
  `${hallName} | ${t.SeatNo || t.seatNo || ''} | ${(t.TicketType || t.ticketType || 'ADULT').toUpperCase()} | RM${(t.Price || t.price || 0).toFixed(2)} | RM${(t.Surcharge || t.surcharge || 0).toFixed(2)} | RM${(parseFloat(t.Price || t.price || 0) + parseFloat(t.Surcharge || t.surcharge || 0)).toFixed(2)}`
).join('\n') : 'No ticket details'}

Sub Charge(RM): RM${parseFloat(subCharge || 0).toFixed(2)}
Grand Total(RM): RM${parseFloat(grandTotal || 0).toFixed(2)}

Terms & Conditions
This document contains the terms and conditions governing your use of this Website and your purchase of any movie tickets, goods or services from MS Cinemas Sdn. Bhd. using this Website.
  `;

  return await sendEmail({ to, subject, html, text });
}

export default {
  sendEmail,
  sendActivationEmail,
  sendForgotPasswordEmail,
  sendTicketEmail,
};

