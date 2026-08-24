import nodemailer from 'nodemailer';
import QRCode from 'qrcode';

async function testGmailSMTP(email, pass) {
  console.log(`=== TESTING GMAIL SMTP WITH ${email} ===\n`);

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    service: 'gmail',
    auth: {
      user: email,
      pass: pass.replace(/\s+/g, '')
    }
  });

  const testBookingRef = 'BK-GMAIL-LIVE';
  const qrCodeDataUrl = await QRCode.toDataURL(testBookingRef, { margin: 1 });

  try {
    const info = await transporter.sendMail({
      from: `CinePass Tickets <${email}>`,
      to: email, // Send test email directly to the user's gmail inbox!
      subject: `🎉 Booking Confirmed! Universal Ticket Pass (${testBookingRef})`,
      html: `
        <div style="font-family: Arial; padding: 20px; background: #0f172a; color: white; border-radius: 12px;">
          <h1 style="color: #6366f1;">🎟️ Universal Gmail Ticket Dispatch Active!</h1>
          <p>Your Gmail App Password was successfully authenticated. Real ticket emails will now deliver to <strong>ANY email address in the world</strong>!</p>
        </div>
      `
    });

    console.log(`🎉 SUCCESS! Gmail SMTP authenticated for ${email}! Message ID: ${info.messageId}`);
    return { success: true, email };
  } catch (err) {
    console.log(`❌ Auth failed for ${email}:`, err.message);
    return { success: false, error: err.message };
  }
}

async function run() {
  const candidateEmails = ['kshitijkadyan3@gmail.com', 'davidloomba@gmail.com'];
  const appPass = 'tiioygeayvtswzcz';

  for (const email of candidateEmails) {
    const res = await testGmailSMTP(email, appPass);
    if (res.success) break;
  }
}

run();
