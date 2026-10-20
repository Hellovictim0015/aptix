import { getSetting } from "@/lib/settings";
import { OTP_TTL_MINUTES } from "@/lib/otp";

// WhatsApp OTP delivery through Fast2SMS (https://www.fast2sms.com/dev/otp/send).
// Keys come from Admin → Settings first, then .env.local (FAST2SMS_API_KEY,
// FAST2SMS_OTP_ID). With no API key configured, the OTP is printed to the
// server console instead — handy for local development.
export async function getFast2SmsConfig() {
  const [apiKey, otpId] = await Promise.all([getSetting("fast2sms_api_key"), getSetting("fast2sms_otp_id")]);
  return {
    apiKey: apiKey || process.env.FAST2SMS_API_KEY || "",
    otpId: otpId || process.env.FAST2SMS_OTP_ID || "",
  };
}

export async function sendWhatsAppOtp(phone, otp) {
  const { apiKey, otpId } = await getFast2SmsConfig();

  if (!apiKey) {
    console.log(`[whatsapp-otp:dev] No Fast2SMS key configured. OTP for ${phone}: ${otp}`);
    return;
  }
  if (!otpId) throw new Error("Fast2SMS OTP ID is not configured. Add it in Admin → Settings.");

  const res = await fetch("https://www.fast2sms.com/dev/otp/send", {
    method: "POST",
    headers: { authorization: apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      mobile: phone,
      otp_id: otpId,
      otp,
      otp_length: otp.length,
      otp_expiry: OTP_TTL_MINUTES,
    }),
  });

  const text = await res.text().catch(() => "");
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {}

  // Fast2SMS signals failure with a non-2xx status and/or `"return": false`.
  if (!res.ok || data?.return === false || data?.status === false) {
    const message = Array.isArray(data?.message) ? data.message.join(", ") : data?.message;
    throw new Error(`Fast2SMS send failed (${res.status}): ${message || text.slice(0, 200)}`);
  }
}
