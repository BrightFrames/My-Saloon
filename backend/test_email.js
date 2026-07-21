const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmails() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const testEmail = process.env.SMTP_USER;
  console.log('Sending Test Email 1: Request Received to', testEmail);
  try {
    const info1 = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: testEmail,
      subject: 'Booking Request Received - Test',
      html: '<h1>Test Email 1: Booking Request Received</h1><p>The salon will confirm within 15 minutes.</p>',
    });
    console.log('Email 1 Sent:', info1.messageId);
  } catch (err) {
    console.error('Email 1 Failed:', err);
  }

  console.log('Sending Test Email 2: Slot Confirmed to', testEmail);
  try {
    const info2 = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: testEmail,
      subject: '🎉 Slot Confirmed! - Test',
      html: '<h1>Test Email 2: Slot Confirmed!</h1><p>Your slot is locked.</p>',
    });
    console.log('Email 2 Sent:', info2.messageId);
  } catch (err) {
    console.error('Email 2 Failed:', err);
  }
}

testEmails();
