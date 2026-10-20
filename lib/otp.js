import crypto from "crypto";
import bcrypt from "bcryptjs";
import { query, queryOne } from "@/lib/db";

export const OTP_TTL_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;

// Play Store review/test account: this one number always gets a fixed OTP and
// no WhatsApp message is sent. Every other number gets a real random OTP.
// Override with REVIEW_TEST_PHONE / REVIEW_TEST_OTP in .env.local, or set
// REVIEW_TEST_PHONE to an empty value to switch the test login off.
const REVIEW_TEST_PHONE = process.env.REVIEW_TEST_PHONE ?? "8827219873";
const REVIEW_TEST_OTP = process.env.REVIEW_TEST_OTP || "123456";

export function isReviewTestPhone(phone) {
  return Boolean(REVIEW_TEST_PHONE) && phone === REVIEW_TEST_PHONE;
}

function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

// `target` is { phone } (WhatsApp login) or { email } (older email accounts).
function targetColumn(target) {
  if (target?.phone) return ["phone", target.phone];
  if (target?.email) return ["email", target.email];
  throw new Error("OTP target needs a phone or email");
}

// Creates and stores a fresh OTP for the target, respecting a resend cooldown.
// Returns the plaintext OTP (caller is responsible for sending it), or null
// if a resend was requested too soon.
export async function createOtp(target, purpose = "user_login") {
  const [column, value] = targetColumn(target);
  const isReview = isReviewTestPhone(target?.phone);
  const recent = isReview ? null : await queryOne(
    `SELECT id, last_sent_at FROM otps WHERE ${column} = ? AND purpose = ? ORDER BY id DESC LIMIT 1`,
    [value, purpose]
  );
  if (recent) {
    const secondsSince = (Date.now() - new Date(recent.last_sent_at).getTime()) / 1000;
    if (secondsSince < RESEND_COOLDOWN_SECONDS) {
      return { otp: null, waitSeconds: Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSince) };
    }
  }

  const otp = isReview ? REVIEW_TEST_OTP : generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await query(
    `INSERT INTO otps (${column}, purpose, otp_hash, expires_at, last_sent_at) VALUES (?, ?, ?, ?, NOW())`,
    [value, purpose, otpHash, expiresAt]
  );

  return { otp, waitSeconds: 0 };
}

// Verifies an OTP, consuming it on success. Returns { ok, error }.
export async function verifyOtp(target, code, purpose = "user_login") {
  const [column, value] = targetColumn(target);
  const row = await queryOne(
    `SELECT * FROM otps WHERE ${column} = ? AND purpose = ? AND consumed_at IS NULL ORDER BY id DESC LIMIT 1`,
    [value, purpose]
  );
  if (!row) return { ok: false, error: "No OTP found. Please request a new one." };

  if (new Date(row.expires_at).getTime() < Date.now()) {
    return { ok: false, error: "OTP expired. Please request a new one." };
  }
  if (row.attempts >= row.max_attempts) {
    return { ok: false, error: "Too many incorrect attempts. Please request a new OTP." };
  }

  const isValid = await bcrypt.compare(code, row.otp_hash);
  if (!isValid) {
    await query(`UPDATE otps SET attempts = attempts + 1 WHERE id = ?`, [row.id]);
    return { ok: false, error: "Incorrect OTP." };
  }

  await query(`UPDATE otps SET consumed_at = NOW() WHERE id = ?`, [row.id]);
  return { ok: true };
}
