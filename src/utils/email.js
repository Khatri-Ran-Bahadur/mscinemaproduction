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
    totalPersons = 0,
    bookingId = 'N/A',
    trackingId = 'N/A',
  } = ticketInfo;

  // Format date and time
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

  // Format seat display
  const seatDisplayText = seatDisplay.length > 0
    ? seatDisplay.map((group, idx) => 
        `${idx > 0 ? ' | ' : ''}${group.type} ${group.seats.join(', ')}`
      ).join('')
    : 'No seat information';

  const subject = `Your MS Cinema Ticket - ${movieName}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Ticket - ${movieName}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #1c1c1c;">
      <div style="background-color: #2a2a2a; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
        <!-- Movie Poster Section -->
        <div style="position: relative; width: 100%; height: 300px; background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);">
          <img src="${movieImage}" alt="${movieName}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://via.placeholder.com/600x300/1a1a1a/FFCA20?text=${encodeURIComponent(movieName)}';" />
          <div style="position: absolute; top: 20px; left: 20px; background-color: rgba(0,0,0,0.7); padding: 10px 15px; border-radius: 5px;">
            <h2 style="color: #FFCA20; margin: 0; font-size: 24px; font-weight: bold; text-transform: uppercase;">
              ${movieName}
            </h2>
          </div>
        </div>

        <!-- Movie Title Section -->
        <div style="padding: 20px; border-bottom: 2px dashed #4a4a4a;">
          <h3 style="color: #FAFAFA; font-size: 22px; font-weight: bold; margin: 0 0 10px 0;">${movieName}</h3>
          <p style="color: #D3D3D3; font-size: 14px; margin: 0;">
            ${genre} | ${duration} | ${language}
          </p>
        </div>

        <!-- Ticket Holder Section -->
        <div style="padding: 20px; border-bottom: 2px dashed #4a4a4a;">
          <h4 style="color: #FAFAFA; font-size: 18px; font-weight: bold; margin: 0 0 10px 0;">${customerName}</h4>
          <p style="color: #D3D3D3; font-size: 14px; margin: 5px 0;">
            ${experienceType} | ${hallName}
          </p>
          <p style="color: #D3D3D3; font-size: 14px; margin: 5px 0;">
            ${formatDate(showDate)} | ${formatTime(showTime)}
          </p>
        </div>

        <!-- Seat and Booking Details Section -->
        <div style="padding: 20px; border-bottom: 2px dashed #4a4a4a;">
          <!-- Seat Information -->
          <div style="margin-bottom: 15px;">
            <p style="color: #FAFAFA; font-size: 14px; margin: 0 0 10px 0;">
              ${seatDisplayText}
            </p>
            <p style="color: #D3D3D3; font-size: 12px; margin: 0 0 15px 0;">${totalPersons} person${totalPersons !== 1 ? 's' : ''}</p>
          </div>
          
          <!-- Booking IDs -->
          <div style="background-color: #1a1a1a; padding: 15px; border-radius: 5px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #D3D3D3; font-size: 14px;">Booking ID</span>
              <span style="color: #FAFAFA; font-size: 14px; font-weight: bold;">${bookingId}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #D3D3D3; font-size: 14px;">Tracking ID</span>
              <span style="color: #FAFAFA; font-size: 14px; font-weight: bold;">${trackingId}</span>
            </div>
          </div>
        </div>

        <!-- Barcode Section -->
        <div style="padding: 30px; background-color: rgba(0,0,0,0.3); text-align: center;">
          <div style="background-color: #FFFFFF; padding: 20px; border-radius: 5px; display: inline-block;">
            <p style="color: #000; font-size: 12px; margin: 0 0 10px 0; font-weight: bold;">SCAN AT ENTRANCE</p>
            <img src="${barcodeUrl}" alt="Barcode" style="height: 80px; width: auto; max-width: 100%;" />
            <p style="color: #000; font-size: 10px; margin: 10px 0 0 0;">${bookingId}</p>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding: 20px; background-color: #1a1a1a; text-align: center;">
          <p style="color: #D3D3D3; font-size: 12px; margin: 0;">
            Please present this ticket at the cinema entrance. Keep this email safe.
          </p>
          <p style="color: #D3D3D3; font-size: 11px; margin: 10px 0 0 0;">
            © ${new Date().getFullYear()} MS Cinema. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  const text = `
Your MS Cinema Ticket - ${movieName}

Movie: ${movieName}
Genre: ${genre} | Duration: ${duration} | Language: ${language}

Ticket Holder: ${customerName}
Experience: ${experienceType} | Hall: ${hallName}
Date: ${formatDate(showDate)} | Time: ${formatTime(showTime)}

Seats: ${seatDisplayText}
Total: ${totalPersons} person${totalPersons !== 1 ? 's' : ''}

Booking ID: ${bookingId}
Tracking ID: ${trackingId}

Please present this ticket at the cinema entrance.
  `;

  return await sendEmail({ to, subject, html, text });
}

export default {
  sendEmail,
  sendActivationEmail,
  sendForgotPasswordEmail,
  sendTicketEmail,
};

