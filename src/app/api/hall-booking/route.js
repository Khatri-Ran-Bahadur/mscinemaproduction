
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/utils/email';
import { verifyRecaptcha } from '@/utils/recaptcha';

import { sanitizeInput, escapeHtml, hasSuspiciousPatterns } from '@/utils/security.js';

export async function POST(request) {
  try {
    const body = await request.json();
    let { 
      fullName, 
      contactNumber, 
      email, 
      eventType, 
      preferredHall, 
      preferredLocation, 
      date, 
      numberOfPeople,
      recaptchaToken 
    } = body;

    // Sanitize all inputs
    fullName = sanitizeInput(fullName);
    contactNumber = sanitizeInput(contactNumber);
    email = sanitizeInput(email);
    eventType = sanitizeInput(eventType);
    preferredHall = sanitizeInput(preferredHall);
    preferredLocation = sanitizeInput(preferredLocation);
    numberOfPeople = sanitizeInput(numberOfPeople);

    // Check for suspicious patterns
    const allInputs = [fullName, contactNumber, email, eventType, preferredHall, preferredLocation].join(' ');
    if (hasSuspiciousPatterns(allInputs)) {
      return NextResponse.json({ error: 'Invalid input detected' }, { status: 400 });
    }

    // Verify Recaptcha
    const isCaptchaValid = await verifyRecaptcha(recaptchaToken);
    if (!isCaptchaValid) {
      return NextResponse.json({ error: 'Recaptcha verification failed' }, { status: 400 });
    }

    // Validate (basic validation, client side handles most)
    if (!fullName || !email || !contactNumber) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get Recipient Email from Settings
    const setting = await prisma.setting.findUnique({
      where: { key: 'contact_recipient_email' },
    });
    
    // Fallback email if not set
    const recipientEmail = setting?.value || process.env.EMAIL_FROM || 'admin@mscinemas.my';

    // Format Date
    const formattedDate = new Date(date).toLocaleDateString('en-MY', {
        timeZone: 'Asia/Kuala_Lumpur',
        day: 'numeric', month: 'long', year: 'numeric'
    });

    // Send Email with escaped HTML
    const emailHtml = `
      <h2>New Hall Booking Request</h2>
      <p><strong>Name:</strong> ${escapeHtml(fullName)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Contact Number:</strong> ${escapeHtml(contactNumber)}</p>
      <hr />
      <h3>Event Details:</h3>
      <table cellpadding="5" style="border-collapse: collapse; width: 100%;">
        <tr>
          <td style="font-weight: bold; width: 150px;">Event Type:</td>
          <td>${escapeHtml(eventType)}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Preferred Hall:</td>
          <td>${escapeHtml(preferredHall)}</td>
        </tr>
         <tr>
          <td style="font-weight: bold;">Preferred Location:</td>
          <td>${escapeHtml(preferredLocation)}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Preferred Date:</td>
          <td>${escapeHtml(formattedDate)}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Number of People:</td>
          <td>${escapeHtml(numberOfPeople)}</td>
        </tr>
      </table>
      <br />
      <p><small>Sent from MS Cinemas Hall Booking Form</small></p>
    `;

    // Text version (pure text is safer)
    const textVersion = `
      New Hall Booking Request\n
      Name: ${fullName}
      Email: ${email}
      Contact Number: ${contactNumber}\n
      Event Details:
      Event Type: ${eventType}
      Preferred Hall: ${preferredHall}
      Preferred Location: ${preferredLocation}
      Preferred Date: ${formattedDate}
      Number of People: ${numberOfPeople}
    `;

    await sendEmail({
      to: recipientEmail,
      subject: `[Hall Booking] ${escapeHtml(eventType)} - ${escapeHtml(fullName)}`,
      html: emailHtml,
      text: textVersion
    });

    return NextResponse.json({ success: true, message: 'Booking request sent successfully' });

  } catch (error) {
    console.error('Hall Booking API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
