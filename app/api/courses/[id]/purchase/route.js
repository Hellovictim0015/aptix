import { requireBearerAuth } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";

// Free-course enrollment only. Paid courses go through /api/payments/create-order
// + /api/payments/verify (Razorpay).
export async function POST(request, { params }) {
  const user = await requireBearerAuth(request, "user");
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const course = await queryOne("SELECT id, price FROM courses WHERE id = ? AND status = 'published'", [id]);
  if (!course) return Response.json({ error: "Course not found" }, { status: 404 });

  if (Number(course.price) > 0) {
    return Response.json(
      { error: "This is a paid course. Use the Razorpay checkout flow to purchase it." },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const deviceId = String(body.device_id || "").trim() || null;

  const existing = await queryOne("SELECT id FROM course_purchases WHERE user_id = ? AND course_id = ?", [
    user.id,
    id,
  ]);
  if (existing) {
    return Response.json({ ok: true, already_purchased: true });
  }

  await query(
    "INSERT INTO course_purchases (user_id, course_id, device_id, price_paid) VALUES (?, ?, ?, 0)",
    [user.id, id, deviceId]
  );

  return Response.json({ ok: true, already_purchased: false });
}
