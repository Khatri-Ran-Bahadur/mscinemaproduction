
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/utils/email';
import { verifyRecaptcha } from '@/utils/recaptcha';

// Helper function to sanitize input and prevent XSS
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  // Remove any HTML tags and script tags
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}

// Helper function to escape HTML for email display
function escapeHtml(text) {
  if (typeof text !== 'string') return text;
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function POST(request) {
  try {
    const body = await request.json();
    let { name, email, phone, subject, message, recaptchaToken } = body;

    // Sanitize all inputs to prevent XSS
    name = sanitizeInput(name);
    email = sanitizeInput(email);
    phone = sanitizeInput(phone);
    subject = sanitizeInput(subject);
    message = sanitizeInput(message);

    // Verify Recaptcha
    const isCaptchaValid = await verifyRecaptcha(recaptchaToken);
    if (!isCaptchaValid) {
      return NextResponse.json({ error: 'Recaptcha verification failed' }, { status: 400 });
    }

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Additional validation: check for suspicious patterns
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i, // onclick=, onload=, etc.
      /<iframe/i,
      /eval\(/i
    ];

    const allInputs = [name, email, phone, subject, message].join(' ');
    if (suspiciousPatterns.some(pattern => pattern.test(allInputs))) {
      return NextResponse.json({ error: 'Invalid input detected' }, { status: 400 });
    }

    // Save to DB
    const newMessage = await prisma.contactMessage.create({
      data: {
        name,
        email,
        phone: phone || null,
        subject,
        message,
      },
    });

    // Get Recipient Email from Settings
    const setting = await prisma.setting.findUnique({
      where: { key: 'contact_recipient_email' },
    });
    
    // Fallback email if not set
    const recipientEmail = setting?.value || process.env.EMAIL_FROM || 'admin@mscinemas.my';

    // Send Email with escaped HTML to prevent XSS in email clients
    const emailHtml = `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(phone || 'N/A')}</p>
      <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
      <hr />
      <h3>Message:</h3>
      <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
      <br />
      <p><small>Sent from MS Cinemas Contact Form</small></p>
    `;

    await sendEmail({
      to: recipientEmail,
      subject: `[Contact Form] ${escapeHtml(subject)} - ${escapeHtml(name)}`,
      html: emailHtml,
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nSubject: ${subject}\n\nMessage:\n${message}`
    });

    return NextResponse.json({ success: true, message: 'Message sent successfully', data: newMessage });

  } catch (error) {
    console.error('Contact API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
