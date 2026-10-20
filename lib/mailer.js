import nodemailer from "nodemailer";

let transporter;

function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }
  return transporter;
}

// Sends an email if SMTP is configured; otherwise logs it to the console so
// local development isn't blocked on real email delivery.
export async function sendMail({ to, subject, html, text }) {
  const t = getTransporter();
  if (!t) {
    console.log(`[mailer] SMTP not configured — logging email instead of sending.\nTo: ${to}\nSubject: ${subject}\n${text || html}`);
    return;
  }
  await t.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
    text,
  });
}

export async function sendOtpEmail(email, otp) {
  await sendMail({
    to: email,
    subject: "Your AptiX login code",
    text: `Your AptiX OTP is ${otp}. It expires in 10 minutes.`,
    html: `<p>Your AptiX login code is:</p><h2 style="letter-spacing:4px">${otp}</h2><p>This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>`,
  });
}

export async function sendAccountDeleteOtpEmail(email, otp) {
  await sendMail({
    to: email,
    subject: "Confirm your AptiX account deletion",
    text: `Your AptiX account deletion code is ${otp}. It expires in 10 minutes. If you didn't request this, ignore this email — your account will not be deleted.`,
    html: `<p>Use this code to confirm you want to permanently delete your AptiX account:</p><h2 style="letter-spacing:4px">${otp}</h2><p>This code expires in 10 minutes. If you didn't request this, ignore this email — your account will not be deleted.</p>`,
  });
}
