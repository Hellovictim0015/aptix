import { requireBearerAuth } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import {
  getRazorpayConfig,
  verifyRazorpaySignature,
  fetchRazorpayPayment,
  assertPaymentSettles,
  fulfillPaymentOrder,
} from "@/lib/razorpay";

export async function POST(request) {
  const user = await requireBearerAuth(request, "user");
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = body || {};
  if (!orderId || !paymentId || !signature) {
    return Response.json({ error: "Missing payment verification fields" }, { status: 400 });
  }

  const order = await queryOne(
    "SELECT * FROM payment_orders WHERE razorpay_order_id = ? AND user_id = ?",
    [orderId, user.id]
  );
  if (!order) return Response.json({ error: "Order not found" }, { status: 404 });
  if (order.status === "paid") return Response.json({ ok: true, already_processed: true });

  const config = await getRazorpayConfig();
  const valid = verifyRazorpaySignature({ orderId, paymentId, signature, keySecret: config.keySecret });
  if (!valid) {
    // Don't mark the order failed here: a forged/garbled call must not be able
    // to block a genuine payment that the webhook may still confirm.
    return Response.json({ error: "Payment verification failed" }, { status: 400 });
  }

  // The signature proves Razorpay issued this payment for this order; also
  // confirm with Razorpay's API that the money was actually captured in full.
  try {
    const payment = await fetchRazorpayPayment({ ...config, paymentId });
    await assertPaymentSettles(config, order, payment);
  } catch (err) {
    console.error(`Payment check failed for order ${orderId}:`, err.message);
    await query("UPDATE payment_orders SET failure_reason = ? WHERE id = ? AND status <> 'paid'", [
      err.message.slice(0, 255),
      order.id,
    ]);
    return Response.json(
      { error: "Payment could not be confirmed yet. If money was deducted, access will be granted automatically." },
      { status: 409 }
    );
  }

  await fulfillPaymentOrder(orderId, paymentId);
  return Response.json({ ok: true });
}
