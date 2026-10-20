import { query, queryOne } from "@/lib/db";
import {
  getRazorpayConfig,
  verifyWebhookSignature,
  assertPaymentSettles,
  fulfillPaymentOrder,
} from "@/lib/razorpay";

// Razorpay server-to-server webhook. Configure in Razorpay Dashboard →
// Settings → Webhooks with URL <APP_URL>/api/payments/webhook, the same secret
// saved in Admin → Settings, and events: payment.captured, order.paid,
// payment.failed. This grants courses even if the app was closed or lost
// network right after the student paid.
export async function POST(request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") || "";

  const config = await getRazorpayConfig();
  if (!config.webhookSecret) {
    return Response.json({ error: "Webhook secret not configured" }, { status: 503 });
  }
  if (!verifyWebhookSignature({ rawBody, signature, webhookSecret: config.webhookSecret })) {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payment = event.payload?.payment?.entity;
  const orderId = payment?.order_id || event.payload?.order?.entity?.id;
  if (!payment || !orderId) return Response.json({ ok: true, ignored: true });

  const order = await queryOne("SELECT * FROM payment_orders WHERE razorpay_order_id = ?", [orderId]);
  // Not one of ours (e.g. a payment link created elsewhere on the same account).
  if (!order) return Response.json({ ok: true, ignored: true });

  if (event.event === "payment.captured" || event.event === "order.paid") {
    try {
      await assertPaymentSettles(config, order, payment);
    } catch (err) {
      console.error(`Webhook ${event.event} rejected for ${orderId}:`, err.message);
      return Response.json({ ok: true, ignored: true });
    }
    await fulfillPaymentOrder(orderId, payment.id);
    return Response.json({ ok: true });
  }

  if (event.event === "payment.failed") {
    const reason = payment.error_description || payment.error_reason || "Payment failed";
    // Only an unpaid order can fail; a later successful retry on the same order
    // will still flip it to 'paid'.
    await query(
      "UPDATE payment_orders SET status = 'failed', razorpay_payment_id = ?, failure_reason = ? WHERE id = ? AND status <> 'paid'",
      [payment.id, String(reason).slice(0, 255), order.id]
    );
    return Response.json({ ok: true });
  }

  return Response.json({ ok: true, ignored: true });
}
