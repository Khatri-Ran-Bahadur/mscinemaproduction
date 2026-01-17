
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendEmail } from '@/utils/email';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, phone, subject, message } = body;

    // Validate
    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Save to DB
    const newMessage = await prisma.contactMessage.create({
      data: {
        name,
        email,
        phone,
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

    // Send Email
    const emailHtml = `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <hr />
      <h3>Message:</h3>
      <p>${message.replace(/\n/g, '<br>')}</p>
      <br />
      <p><small>Sent from MS Cinemas Contact Form</small></p>
    `;

    await sendEmail({
      to: recipientEmail,
      subject: `[Contact Form] ${subject} - ${name}`,
      html: emailHtml,
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nSubject: ${subject}\n\nMessage:\n${message}`
    });

    return NextResponse.json({ success: true, message: 'Message sent successfully', data: newMessage });

  } catch (error) {
    console.error('Contact API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
