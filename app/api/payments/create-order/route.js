import { requireBearerAuth } from "@/lib/auth";
import { query } from "@/lib/db";
import { loadCombos } from "@/lib/combos";
import { getRazorpayConfig, createRazorpayOrder } from "@/lib/razorpay";

export async function POST(request) {
  const user = await requireBearerAuth(request, "user");
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const comboId = Number(body.combo_id) || null;

  let courseIds;
  let combo = null;
  if (comboId) {
    // Combo purchase: the courses and price come from the combo itself, never the client.
    [combo] = await loadCombos({ publicOnly: true, comboId });
    if (!combo) return Response.json({ error: "This combo offer is no longer available" }, { status: 404 });
    courseIds = combo.courses.map((c) => c.id);
  } else {
    courseIds = Array.isArray(body.course_ids) ? [...new Set(body.course_ids.map(Number))].filter(Boolean) : [];
    if (courseIds.length !== 1) {
      return Response.json({ error: "Send one course_id, or a combo_id for a bundle" }, { status: 400 });
    }
  }

  const placeholders = courseIds.map(() => "?").join(",");
  const courses = await query(
    `SELECT id, title, price FROM courses WHERE id IN (${placeholders}) AND status = 'published'`,
    courseIds
  );
  if (courses.length !== courseIds.length) {
    return Response.json({ error: "One or more courses were not found" }, { status: 404 });
  }

  const alreadyOwned = await query(
    `SELECT c.title FROM course_purchases p JOIN courses c ON c.id = p.course_id
     WHERE p.user_id = ? AND p.course_id IN (${placeholders})`,
    [user.id, ...courseIds]
  );
  if (alreadyOwned.length > 0) {
    return Response.json(
      { error: `You already own: ${alreadyOwned.map((r) => r.title).join(", ")}` },
      { status: 400 }
    );
  }

  let amount;
  if (combo) {
    amount = combo.combo_price;
  } else {
    amount = Number(courses[0].price);
    if (amount <= 0) {
      return Response.json({ error: "This course is free — use the free enroll endpoint instead." }, { status: 400 });
    }
  }

  const { keyId, keySecret } = await getRazorpayConfig();
  if (!keyId || !keySecret) {
    return Response.json(
      { error: "Payments are not configured yet. Add Razorpay keys in Admin → Settings." },
      { status: 400 }
    );
  }

  const deviceId = request.headers.get("x-device-id") || null;

  let order;
  try {
    order = await createRazorpayOrder({
      keyId,
      keySecret,
      amountRupees: amount,
      receipt: `user${user.id}-${Date.now()}`,
      notes: {
        user_id: String(user.id),
        phone: user.phone || "",
        email: user.email || "",
        course_ids: courseIds.join(","),
        ...(combo ? { combo_id: String(combo.id) } : {}),
      },
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 });
  }

  await query(
    `INSERT INTO payment_orders (user_id, razorpay_order_id, combo_id, course_ids, amount, device_id, status)
     VALUES (?, ?, ?, ?, ?, ?, 'created')`,
    [user.id, order.id, combo?.id ?? null, courseIds.join(","), amount, deviceId]
  );

  return Response.json({
    order_id: order.id,
    amount: order.amount,
    currency: order.currency,
    key_id: keyId,
  });
}
