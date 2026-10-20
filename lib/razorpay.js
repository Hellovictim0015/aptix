import crypto from "crypto";
import { getPool } from "@/lib/db";
import { getSetting } from "@/lib/settings";

const API_BASE = "https://api.razorpay.com/v1";

export async function getRazorpayConfig() {
  const [keyId, keySecret, webhookSecret] = await Promise.all([
    getSetting("razorpay_key_id"),
    getSetting("razorpay_key_secret"),
    getSetting("razorpay_webhook_secret"),
  ]);
  return { keyId: keyId || "", keySecret: keySecret || "", webhookSecret: webhookSecret || "" };
}

async function razorpayRequest({ keyId, keySecret }, path, { method = "GET", body } = {}) {
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Razorpay ${method} ${path} failed (${res.status}): ${text.slice(0, 300)}`);
  }
  return res.json();
}

// Creates a Razorpay order for `amountRupees`. Returns the order object from
// Razorpay's API (includes `id`, `amount` in paise, `currency`).
export async function createRazorpayOrder({ keyId, keySecret, amountRupees, receipt, notes }) {
  return razorpayRequest({ keyId, keySecret }, "/orders", {
    method: "POST",
    body: {
      amount: Math.round(amountRupees * 100), // paise
      currency: "INR",
      receipt,
      notes,
    },
  });
}

export async function fetchRazorpayPayment({ keyId, keySecret, paymentId }) {
  return razorpayRequest({ keyId, keySecret }, `/payments/${encodeURIComponent(paymentId)}`);
}

// Captures an `authorized` payment (only needed if auto-capture is off in the
// Razorpay dashboard). Amount must be in paise and match the authorized amount.
export async function captureRazorpayPayment({ keyId, keySecret, paymentId, amountPaise }) {
  return razorpayRequest({ keyId, keySecret }, `/payments/${encodeURIComponent(paymentId)}/capture`, {
    method: "POST",
    body: { amount: amountPaise, currency: "INR" },
  });
}

function safeEqualHex(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
}

// Verifies the checkout signature Razorpay returns after a successful payment.
export function verifyRazorpaySignature({ orderId, paymentId, signature, keySecret }) {
  const expected = crypto.createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqualHex(expected, signature);
}

// Verifies the X-Razorpay-Signature header on a webhook, computed over the raw body.
export function verifyWebhookSignature({ rawBody, signature, webhookSecret }) {
  const expected = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}

// Checks a payment fetched from Razorpay really belongs to `order` and is paid
// in full, capturing it first if it's only authorized. Throws on any mismatch.
export async function assertPaymentSettles(config, order, payment) {
  const expectedPaise = Math.round(Number(order.amount) * 100);
  if (payment.order_id !== order.razorpay_order_id) {
    throw new Error("Payment does not belong to this order");
  }
  if (Number(payment.amount) !== expectedPaise || payment.currency !== "INR") {
    throw new Error("Payment amount does not match the order");
  }
  if (payment.status === "authorized") {
    const captured = await captureRazorpayPayment({ ...config, paymentId: payment.id, amountPaise: expectedPaise });
    if (captured.status !== "captured") throw new Error(`Payment capture returned status ${captured.status}`);
    return;
  }
  if (payment.status !== "captured") {
    throw new Error(`Payment is ${payment.status}, not captured`);
  }
}

// Marks a payment order as paid and grants every course in it, atomically.
// Idempotent: safe to call from both the app's verify call and the webhook —
// whichever arrives second sees status = 'paid' and does nothing.
// Returns true if this call did the fulfilment.
export async function fulfillPaymentOrder(razorpayOrderId, paymentId) {
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.execute("SELECT * FROM payment_orders WHERE razorpay_order_id = ? FOR UPDATE", [
      razorpayOrderId,
    ]);
    const order = rows[0];
    if (!order) throw new Error(`Unknown order ${razorpayOrderId}`);
    if (order.status === "paid") {
      await conn.commit();
      return false;
    }
    // The student deleted their account while the payment was in flight;
    // record the payment (for refund handling) but there is no one to grant to.
    if (!order.user_id) {
      await conn.execute(
        "UPDATE payment_orders SET status = 'paid', razorpay_payment_id = ?, failure_reason = 'Account deleted — refund due' WHERE id = ?",
        [paymentId, order.id]
      );
      await conn.commit();
      return false;
    }

    const courseIds = order.course_ids.split(",").map(Number);
    const pricePerCourse = Math.round((Number(order.amount) / courseIds.length) * 100) / 100;

    for (const courseId of courseIds) {
      await conn.execute(
        `INSERT INTO course_purchases (user_id, course_id, device_id, price_paid, payment_order_id)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE device_id = VALUES(device_id)`,
        [order.user_id, courseId, order.device_id, pricePerCourse, order.id]
      );
    }

    await conn.execute(
      "UPDATE payment_orders SET status = 'paid', razorpay_payment_id = ?, failure_reason = NULL WHERE id = ?",
      [paymentId, order.id]
    );

    await conn.commit();
    return true;
  } catch (err) {
    await conn.rollback().catch(() => {});
    throw err;
  } finally {
    conn.release();
  }
}
