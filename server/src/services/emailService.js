import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Configure Nodemailer Transporter dynamically for Gmail SMTP or Resend SMTP
 */
const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';

  const isGmail = host.includes('gmail');

  return nodemailer.createTransport({
    host,
    port,
    secure: false, // TLS
    service: isGmail ? 'gmail' : undefined,
    auth: {
      user,
      pass
    }
  });
};

/**
 * Send Booking Confirmation Email with QR Ticket Pass
 */
export const sendBookingConfirmationEmail = async ({ toEmail, userName, bookingRef, showTitle, venueName, showDate, totalAmountINR, qrCodeDataUrl }) => {
  try {
    const transporter = createTransporter();

    const fromAddress = process.env.SMTP_USER && process.env.SMTP_USER.includes('@gmail.com')
      ? `CinePass Tickets <${process.env.SMTP_USER}>`
      : 'CinePass Tickets <onboarding@resend.dev>';

    const mailOptions = {
      from: fromAddress,
      to: toEmail,
      subject: `🎉 Booking Confirmed! Ticket Pass for ${showTitle} (${bookingRef})`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #ffffff; padding: 30px; border-radius: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b;">
          <div style="text-align: center; border-bottom: 1px solid #1e293b; padding-bottom: 20px; margin-bottom: 20px;">
            <h1 style="color: #6366f1; margin: 0; font-size: 28px;">🎟️ CinePass Tickets</h1>
            <p style="color: #94a3b8; font-size: 14px; margin-top: 5px;">Your Official Digital Entry Pass</p>
          </div>

          <p style="font-size: 16px; color: #e2e8f0;">Hello <strong>${userName}</strong>,</p>
          <p style="font-size: 14px; color: #94a3b8; leading: 1.6;">Your booking for <strong>${showTitle}</strong> has been successfully confirmed!</p>

          <div style="background: #1e293b; border-radius: 16px; padding: 20px; margin: 20px 0; border: 1px solid #334155;">
            <p style="margin: 6px 0; font-size: 14px;"><strong>Booking Reference:</strong> <span style="color: #fbbf24; font-family: monospace; font-size: 16px;">${bookingRef}</span></p>
            <p style="margin: 6px 0; font-size: 14px;"><strong>Event:</strong> ${showTitle}</p>
            <p style="margin: 6px 0; font-size: 14px;"><strong>Venue:</strong> ${venueName}</p>
            <p style="margin: 6px 0; font-size: 14px;"><strong>Date & Time:</strong> ${showDate}</p>
            <p style="margin: 6px 0; font-size: 14px;"><strong>Total Paid:</strong> <span style="color: #34d399; font-weight: bold;">₹${totalAmountINR?.toLocaleString('en-IN')}</span></p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <p style="font-size: 12px; color: #94a3b8; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Scan QR Pass at Venue Gate</p>
            <img src="${qrCodeDataUrl}" alt="QR Ticket Code" style="width: 180px; height: 180px; border-radius: 12px; border: 4px solid #ffffff;" />
          </div>

          <div style="text-align: center; border-top: 1px solid #1e293b; pt: 20px; margin-top: 20px; font-size: 12px; color: #64748b;">
            <p>Thank you for booking with CinePass! Show this email or QR pass at the entrance.</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Sent]: Confirmation email dispatched to ${toEmail} | Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email Dispatch Warning]:', error.message);
    return { success: false, error: error.message };
  }
};
