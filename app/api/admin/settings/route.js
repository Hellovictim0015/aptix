import { cookies } from "next/headers";
import { getAuthFromCookieStore } from "@/lib/auth";
import { getAllSettings, setSetting } from "@/lib/settings";
import { getFast2SmsConfig } from "@/lib/whatsapp";

function maskKey(key) {
  if (!key) return "";
  if (key.length <= 8) return "•".repeat(key.length);
  return `${key.slice(0, 4)}${"•".repeat(10)}${key.slice(-4)}`;
}

export async function GET() {
  const admin = await getAuthFromCookieStore(await cookies(), "admin");
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const [settings, fast2sms] = await Promise.all([getAllSettings(), getFast2SmsConfig()]);
  return Response.json({
    fast2sms_api_key_masked: maskKey(fast2sms.apiKey),
    has_fast2sms_api_key: Boolean(fast2sms.apiKey),
    fast2sms_otp_id: fast2sms.otpId,
    openai_api_key_masked: maskKey(settings.openai_api_key || ""),
    has_openai_api_key: Boolean(settings.openai_api_key),
    openai_model: settings.openai_model || "gpt-4o-mini",
    device_lock_enabled: settings.device_lock_enabled === "true",
    razorpay_key_id: settings.razorpay_key_id || "",
    razorpay_key_secret_masked: maskKey(settings.razorpay_key_secret || ""),
    has_razorpay_key_secret: Boolean(settings.razorpay_key_secret),
    razorpay_webhook_secret_masked: maskKey(settings.razorpay_webhook_secret || ""),
    has_razorpay_webhook_secret: Boolean(settings.razorpay_webhook_secret),
    webhook_url: `${(process.env.APP_URL || "").replace(/\/$/, "")}/api/payments/webhook`,
  });
}

export async function POST(request) {
  const admin = await getAuthFromCookieStore(await cookies(), "admin");
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { openai_api_key, openai_model, device_lock_enabled, razorpay_key_id, razorpay_key_secret, razorpay_webhook_secret, fast2sms_api_key, fast2sms_otp_id } =
    body || {};

  if (typeof openai_api_key === "string" && openai_api_key.trim()) {
    await setSetting("openai_api_key", openai_api_key.trim());
  }
  if (typeof openai_model === "string" && openai_model.trim()) {
    await setSetting("openai_model", openai_model.trim());
  }
  if (typeof device_lock_enabled === "boolean") {
    await setSetting("device_lock_enabled", String(device_lock_enabled));
  }
  if (typeof razorpay_key_id === "string" && razorpay_key_id.trim()) {
    await setSetting("razorpay_key_id", razorpay_key_id.trim());
  }
  if (typeof razorpay_key_secret === "string" && razorpay_key_secret.trim()) {
    await setSetting("razorpay_key_secret", razorpay_key_secret.trim());
  }
  if (typeof razorpay_webhook_secret === "string" && razorpay_webhook_secret.trim()) {
    await setSetting("razorpay_webhook_secret", razorpay_webhook_secret.trim());
  }

  if (typeof fast2sms_api_key === "string" && fast2sms_api_key.trim()) {
    await setSetting("fast2sms_api_key", fast2sms_api_key.trim());
  }
  if (typeof fast2sms_otp_id === "string" && fast2sms_otp_id.trim()) {
    await setSetting("fast2sms_otp_id", fast2sms_otp_id.trim());
  }

  return Response.json({ ok: true });
}
