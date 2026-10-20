import { queryOne } from "@/lib/db";
import { verifyOtp } from "@/lib/otp";
import { signToken } from "@/lib/auth";
import { normalizeIndianPhone } from "@/lib/validate";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const phone = normalizeIndianPhone(body.phone);
  const otp = String(body.otp || "").trim();

  if (!phone || !otp) {
    return Response.json({ error: "Please provide your mobile number and the OTP" }, { status: 400 });
  }

  const result = await verifyOtp({ phone }, otp, "user_login");
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 401 });
  }

  const user = await queryOne("SELECT id, phone, email, name, status FROM users WHERE phone = ?", [phone]);
  if (!user) return Response.json({ error: "Account not found" }, { status: 404 });
  if (user.status === "blocked") {
    return Response.json({ error: "This account has been blocked. Contact support." }, { status: 403 });
  }

  const token = await signToken({ role: "user", id: user.id, phone: user.phone, email: user.email, name: user.name });

  return Response.json({
    token,
    user: { id: user.id, phone: user.phone, email: user.email, name: user.name },
  });
}
