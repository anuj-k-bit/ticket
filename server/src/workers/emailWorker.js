import { Worker } from 'bullmq';
import nodemailer from 'nodemailer';
import { createRedisClient } from '../config/redis.js';

const connection = createRedisClient();

let transporter;

const initTransporter = async () => {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } else {
    // Ethereal / Test SMTP Account Fallback for Development
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    console.log('[Email Worker] Ethereal SMTP test account created:', testAccount.user);
  }
};

initTransporter().catch(console.error);

export const emailWorker = new Worker(
  'emailNotifications',
  async (job) => {
    const { to, userName, bookingRef, showTitle, venueName, startTime, seats, totalAmount, qrCodeDataUrl } = job.data;
    console.log(`[BullMQ Email Worker] Dispatching booking confirmation email to ${to} for Booking ${bookingRef}...`);

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 30px; border-radius: 16px; max-width: 600px; margin: auto;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #818cf8; margin: 0;">🎟️ CinePass Booking Confirmed!</h1>
          <p style="color: #94a3b8; font-size: 14px;">Your tickets have been secured and confirmed.</p>
        </div>

        <div style="background-color: #1e293b; padding: 20px; border-radius: 12px; border: 1px solid #334155; margin-bottom: 20px;">
          <h2 style="color: #ffffff; margin-top: 0;">${showTitle}</h2>
          <p style="color: #cbd5e1; font-size: 14px; margin: 5px 0;">📍 <strong>Venue:</strong> ${venueName}</p>
          <p style="color: #cbd5e1; font-size: 14px; margin: 5px 0;">📅 <strong>Date & Time:</strong> ${new Date(startTime).toLocaleString()}</p>
          <p style="color: #cbd5e1; font-size: 14px; margin: 5px 0;">🎟️ <strong>Booking Ref:</strong> <span style="color: #818cf8; font-weight: bold;">${bookingRef}</span></p>
          <p style="color: #cbd5e1; font-size: 14px; margin: 5px 0;">💺 <strong>Seats:</strong> ${seats.map((s) => `${s.category} (${s.row}-${s.number})`).join(', ')}</p>
          <p style="color: #10b981; font-size: 18px; font-weight: bold; margin-top: 15px;">Total Paid: $${totalAmount}</p>
        </div>

        <div style="text-align: center; background-color: #ffffff; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
          <p style="color: #0f172a; font-weight: bold; font-size: 14px; margin-top: 0;">SCAN QR CODE AT VENUE ENTRANCE</p>
          <img src="${qrCodeDataUrl}" alt="Booking QR Code" style="width: 180px; height: 180px; margin: auto;" />
          <p style="color: #64748b; font-size: 12px; margin-bottom: 0;">Ref: ${bookingRef}</p>
        </div>

        <div style="text-align: center; color: #64748b; font-size: 12px;">
          <p>Thank you for booking with CinePass!</p>
        </div>
      </div>
    `;

    try {
      if (!transporter) await initTransporter();
      const info = await transporter.sendMail({
        from: '"CinePass Tickets" <tickets@cinepass.com>',
        to,
        subject: `🎟️ Booking Confirmed! (${bookingRef}) - ${showTitle}`,
        html: htmlContent
      });

      console.log(`[BullMQ Email Worker] Email dispatched successfully! Message ID: ${info.messageId}`);
      if (nodemailer.getTestMessageUrl(info)) {
        console.log(`[BullMQ Email Worker] View Ethereal test email online: ${nodemailer.getTestMessageUrl(info)}`);
      }
    } catch (err) {
      console.error('[BullMQ Email Worker Error]: Failed to send email:', err.message);
    }
  },
  { connection }
);

emailWorker.on('completed', (job) => {
  console.log(`[BullMQ Email Worker] Job ${job.id} completed successfully.`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`[BullMQ Email Worker] Job ${job?.id} failed:`, err.message);
});
