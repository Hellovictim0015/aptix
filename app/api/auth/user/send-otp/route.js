import { query, queryOne } from "@/lib/db";
import { createOtp, isReviewTestPhone } from "@/lib/otp";
import { sendWhatsAppOtp } from "@/lib/whatsapp";
import { normalizeIndianPhone } from "@/lib/validate";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const phone = normalizeIndianPhone(body.phone);

  if (!phone) {
    return Response.json({ error: "Please enter a valid 10-digit mobile number" }, { status: 400 });
  }

  const existing = await queryOne("SELECT id, status FROM users WHERE phone = ?", [phone]);
  if (existing?.status === "blocked") {
    return Response.json({ error: "This account has been blocked. Contact support." }, { status: 403 });
  }

  const { otp, waitSeconds } = await createOtp({ phone }, "user_login");
  if (!otp) {
    return Response.json(
      { error: `Please wait ${waitSeconds}s before requesting another OTP.` },
      { status: 429 }
    );
  }

  try {
    // Review test number uses its fixed OTP; nothing is sent on WhatsApp.
    if (!isReviewTestPhone(phone)) await sendWhatsAppOtp(phone, otp);
  } catch (err) {
    console.error("WhatsApp OTP send failed:", err.message);
    return Response.json(
      { error: "Could not send the WhatsApp OTP right now. Please try again in a minute." },
      { status: 502 }
    );
  }

  // Create the account only once an OTP actually went out.
  if (!existing) {
    await query("INSERT IGNORE INTO users (phone) VALUES (?)", [phone]);
  }

  return Response.json({ ok: true });
}
